<?php
echo "=== Database Structure Check ===\n\n";

$config = require __DIR__ . '/Applications/Billiards/config/database.php';

$dsn = "mysql:host={$config['host']};port={$config['port']};dbname={$config['dbname']};charset={$config['charset']}";

try {
    $pdo = new PDO($dsn, $config['username'], $config['password'], $config['options']);
    echo "Database connected: {$config['dbname']}\n\n";

    $tables = ['bi_busi_light_device', 'bi_busi_light_channel'];

    foreach ($tables as $table) {
        $stmt = $pdo->query("SHOW TABLES LIKE '{$table}'");
        if ($stmt->rowCount() > 0) {
            echo "[OK] Table {$table} exists\n";
        } else {
            echo "[MISSING] Table {$table} does not exist\n";
        }
    }

    echo "\n";

    $stmt = $pdo->query("SHOW COLUMNS FROM `bi_busi_light_device`");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);

    echo "bi_busi_light_device columns:\n";
    foreach ($columns as $col) {
        echo "  - {$col}\n";
    }

    if (!in_array('addr', $columns)) {
        echo "\n[FIX] Adding missing column 'addr' to bi_busi_light_device...\n";
        $pdo->exec("ALTER TABLE `bi_busi_light_device` ADD COLUMN `addr` VARCHAR(50) DEFAULT NULL COMMENT '设备地址' AFTER `device_sn`");
        echo "[OK] Column 'addr' added\n";
    }

    echo "\nCheck completed.\n";

} catch (PDOException $e) {
    echo "Database error: {$e->getMessage()}\n";
    exit(1);
}
