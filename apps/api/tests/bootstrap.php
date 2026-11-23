<?php

declare(strict_types=1);

define('ROOT_PATH', dirname(__DIR__) . '/');
define('APP_PATH', ROOT_PATH . 'app/');

require ROOT_PATH . 'vendor/autoload.php';

$envFile = ROOT_PATH . '.env';
if (file_exists($envFile)) {
    $lines = file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        if (strpos(trim($line), '#') === 0) {
            continue;
        }
        list($name, $value) = explode('=', $line, 2);
        $name = trim($name);
        $value = trim($value);
        if (!empty($name)) {
            putenv("$name=$value");
        }
    }
}

date_default_timezone_set('Asia/Shanghai');

if (file_exists(APP_PATH . 'common.php')) {
    require APP_PATH . 'common.php';
}
