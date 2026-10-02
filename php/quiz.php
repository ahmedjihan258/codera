<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";
require_once "module_access.php";

/*
 * Quiz API (module based, with anti-cheat + module gating)
 *
 *  GET  quiz.php?course_id=1   -> quizzes of a course: title, module, best score, passed,
 *                                 locked (+ reason), cooldown_seconds. No questions here.
 *  GET  quiz.php?quiz_id=4     -> one quiz: a random QUIZ_SAMPLE_SIZE subset of its question
 *                                 pool, options never include the correct answer.
 *  POST quiz.php {quiz_id, answers} -> grade + save attempt. Correct answers are only
 *                                 revealed in the response once the attempt itself passes.
 *
 * Every check below also runs on POST, not just GET, so a request built by hand can't
 * skip enrollment, module order, or the retry cooldown.
 */

function respond(array $payload, int $status = 200): void {
    http_response_code($status);
    echo json_encode($payload);
    exit;
}

function is_enrolled(mysqli $conn, int $user_id, int $course_id): bool {
    $stmt = $conn->prepare("SELECT 1 FROM enrollments WHERE user_id = ? AND course_id = ? LIMIT 1");
    $stmt->bind_param("ii", $user_id, $course_id);
    $stmt->execute();
    $stmt->store_result();
    $ok = $stmt->num_rows > 0;
    $stmt->close();
    return $ok;
}

function format_remaining(int $seconds): string {
    $seconds = max(0, $seconds);
    $h = intdiv($seconds, 3600);
    $m = intdiv($seconds % 3600, 60);
    $s = $seconds % 60;
    return sprintf("%02d : %02d : %02d", $h, $m, $s);
}

/**
 * Runs every gate for opening/submitting a quiz (enrollment, module order, final-quiz
 * completion, retry cooldown). Exits with a JSON error via respond() if any gate fails.
 * $quiz must have: id, course_id, module_name.
 */
function enforce_quiz_gates(mysqli $conn, int $user_id, array $quiz): void {
    $course_id = (int)$quiz["course_id"];

    if (!is_enrolled($conn, $user_id, $course_id)) {
        respond(["success" => false, "code" => "not_enrolled",
                 "message" => "Enroll in this course to take its quizzes."], 403);
    }

    if ($quiz["module_name"] !== null) {
        if (!is_module_unlocked($conn, $user_id, $course_id, $quiz["module_name"])) {
            $blocking = get_blocking_module($conn, $course_id, $quiz["module_name"]);
            respond(["success" => false, "code" => "locked_module",
                     "message" => "Score " . QUIZ_PASS_PERCENT . "%+ on the \"" . $blocking .
                                   "\" quiz to unlock this module."], 403);
        }
    } else {
        if (!is_final_quiz_unlocked($conn, $user_id, $course_id)) {
            respond(["success" => false, "code" => "locked_final",
                     "message" => "Pass every module quiz with " . QUIZ_PASS_PERCENT .
                                   "%+ to unlock the final quiz."], 403);
        }
    }

    $cooldown = get_quiz_cooldown($conn, $user_id, (int)$quiz["id"]);
    if ($cooldown["remaining"] > 0) {
        respond(["success" => false, "code" => "cooldown",
                 "message" => "You didn't pass last time. Try again in " .
                               format_remaining($cooldown["remaining"]) . ".",
                 "retry_at" => $cooldown["retry_at"],
                 "remaining_seconds" => $cooldown["remaining"]], 403);
    }
}

if (!isset($_SESSION["user_id"])) {
    respond(["success" => false, "message" => "Not authenticated."], 401);
}

$user_id = (int)$_SESSION["user_id"];
$method  = $_SERVER["REQUEST_METHOD"];

