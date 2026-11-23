-- ============================================================
-- 重构助教订单表结构
-- 删除独立订单表，创建助教订单详情表
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- ============================================================
-- 1. 删除之前创建的独立助教订单表
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_assistant_order`;

-- ============================================================
-- 2. 创建助教订单详情表（关联主订单表）
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_assistant_order_detail`;
CREATE TABLE `bi_busi_assistant_order_detail` (
  `id` varchar(36) NOT NULL COMMENT 'ID',
  `order_id` varchar(36) NOT NULL COMMENT '关联订单ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `assistant_id` varchar(36) NOT NULL COMMENT '助教ID',
  `member_id` varchar(36) DEFAULT NULL COMMENT '会员ID',
  `student_name` varchar(100) DEFAULT NULL COMMENT '学员姓名',
  `student_phone` varchar(20) DEFAULT NULL COMMENT '学员电话',
  `service_type` varchar(20) DEFAULT 'one_on_one' COMMENT '服务类型(one_on_one/group/private)',
  `duration` decimal(5,1) DEFAULT NULL COMMENT '服务时长(小时)',
  `start_time` datetime DEFAULT NULL COMMENT '服务开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '服务结束时间',
  `rating` int(1) DEFAULT NULL COMMENT '评分(1-5)',
  `review` text COMMENT '评价内容',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_id` (`order_id`),
  KEY `idx_assistant_id` (`assistant_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教订单详情表';

SET FOREIGN_KEY_CHECKS = 1;

SELECT '助教订单表结构重构完成' AS result;