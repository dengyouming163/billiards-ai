-- ============================================================
-- 助教订单表和排班表
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- ============================================================
-- 助教订单表 - bi_busi_assistant_order
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_assistant_order`;
CREATE TABLE `bi_busi_assistant_order` (
  `id` varchar(36) NOT NULL COMMENT '订单ID',
  `order_no` varchar(50) NOT NULL COMMENT '订单编号',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `assistant_id` varchar(36) NOT NULL COMMENT '助教ID',
  `member_id` varchar(36) DEFAULT NULL COMMENT '会员ID',
  `student_name` varchar(100) NOT NULL COMMENT '学员姓名',
  `student_phone` varchar(20) DEFAULT NULL COMMENT '学员电话',
  `type` varchar(20) NOT NULL DEFAULT 'one_on_one' COMMENT '服务类型(one_on_one/小班课/私教课程)',
  `duration` decimal(5,1) NOT NULL COMMENT '时长(小时)',
  `unit_price` decimal(10,2) NOT NULL COMMENT '单价',
  `total_amount` decimal(10,2) NOT NULL COMMENT '总价',
  `status` varchar(20) NOT NULL DEFAULT 'pending' COMMENT '状态(pending/in_progress/completed/cancelled)',
  `rating` int(1) DEFAULT NULL COMMENT '评分(1-5)',
  `review` text COMMENT '评价内容',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `operator_id` varchar(36) DEFAULT NULL COMMENT '操作人ID',
  `operator_name` varchar(50) DEFAULT NULL COMMENT '操作人姓名',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `completed_at` datetime DEFAULT NULL COMMENT '完成时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_assistant_id` (`assistant_id`),
  KEY `idx_member_id` (`member_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_assistant_order_store` FOREIGN KEY (`store_id`) REFERENCES `bi_stores` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assistant_order_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `bi_busi_assistant` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教订单表';

-- ============================================================
-- 助教排班表 - bi_busi_assistant_schedule
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_assistant_schedule`;
CREATE TABLE `bi_busi_assistant_schedule` (
  `id` varchar(36) NOT NULL COMMENT '排班ID',
  `assistant_id` varchar(36) NOT NULL COMMENT '助教ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `date` date NOT NULL COMMENT '日期',
  `shift` varchar(20) NOT NULL COMMENT '班次(morning/afternoon/evening/full)',
  `start_time` time NOT NULL COMMENT '上班时间',
  `end_time` time NOT NULL COMMENT '下班时间',
  `status` varchar(20) NOT NULL DEFAULT 'scheduled' COMMENT '状态(scheduled/on_duty/off_duty/leave)',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_assistant_date_shift` (`assistant_id`, `date`, `shift`),
  KEY `idx_assistant_id` (`assistant_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_date` (`date`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_assistant_schedule_assistant` FOREIGN KEY (`assistant_id`) REFERENCES `bi_busi_assistant` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_assistant_schedule_store` FOREIGN KEY (`store_id`) REFERENCES `bi_stores` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教排班表';

SET FOREIGN_KEY_CHECKS = 1;

SELECT '助教订单表和排班表创建完成' AS result;