-- ============================================================
-- 补充会员模块缺失的字段
-- ============================================================

-- 会员表添加缺失字段
ALTER TABLE `la_busi_member`
ADD COLUMN IF NOT EXISTS `card_number` VARCHAR(50) NOT NULL DEFAULT '' COMMENT '会员卡号' AFTER `birthday`,
ADD UNIQUE INDEX IF NOT EXISTS `uk_card_number` (`card_number`);

-- 会员等级表添加缺失字段
ALTER TABLE `la_busi_member_level`
ADD COLUMN IF NOT EXISTS `min_amount` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费满多少升级' AFTER `points_multiplier`;

-- 会员消费记录表添加缺失字段
ALTER TABLE `la_busi_member_consume`
ADD COLUMN IF NOT EXISTS `points_gained` INT(11) NOT NULL DEFAULT 0 COMMENT '获得积分' AFTER `amount`,
ADD COLUMN IF NOT EXISTS `points_deduct` INT(11) NOT NULL DEFAULT 0 COMMENT '抵扣积分' AFTER `points_gained`,
ADD COLUMN IF NOT EXISTS `balance_deduct` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额抵扣' AFTER `points_deduct`,
ADD COLUMN IF NOT EXISTS `consume_type` VARCHAR(20) NOT NULL DEFAULT 'order' COMMENT '消费类型' AFTER `balance_deduct`;

-- 初始化默认会员等级数据（如果不存在）
INSERT IGNORE INTO `la_busi_member_level` (`id`, `store_id`, `name`, `code`, `color`, `discount_rate`, `points_multiplier`, `min_amount`, `min_points`, `sort_order`, `status`, `created_at`) VALUES
('level_normal', 'default', '普通会员', 'normal', '#94a3b8', 100.00, 1.00, 0.00, 0, 1, 1, NOW()),
('level_silver', 'default', '银卡会员', 'silver', '#c0c0c0', 95.00, 1.20, 1000.00, 1000, 2, 1, NOW()),
('level_gold', 'default', '金卡会员', 'gold', '#ffd700', 90.00, 1.50, 5000.00, 5000, 3, 1, NOW()),
('level_diamond', 'default', '钻石会员', 'diamond', '#b9f2ff', 85.00, 2.00, 20000.00, 20000, 4, 1, NOW());

SELECT '会员表字段补充完成' AS result;