<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit;
}

$user_id   = $_SESSION["user_id"];
$lesson_id = isset($_GET["lesson_id"]) ? (int)$_GET["lesson_id"] : 0;

if ($lesson_id) {
    // Single lesson
    $stmt = $conn->prepare("
        SELECT l.*, c.title AS course_title,
               IF(p.id IS NULL, 0, 1) AS completed
        FROM lessons l
        JOIN courses c ON c.id = l.course_id
        LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = ?
        WHERE l.id = ?
    ");
    $stmt->bind_param("ii", $user_id, $lesson_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $lesson = $result->fetch_assoc();

    if (!$lesson) {
        echo json_encode(["success" => false, "message" => "Lesson not found."]);
        exit;
    }

    $lesson["completed"] = (bool)$lesson["completed"];

    // Previous and next lesson in the same course
    $nav = $conn->prepare("
        SELECT id, title FROM lessons
        WHERE course_id = ? AND order_num = ?
    ");

    $prev_order = $lesson["order_num"] - 1;
    $nav->bind_param("ii", $lesson["course_id"], $prev_order);
    $nav->execute();
    $lesson["prev_lesson"] = $nav->get_result()->fetch_assoc();

    $next_order = $lesson["order_num"] + 1;
    $nav->bind_param("ii", $lesson["course_id"], $next_order);
    $nav->execute();
    $lesson["next_lesson"] = $nav->get_result()->fetch_assoc();

    $nav->close();

    echo json_encode(["success" => true, "lesson" => $lesson]);
    $stmt->close();
} else {
    echo json_encode(["success" => false, "message" => "lesson_id required."]);
}

$conn->close();
