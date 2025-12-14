<?php
require '../../db.php';

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $pdo->prepare("SELECT * FROM users WHERE username = ?");
$stmt->execute([$data['username']]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user || !password_verify($data['password'], $user['password'])) {
    http_response_code(401);
    echo json_encode(["success" => false, "message" => "Invalid credentials"]);
    exit;
}

echo json_encode([
    "success" => true,
    "user" => ["id" => $user["id"], "username" => $user["username"]]
]);