/* ───────────── GET ───────────── */
if ($method === "GET") {

    /* --- one quiz, with a random subset of its question pool --- */
    if (isset($_GET["quiz_id"])) {
        $quiz_id = (int)$_GET["quiz_id"];

        $stmt = $conn->prepare("
            SELECT q.id, q.course_id, q.module_name, q.title, c.title AS course_title
            FROM quizzes q JOIN courses c ON c.id = q.course_id
            WHERE q.id = ?
        ");
        $stmt->bind_param("i", $quiz_id);
        $stmt->execute();
        $quiz = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$quiz) respond(["success" => false, "message" => "Quiz not found."], 404);

        enforce_quiz_gates($conn, $user_id, $quiz);

        // Random QUIZ_SAMPLE_SIZE questions from this quiz's pool (never send correct_option)
        $qs = $conn->prepare("
            SELECT id, question, option_a, option_b, option_c, option_d
            FROM quiz_questions WHERE quiz_id = ?
            ORDER BY RAND() LIMIT " . QUIZ_SAMPLE_SIZE
        );
        $qs->bind_param("i", $quiz_id);
        $qs->execute();
        $questions = $qs->get_result()->fetch_all(MYSQLI_ASSOC);
        $qs->close();

        $att = $conn->prepare("
            SELECT score, total, attempted_at FROM quiz_attempts
            WHERE user_id = ? AND quiz_id = ? AND total > 0
            ORDER BY (score / total) DESC, attempted_at DESC LIMIT 1
        ");
        $att->bind_param("ii", $user_id, $quiz_id);
        $att->execute();
        $best = $att->get_result()->fetch_assoc();
        $att->close();

        respond([
            "success"   => true,
            "quiz"      => $quiz,
            "questions" => $questions,
            "best"      => $best,
            "passed"    => $best ? (round($best["score"] / $best["total"] * 100) >= QUIZ_PASS_PERCENT) : false
        ]);
    }

    /* --- list quizzes of a course, each with lock/cooldown/pass status --- */
    $course_id = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;
    if (!$course_id) respond(["success" => false, "message" => "course_id or quiz_id required."], 400);

    $enrolled = is_enrolled($conn, $user_id, $course_id);

    $stmt = $conn->prepare("
        SELECT id, module_name, title,
               (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = quizzes.id) AS question_count
        FROM quizzes WHERE course_id = ?
        ORDER BY module_name IS NULL, module_name ASC, id ASC
    ");
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $quizzes = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    $unlockMap = $enrolled ? get_module_unlock_map($conn, $user_id, $course_id) : [];
    $finalUnlocked = $enrolled ? is_final_quiz_unlocked($conn, $user_id, $course_id) : false;

    foreach ($quizzes as &$row) {
        $row["id"]             = (int)$row["id"];
        $row["question_count"] = (int)$row["question_count"];

        $best = get_best_percent($conn, $user_id, $row["id"]);
        $row["best_percent"] = $best;
        $row["passed"]       = $best !== null && $best >= QUIZ_PASS_PERCENT;

        if (!$enrolled) {
            $row["locked"] = true;
            $row["locked_reason"] = "Enroll in this course to unlock quizzes.";
        } elseif ($row["module_name"] !== null) {
            $row["locked"] = !($unlockMap[$row["module_name"]] ?? true);
            $blocking = $row["locked"] ? get_blocking_module($conn, $course_id, $row["module_name"]) : null;
            $row["locked_reason"] = $row["locked"]
                ? "Score " . QUIZ_PASS_PERCENT . "%+ on the \"$blocking\" quiz to unlock this."
                : null;
        } else {
            $row["locked"] = !$finalUnlocked;
            $row["locked_reason"] = $row["locked"]
                ? "Pass every module quiz with " . QUIZ_PASS_PERCENT . "%+ to unlock the final quiz."
                : null;
        }

        $cooldown = ($enrolled && !$row["locked"]) ? get_quiz_cooldown($conn, $user_id, $row["id"]) : ["remaining" => 0, "retry_at" => null];
        $row["cooldown_seconds"] = $cooldown["remaining"];
        $row["retry_at"]         = $cooldown["retry_at"];
    }
    unset($row);

    respond(["success" => true, "enrolled" => $enrolled, "quizzes" => $quizzes]);
}

/* ───────────── POST: submit answers ───────────── */
if ($method === "POST") {
    $data    = json_decode(file_get_contents("php://input"), true);
    if (!is_array($data)) $data = [];
    $quiz_id = (int)($data["quiz_id"] ?? 0);
    $answers = is_array($data["answers"] ?? null) ? $data["answers"] : [];

    if (!$quiz_id || empty($answers)) {
        respond(["success" => false, "message" => "quiz_id and answers required."], 400);
    }

    $stmt = $conn->prepare("SELECT id, course_id, module_name FROM quizzes WHERE id = ?");
    $stmt->bind_param("i", $quiz_id);
    $stmt->execute();
    $quiz = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$quiz) respond(["success" => false, "message" => "Quiz not found."], 404);

    enforce_quiz_gates($conn, $user_id, $quiz);

    // Only grade questions that really belong to this quiz, and cap at QUIZ_SAMPLE_SIZE
    // (what the student was actually shown) so extra submitted IDs can't inflate the total.
    $submittedIds = array_slice(array_unique(array_map("intval", array_keys($answers))), 0, QUIZ_SAMPLE_SIZE);
    if (empty($submittedIds)) {
        respond(["success" => false, "message" => "No valid answers submitted."], 400);
    }

    $placeholders = implode(",", array_fill(0, count($submittedIds), "?"));
    $types        = "i" . str_repeat("i", count($submittedIds));
    $stmt = $conn->prepare("SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ? AND id IN ($placeholders)");
    $stmt->bind_param($types, $quiz_id, ...$submittedIds);
    $stmt->execute();
    $result  = $stmt->get_result();
    $correct = [];
    while ($q = $result->fetch_assoc()) $correct[(int)$q["id"]] = strtolower($q["correct_option"]);
    $stmt->close();

    $total = count($correct);
    if ($total === 0) {
        respond(["success" => false, "message" => "Could not grade this attempt."], 400);
    }

    $score = 0;
    $raw   = [];
    foreach ($correct as $qid => $ans) {
        $submitted  = strtolower((string)($answers[$qid] ?? ""));
        $is_correct = ($submitted === $ans);
        if ($is_correct) $score++;
        $raw[$qid] = ["correct" => $is_correct, "your" => $submitted, "expected" => $ans];
    }

    $percent = (int)round(($score / $total) * 100);
    $passed  = $percent >= QUIZ_PASS_PERCENT;

    // Correct answers are only revealed once this attempt itself has passed
    $feedback = [];
    foreach ($raw as $qid => $fb) {
        $feedback[$qid] = ["correct" => $fb["correct"], "your" => $fb["your"]];
        if ($passed) $feedback[$qid]["expected"] = $fb["expected"];
    }

    $stmt = $conn->prepare("INSERT INTO quiz_attempts (user_id, quiz_id, score, total) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiii", $user_id, $quiz_id, $score, $total);
    $stmt->execute();
    $stmt->close();

    respond([
        "success"  => true,
        "score"    => $score,
        "total"    => $total,
        "percent"  => $percent,
        "passed"   => $passed,
        "feedback" => $feedback
    ]);
}

respond(["success" => false, "message" => "Invalid request."], 405);
