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
$action  = $_GET["action"] ?? "posts";

// GET
if ($method === "GET") {
    if ($action === "posts") {
        $stmt = $conn->prepare("
            SELECT cp.*, u.full_name,
                   (SELECT COUNT(*) FROM community_comments WHERE post_id = cp.id) AS comment_count
            FROM community_posts cp
            JOIN users u ON u.id = cp.user_id
            ORDER BY cp.created_at DESC
            LIMIT 50
        ");
        $stmt->execute();
        $result = $stmt->get_result();
        $posts  = [];
        while ($row = $result->fetch_assoc()) $posts[] = $row;
        $stmt->close();
        echo json_encode(["success" => true, "posts" => $posts]);
    }

    if ($action === "comments") {
        $post_id = (int)($_GET["post_id"] ?? 0);
        $stmt = $conn->prepare("
            SELECT cc.*, u.full_name
            FROM community_comments cc
            JOIN users u ON u.id = cc.user_id
            WHERE cc.post_id = ?
            ORDER BY cc.created_at ASC
        ");
        $stmt->bind_param("i", $post_id);
        $stmt->execute();
        $result   = $stmt->get_result();
        $comments = [];
        while ($row = $result->fetch_assoc()) $comments[] = $row;
        $stmt->close();
        echo json_encode(["success" => true, "comments" => $comments]);
    }
    exit;
}

// POST
if ($method === "POST") {
    $data = json_decode(file_get_contents("php://input"), true);

    if ($action === "post") {
        $title   = trim($data["title"] ?? "");
        $content = trim($data["content"] ?? "");

        if (empty($title) || empty($content)) {
            echo json_encode(["success" => false, "message" => "Title and content are required."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO community_posts (user_id, title, content) VALUES (?, ?, ?)");
        $stmt->bind_param("iss", $user_id, $title, $content);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Post created!", "post_id" => $conn->insert_id]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to create post."]);
        }
        $stmt->close();
    }

    if ($action === "comment") {
        $post_id = (int)($data["post_id"] ?? 0);
        $content = trim($data["content"] ?? "");

        if (!$post_id || empty($content)) {
            echo json_encode(["success" => false, "message" => "post_id and content are required."]);
            exit;
        }

        $stmt = $conn->prepare("INSERT INTO community_comments (post_id, user_id, content) VALUES (?, ?, ?)");
        $stmt->bind_param("iis", $post_id, $user_id, $content);

        if ($stmt->execute()) {
            echo json_encode(["success" => true, "message" => "Comment added!"]);
        } else {
            echo json_encode(["success" => false, "message" => "Failed to add comment."]);
        }
        $stmt->close();
    }

    if ($action === "upvote") {
        $post_id = (int)($data["post_id"] ?? 0);
        $stmt = $conn->prepare("UPDATE community_posts SET upvotes = upvotes + 1 WHERE id = ?");
        $stmt->bind_param("i", $post_id);
        $stmt->execute();
        $stmt->close();
        echo json_encode(["success" => true]);
    }

    exit;
}

echo json_encode(["success" => false, "message" => "Invalid request."]);
$conn->close();
