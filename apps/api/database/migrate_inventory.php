<?php
try {
    $dsn = "mysql:host=123.207.50.64;port=13306;dbname=billiards;charset=utf8mb4";
    $pdo = new PDO($dsn, 'billiards', 'dengyouming2tll');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "ALTER TABLE `bi_busi_inventory_record` 
            ADD COLUMN `stock_before` INT NOT NULL DEFAULT 0 AFTER `quantity`,
            ADD COLUMN `stock_after` INT NOT NULL DEFAULT 0 AFTER `stock_before`,
            ADD COLUMN `remark` TEXT DEFAULT NULL AFTER `stock_after`,
            ADD COLUMN `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP AFTER `remark`;";
    
    $pdo->exec($sql);
    echo "Database table updated successfully!\n";
} catch (PDOException $e) {
    echo "Error updating database: " . $e->getMessage() . "\n";
    exit(1);
}