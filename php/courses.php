<?php

require_once "db.php";

header("Content-Type: application/json");

if ($_SERVER["REQUEST_METHOD"] === "GET") {

    // Get one course
    if (isset($_GET["id"])) {

        $id = intval($_GET["id"]);

        $stmt = $conn->prepare(
            "SELECT id, title, description, level, duration, lessons, image
             FROM courses
             WHERE id = ?"
        );

        $stmt->bind_param("i", $id);
        $stmt->execute();

        $result = $stmt->get_result();

        if ($result->num_rows === 0) {
            echo json_encode([
                "success" => false,
                "message" => "Course not found."
            ]);
            exit;
        }

        $course = $result->fetch_assoc();

        echo json_encode([
            "success" => true,
            "course" => $course
        ]);

        $stmt->close();
        $conn->close();
        exit;
    }


    // Get all courses

    $result = $conn->query(
        "SELECT id, title, description, level, duration, lessons, image
         FROM courses
         ORDER BY id ASC"
    );

    $courses = [];

    while ($row = $result->fetch_assoc()) {
        $courses[] = $row;
    }

    echo json_encode([
        "success" => true,
        "courses" => $courses
    ]);

    $conn->close();
    exit;
}


echo json_encode([
    "success" => false,
    "message" => "Invalid request."
]);

?>