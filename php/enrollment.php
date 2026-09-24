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

// GET: check enrollment or list enrollment
if ($method === "GET") {
    $course_id = isset($_GET["course_id"]) ? (int)$_GET["course_id"] : 0;

    if ($course_id) {
        // Check single course
        $stmt = $conn->prepare("SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?");
        $stmt->bind_param("ii", $user_id, $course_id);
        $stmt->execute();
        $stmt->store_result();
        echo json_encode(["success" => true, "enrolled" => $stmt->num_rows > 0]);
        $stmt->close();
    } else {
        // Return all enrolled courses
        $stmt = $conn->prepare("
            SELECT c.*, e.enrolled_at FROM enrollments e
            JOIN courses c ON c.id = e.course_id
            WHERE e.user_id = ?
        ");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $courses = [];
        while ($row = $result->fetch_assoc()) $courses[] = $row;
        echo json_encode(["success" => true, "courses" => $courses]);
        $stmt->close();
    }
    exit;
}

// POST: enroll
if ($method === "POST") {
    $data      = json_decode(file_get_contents("php://input"), true);
    $course_id = (int)($data["course_id"] ?? 0);

    if (!$course_id) {
        echo json_encode(["success" => false, "message" => "Invalid course."]);
        exit;
    }

    // Verify course exists
    $check = $conn->prepare("SELECT id FROM courses WHERE id = ?");
    $check->bind_param("i", $course_id);
    $check->execute();
    $check->store_result();
    if ($check->num_rows === 0) {
        echo json_encode(["success" => false, "message" => "Course not found."]);
        $check->close();
        exit;
    }
    $check->close();

    // Insert (ignore duplicate)
    $stmt = $conn->prepare("INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)");
    $stmt->bind_param("ii", $user_id, $course_id);

    if ($stmt->execute()) {
        echo json_encode(["success" => true, "message" => "Enrolled successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Enrollment failed."]);
    }
    $stmt->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request."]);
$conn->close();
