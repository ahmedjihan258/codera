<?php
/**
 * C / C++ judge.
 *
 * POST JSON: { problem_id, language: "c"|"cpp", code, mode: "run"|"submit" }
 *
 *  - "run"    -> compiles and runs the visible example test cases only (nothing saved)
 *  - "submit" -> runs every C/C++ test case and saves the submission
 *
 * Test cases used here are the ones with kind = 'stdio' in problem_test_cases:
 *    input           = text sent to the program's stdin
 *    expected_output = text the program must print to stdout
 *
 * REQUIREMENT: a C/C++ compiler (MinGW-w64 g++/gcc) installed on the machine
 * running XAMPP. See find_compiler() for the folders that are searched.
 *
 * SECURITY NOTE: this compiles and runs students' code directly on the server
 * with only a time limit. That is fine for a local learning project on your own
 * computer, but do NOT expose it to the public internet as it is.
 */

if (!defined("CODERA_RUNCODE_LIB")) {
    ini_set("display_errors", "0");
}

const RC_COMPILE_TIMEOUT = 20;     // seconds allowed for compiling
const RC_RUN_TIMEOUT     = 2.0;    // seconds allowed per test case
const RC_MAX_CODE_BYTES  = 50000;  // max source size
const RC_MAX_OUTPUT      = 65536;  // max bytes of program output we read back

/** Look for a compiler on PATH and in the usual Windows install folders. */
function find_compiler(string $language): ?string {
    $isWin = (PHP_OS_FAMILY === "Windows");
    $name  = ($language === "c") ? "gcc" : "g++";
    $file  = $isWin ? $name . ".exe" : $name;

    $dirs = [];
    foreach (explode(PATH_SEPARATOR, (string)getenv("PATH")) as $d) {
        if ($d !== "") $dirs[] = $d;
    }
    if ($isWin) {
        $dirs = array_merge($dirs, [
            "C:\\msys64\\ucrt64\\bin",
            "C:\\msys64\\mingw64\\bin",
            "C:\\MinGW\\bin",
            "C:\\mingw64\\bin",
            "C:\\mingw32\\bin",
            "C:\\TDM-GCC-64\\bin",
            "C:\\Program Files\\mingw-w64\\mingw64\\bin",
            "C:\\Program Files (x86)\\Dev-Cpp\\MinGW64\\bin",
            "C:\\Program Files\\CodeBlocks\\MinGW\\bin",
            "C:\\Program Files (x86)\\CodeBlocks\\MinGW\\bin",
        ]);
    }
    foreach ($dirs as $d) {
        $full = rtrim($d, "/\\") . DIRECTORY_SEPARATOR . $file;
        if (is_file($full)) return $full;
    }
    return null;
}

/**
 * Starts a process without a shell, with stdin/stdout/stderr tied to files
 * (pipes cannot be polled on Windows). Returns [exitCode, timedOut].
 */
function rc_run_process(array $cmd, ?string $stdinFile, string $stdoutFile, string $stderrFile, string $cwd, float $timeout, array $env): array {
    $spec = [
        0 => $stdinFile !== null ? ["file", $stdinFile, "r"] : ["file", (PHP_OS_FAMILY === "Windows" ? "NUL" : "/dev/null"), "r"],
        1 => ["file", $stdoutFile, "w"],
        2 => ["file", $stderrFile, "w"],
    ];
    $proc = @proc_open($cmd, $spec, $pipes, $cwd, $env, ["bypass_shell" => true]);
    if (!is_resource($proc)) return [-1, false];

    $start    = microtime(true);
    $exitCode = null;
    $timedOut = false;

    while (true) {
        $st = proc_get_status($proc);
        if (!$st["running"]) {
            $exitCode = $st["exitcode"];
            break;
        }
        if (microtime(true) - $start > $timeout) {
            $timedOut = true;
            proc_terminate($proc, 9);
            if (PHP_OS_FAMILY === "Windows" && !empty($st["pid"])) {
                @exec("taskkill /F /T /PID " . (int)$st["pid"] . " 2>NUL");
            }
            break;
        }
        usleep(10000); // 10 ms
    }
    proc_close($proc);
    return [$exitCode === null ? -1 : $exitCode, $timedOut];
}

function rc_normalize(string $s): string {
    $s = str_replace("\r\n", "\n", $s);
    $s = str_replace("\r", "\n", $s);
    $lines = array_map("rtrim", explode("\n", $s));
    return rtrim(implode("\n", $lines));
}

function rc_rmdir(string $dir): void {
    if (!is_dir($dir)) return;
    foreach (scandir($dir) as $f) {
        if ($f === "." || $f === "..") continue;
        $p = $dir . DIRECTORY_SEPARATOR . $f;
        is_dir($p) ? rc_rmdir($p) : @unlink($p);
    }
    @rmdir($dir);
}

