<?php
// Database connection — reusable across all PHP files
$host     = "localhost";
$username = "root";
$password = "";
$database = "codera_db";

$conn = new mysqli($host, $username, $password, $database);

if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Database connection failed: " . $conn->connect_error]);
    exit;
}

$conn->set_charset("utf8mb4");
