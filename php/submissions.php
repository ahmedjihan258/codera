<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";
require_once "judge_schema.php";

ensure_judge_tables($conn);

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit;
}

$user_id = $_SESSION["user_id"];
$action  = $_GET["action"] ?? ($_POST["action"] ?? "");

// ---------- GET: test cases for the judge to run against ----------
// Returns BOTH sample and hidden test cases. Note: since this project runs
// the student's code in the browser (no server-side sandbox), the judge
// needs the expected outputs client-side to compare against — a technically
// savvy student could inspect this response in DevTools. That's an accepted
// trade-off for a local learning platform; it is not a true anti-cheat judge.
if ($action === "get_test_cases") {
    $problem_id = (int)($_GET["problem_id"] ?? 0);
    if (!$problem_id) {
        echo json_encode(["success" => false, "message" => "problem_id is required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, input, expected_output, is_sample FROM problem_test_cases WHERE problem_id = ? AND kind = 'js' ORDER BY order_num ASC, id ASC");
    $stmt->bind_param("i", $problem_id);
    $stmt->execute();
    $cases = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Fallback: if the admin has not added any test cases yet, use the
    // problem's own example input/output as a single visible test case so
    // Run and Submit still work.
    if (count($cases) === 0) {
        $pstmt = $conn->prepare("SELECT example_input, example_output FROM problems WHERE id = ?");
        $pstmt->bind_param("i", $problem_id);
        $pstmt->execute();
        $prob = $pstmt->get_result()->fetch_assoc();
        $pstmt->close();

        if ($prob && trim((string)$prob["example_input"]) !== "" && trim((string)$prob["example_output"]) !== "") {
            $cases[] = [
                "id"              => 0,
                "input"           => $prob["example_input"],
                "expected_output" => $prob["example_output"],
                "is_sample"       => 1
            ];
        }
    }

    echo json_encode(["success" => true, "test_cases" => $cases]);
    exit;
}

// ---------- GET: this user's past submissions for one problem ----------
if ($action === "get_history") {
    $problem_id = (int)($_GET["problem_id"] ?? 0);
    if (!$problem_id) {
        echo json_encode(["success" => false, "message" => "problem_id is required."]);
        exit;
    }

    $stmt = $conn->prepare("
        SELECT id, verdict, passed_count, total_count, submitted_at
        FROM submissions
        WHERE user_id = ? AND problem_id = ?
        ORDER BY submitted_at DESC
        LIMIT 20
    ");
    $stmt->bind_param("ii", $user_id, $problem_id);
    $stmt->execute();
    $history = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    echo json_encode(["success" => true, "history" => $history]);
    exit;
}

// ---------- POST: record a submission ----------
// The verdict is computed by the browser's judge (see js/problems.js) and
// reported here to be stored; this endpoint trusts that report rather than
// re-executing the code server-side (no sandbox is set up for that).
if ($action === "submit" && $_SERVER["REQUEST_METHOD"] === "POST") {
    $input = json_decode(file_get_contents("php://input"), true);
    if (!is_array($input)) $input = [];

    $problem_id   = (int)($input["problem_id"] ?? 0);
    $code         = (string)($input["code"] ?? "");
    $verdict      = (string)($input["verdict"] ?? "");
    $passed_count = (int)($input["passed_count"] ?? 0);
    $total_count  = (int)($input["total_count"] ?? 0);

    $allowed_verdicts = ["Accepted", "Wrong Answer", "Runtime Error"];
    if (!$problem_id || $code === "" || !in_array($verdict, $allowed_verdicts, true)) {
        echo json_encode(["success" => false, "message" => "Invalid submission payload."]);
        exit;
    }

    $stmt = $conn->prepare("
        INSERT INTO submissions (user_id, problem_id, code, verdict, passed_count, total_count)
        VALUES (?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param("iissii", $user_id, $problem_id, $code, $verdict, $passed_count, $total_count);
    $stmt->execute();
    $stmt->close();

    echo json_encode(["success" => true, "message" => "Submission recorded."]);
    exit;
}

echo json_encode(["success" => false, "message" => "Unknown action."]);
