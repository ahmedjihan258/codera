<?php

require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode([
        "success" => false,
        "message" => "Invalid request."
    ]);
    exit;
}

$name = trim($_POST["name"] ?? "");
$email = trim($_POST["email"] ?? "");
$password = $_POST["password"] ?? "";
$confirmPassword = $_POST["confirmPassword"] ?? "";


// Check required fields
if ($name === "" || $email === "" || $password === "") {
    echo json_encode([
        "success" => false,
        "message" => "All fields are required."
    ]);
    exit;
}


// Check password
if ($password !== $confirmPassword) {
    echo json_encode([
        "success" => false,
        "message" => "Passwords do not match."
    ]);
    exit;
}


// Check password length
if (strlen($password) < 6) {
    echo json_encode([
        "success" => false,
        "message" => "Password must be at least 6 characters."
    ]);
    exit;
}


// Check if email already exists
$check = $conn->prepare(
    "SELECT id FROM users WHERE email = ?"
);

$check->bind_param("s", $email);
$check->execute();
$check->store_result();

if ($check->num_rows > 0) {

    echo json_encode([
        "success" => false,
        "message" => "An account with this email already exists."
    ]);

    $check->close();
    exit;
}

$check->close();


// Hash password
$hashedPassword = password_hash(
    $password,
    PASSWORD_DEFAULT
);


// Insert user
$stmt = $conn->prepare(
    "INSERT INTO users (name, email, password)
     VALUES (?, ?, ?)"
);

$stmt->bind_param(
    "sss",
    $name,
    $email,
    $hashedPassword
);


if ($stmt->execute()) {

    echo json_encode([
        "success" => true,
        "message" => "Account created successfully."
    ]);

} else {

    echo json_encode([
        "success" => false,
        "message" => "Something went wrong. Please try again."
    ]);
}


$stmt->close();
$conn->close();

?>