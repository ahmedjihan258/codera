<?php
ini_set("display_errors", "0"); // warnings must never leak into the JSON output (they are still logged)
session_set_cookie_params(["samesite" => "Lax", "httponly" => true]);
session_start();
header("Content-Type: application/json");
require_once "db.php";

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    echo json_encode(["success" => false, "message" => "Invalid request method."]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!is_array($data)) {
    $data = [];
}

$email    = trim((string)($data["email"] ?? ""));
$password = (string)($data["password"] ?? "");
// Extract expected role from payload (defaults to 'student' if not set)
$type     = trim((string)($data["type"] ?? $data["role"] ?? "student"));

if ($email === "" || $password === "") {
    echo json_encode(["success" => false, "message" => "Email and password are required."]);
    exit;
}

try {
    // Make sure the 'role' column exists (older database dumps don't have it, which made login fail)
    $col = $conn->query("SHOW COLUMNS FROM users LIKE 'role'");
    if ($col && $col->num_rows === 0) {
        $conn->query("ALTER TABLE users ADD COLUMN role ENUM('user','admin') NOT NULL DEFAULT 'user' AFTER password");
        $conn->query("UPDATE users SET role='admin' WHERE email='admin@codera.com'");
    }

    $stmt = $conn->prepare("SELECT id, full_name, password, role FROM users WHERE email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Verify credentials
    if (!$user || !password_verify($password, $user["password"])) {
        echo json_encode(["success" => false, "message" => "Invalid email or password."]);
        exit;
    }

    // 2. UPDATED: Verify Admin tab restriction
    // If logging in from the Admin tab, verify the database role is actually 'admin'
    if (strtolower($type) === "admin" && strtolower($user["role"]) !== "admin") {
        echo json_encode([
            "success" => false,
            "message" => "This account isn't an admin. Switch to Student login."
        ]);
        exit;
    }

    // New session id after login (prevents session fixation)
    session_regenerate_id(true);
    $_SESSION["user_id"]   = (int)$user["id"];
    $_SESSION["user_name"] = $user["full_name"];
    $_SESSION["role"]      = $user["role"]; // Store role in session
    session_write_close(); // release the session lock so the next page loads instantly

    echo json_encode([
        "success"   => true,
        "message"   => "Login successful.",
        "user_name" => $user["full_name"],
        "role"      => $user["role"]
    ]);
} catch (Throwable $e) {
    // Always answer with JSON, never an HTML error page.
    error_log("login.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["success" => false, "message" => "Server error. Please try again."]);
}
