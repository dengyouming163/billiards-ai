<?php

define('APP_PATH', __DIR__ . '/../../app/');
define('ROOT_PATH', __DIR__ . '/../../');

require_once __DIR__ . '/../../vendor/autoload.php';

$app = new think\App();
$app->initialize();

use think\facade\Db;

try {
    echo "=== 开始执行数据库字段迁移 ===\n\n";

    // 1. 为 bi_busi_member_recharge 表添加 status 字段
    echo "1. 检查 bi_busi_member_recharge.status 字段...\n";
    $columns = Db::query("SHOW COLUMNS FROM bi_busi_member_recharge LIKE 'status'");
    if (empty($columns)) {
        Db::execute("ALTER TABLE bi_busi_member_recharge ADD COLUMN `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 1-正常 0-取消'");
        echo "   ✓ 已添加 status 字段\n";
    } else {
        echo "   ✗ status 字段已存在\n";
    }

    // 2. 为 bi_busi_order 表添加 member_name 字段
    echo "\n2. 检查 bi_busi_order.member_name 字段...\n";
    $columns = Db::query("SHOW COLUMNS FROM bi_busi_order LIKE 'member_name'");
    if (empty($columns)) {
        Db::execute("ALTER TABLE bi_busi_order ADD COLUMN `member_name` varchar(50) DEFAULT '' COMMENT '会员姓名（冗余）'");
        echo "   ✓ 已添加 member_name 字段\n";
    } else {
        echo "   ✗ member_name 字段已存在\n";
    }

    // 3. 为 bi_busi_assistant 表添加 level_id 字段
    echo "\n3. 检查 bi_busi_assistant.level_id 字段...\n";
    $columns = Db::query("SHOW COLUMNS FROM bi_busi_assistant LIKE 'level_id'");
    if (empty($columns)) {
        Db::execute("ALTER TABLE bi_busi_assistant ADD COLUMN `level_id` varchar(36) DEFAULT NULL COMMENT '等级ID'");
        echo "   ✓ 已添加 level_id 字段\n";
    } else {
        echo "   ✗ level_id 字段已存在\n";
    }

    echo "\n=== 数据库字段迁移完成 ===\n";

} catch (Exception $e) {
    echo "迁移失败: " . $e->getMessage() . "\n";
    exit(1);
}