function rc_clean_compiler_output(string $out, string $dir): string {
    $out = str_replace([$dir . DIRECTORY_SEPARATOR, $dir], "", $out);
    $out = str_replace("\\", "/", $out);
    $out = trim($out);
    if (strlen($out) > 2000) $out = substr($out, 0, 2000) . "\n…";
    return $out;
}

/**
 * Compiles $code and runs it against $cases.
 * Returns ["status" => "compile_error"|"no_compiler"|"ok", "compile_error"?, "results" => [...]]
 * Each result: passed, state (ok|wrong|runtime|timeout), is_sample, and for visible cases input/expected/actual/error.
 */
function native_judge(string $language, string $code, array $cases): array {
    $compiler = find_compiler($language);
    if ($compiler === null) {
        return ["status" => "no_compiler", "results" => []];
    }

    $isWin   = (PHP_OS_FAMILY === "Windows");
    $workDir = rtrim(sys_get_temp_dir(), "/\\") . DIRECTORY_SEPARATOR . "codera_" . bin2hex(random_bytes(6));
    if (!@mkdir($workDir, 0700, true)) {
        return ["status" => "compile_error", "compile_error" => "Server could not create a temporary folder.", "results" => []];
    }

    try {
        $srcName = ($language === "c") ? "main.c" : "main.cpp";
        $src     = $workDir . DIRECTORY_SEPARATOR . $srcName;
        $exe     = $workDir . DIRECTORY_SEPARATOR . "prog" . ($isWin ? ".exe" : "");
        file_put_contents($src, $code);

        // Make the compiler's own folder part of PATH so its DLLs/helpers are found.
        $env = getenv();
        if (!is_array($env)) $env = [];
        $compilerDir = dirname($compiler);
        $pathKey = "PATH";
        foreach (array_keys($env) as $k) { if (strtoupper($k) === "PATH") { $pathKey = $k; break; } }
        $env[$pathKey] = $compilerDir . PATH_SEPARATOR . ($env[$pathKey] ?? "");

        $cmd = [$compiler, $language === "c" ? "-std=c11" : "-std=c++17", "-O2", $srcName, "-o", $exe];
        if ($isWin) $cmd[] = "-static";      // so the .exe does not need the MinGW DLLs at run time
        if ($language === "c") $cmd[] = "-lm";

        $ccOut = $workDir . DIRECTORY_SEPARATOR . "cc_out.txt";
        $ccErr = $workDir . DIRECTORY_SEPARATOR . "cc_err.txt";
        [$cc, $ccTimeout] = rc_run_process($cmd, null, $ccOut, $ccErr, $workDir, RC_COMPILE_TIMEOUT, $env);

        if ($ccTimeout || $cc !== 0 || !is_file($exe)) {
            $msg = $ccTimeout ? "Compilation took too long." : rc_clean_compiler_output((string)@file_get_contents($ccErr) . (string)@file_get_contents($ccOut), $workDir);
            if ($msg === "") $msg = "Compilation failed.";
            return ["status" => "compile_error", "compile_error" => $msg, "results" => []];
        }

        $results = [];
        $skipRest = false;   // after one time-out the remaining cases are marked without running (saves waiting)
        foreach ($cases as $i => $tc) {
            $inFile  = $workDir . DIRECTORY_SEPARATOR . "in_$i.txt";
            $outFile = $workDir . DIRECTORY_SEPARATOR . "out_$i.txt";
            $errFile = $workDir . DIRECTORY_SEPARATOR . "err_$i.txt";
            $stdin   = str_replace("\r\n", "\n", (string)$tc["input"]);
            if ($stdin !== "" && substr($stdin, -1) !== "\n") $stdin .= "\n";
            file_put_contents($inFile, $stdin);

            if ($skipRest) {
                $timedOut = true; $code_ = -1;
                file_put_contents($outFile, ""); file_put_contents($errFile, "");
            } else {
                [$code_, $timedOut] = rc_run_process([$exe], $inFile, $outFile, $errFile, $workDir, RC_RUN_TIMEOUT, $env);
                if ($timedOut) $skipRest = true;
            }

            $actualRaw = (string)@file_get_contents($outFile, false, null, 0, RC_MAX_OUTPUT);
            $stderr    = trim((string)@file_get_contents($errFile, false, null, 0, 500));
            $expected  = (string)$tc["expected_output"];

            $state = "ok"; $passed = false; $error = "";
            if ($timedOut) {
                $state = "timeout"; $error = "Time limit exceeded (" . RC_RUN_TIMEOUT . "s) — possible infinite loop.";
            } elseif ($code_ !== 0) {
                $state = "runtime"; $error = "Program crashed or returned exit code $code_." . ($stderr !== "" ? " " . $stderr : "");
            } else {
                $passed = (rc_normalize($actualRaw) === rc_normalize($expected));
                if (!$passed) $state = "wrong";
            }

            $row = [
                "passed"    => $passed,
                "state"     => $state,
                "is_sample" => ((int)$tc["is_sample"] === 1),
            ];
            if ($row["is_sample"]) {            // hidden cases never reveal input or expected output
                $row["input"]    = (string)$tc["input"];
                $row["expected"] = $expected;
                $row["actual"]   = $actualRaw;
                $row["error"]    = $error;
            } else {
                $row["error"]    = $error;
            }
            $results[] = $row;
        }

        return ["status" => "ok", "results" => $results];
    } finally {
        rc_rmdir($workDir);
    }
}

