-- 提成配置表
CREATE TABLE IF NOT EXISTS `bi_busi_commission_config` (
  `id` varchar(64) NOT NULL COMMENT '主键ID',
  `store_id` varchar(64) NOT NULL COMMENT '门店ID',
  `assistant_id` varchar(64) NOT NULL COMMENT '助教ID',
  `commission_type` varchar(32) NOT NULL DEFAULT 'percentage' COMMENT '提成类型: percentage/fixed/mixed',
  `commission_rate` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '提成比例(percentage:百分比, fixed:固定金额, mixed:百分比)',
  `base_salary` decimal(10,2) DEFAULT NULL COMMENT '底薪(mixed类型使用)',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态: 0=禁用, 1=启用',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  `deleted_at` datetime DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_assistant` (`assistant_id`, `deleted_at`),
  KEY `idx_store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='助教提成配置表';

-- 提成记录表
CREATE TABLE IF NOT EXISTS `bi_busi_commission_record` (
  `id` varchar(64) NOT NULL COMMENT '主键ID',
  `store_id` varchar(64) NOT NULL COMMENT '门店ID',
  `assistant_id` varchar(64) NOT NULL COMMENT '助教ID',
  `order_item_id` varchar(64) NOT NULL COMMENT '关联OrderItem ID',
  `order_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '订单金额',
  `commission_type` varchar(32) NOT NULL COMMENT '提成类型快照',
  `commission_rate` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '提成比例快照',
  `commission_amount` decimal(10,2) NOT NULL DEFAULT '0.00' COMMENT '提成金额',
  `status` varchar(32) NOT NULL DEFAULT 'pending' COMMENT '发放状态: pending/paid/cancelled',
  `paid_at` datetime DEFAULT NULL COMMENT '发放时间',
  `remark` varchar(255) DEFAULT '' COMMENT '备注',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_assistant_id` (`assistant_id`),
  KEY `idx_order_item_id` (`order_item_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='助教提成记录表';
