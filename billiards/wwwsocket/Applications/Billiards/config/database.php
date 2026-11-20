<?php
return [
    'host'     => getenv('BILLIARDS_DB_HOST') ?: '127.0.0.1',
    'port'     => (int) (getenv('BILLIARDS_DB_PORT') ?: 3306),
    'dbname'   => getenv('BILLIARDS_DB_NAME') ?: 'test_billiards',
    'username' => getenv('BILLIARDS_DB_USERNAME') ?: 'test_user',
    'password' => getenv('BILLIARDS_DB_PASSWORD') ?: 'test_password',
    'charset'  => 'utf8mb4',
    'options'  => [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ],
];
