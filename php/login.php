<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);

$email    = trim($data["email"] ?? "");
$password = $data["password"] ?? "";

if (empty($email) || empty($password)) {
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit;
}

// Find user by email
$stmt = $conn->prepare("SELECT id, full_name, password FROM users WHERE email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["success" => false, "message" => "No account found with that email."]);
    $stmt->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

if (!password_verify($password, $user["password"])) {
    echo json_encode(["success" => false, "message" => "Incorrect password."]);
    exit;
}

// Set session
$_SESSION["user_id"]   = $user["id"];
$_SESSION["user_name"] = $user["full_name"];

echo json_encode([
    "success"   => true,
    "message"   => "Login successful.",
    "user_name" => $user["full_name"]
]);

$conn->close();
