CREATE TABLE IF NOT EXISTS `bi_busi_order_table_log` (
    `id` VARCHAR(36) NOT NULL COMMENT '主键ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `order_id` VARCHAR(36) NOT NULL COMMENT '订单ID',
    `table_id` VARCHAR(36) NOT NULL COMMENT '台桌ID',
    `action` VARCHAR(20) NOT NULL COMMENT '操作类型: create-开台 transfer_from-换出 transfer_to-换入 merge_from-并出 merge_to-并入 checkout-结账',
    `related_order_id` VARCHAR(36) DEFAULT NULL COMMENT '关联订单ID',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作人ID',
    `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
    `operated_at` DATETIME NOT NULL COMMENT '操作时间',
    `remark` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_table_id` (`table_id`),
    KEY `idx_action` (`action`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单-台桌变更审计日志表';
