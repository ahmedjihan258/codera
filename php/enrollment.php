<?php

session_start();

require_once "db.php";

header("Content-Type: application/json");


// Check login
if (!isset($_SESSION["user_id"])) {
    echo json_encode([
        "success" => false,
        "message" => "Please login first."
    ]);
    exit;
}

$user_id = $_SESSION["user_id"];


// =========================
// GET ENROLLMENT STATUS
// =========================

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    $course_id = intval($_GET["course_id"] ?? 0);

    if ($course_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid course."
        ]);
        exit;
    }

    $stmt = $conn->prepare(
        "SELECT id
         FROM enrollments
         WHERE user_id = ? AND course_id = ?"
    );

    $stmt->bind_param("ii", $user_id, $course_id);
    $stmt->execute();

    $result = $stmt->get_result();

    echo json_encode([
        "success" => true,
        "enrolled" => $result->num_rows > 0
    ]);

    $stmt->close();
    $conn->close();
    exit;
}


// =========================
// CREATE ENROLLMENT
// =========================

if ($_SERVER["REQUEST_METHOD"] === "POST") {

    $course_id = intval($_POST["course_id"] ?? 0);

    if ($course_id <= 0) {
        echo json_encode([
            "success" => false,
            "message" => "Invalid course."
        ]);
        exit;
    }


    // Check course exists

    $courseCheck = $conn->prepare(
        "SELECT id FROM courses WHERE id = ?"
    );

    $courseCheck->bind_param("i", $course_id);
    $courseCheck->execute();

    $courseResult = $courseCheck->get_result();

    if ($courseResult->num_rows === 0) {
        echo json_encode([
            "success" => false,
            "message" => "Course not found."
        ]);
        exit;
    }

    $courseCheck->close();


    // Check existing enrollment

    $check = $conn->prepare(
        "SELECT id
         FROM enrollments
         WHERE user_id = ? AND course_id = ?"
    );

    $check->bind_param("ii", $user_id, $course_id);
    $check->execute();

    $result = $check->get_result();

    if ($result->num_rows > 0) {

        echo json_encode([
            "success" => true,
            "message" => "You are already enrolled in this course.",
            "already_enrolled" => true
        ]);

        $check->close();
        $conn->close();
        exit;
    }

    $check->close();


    // Create enrollment

    $stmt = $conn->prepare(
        "INSERT INTO enrollments (user_id, course_id)
         VALUES (?, ?)"
    );

    $stmt->bind_param("ii", $user_id, $course_id);

    if ($stmt->execute()) {

        echo json_encode([
            "success" => true,
            "message" => "You are enrolled successfully!",
            "already_enrolled" => false
        ]);

    } else {

        echo json_encode([
            "success" => false,
            "message" => "Enrollment failed."
        ]);
    }

    $stmt->close();
    $conn->close();
    exit;
}


echo json_encode([
    "success" => false,
    "message" => "Invalid request."
]);

?>