<?php
session_start();
header("Content-Type: application/json");
require_once "db.php";

if (!isset($_SESSION["user_id"])) {
    echo json_encode(["success" => false, "message" => "Not authenticated."]);
    exit;
}

$id = isset($_GET["id"]) ? (int)$_GET["id"] : 0;

if ($id) {
    $stmt = $conn->prepare("SELECT * FROM problems WHERE id = ?");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $problem = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if ($problem) {
        echo json_encode(["success" => true, "problem" => $problem]);
    } else {
        echo json_encode(["success" => false, "message" => "Problem not found."]);
    }
} else {
    // Filter by difficulty
    $difficulty = $_GET["difficulty"] ?? "";
    if ($difficulty && in_array($difficulty, ["Easy", "Medium", "Hard"])) {
        $stmt = $conn->prepare("SELECT id, title, difficulty FROM problems WHERE difficulty = ? ORDER BY id ASC");
        $stmt->bind_param("s", $difficulty);
    } else {
        $stmt = $conn->prepare("SELECT id, title, difficulty FROM problems ORDER BY id ASC");
    }
    $stmt->execute();
    $result   = $stmt->get_result();
    $problems = [];
    while ($row = $result->fetch_assoc()) $problems[] = $row;
    $stmt->close();
    echo json_encode(["success" => true, "problems" => $problems]);
}

$conn->close();
