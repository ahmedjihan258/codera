<?php
session_start();
header("Content-Type: application/json");

if (isset($_SESSION["user_id"])) {
    $out = [
        "logged_in" => true,
        "user_id"   => $_SESSION["user_id"],
        "user_name" => $_SESSION["user_name"],
        "role"      => $_SESSION["role"] ?? "user"
    ];
} else {
    $out = ["logged_in" => false];
}
session_write_close();
echo json_encode($out);
