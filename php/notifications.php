<?php
// ===== FILE: php/notifications.php =====
session_start();
header('Content-Type: application/json');
require_once 'db.php';

$action = $_GET['action'] ?? '';
$user_id = $_SESSION['user_id'] ?? null;

// Fetch notifications (both targeted and global NULL broadcast)
if ($action === 'get') {
    $stmt = $conn->prepare("
        SELECT * FROM notifications
        WHERE user_id IS NULL OR user_id = ?
        ORDER BY created_at DESC LIMIT 10
    ");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $notifications = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    echo json_encode(["success" => true, "notifications" => $notifications]);
    exit();
}

// Mark notifications as read
if ($action === 'mark_read') {
    $stmt = $conn->prepare("UPDATE notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    echo json_encode(["success" => true]);
    exit();
}
