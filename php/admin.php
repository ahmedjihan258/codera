<?php
// ===== FILE: php/admin.php =====
session_start();
header('Content-Type: application/json');
require_once 'db.php';
require_once 'module_access.php';
require_once 'judge_schema.php';

// Check if user is logged in and is an admin
if (!isset($_SESSION['user_id']) || $_SESSION['role'] !== 'admin') {
    echo json_encode(["success" => false, "message" => "Unauthorized access."]);
    exit();
}

ensure_judge_tables($conn);

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

        if (empty($title)) {
            echo json_encode(["success" => false, "message" => "Title is required."]);
            exit();
        }

        if ($id) {
            $stmt = $conn->prepare("UPDATE problems SET title=?, difficulty=?, description=?, example_input=?, example_output=?, hint=? WHERE id=?");
            $stmt->bind_param("ssssssi", $title, $difficulty, $description, $example_input, $example_output, $hint, $id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO problems (title, difficulty, description, example_input, example_output, hint) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("ssssss", $title, $difficulty, $description, $example_input, $example_output, $hint);
            $stmt->execute();
        }

        echo json_encode(["success" => true, "message" => "Problem saved successfully."]);
        exit();
    }

    // Delete Problem (also cleans up its test cases and submissions —
    // explicit here since the auto-created judge tables have no FK cascade;
    // only the SQL-file-imported version does)
    if ($postAction === 'delete_problem') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM submissions WHERE problem_id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $stmt = $conn->prepare("DELETE FROM problem_test_cases WHERE problem_id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            $stmt = $conn->prepare("DELETE FROM problems WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();

            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid problem ID."]);
        }
        exit();
    }

    // Save Test Case (belongs to one problem)
    if ($postAction === 'save_test_case') {
        $id              = $input['id'] ?? null;
        $problem_id      = $input['problem_id'] ?? null;
        $test_input      = trim($input['input'] ?? '');
        $expected_output = (string)($input['expected_output'] ?? '');
        $is_sample       = !empty($input['is_sample']) ? 1 : 0;
        $order_num       = (int)($input['order_num'] ?? 0);
        $kind            = (($input['kind'] ?? 'js') === 'stdio') ? 'stdio' : 'js';

        if (empty($problem_id) || $test_input === '' || $expected_output === '') {
            echo json_encode(["success" => false, "message" => "Problem, input, and expected output are all required."]);
            exit();
        }

        if ($id) {
            $stmt = $conn->prepare("UPDATE problem_test_cases SET problem_id=?, input=?, expected_output=?, is_sample=?, order_num=?, kind=? WHERE id=?");
            $stmt->bind_param("issiisi", $problem_id, $test_input, $expected_output, $is_sample, $order_num, $kind, $id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO problem_test_cases (problem_id, input, expected_output, is_sample, order_num, kind) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("issiis", $problem_id, $test_input, $expected_output, $is_sample, $order_num, $kind);
            $stmt->execute();
        }

        echo json_encode(["success" => true, "message" => "Test case saved successfully."]);
        exit();
    }

    // Delete Test Case
    if ($postAction === 'delete_test_case') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM problem_test_cases WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid test case ID."]);
        }
        exit();
    }

    // Save Quiz (module quiz, or final course quiz when module_name is left blank)
    if ($postAction === 'save_quiz') {
        $id = $input['id'] ?? null;
        $course_id = $input['course_id'] ?? null;
        $module_name = trim($input['module_name'] ?? '');
        $module_name = $module_name === '' ? null : $module_name;
        $title = trim($input['title'] ?? '');

        if (empty($course_id) || empty($title)) {
            echo json_encode(["success" => false, "message" => "Course and quiz title are required."]);
            exit();
        }

        if ($id) {
            $stmt = $conn->prepare("UPDATE quizzes SET course_id=?, module_name=?, title=? WHERE id=?");
            $stmt->bind_param("issi", $course_id, $module_name, $title, $id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO quizzes (course_id, module_name, title) VALUES (?, ?, ?)");
            $stmt->bind_param("iss", $course_id, $module_name, $title);
            $stmt->execute();
        }

        echo json_encode(["success" => true, "message" => "Quiz saved successfully."]);
        exit();
    }

    // Delete Quiz (cascades to its questions and attempts via FK)
    if ($postAction === 'delete_quiz') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM quizzes WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid quiz ID."]);
        }
        exit();
    }

    // Save Quiz Question (belongs to one quiz)
    if ($postAction === 'save_quiz_question') {
        $id             = $input['id'] ?? null;
        $quiz_id        = $input['quiz_id'] ?? null;
        $question       = trim($input['question'] ?? '');
        $option_a       = trim($input['option_a'] ?? '');
        $option_b       = trim($input['option_b'] ?? '');
        $option_c       = trim($input['option_c'] ?? '');
        $option_d       = trim($input['option_d'] ?? '');
        $correct_option = strtolower(trim($input['correct_option'] ?? ''));

        if (empty($quiz_id) || $question === '' || $option_a === '' || $option_b === '' || $option_c === '' || $option_d === '') {
            echo json_encode(["success" => false, "message" => "Question text and all four options are required."]);
            exit();
        }
        if (!in_array($correct_option, ['a', 'b', 'c', 'd'], true)) {
            echo json_encode(["success" => false, "message" => "Correct option must be A, B, C, or D."]);
            exit();
        }

        if ($id) {
            $stmt = $conn->prepare("UPDATE quiz_questions SET quiz_id=?, question=?, option_a=?, option_b=?, option_c=?, option_d=?, correct_option=? WHERE id=?");
            $stmt->bind_param("issssssi", $quiz_id, $question, $option_a, $option_b, $option_c, $option_d, $correct_option, $id);
            $stmt->execute();
        } else {
            $stmt = $conn->prepare("INSERT INTO quiz_questions (quiz_id, question, option_a, option_b, option_c, option_d, correct_option) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->bind_param("issssss", $quiz_id, $question, $option_a, $option_b, $option_c, $option_d, $correct_option);
            $stmt->execute();
        }

        echo json_encode(["success" => true, "message" => "Question saved successfully."]);
        exit();
    }

    // Delete Quiz Question
    if ($postAction === 'delete_quiz_question') {
        $id = $_GET['id'] ?? ($input['id'] ?? null);
        if ($id) {
            $stmt = $conn->prepare("DELETE FROM quiz_questions WHERE id=?");
            $stmt->bind_param("i", $id);
            $stmt->execute();
            echo json_encode(["success" => true]);
        } else {
            echo json_encode(["success" => false, "message" => "Invalid question ID."]);
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

if ($action === 'get_quizzes') {
    $result = $conn->query("
        SELECT q.id, q.course_id, q.module_name, q.title, c.title AS course_title,
               (SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = q.id) AS question_count
        FROM quizzes q
        LEFT JOIN courses c ON q.course_id = c.id
        ORDER BY q.course_id ASC, (q.module_name IS NULL) ASC, q.id ASC
    ");
    echo json_encode(["success" => true, "quizzes" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_quiz_questions') {
    $quiz_id = $_GET['quiz_id'] ?? null;
    if (!$quiz_id) {
        echo json_encode(["success" => false, "message" => "quiz_id is required.", "questions" => []]);
        exit();
    }
    $stmt = $conn->prepare("SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY id ASC");
    $stmt->bind_param("i", $quiz_id);
    $stmt->execute();
    echo json_encode(["success" => true, "questions" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_quiz_results') {
    $course_id = $_GET['course_id'] ?? null;
    $quiz_id   = $_GET['quiz_id'] ?? null;
    $student   = trim($_GET['student'] ?? '');

    $sql = "
        SELECT qa.id, qa.user_id, qa.quiz_id, qa.score, qa.total, qa.attempted_at,
               u.full_name AS student_name, u.email AS student_email,
               q.title AS quiz_title, q.module_name, q.course_id,
               c.title AS course_title
        FROM quiz_attempts qa
        JOIN users u    ON u.id = qa.user_id
        JOIN quizzes q  ON q.id = qa.quiz_id
        JOIN courses c  ON c.id = q.course_id
        WHERE 1=1
    ";
    $types = "";
    $params = [];
    if ($course_id) { $sql .= " AND q.course_id = ?"; $types .= "i"; $params[] = $course_id; }
    if ($quiz_id)   { $sql .= " AND qa.quiz_id = ?";   $types .= "i"; $params[] = $quiz_id; }
    if ($student !== '') {
        $sql .= " AND (u.full_name LIKE ? OR u.email LIKE ?)";
        $types .= "ss";
        $like = "%{$student}%";
        $params[] = $like;
        $params[] = $like;
    }
    $sql .= " ORDER BY qa.attempted_at DESC";

    $stmt = $conn->prepare($sql);
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    foreach ($rows as &$r) {
        $r['percent'] = $r['total'] > 0 ? round($r['score'] / $r['total'] * 100) : 0;
        $r['passed']  = $r['percent'] >= QUIZ_PASS_PERCENT;
    }

    echo json_encode(["success" => true, "results" => $rows, "pass_threshold" => QUIZ_PASS_PERCENT]);
    exit();
}

if ($action === 'get_results_summary') {
    $course_id = $_GET['course_id'] ?? null;
    $student   = trim($_GET['student'] ?? '');

    $sql = "
        SELECT qa.score, qa.total, qa.user_id
        FROM quiz_attempts qa
        JOIN quizzes q ON q.id = qa.quiz_id
        JOIN users u   ON u.id = qa.user_id
        WHERE 1=1
    ";
    $types = "";
    $params = [];
    if ($course_id) { $sql .= " AND q.course_id = ?"; $types .= "i"; $params[] = $course_id; }
    if ($student !== '') {
        $sql .= " AND (u.full_name LIKE ? OR u.email LIKE ?)";
        $types .= "ss";
        $like = "%{$student}%";
        $params[] = $like;
        $params[] = $like;
    }

    $stmt = $conn->prepare($sql);
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

    $totalAttempts = count($rows);
    $uniqueStudents = count(array_unique(array_column($rows, 'user_id')));
    $passed = 0;
    $percentSum = 0;
    foreach ($rows as $r) {
        $percent = $r['total'] > 0 ? ($r['score'] / $r['total'] * 100) : 0;
        $percentSum += $percent;
        if ($percent >= QUIZ_PASS_PERCENT) $passed++;
    }
    $avgPercent = $totalAttempts > 0 ? round($percentSum / $totalAttempts) : 0;
    $passRate   = $totalAttempts > 0 ? round($passed / $totalAttempts * 100) : 0;

    echo json_encode([
        "success" => true,
        "summary" => [
            "total_attempts"  => $totalAttempts,
            "unique_students" => $uniqueStudents,
            "average_percent" => $avgPercent,
            "pass_rate"       => $passRate
        ]
    ]);
    exit();
}

if ($action === 'get_problems') {
    $result = $conn->query("
        SELECT p.*, (SELECT COUNT(*) FROM problem_test_cases WHERE problem_id = p.id) AS test_case_count
        FROM problems p
        ORDER BY p.id DESC
    ");
    echo json_encode(["success" => true, "problems" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

// ---------- SUBMISSIONS (admin view of every student's problem submissions) ----------
if ($action === 'get_submissions') {
    $problem_id = (int)($_GET['problem_id'] ?? 0);
    $verdict    = trim($_GET['verdict'] ?? '');
    $language   = trim($_GET['language'] ?? '');
    $student    = trim($_GET['student'] ?? '');

    $sql = "
        SELECT s.id, s.user_id, s.problem_id, s.verdict, s.passed_count, s.total_count,
               s.submitted_at, s.language,
               u.full_name AS student_name, u.email AS student_email,
               p.title AS problem_title, p.difficulty
        FROM submissions s
        JOIN users u    ON u.id = s.user_id
        JOIN problems p ON p.id = s.problem_id
        WHERE 1=1
    ";
    $types = "";
    $params = [];
    if ($problem_id) { $sql .= " AND s.problem_id = ?"; $types .= "i"; $params[] = $problem_id; }
    if ($verdict !== '')  { $sql .= " AND s.verdict = ?";  $types .= "s"; $params[] = $verdict; }
    if ($language !== '') { $sql .= " AND s.language = ?"; $types .= "s"; $params[] = $language; }
    if ($student !== '') {
        $sql .= " AND (u.full_name LIKE ? OR u.email LIKE ?)";
        $types .= "ss";
        $like = "%{$student}%";
        $params[] = $like;
        $params[] = $like;
    }
    $sql .= " ORDER BY s.submitted_at DESC, s.id DESC LIMIT 500";

    $stmt = $conn->prepare($sql);
    if ($types) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    echo json_encode(["success" => true, "submissions" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_submissions_summary') {
    $row = $conn->query("
        SELECT COUNT(*) AS total,
               COUNT(DISTINCT user_id) AS students,
               SUM(verdict = 'Accepted') AS accepted
        FROM submissions
    ")->fetch_assoc();
    $total    = (int)$row['total'];
    $accepted = (int)$row['accepted'];
    echo json_encode([
        "success" => true,
        "summary" => [
            "total"           => $total,
            "unique_students" => (int)$row['students'],
            "accepted"        => $accepted,
            "acceptance_rate" => $total > 0 ? round($accepted / $total * 100) : 0
        ]
    ]);
    exit();
}

if ($action === 'get_submission_code') {
    $id = (int)($_GET['id'] ?? 0);
    $stmt = $conn->prepare("
        SELECT s.id, s.code, s.verdict, s.passed_count, s.total_count, s.submitted_at, s.language,
               u.full_name AS student_name, u.email AS student_email,
               p.title AS problem_title
        FROM submissions s
        JOIN users u    ON u.id = s.user_id
        JOIN problems p ON p.id = s.problem_id
        WHERE s.id = ?
    ");
    $stmt->bind_param("i", $id);
    $stmt->execute();
    $sub = $stmt->get_result()->fetch_assoc();
    echo json_encode($sub ? ["success" => true, "submission" => $sub] : ["success" => false, "message" => "Submission not found."]);
    exit();
}

if ($action === 'get_test_cases_admin') {
    $problem_id = $_GET['problem_id'] ?? null;
    if (!$problem_id) {
        echo json_encode(["success" => false, "message" => "problem_id is required.", "test_cases" => []]);
        exit();
    }
    $stmt = $conn->prepare("SELECT * FROM problem_test_cases WHERE problem_id = ? ORDER BY order_num ASC, id ASC");
    $stmt->bind_param("i", $problem_id);
    $stmt->execute();
    echo json_encode(["success" => true, "test_cases" => $stmt->get_result()->fetch_all(MYSQLI_ASSOC)]);
    exit();
}

if ($action === 'get_users') {
    $result = $conn->query("SELECT id, full_name, email, role, created_at FROM users ORDER BY id DESC");
    echo json_encode(["success" => true, "users" => $result->fetch_all(MYSQLI_ASSOC)]);
    exit();
}
