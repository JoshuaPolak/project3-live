<?php
require '../../db.php';

$data = json_decode(file_get_contents("php://input"), true);

$stmt = $pdo->prepare("
    INSERT INTO scores (user_id, username, time, moves, puzzle_size, theme, session_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
");

$stmt->execute([
    $data["userId"],
    $data["username"],
    $data["time"],
    $data["moves"],
    $data["puzzleSize"],
    $data["theme"],
    $data["sessionId"]
]);

echo json_encode(["success" => true]);