// ------------------------------------------------------------------
// HTTP endpoint (skipped when this file is included by a test script)
// ------------------------------------------------------------------
if (defined("CODERA_RUNCODE_LIB")) return;

session_start();
header("Content-Type: application/json");
require_once "db.php";
require_once "judge_schema.php";

function rc_reply(array $data): void { echo json_encode($data); exit; }

try {
    ensure_judge_tables($conn);

    if (!isset($_SESSION["user_id"])) rc_reply(["success" => false, "message" => "Not authenticated."]);
    if ($_SERVER["REQUEST_METHOD"] !== "POST") rc_reply(["success" => false, "message" => "POST required."]);
    $user_id = (int)$_SESSION["user_id"];

    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) $input = [];

    $problem_id = (int)($input["problem_id"] ?? 0);
    $language   = (string)($input["language"] ?? "");
    $code       = (string)($input["code"] ?? "");
    $mode       = (($input["mode"] ?? "run") === "submit") ? "submit" : "run";

    if (!$problem_id)                         rc_reply(["success" => false, "message" => "problem_id is required."]);
    if (!in_array($language, ["c", "cpp"], true)) rc_reply(["success" => false, "message" => "Unsupported language."]);
    if (trim($code) === "")                   rc_reply(["success" => false, "message" => "Write some code first."]);
    if (strlen($code) > RC_MAX_CODE_BYTES)    rc_reply(["success" => false, "message" => "Code is too long."]);

    $sql = "SELECT id, input, expected_output, is_sample FROM problem_test_cases WHERE problem_id = ? AND kind = 'stdio'";
    if ($mode === "run") $sql .= " AND is_sample = 1";
    $sql .= " ORDER BY order_num ASC, id ASC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $problem_id);
    $stmt->execute();
    $cases = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    if (count($cases) === 0) {
        rc_reply(["success" => true, "status" => "no_tests",
                  "message" => $mode === "run"
                      ? "This problem has no visible C/C++ example yet. Ask an admin to add a C/C++ test case (marked as a visible example)."
                      : "This problem has no C/C++ test cases yet. Ask an admin to add some."]);
    }

    $judged = native_judge($language, $code, $cases);

    if ($judged["status"] === "no_compiler") {
        rc_reply(["success" => true, "status" => "no_compiler",
                  "message" => "No " . ($language === "c" ? "gcc" : "g++") . " compiler was found on the server. Install MinGW-w64 and restart Apache."]);
    }

    $total = count($cases);
    $passedCount = 0; $anyFail = false; $anyRuntime = false;
    foreach ($judged["results"] as $r) {
        if ($r["passed"]) $passedCount++;
        if ($r["state"] === "runtime" || $r["state"] === "timeout") $anyRuntime = true;
    }

    if ($judged["status"] === "compile_error") {
        $verdict = "Compile Error";
    } elseif ($passedCount === $total) {
        $verdict = "Accepted";
    } elseif ($anyRuntime && $passedCount === 0) {
        $verdict = "Runtime Error";
    } else {
        $verdict = "Wrong Answer";
    }

    if ($mode === "submit") {
        $langName = ($language === "c") ? "c" : "cpp";
        $stmt = $conn->prepare("INSERT INTO submissions (user_id, problem_id, code, verdict, passed_count, total_count, language) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("iissiis", $user_id, $problem_id, $code, $verdict, $passedCount, $total, $langName);
        $stmt->execute();
        $stmt->close();
    }

    rc_reply([
        "success"       => true,
        "status"        => $judged["status"],
        "verdict"       => $verdict,
        "passed_count"  => $passedCount,
        "total_count"   => $total,
        "compile_error" => $judged["compile_error"] ?? "",
        "results"       => $judged["results"],
    ]);
} catch (Throwable $e) {
    error_log("run_code.php: " . $e->getMessage());
    rc_reply(["success" => false, "message" => "Server error: " . $e->getMessage()]);
}
