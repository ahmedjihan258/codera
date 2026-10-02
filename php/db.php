<?php
// Database connection — reusable across all PHP files
$host     = "127.0.0.1"; // "localhost" can hang on Windows if it resolves to ::1 before MySQL (IPv4-only)
$username = "root";
$password = "";
$database = "codera_db";

// Report errors as exceptions so we can always answer with JSON instead of a PHP fatal error page
mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

try {
    $conn = mysqli_init();
    $conn->options(MYSQLI_OPT_CONNECT_TIMEOUT, 5); // fail after 5s instead of hanging forever
    $conn->real_connect($host, $username, $password, $database);
    $conn->set_charset("utf8mb4");
} catch (Throwable $e) {
    error_log("db.php: " . $e->getMessage());
    if (!headers_sent()) {
        header("Content-Type: application/json");
        http_response_code(500);
    }
    echo json_encode(["success" => false, "message" => "Database connection failed. Is MySQL running and is the 'codera_db' database imported?"]);
    exit;
}
