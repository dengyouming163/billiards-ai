-- ============================================================
-- 会员管理相关表
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `localhost_likeadmin`;

-- ============================================================
-- 会员表 - la_busi_member
-- ============================================================
DROP TABLE IF EXISTS `la_busi_member`;
CREATE TABLE `la_busi_member` (
  `id` varchar(36) NOT NULL COMMENT '会员ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `level_id` varchar(36) DEFAULT NULL COMMENT '等级ID',
  `name` varchar(50) NOT NULL COMMENT '会员姓名',
  `phone` varchar(20) NOT NULL COMMENT '手机号码',
  `gender` varchar(10) DEFAULT 'unknown' COMMENT '性别',
  `avatar` varchar(255) DEFAULT '' COMMENT '头像',
  `birthday` date DEFAULT NULL COMMENT '生日',
  `card_number` varchar(50) NOT NULL COMMENT '会员卡号',
  `balance` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额',
  `points` int(11) NOT NULL DEFAULT 0 COMMENT '积分',
  `total_consume` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费',
  `total_recharge` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 1-正常 0-冻结',
  `last_consume_time` datetime DEFAULT NULL COMMENT '最后消费时间',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_card_number` (`card_number`),
  UNIQUE KEY `uk_store_phone` (`store_id`, `phone`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_level_id` (`level_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

-- ============================================================
-- 会员等级表 - la_busi_member_level
-- ============================================================
DROP TABLE IF EXISTS `la_busi_member_level`;
CREATE TABLE `la_busi_member_level` (
  `id` varchar(36) NOT NULL COMMENT '等级ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `name` varchar(50) NOT NULL COMMENT '等级名称',
  `code` varchar(20) NOT NULL COMMENT '等级代码(normal/silver/gold/diamond)',
  `color` varchar(20) DEFAULT '#94a3b8' COMMENT '等级颜色',
  `discount_rate` decimal(5,2) NOT NULL DEFAULT 100.00 COMMENT '折扣率(%)',
  `points_multiplier` decimal(3,2) NOT NULL DEFAULT 1.00 COMMENT '积分倍率',
  `min_amount` decimal(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费满多少升级',
  `min_points` int(11) NOT NULL DEFAULT 0 COMMENT '累计积分满多少升级',
  `sort_order` int(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
  `description` varchar(255) DEFAULT '' COMMENT '描述',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_store_code` (`store_id`, `code`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员等级表';

-- ============================================================
-- 会员充值记录表 - la_busi_member_recharge
-- ============================================================
DROP TABLE IF EXISTS `la_busi_member_recharge`;
CREATE TABLE `la_busi_member_recharge` (
  `id` varchar(36) NOT NULL COMMENT '充值记录ID',
  `member_id` varchar(36) NOT NULL COMMENT '会员ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `order_no` varchar(50) NOT NULL COMMENT '充值订单号',
  `amount` decimal(10,2) NOT NULL COMMENT '充值金额',
  `gift_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '赠送金额',
  `gift_points` int(11) NOT NULL DEFAULT 0 COMMENT '赠送积分',
  `payment_method` varchar(20) NOT NULL COMMENT '支付方式(wechat/alipay/cash/balance)',
  `transaction_no` varchar(100) DEFAULT '' COMMENT '第三方交易号',
  `balance_before` decimal(10,2) NOT NULL COMMENT '充值前余额',
  `balance_after` decimal(10,2) NOT NULL COMMENT '充值后余额',
  `points_before` int(11) NOT NULL COMMENT '充值前积分',
  `points_after` int(11) NOT NULL COMMENT '充值后积分',
  `operator_id` varchar(36) DEFAULT '' COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT '' COMMENT '操作人姓名',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员充值记录表';

-- ============================================================
-- 会员消费记录表 - la_busi_member_consume
-- ============================================================
DROP TABLE IF EXISTS `la_busi_member_consume`;
CREATE TABLE `la_busi_member_consume` (
  `id` varchar(36) NOT NULL COMMENT '消费记录ID',
  `member_id` varchar(36) NOT NULL COMMENT '会员ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `order_id` varchar(36) DEFAULT '' COMMENT '关联订单ID',
  `order_no` varchar(50) DEFAULT '' COMMENT '关联订单号',
  `amount` decimal(10,2) NOT NULL COMMENT '消费金额',
  `points_gained` int(11) NOT NULL DEFAULT 0 COMMENT '获得积分',
  `points_deduct` int(11) NOT NULL DEFAULT 0 COMMENT '抵扣积分',
  `balance_deduct` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额抵扣',
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
  `consume_type` varchar(20) NOT NULL DEFAULT 'order' COMMENT '消费类型(order/recharge/points_exchange)',
  `balance_before` decimal(10,2) NOT NULL COMMENT '消费前余额',
  `balance_after` decimal(10,2) NOT NULL COMMENT '消费后余额',
  `points_before` int(11) NOT NULL COMMENT '消费前积分',
  `points_after` int(11) NOT NULL COMMENT '消费后积分',
  `operator_id` varchar(36) DEFAULT '' COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT '' COMMENT '操作人姓名',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员消费记录表';

-- ============================================================
-- 初始化会员等级数据
-- ============================================================
INSERT INTO `la_busi_member_level` (`id`, `store_id`, `name`, `code`, `color`, `discount_rate`, `points_multiplier`, `min_amount`, `min_points`, `sort_order`, `status`, `description`) VALUES
('level_normal', 'default', '普通会员', 'normal', '#94a3b8', 100.00, 1.00, 0.00, 0, 1, 1, '基础会员等级'),
('level_silver', 'default', '银卡会员', 'silver', '#c0c0c0', 95.00, 1.20, 1000.00, 1000, 2, 1, '银卡会员享95折优惠'),
('level_gold', 'default', '金卡会员', 'gold', '#ffd700', 90.00, 1.50, 5000.00, 5000, 3, 1, '金卡会员享9折优惠'),
('level_diamond', 'default', '钻石会员', 'diamond', '#b9f2ff', 85.00, 2.00, 20000.00, 20000, 4, 1, '钻石会员享85折优惠');

SET FOREIGN_KEY_CHECKS = 1;

SELECT '会员表初始化完成' AS result;