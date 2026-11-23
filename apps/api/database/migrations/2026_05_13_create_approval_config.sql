-- 创建审批配置表
CREATE TABLE IF NOT EXISTS `bi_busi_approval_config` (
    `id` varchar(36) NOT NULL COMMENT '主键ID',
    `store_id` varchar(36) NOT NULL COMMENT '门店ID',
    `type` varchar(20) NOT NULL COMMENT '审批类型代码',
    `type_name` varchar(50) NOT NULL COMMENT '审批类型名称',
    `approver_ids` text COMMENT '审批人ID列表(JSON)',
    `approver_names` text COMMENT '审批人名称列表(JSON)',
    `status` varchar(20) NOT NULL DEFAULT 'enabled' COMMENT '状态：enabled/disabled',
    `remark` varchar(255) DEFAULT NULL COMMENT '备注',
    `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_type` (`store_id`, `type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='审批配置表';

-- 扩展审批记录表
ALTER TABLE `bi_busi_approval` 
ADD COLUMN IF NOT EXISTS `type_name` varchar(50) DEFAULT NULL COMMENT '审批类型名称' AFTER `type`,
ADD COLUMN IF NOT EXISTS `approver_id` varchar(36) DEFAULT NULL COMMENT '审批人ID' AFTER `remark`,
ADD COLUMN IF NOT EXISTS `approver_name` varchar(50) DEFAULT NULL COMMENT '审批人姓名' AFTER `approver_id`,
ADD COLUMN IF NOT EXISTS `approve_time` datetime DEFAULT NULL COMMENT '审批时间' AFTER `approver_name`,
ADD COLUMN IF NOT EXISTS `approve_remark` text DEFAULT NULL COMMENT '审批意见' AFTER `approve_time`,
ADD COLUMN IF NOT EXISTS `extra_data` text DEFAULT NULL COMMENT '扩展数据(JSON)' AFTER `approve_remark`;

-- 插入默认审批配置
INSERT INTO `bi_busi_approval_config` 
(`id`, `store_id`, `type`, `type_name`, `approver_ids`, `approver_names`, `status`)
SELECT 'config_leave', 'store-001', 'leave', '请假申请', '["emp_admin"]', '["管理员"]', 'enabled'
WHERE NOT EXISTS (SELECT 1 FROM `bi_busi_approval_config` WHERE type = 'leave');

INSERT INTO `bi_busi_approval_config` 
(`id`, `store_id`, `type`, `type_name`, `approver_ids`, `approver_names`, `status`)
SELECT 'config_checkin', 'store-001', 'checkin', '补卡申请', '["emp_admin"]', '["管理员"]', 'enabled'
WHERE NOT EXISTS (SELECT 1 FROM `bi_busi_approval_config` WHERE type = 'checkin');

INSERT INTO `bi_busi_approval_config` 
(`id`, `store_id`, `type`, `type_name`, `approver_ids`, `approver_names`, `status`)
SELECT 'config_exchange', 'store-001', 'exchange', '换班申请', '["emp_admin"]', '["管理员"]', 'enabled'
WHERE NOT EXISTS (SELECT 1 FROM `bi_busi_approval_config` WHERE type = 'exchange');

INSERT INTO `bi_busi_approval_config` 
(`id`, `store_id`, `type`, `type_name`, `approver_ids`, `approver_names`, `status`)
SELECT 'config_overtime', 'store-001', 'overtime', '加班申请', '["emp_admin"]', '["管理员"]', 'enabled'
WHERE NOT EXISTS (SELECT 1 FROM `bi_busi_approval_config` WHERE type = 'overtime');