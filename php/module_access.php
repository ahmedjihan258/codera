<?php
/*
 * Shared helpers for the module-locking / quiz-gating system.
 * require_once this AFTER db.php in any file that needs it.
 *
 * Rule: passing a module's quiz means best score >= QUIZ_PASS_PERCENT.
 * Module 1 of a course is always unlocked. Module N+1 unlocks only once
 * module N's quiz has been passed. The Final Course Quiz (module_name IS NULL)
 * unlocks only once every module quiz of that course has been passed.
 */

if (!defined("QUIZ_PASS_PERCENT")) define("QUIZ_PASS_PERCENT", 60);
if (!defined("QUIZ_SAMPLE_SIZE")) define("QUIZ_SAMPLE_SIZE", 5);
if (!defined("QUIZ_RETRY_COOLDOWN_HOURS")) define("QUIZ_RETRY_COOLDOWN_HOURS", 6);

/** Module names of a course, in the order they appear (by lessons.order_num). */
function get_course_modules(mysqli $conn, int $course_id): array {
    $stmt = $conn->prepare("
        SELECT module_name FROM lessons
        WHERE course_id = ?
        GROUP BY module_name
        ORDER BY MIN(order_num) ASC
    ");
    $stmt->bind_param("i", $course_id);
    $stmt->execute();
    $rows = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmt->close();
    return array_column($rows, "module_name");
}

/** The quiz row {id, title} that belongs to a given module, or null if that module has no quiz. */
function get_module_quiz(mysqli $conn, int $course_id, string $module_name): ?array {
    $stmt = $conn->prepare("SELECT id, title FROM quizzes WHERE course_id = ? AND module_name = ? LIMIT 1");
    $stmt->bind_param("is", $course_id, $module_name);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return $row ?: null;
}

/** This user's best percent score on a quiz, or null if they have never attempted it. */
function get_best_percent(mysqli $conn, int $user_id, int $quiz_id): ?int {
    $stmt = $conn->prepare("
        SELECT MAX(ROUND(score / total * 100)) AS best
        FROM quiz_attempts WHERE user_id = ? AND quiz_id = ? AND total > 0
    ");
    $stmt->bind_param("ii", $user_id, $quiz_id);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();
    return ($row && $row["best"] !== null) ? (int)$row["best"] : null;
}

/**
 * module_name => true/false (unlocked or not) for every module of a course, computed
 * in one pass so callers rendering a whole course page only need one call.
 */
function get_module_unlock_map(mysqli $conn, int $user_id, int $course_id): array {
    $modules = get_course_modules($conn, $course_id);
    $map = [];
    foreach ($modules as $i => $mod) {
        if ($i === 0) { $map[$mod] = true; continue; }
        $prevMod  = $modules[$i - 1];
        $prevQuiz = get_module_quiz($conn, $course_id, $prevMod);
        if (!$prevQuiz) { $map[$mod] = true; continue; } // nothing to gate on
        $best = get_best_percent($conn, $user_id, $prevQuiz["id"]);
        $map[$mod] = ($best !== null && $best >= QUIZ_PASS_PERCENT);
    }
    return $map;
}

function is_module_unlocked(mysqli $conn, int $user_id, int $course_id, ?string $module_name): bool {
    if ($module_name === null) return true; // not a module lesson/quiz
    $map = get_module_unlock_map($conn, $user_id, $course_id);
    return $map[$module_name] ?? true;
}

/** The module (if any) that must still be passed to unlock $module_name. */
function get_blocking_module(mysqli $conn, int $course_id, string $module_name): ?string {
    $modules = get_course_modules($conn, $course_id);
    $idx = array_search($module_name, $modules, true);
    return ($idx !== false && $idx > 0) ? $modules[$idx - 1] : null;
}

/** Final course quiz unlocks once every module quiz of the course has been passed. */
function is_final_quiz_unlocked(mysqli $conn, int $user_id, int $course_id): bool {
    foreach (get_course_modules($conn, $course_id) as $mod) {
        $quiz = get_module_quiz($conn, $course_id, $mod);
        if (!$quiz) continue;
        $best = get_best_percent($conn, $user_id, $quiz["id"]);
        if ($best === null || $best < QUIZ_PASS_PERCENT) return false;
    }
    return true;
}

/**
 * Retake cooldown for a quiz. Cooldown only applies to a quiz that has never been
 * passed: once the user's best-ever score on this quiz reaches QUIZ_PASS_PERCENT,
 * that quiz is permanently exempt from cooldown, even if a later retake scores
 * under the threshold. Only a course/quiz that has NOT yet been passed, and whose
 * most recent attempt failed, gets locked behind the timer.
 * Returns ["remaining" => seconds, "retry_at" => string|null].
 */
function get_quiz_cooldown(mysqli $conn, int $user_id, int $quiz_id): array {
    // Already passed at some point? No cooldown ever, regardless of later attempts.
    $best = get_best_percent($conn, $user_id, $quiz_id);
    if ($best !== null && $best >= QUIZ_PASS_PERCENT) {
        return ["remaining" => 0, "retry_at" => null];
    }

    $stmt = $conn->prepare("
        SELECT score, total, attempted_at FROM quiz_attempts
        WHERE user_id = ? AND quiz_id = ? ORDER BY attempted_at DESC LIMIT 1
    ");
    $stmt->bind_param("ii", $user_id, $quiz_id);
    $stmt->execute();
    $last = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    if (!$last) return ["remaining" => 0, "retry_at" => null];

    $percent = $last["total"] > 0 ? round($last["score"] / $last["total"] * 100) : 0;
    if ($percent >= QUIZ_PASS_PERCENT) return ["remaining" => 0, "retry_at" => null]; // passed, no cooldown

    $stmt = $conn->prepare("
        SELECT DATE_ADD(?, INTERVAL " . QUIZ_RETRY_COOLDOWN_HOURS . " HOUR) AS retry_at,
               TIMESTAMPDIFF(SECOND, NOW(), DATE_ADD(?, INTERVAL " . QUIZ_RETRY_COOLDOWN_HOURS . " HOUR)) AS remaining
    ");
    $stmt->bind_param("ss", $last["attempted_at"], $last["attempted_at"]);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();
    $stmt->close();

    $remaining = max(0, (int)$row["remaining"]);
    return ["remaining" => $remaining, "retry_at" => $remaining > 0 ? $row["retry_at"] : null];
}
