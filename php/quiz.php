<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit;
}

$user_id = $_SESSION["user_id"];
$method  = $_SERVER["REQUEST_METHOD"];

// GET: fetch quiz for a course
if ($method === "GET") {
    $course_id = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;

    if (!$course_id) {
        echo json_encode(["success" => false, "message" => "course_id required."]);
        exit;
    }

    $stmt = $conn->prepare("SELECT id, title FROM quizzes WHERE course_id = ? LIMIT 1");
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $quiz = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$quiz) {
        echo json_encode(["success" => false, "message" => "No quiz found for this course."]);
        exit;
    }

    // Fetch questions (without correct_option to prevent cheating)
    $qs = $conn->prepare("
        SELECT id, question, option_a, option_b, option_c, option_d
        FROM quiz_questions WHERE quiz_id = ?
    ");
    $qs->bind_param("i", $quiz["id"]);
    $qs->execute();
    $result    = $qs->get_result();
    $questions = [];
    while ($q = $result->fetch_assoc()) $questions[] = $q;
    $qs->close();

    // Best previous attempt
    $att = $conn->prepare("
        SELECT score, total, attempted_at FROM quiz_attempts
        WHERE user_id = ? AND quiz_id = ?
        ORDER BY score DESC LIMIT 1
    ");
    $att->bind_param("ii", $user_id, $quiz["id"]);
    $att->execute();
    $best = $att->get_result()->fetch_assoc();
    $att->close();

    echo json_encode([
        "success"   => true,
        "quiz"      => $quiz,
        "questions" => $questions,
        "best"      => $best
    ]);
    exit;
}

// POST: submit quiz answers
if ($method === "POST") {
    $data      = json_decode(file_get_contents("php://input"), true);
    $quiz_id   = (int)($data["quiz_id"] ?? 0);
    $answers   = $data["answers"] ?? []; // ["question_id" => "a|b|c|d"]

    if (!$quiz_id || empty($answers)) {
        echo json_encode(["success" => false, "message" => "quiz_id and answers required."]);
        exit;
    }

    // Fetch correct answers
    $qs = $conn->prepare("SELECT id, correct_option FROM quiz_questions WHERE quiz_id = ?");
    $qs->bind_param("i", $quiz_id);
    $qs->execute();
    $result    = $qs->get_result();
    $correct   = [];
    $feedback  = [];

    while ($q = $result->fetch_assoc()) {
        $correct[$q["id"]] = $q["correct_option"];
    }
    $qs->close();

    $score = 0;
    $total = count($correct);

    foreach ($correct as $qid => $ans) {
        $submitted = strtolower($answers[$qid] ?? "");
        $is_correct = ($submitted === $ans);
        if ($is_correct) $score++;
        $feedback[$qid] = [
            "correct"   => $is_correct,
            "your"      => $submitted,
            "expected"  => $ans
        ];
    }

    // Save attempt
    $stmt = $conn->prepare("INSERT INTO quiz_attempts (user_id, quiz_id, score, total) VALUES (?, ?, ?, ?)");
    $stmt->bind_param("iiii", $user_id, $quiz_id, $score, $total);
    $stmt->execute();
    $stmt->close();

    echo json_encode([
        "success"  => true,
        "score"    => $score,
        "total"    => $total,
        "percent"  => round(($score / $total) * 100),
        "feedback" => $feedback
    ]);
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request."]);
$conn->close();
