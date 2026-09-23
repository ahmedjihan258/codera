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

// GET: fetch progress for a course or all courses
if ($method === "GET") {
    $course_id = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;

    if ($course_id) {
        // Lessons for this course with completion flag
        $stmt = $conn->prepare("
            SELECT l.id, l.title, l.module_name, l.order_num,
                   IF(p.id IS NULL, 0, 1) AS completed
            FROM lessons l
            LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = ?
            WHERE l.course_id = ?
            ORDER BY l.order_num ASC
        ");
        $stmt->bind_param("ii", $user_id, $course_id);
        $stmt->execute();
        $result  = $stmt->get_result();
        $lessons = [];
        while ($row = $result->fetch_assoc()) {
            $row["completed"] = (bool)$row["completed"];
            $lessons[] = $row;
        }

        // Total and completed counts
        $total     = count($lessons);
        $completed = count(array_filter($lessons, fn($l) => $l["completed"]));

        echo json_encode([
            "success"   => true,
            "lessons"   => $lessons,
            "total"     => $total,
            "completed" => $completed
        ]);
        $stmt->close();
    } else {
        // Overall progress summary across all enrolled course
        $stmt = $conn->prepare("
            SELECT c.id, c.title, c.icon,
                   COUNT(l.id) AS total_lessons,
                   SUM(IF(p.id IS NULL, 0, 1)) AS completed_lessons
            FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            JOIN lessons l ON l.course_id = c.id
            LEFT JOIN progress p ON p.lesson_id = l.id AND p.user_id = e.user_id
            WHERE e.user_id = ?
            GROUP BY c.id
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result   = $stmt->get_result();
        $progress = [];
        while ($row = $result->fetch_assoc()) {
            $row["percent"] = $row["total_lessons"] > 0
                ? round(($row["completed_lessons"] / $row["total_lessons"]) * 100)
                : 0;
            $progress[] = $row;
        }
        echo json_encode(["success" => true, "progress" => $progress]);
        $stmt->close();
    }
    exit;
}

// POST: mark lesson as complete
if ($method === "POST") {
    $data      = json_decode(file_get_contents("php://input"), true);
    $lesson_id = (int)($data["lesson_id"] ?? 0);

    if (!$lesson_id) {
        echo json_encode(["success" => false, "message" => "Invalid lesson."]);
        exit;
    }

    $stmt = $conn->prepare("INSERT IGNORE INTO progress (user_id, lesson_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $user_id, $lesson_id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Lesson marked as complete!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Could not save progress."]);
    }
    $stmt->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request."]);
$conn->close();
