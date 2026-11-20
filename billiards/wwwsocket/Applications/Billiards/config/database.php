<?php
$host = getenv('BILLIARDS_DB_HOST');
$port = getenv('BILLIARDS_DB_PORT');
$dbname = getenv('BILLIARDS_DB_NAME');
$username = getenv('BILLIARDS_DB_USERNAME');
$password = getenv('BILLIARDS_DB_PASSWORD');

return [
    'host'     => $host === false ? '127.0.0.1' : $host,
    'port'     => (int) ($port === false ? 3306 : $port),
    'dbname'   => $dbname === false ? 'test_billiards' : $dbname,
    'username' => $username === false ? 'test_user' : $username,
    'password' => $password === false ? 'test_password' : $password,
    'charset'  => 'utf8mb4',
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ],
];
