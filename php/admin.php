<?php
// ===== FILE: php/admin.php =====
session_start();
header('Content-Type: application/json');
require_once 'db.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit();
}

$action = $_GET['action'] ?? '';

// Handle POST actions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true) ?? $_POST;
    $postAction = $input['action'] ?? $action;

    // Save Course
    if ($postAction === 'save_course') {
        $id = $input['id'] ?? null;
        $title = trim($input['title'] ?? '');
        $description = trim($input['description'] ?? '');
        $level = $input['level'] ?? 'Beginner';
        $duration = trim($input['duration'] ?? '');
        $icon = trim($input['icon'] ?? '🌐');

        if (empty($title)) {
            echo json_encode(["success" => false, "message" => "Title is required."]);
            exit();
        }

        if ($id) {
            $stmt = $conn->prepare("UPDATE courses SET title=?, description=?, level=?, duration=?, icon=? WHERE id=?");
            $stmt->bind_param("sssssi", $title, $description, $level, $duration, $icon, $id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO courses (title, description, level, duration, icon) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("sssss", $title, $description, $level, $duration, $icon);
            $stmt->execute();
        }

        echo json_encode(["success" => true, "message" => "Course saved successfully."]);
        exit();
    }

    // Delete Course
    if ($postAction === 'delete_course') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM courses WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid course ID."]);
        }
        exit();
    }

    // Save Lesson & Send Student Notification
    if ($postAction === 'save_lesson') {
        $id = $input['id'] ?? null;
        $course_id = $input['course_id'] ?? null;
        $module_name = trim($input['module_name'] ?? '');
        $title = trim($input['title'] ?? '');
        $order_num = (int)($input['order_num'] ?? 1);
        $content = $input['content'] ?? '';

        if (empty($course_id) || empty($module_name) || empty($title)) {
            echo json_encode(["success" => false, "message" => "Course, module name, and title are required."]);
            exit();
        }

        // Fetch Course Title for notification message
        $cStmt = $conn->prepare("SELECT title FROM courses WHERE id = ?");
        $cStmt->bind_param("i", $course_id);
        $cStmt->execute();
        $course = $cStmt->get_result()->fetch_assoc();
        $course_title = $course ? $course['title'] : 'Course';

        if ($id) {
            // Update Lesson
            $stmt = $conn->prepare("UPDATE lessons SET course_id=?, module_name=?, title=?, order_num=?, content=? WHERE id=?");
            $stmt->bind_param("issisi", $course_id, $module_name, $title, $order_num, $content, $id);
            $stmt->execute();

            $notif_title = "Module/Lesson Updated";
            $notif_msg = "The module/lesson '$title' in $course_title has been updated.";
        } else {
            // Insert Lesson
            $stmt = $conn->prepare("INSERT INTO lessons (course_id, module_name, title, order_num, content) VALUES (?, ?, ?, ?, ?)");
            $stmt->bind_param("issis", $course_id, $module_name, $title, $order_num, $content);
            $stmt->execute();

            $notif_title = "New Module/Lesson Uploaded";
            $notif_msg = "A new module/lesson '$title' ($module_name) was added to $course_title!";
        }

        // Notify only students enrolled in this course
        $enrolledStmt = $conn->prepare("SELECT user_id FROM enrollments WHERE course_id = ?");
        $enrolledStmt->bind_param("i", $course_id);
        $enrolledStmt->execute();
        $enrolledUsers = $enrolledStmt->get_result()->fetch_all(MYSQLI_ASSOC);

        if (count($enrolledUsers) > 0) {
            $notifStmt = $conn->prepare("INSERT INTO notifications (user_id, title, message) VALUES (?, ?, ?)");
            foreach ($enrolledUsers as $row) {
                $uid = $row['user_id'];
                $notifStmt->bind_param("iss", $uid, $notif_title, $notif_msg);
                $notifStmt->execute();
            }
        }

        echo json_encode(["success" => true, "message" => "Lesson saved and enrolled students notified successfully!"]);
        exit();
    }

    // Delete Lesson
    if ($postAction === 'delete_lesson') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM lessons WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid lesson ID."]);
        }
        exit();
    }

    // Save Problem
    if ($postAction === 'save_problem') {
        $id = $input['id'] ?? null;
        $title = trim($input['title'] ?? '');
        $difficulty = $input['difficulty'] ?? 'Easy';
        $description = trim($input['description'] ?? '');
        $example_input = $input['example_input'] ?? '';
        $example_output = $input['example_output'] ?? '';
        $hint = $input['hint'] ?? '';
        $solution = $input['solution'] ?? '';

        if (empty($title)) {
            echo json_encode(["success" => false, "message" => "Title is required."]);
            exit();
        }

        if ($id) {
            $stmt = $conn->prepare("UPDATE problems SET title=?, difficulty=?, description=?, example_input=?, example_output=?, hint=?, solution=? WHERE id=?");
            $stmt->bind_param("sssssssi", $title, $difficulty, $description, $example_input, $example_output, $hint, $solution, $id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO problems (title, difficulty, description, example_input, example_output, hint, solution) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("sssssss", $title, $difficulty, $description, $example_input, $example_output, $hint, $solution);
            $stmt->execute();
        }

        echo json_encode(["success" => true, "message" => "Problem saved successfully."]);
        exit();
    }

    // Delete Problem
    if ($postAction === 'delete_problem') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM problems WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid problem ID."]);
        }
        exit();
    }

    // Update User Role
    if ($postAction === 'update_user_role') {
        $id = $input['id'] ?? null;
        $role = $input['role'] ?? 'user';
        if ($id) {
            $stmt = $conn->prepare("UPDATE users SET role=? WHERE id=?");
            $stmt->bind_param("si", $role, $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid user ID."]);
        }
        exit();
    }

    // Delete User
    if ($postAction === 'delete_user') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM users WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid user ID."]);
        }
        exit();
    }
}

