-- ============================================================
-- 班次配置表
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- ============================================================
-- 班次配置表 - bi_busi_shift_config
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_shift_config`;
CREATE TABLE `bi_busi_shift_config` (
  `id` varchar(36) NOT NULL COMMENT '配置ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `name` varchar(50) NOT NULL COMMENT '班次名称',
  `code` varchar(20) NOT NULL COMMENT '班次代码(morning/afternoon/evening/full)',
  `start_time` time NOT NULL COMMENT '开始时间',
  `end_time` time NOT NULL COMMENT '结束时间',
  `color` varchar(20) DEFAULT '#3b82f6' COMMENT '班次颜色',
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班次配置表';

-- ============================================================
-- 初始化班次配置数据
-- ============================================================
INSERT INTO `bi_busi_shift_config` (`id`, `store_id`, `name`, `code`, `start_time`, `end_time`, `color`, `sort_order`, `status`, `description`) VALUES
('shift_morning', 'default', '早班', 'morning', '09:00:00', '17:00:00', '#22c55e', 1, 1, '上午9点到下午5点'),
('shift_afternoon', 'default', '晚班', 'afternoon', '17:00:00', '01:00:00', '#f59e0b', 2, 1, '下午5点到凌晨1点'),
('shift_full', 'default', '全天班', 'full', '09:00:00', '01:00:00', '#8b5cf6', 3, 1, '全天值班'),
('shift_evening', 'default', '深夜班', 'evening', '23:00:00', '09:00:00', '#6366f1', 4, 0, '深夜值班（备用）');

SET FOREIGN_KEY_CHECKS = 1;

SELECT '班次配置表创建完成' AS result;