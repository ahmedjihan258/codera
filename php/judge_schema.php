<?php
/**
 * Ensures the automated-judge tables (problem_test_cases, submissions) exist.
 * Safe to call on every request; each CREATE is a no-op if the table is
 * already there. This mirrors the same defensive pattern login.php already
 * uses for the users.role column, so the feature works even if someone
 * forgets to import database/judge_schema.sql.
 */
function ensure_judge_tables(mysqli $conn): void {
    $conn->query("
        CREATE TABLE IF NOT EXISTS `problem_test_cases` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `problem_id` INT NOT NULL,
            `input` TEXT NOT NULL,
            `expected_output` TEXT NOT NULL,
            `is_sample` TINYINT(1) NOT NULL DEFAULT 0,
            `order_num` INT NOT NULL DEFAULT 0,
            PRIMARY KEY (`id`),
            KEY `problem_id` (`problem_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    $conn->query("
        CREATE TABLE IF NOT EXISTS `submissions` (
            `id` INT NOT NULL AUTO_INCREMENT,
            `user_id` INT NOT NULL,
            `problem_id` INT NOT NULL,
            `code` TEXT NOT NULL,
            `verdict` ENUM('Accepted','Wrong Answer','Runtime Error') NOT NULL,
            `passed_count` INT NOT NULL DEFAULT 0,
            `total_count` INT NOT NULL DEFAULT 0,
            `submitted_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (`id`),
            KEY `user_id` (`user_id`),
            KEY `problem_id` (`problem_id`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    ");

    // Newer columns, added to existing installs without touching their data.
    //   problem_test_cases.kind : 'js'    = JavaScript function-call test (input is an expression)
    //                             'stdio' = C / C++ test (input is stdin text, expected_output is stdout)
    //   submissions.language    : which language the code was written in
    $col = $conn->query("SHOW COLUMNS FROM `problem_test_cases` LIKE 'kind'");
    if ($col && $col->num_rows === 0) {
        $conn->query("ALTER TABLE `problem_test_cases` ADD COLUMN `kind` VARCHAR(10) NOT NULL DEFAULT 'js'");
    }
    $col = $conn->query("SHOW COLUMNS FROM `submissions` LIKE 'language'");
    if ($col && $col->num_rows === 0) {
        $conn->query("ALTER TABLE `submissions` ADD COLUMN `language` VARCHAR(12) NOT NULL DEFAULT 'javascript'");
    }

    $col = $conn->query("SHOW COLUMNS FROM `submissions` LIKE 'verdict'");
    if ($col && ($row = $col->fetch_assoc()) && stripos($row['Type'], 'Compile Error') === false) {
        $conn->query("ALTER TABLE `submissions` MODIFY `verdict` ENUM('Accepted','Wrong Answer','Runtime Error','Compile Error') NOT NULL");
    }
}
