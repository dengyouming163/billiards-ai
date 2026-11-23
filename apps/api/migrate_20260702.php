<?php
/**
 * VenueIQ - 2026-07-02 数据库迁移
 * 执行方式: php migrate_20260702.php
 */

// 数据库配置 (从 .env 读取)
$host = '127.0.0.1';
$port = '3306';
$user = 'root';
$pass = 'root';
$db   = 'billiards';
$prefix = 'bi_';

// 解析命令行参数
$dryRun = in_array('--dry-run', $argv ?? []);

echo "=== VenueIQ DB Migration 2026-07-02 ===\n";
echo "Host: $host:$port  DB: $db  Prefix: {$prefix}\n";
echo ($dryRun ? "[DRY RUN — 仅检查，不执行]\n\n" : "\n");

try {
    $pdo = new PDO("mysql:host=$host;port=$port;dbname=$db;charset=utf8mb4", $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
    ]);
    echo "✅ 数据库连接成功\n\n";
} catch (PDOException $e) {
    die("❌ 数据库连接失败: " . $e->getMessage() . "\n");
}

$tableItem = $prefix . 'busi_order_item';
$tableOrder = $prefix . 'busi_order';

// =============================================
// Migration 1: bi_busi_order_item
// =============================================
echo "1/4 bi_busi_order_item 字段检查:\n";

$existingCols = [];
$res = $pdo->query("SHOW COLUMNS FROM `$tableItem`");
foreach ($res as $row) $existingCols[$row['Field']] = $row;

$itemMigrations = [
    ['is_paused', "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否暂停 0=否 1=是'"],
    ['paused_at', "DATETIME NULL COMMENT '暂停开始时间'"],
    ['total_paused_seconds', "INT NOT NULL DEFAULT 0 COMMENT '累计暂停秒数'"],
];

foreach ($itemMigrations as [$col, $def]) {
    if (isset($existingCols[$col])) {
        echo "  ⏭  $col — 已存在\n";
    } else {
        $sql = "ALTER TABLE `$tableItem` ADD COLUMN `$col` $def";
        echo "  ▶  $col — 添加中... ";
        if (!$dryRun) {
            $pdo->exec($sql);
            echo "✅\n";
        } else {
            echo "(dry-run)\n";
        }
    }
}

// Check status field type
$statusCol = $existingCols['status'] ?? null;
if ($statusCol) {
    $type = strtoupper($statusCol['Type']);
    if (strpos($type, 'ENUM') !== false) {
        echo "  ▶  status ENUM → VARCHAR — 修改中... ";
        $sql = "ALTER TABLE `$tableItem` MODIFY COLUMN `status` VARCHAR(32) NOT NULL DEFAULT 'pending'
            COMMENT '状态: preorder_pending/pending/processing/delivered/rejected/pending_confirm/serving/active/completed/cancelled'";
        if (!$dryRun) { $pdo->exec($sql); echo "✅\n"; } else { echo "(dry-run)\n"; }
    } else {
        echo "  ⏭  status — 已是 VARCHAR\n";
    }
}

// =============================================
// Migration 2: bi_busi_order
// =============================================
echo "\n2/4 bi_busi_order 字段检查:\n";

$orderCols = [];
$res = $pdo->query("SHOW COLUMNS FROM `$tableOrder`");
foreach ($res as $row) $orderCols[$row['Field']] = $row;

$orderMigrations = [
    ['table_fee_paused', "TINYINT(1) NOT NULL DEFAULT 0 COMMENT '台费是否暂停'"],
    ['table_fee_paused_at', "DATETIME NULL COMMENT '台费暂停时间'"],
    ['table_fee_paused_duration', "INT NOT NULL DEFAULT 0 COMMENT '累计暂停秒数'"],
];

foreach ($orderMigrations as [$col, $def]) {
    if (isset($orderCols[$col])) {
        echo "  ⏭  $col — 已存在\n";
    } else {
        $sql = "ALTER TABLE `$tableOrder` ADD COLUMN `$col` $def";
        echo "  ▶  $col — 添加中... ";
        if (!$dryRun) {
            $pdo->exec($sql);
            echo "✅\n";
        } else {
            echo "(dry-run)\n";
        }
    }
}

// =============================================
// Summary
// =============================================
echo "\n3/4 验证结果:\n";

$res = $pdo->query("SHOW COLUMNS FROM `$tableItem`");
$itemFinal = array_column($res->fetchAll(), 'Field');
$res = $pdo->query("SHOW COLUMNS FROM `$tableOrder`");
$orderFinal = array_column($res->fetchAll(), 'Field');

$allChecks = [
    "$tableItem.is_paused" => in_array('is_paused', $itemFinal),
    "$tableItem.paused_at" => in_array('paused_at', $itemFinal),
    "$tableItem.total_paused_seconds" => in_array('total_paused_seconds', $itemFinal),
    "$tableOrder.table_fee_paused" => in_array('table_fee_paused', $orderFinal),
    "$tableOrder.table_fee_paused_at" => in_array('table_fee_paused_at', $orderFinal),
    "$tableOrder.table_fee_paused_duration" => in_array('table_fee_paused_duration', $orderFinal),
];

$allOk = true;
foreach ($allChecks as $name => $ok) {
    echo $ok ? "  ✅ $name\n" : "  ❌ $name 缺失!\n";
    if (!$ok) $allOk = false;
}

echo "\n" . ($allOk ? "✅ 迁移完成!" : "❌ 部分失败，请检查") . "\n";
