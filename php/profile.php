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

// GET: fetch profil
if ($method === "GET") {
    $stmt = $conn->prepare("SELECT id, full_name, email, bio, avatar, created_at FROM users WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $user = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    // Enrollment count
    $ec = $conn->prepare("SELECT COUNT(*) AS c FROM enrollments WHERE user_id = ?");
    $ec->bind_param("i", $user_id);
    $ec->execute();
    $user["enrolled_courses"] = (int)$ec->get_result()->fetch_assoc()["c"];
    $ec->close();

    // Completed lessons count
    $lc = $conn->prepare("SELECT COUNT(*) AS c FROM progress WHERE user_id = ?");
    $lc->bind_param("i", $user_id);
    $lc->execute();
    $user["completed_lessons"] = (int)$lc->get_result()->fetch_assoc()["c"];
    $lc->close();

    echo json_encode(["success" => true, "user" => $user]);
    exit;
}

// POST: update profile
if ($method === "POST") {
    $data      = json_decode(file_get_contents("php://input"), true);
    $full_name = trim($data["full_name"] ?? "");
    $bio       = trim($data["bio"] ?? "");

    if (empty($full_name)) {
        echo json_encode(["success" => false, "message" => "Name is required."]);
        exit;
    }

    // Handle password change
    if (!empty($data["new_password"])) {
        if (strlen($data["new_password"]) < 6) {
            echo json_encode(["success" => false, "message" => "New password must be at least 6 characters."]);
            exit;
        }

        // Verify current password
        $cur = $conn->prepare("SELECT password FROM users WHERE id = ?");
        $cur->bind_param("i", $user_id);
        $cur->execute();
        $existing = $cur->get_result()->fetch_assoc();
        $cur->close();

        if (!password_verify($data["current_password"] ?? "", $existing["password"])) {
            echo json_encode(["success" => false, "message" => "Current password is incorrect."]);
            exit;
        }

        $hashed = password_hash($data["new_password"], PASSWORD_BCRYPT);
        $stmt   = $conn->prepare("UPDATE users SET full_name = ?, bio = ?, password = ? WHERE id = ?");
        $stmt->bind_param("sssi", $full_name, $bio, $hashed, $user_id);
    } else {
        $stmt = $conn->prepare("UPDATE users SET full_name = ?, bio = ? WHERE id = ?");
        $stmt->bind_param("ssi", $full_name, $bio, $user_id);
    }

    if ($stmt->execute()) {
        $_SESSION["user_name"] = $full_name;
        echo json_encode(["success" => true, "message" => "Profile updated successfully!"]);
    } else {
        echo json_encode(["success" => false, "message" => "Update failed."]);
    }
    $stmt->close();
    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request."]);
$conn->close();