// Handle GET actions
if ($action === 'stats') {
    $c = $conn->query("SELECT COUNT(*) AS c FROM courses")->fetch_assoc()['c'];
    $l = $conn->query("SELECT COUNT(*) AS c FROM lessons")->fetch_assoc()['c'];
    $p = $conn->query("SELECT COUNT(*) AS c FROM problems")->fetch_assoc()['c'];
    $u = $conn->query("SELECT COUNT(*) AS c FROM users")->fetch_assoc()['c'];
    echo json_encode(["success" => true, "stats" => ["courses" => $c, "lessons" => $l, "problems" => $p, "users" => $u]]);
    exit();
}

if ($action === 'get_courses') {
    $result = $conn->query("
        SELECT c.*, COUNT(l.id) as lesson_count
        FROM courses c
        LEFT JOIN lessons l ON c.id = l.course_id
        GROUP BY c.id
        ORDER BY c.id DESC
    ");
    echo json_encode(["success" => true, "courses" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_modules') {
    $course_id = $_GET['course_id'] ?? null;
    if ($course_id) {
        $stmt = $conn->prepare("SELECT DISTINCT module_name FROM lessons WHERE course_id = ? AND module_name IS NOT NULL AND module_name != ''");
        $stmt->bind_param("i", $course_id);
        $stmt->execute();
        $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $modules = array_map(fn($r) => $r['module_name'], $rows);
        echo json_encode(["success" => true, "modules" => $modules]);
    } else {
        echo json_encode(["success" => false, "modules" => []]);
    }
    exit();
}

if ($action === 'get_lessons') {
    $result = $conn->query("
        SELECT l.*, c.title as course_title
        FROM lessons l
        LEFT JOIN courses c ON l.course_id = c.id
        ORDER BY l.id DESC
    ");
    echo json_encode(["success" => true, "lessons" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_problems') {
    $result = $conn->query("SELECT * FROM problems ORDER BY id DESC");
    echo json_encode(["success" => true, "problems" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_users') {
    $result = $conn->query("SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC");
    echo json_encode(["success" => true, "users" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}
