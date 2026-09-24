<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit;
}

$user_id = $_SESSION["user_id"];

// User info
$stmt = $conn->prepare("SELECT id, full_name, email, created_at FROM users WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$user = $stmt->get_result()->fetch_assoc();
$stmt->close();

// Enrolled courses with progress
$stmt = $conn->prepare("
    SELECT c.id, c.title, c.icon, c.level, c.duration, c.lesson_count,
           COUNT(DISTINCT l.id)   AS total_lessons,
           COUNT(DISTINCT p.lesson_id) AS done_lessons
    FROM enrollments e
    JOIN courses c ON c.id = e.course_id
    LEFT JOIN lessons l ON l.course_id = c.id
    LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = e.user_id
    WHERE e.user_id = ?
    GROUP BY c.id
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result  = $stmt->get_result();
$courses = [];
while ($row = $result->fetch_assoc()) {
    $row["percent"] = $row["total_lessons"] > 0
        ? round(($row["done_lessons"] / $row["total_lessons"]) * 100)
        : 0;
    $courses[] = $row;
}
$stmt->close();

// Recent quiz attempt
$stmt = $conn->prepare("
    SELECT qa.score, qa.total, qa.attempted_at, q.title AS quiz_title, c.title AS course_title
    FROM quiz_attempts qa
    JOIN quizzes q ON q.id = qa.quiz_id
    JOIN courses c ON c.id = q.course_id
    WHERE qa.user_id = ?
    ORDER BY qa.attempted_at DESC
    LIMIT 5
");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result   = $stmt->get_result();
$attempts = [];
while ($row = $result->fetch_assoc()) $attempts[] = $row;
$stmt->close();

// Summary stats
$total_enrolled   = count($courses);
$total_completed  = 0;
$total_lessons_done = 0;
foreach ($courses as $c) {
    if ($c["percent"] === 100) $total_completed++;
    $total_lessons_done += (int)$c["done_lessons"];
}

echo json_encode([
    "success"         => true,
    "user"            => $user,
    "courses"         => $courses,
    "quiz_attempts"   => $attempts,
    "total_enrolled"  => $total_enrolled,
    "total_completed" => $total_completed,
    "lessons_done"    => $total_lessons_done
]);

$conn->close();
