<?php
require '../db.php';

$size = $_GET["size"] ?? 4;

$stmt = $pdo->prepare("
    SELECT username, time, moves
    FROM scores
    WHERE puzzle_size = ?
    ORDER BY time ASC, moves ASC
    LIMIT 10
");

$stmt->execute([(int)$size]);
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
