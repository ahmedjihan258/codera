<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

// Only accept POST requests
if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$full_name        = trim($data["full_name"] ?? "");
$email            = trim($data["email"] ?? "");
$password         = $data["password"] ?? "";
$confirm_password = $data["confirm_password"] ?? "";

// Validate
if (empty($full_name) || empty($email) || empty($password) || empty($confirm_password)) {
    echo json_encode(["success" => false, "message" => "All fields are required."]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["success" => false, "message" => "Invalid email address."]);
    exit;
}

if (strlen($password) < 6) {
    echo json_encode(["success" => false, "message" => "Password must be at least 6 characters."]);
    exit;
}

if ($password !== $confirm_password) {
    echo json_encode(["success" => false, "message" => "Passwords do not match."]);
    exit;
}

// Check if email already exist
$stmt = $conn->prepare("SELECT id FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows > 0) {
    echo json_encode(["success" => false, "message" => "An account with this email already exists."]);
    $stmt->close();
    exit;
}
$stmt->close();

// Hash password and insert user
$hashed = password_hash($password, PASSWORD_BCRYPT);

$stmt = $conn->prepare("INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $full_name, $email, $hashed);

if ($stmt->execute()) {
    $user_id = $conn->insert_id;
    $_SESSION["user_id"]   = $user_id;
    $_SESSION["user_name"] = $full_name;
    echo json_encode(["success" => true, "message" => "Account created successfully.", "user_name" => $full_name]);
} else {
    echo json_encode(["success" => false, "message" => "Registration failed. Please try again."]);
}

$stmt->close();
$conn->close();
