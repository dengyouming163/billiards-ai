-- =============================================
-- 示例数据：员工和助教
-- =============================================

-- 先插入员工数据
INSERT INTO `bi_busi_employee` 
(`id`, `name`, `phone`, `gender`, `role`, `position`, `status`, `hire_date`, `created_at`, `updated_at`) 
VALUES 
('emp_zhangsan', '张三', '13800001001', 'male', 'assistant', '助教', 1, '2025-01-15', NOW(), NOW()),
('emp_lisi', '李四', '13800001002', 'female', 'assistant', '助教', 1, '2025-02-20', NOW(), NOW()),
('emp_wangwu', '王五', '13800001003', 'male', 'assistant', '助教', 1, '2025-03-10', NOW(), NOW()),
('emp_zhaoliu', '赵六', '13800001004', 'female', 'assistant', '高级助教', 1, '2024-12-01', NOW(), NOW()),
('emp_sunqi', '孙七', '13800001005', 'male', 'assistant', '助教', 1, '2025-04-05', NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `updated_at` = NOW();

-- 再插入助教数据
INSERT INTO `bi_busi_assistant` 
(`id`, `employee_id`, `store_id`, `level_id`, `name`, `phone`, `gender`, `skills`, `hourly_rate`, `status`, `total_orders`, `total_hours`, `total_amount`, `rating`, `created_at`, `updated_at`) 
VALUES 
('assistant_zhangsan', 'emp_zhangsan', 'store-001', 'ast-level-002', '张三', '13800001001', 'male', '["台球教学", "初级"]', 80.00, 0, 120, 480.5, 38440.00, 4.8, NOW(), NOW()),
('assistant_lisi', 'emp_lisi', 'store-001', 'ast-level-001', '李四', '13800001002', 'female', '["台球教学"]', 60.00, 0, 85, 340.0, 20400.00, 4.6, NOW(), NOW()),
('assistant_wangwu', 'emp_wangwu', 'store-001', 'ast-level-003', '王五', '13800001003', 'male', '["台球教学", "中级", "高级"]', 100.00, 1, 200, 800.0, 80000.00, 4.9, NOW(), NOW()),
('assistant_zhaoliu', 'emp_zhaoliu', 'store-001', 'ast-level-003', '赵六', '13800001004', 'female', '["台球教学", "中级"]', 100.00, 0, 150, 600.0, 60000.00, 4.7, NOW(), NOW()),
('assistant_sunqi', 'emp_sunqi', 'store-001', 'ast-level-001', '孙七', '13800001005', 'male', '["台球教学"]', 60.00, 2, 50, 200.0, 12000.00, 4.5, NOW(), NOW())
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `updated_at` = NOW();
