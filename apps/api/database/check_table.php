<?php
try {
    $dsn = "mysql:host=123.207.50.64;port=13306;dbname=billiards;charset=utf8mb4";
    $pdo = new PDO($dsn, 'billiards', 'dengyouming2tll');
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    $sql = "DESCRIBE bi_busi_inventory_record;";
    $stmt = $pdo->query($sql);
    $columns = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "Table: bi_busi_inventory_record\n";
    echo "================================\n";
    foreach ($columns as $col) {
        echo "Field: " . $col['Field'] . "\n";
        echo "  Type: " . $col['Type'] . "\n";
        echo "  Null: " . $col['Null'] . "\n";
        echo "  Key: " . $col['Key'] . "\n";
        echo "  Default: " . ($col['Default'] ?? 'NULL') . "\n";
        echo "  Extra: " . $col['Extra'] . "\n";
        echo "------------------------\n";
    }
} catch (PDOException $e) {
    echo "Error: " . $e->getMessage() . "\n";
    exit(1);
}