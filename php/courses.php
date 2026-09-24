<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

// Must be logged in
if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit;
}

$user_id = $_SESSION["user_id"];

// Fetch all courses with enrollment status for this user
$sql = "
    SELECT c.*,
           (SELECT COUNT(*) FROM enrollments WHERE user_id = ? AND course_id = c.id) AS enrolled
    FROM courses c
    ORDER BY c.id ASC
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

$courses = [];
while ($row = $result->fetch_assoc()) {
    $row["enrolled"] = (int)$row["enrolled"] > 0;
    $courses[] = $row;
}

echo json_encode(["success" => true, "courses" => $courses]);

$stmt->close();
$conn->close();
