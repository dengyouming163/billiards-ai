-- 审批配置数据初始化脚本
-- 日期：2026-05-14

-- 插入审批配置数据
INSERT INTO `bi_busi_approval_config` 
(`id`, `store_id`, `type`, `type_name`, `approver_ids`, `approver_names`, `status`, `remark`, `created_at`, `updated_at`)
VALUES
('cfg_outwork_001', 'store-001', 'outwork', '外勤申请', '["emp-001","emp-002"]', '["陈志强","王小明"]', 'enabled', '外勤申请审批配置', NOW(), NOW()),
('cfg_checkin_001', 'store-001', 'checkin', '补签申请', '["emp-001","emp-002"]', '["陈志强","王小明"]', 'enabled', '补签申请审批配置', NOW(), NOW()),
('cfg_leave_001', 'store-001', 'leave', '请假申请', '["emp-001","emp-002"]', '["陈志强","王小明"]', 'enabled', '请假申请审批配置', NOW(), NOW()),
('cfg_exchange_001', 'store-001', 'exchange', '换班申请', '["emp-001","emp-002"]', '["陈志强","王小明"]', 'enabled', '换班申请审批配置', NOW(), NOW());

-- 插入示例员工数据（审批人）
INSERT INTO `bi_busi_employee` 
(`id`, `store_id`, `name`, `phone`, `role`, `status`, `created_at`)
VALUES
('emp-001', 'store-001', '陈志强', '13800138001', 'manager', 1, NOW()),
('emp-002', 'store-001', '王小明', '13800138002', 'supervisor', 1, NOW());

-- 插入示例助教数据（用于换班）
INSERT INTO `bi_busi_assistant` 
(`id`, `store_id`, `name`, `phone`, `level_id`, `status`, `created_at`)
VALUES
('assist-001', 'store-001', '张伟', '13800138003', NULL, 1, NOW()),
('assist-002', 'store-001', '李娜', '13800138004', NULL, 1, NOW()),
('assist-003', 'store-001', '王磊', '13800138005', NULL, 1, NOW()),
('assist-004', 'store-001', '刘洋', '13800138006', NULL, 1, NOW());
