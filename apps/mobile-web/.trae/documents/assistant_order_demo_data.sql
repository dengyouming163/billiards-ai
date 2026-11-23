-- ============================================
-- 助教订单演示数据 - 修复版
-- 问题分析：
-- 1. 原外键约束指向不存在的表 bi_stores，实际应为 bi_busi_store
-- 2. type 字段值应为 'one_on_one' 而非 'coaching'/'practice'
-- 3. status 字段值应为 'pending'/'in_progress'/'completed'/'cancelled'
-- 4. 使用 UUID() 生成正确的 id
-- ============================================

-- 步骤1：临时关闭外键检查
SET FOREIGN_KEY_CHECKS = 0;

-- 步骤2：修复外键约束（删除错误的，添加正确的）
ALTER TABLE bi_busi_assistant_order DROP FOREIGN KEY IF EXISTS fk_assistant_order_store;
ALTER TABLE bi_busi_assistant_order ADD CONSTRAINT fk_assistant_order_store FOREIGN KEY (store_id) REFERENCES bi_busi_store (id) ON DELETE CASCADE;

-- 步骤3：清空现有数据
DELETE FROM `bi_busi_assistant_order`;

-- 步骤4：插入待接单数据（assistant_id为空）
INSERT INTO `bi_busi_assistant_order` 
(`id`, `order_no`, `store_id`, `assistant_id`, `student_name`, `student_phone`, `type`, `duration`, `unit_price`, `total_amount`, `status`, `operator_id`, `operator_name`, `remark`, `created_at`, `updated_at`) 
VALUES 
(UUID(), 'AST20250513001', 'store-001', '', '李先生', '13800138001', 'one_on_one', 2.00, 150.00, 300.00, 'pending', '', '李明华', '希望学习斯诺克基础', NOW(), NOW()),
(UUID(), 'AST20250513002', 'store-001', '', '王女士', '13800138002', 'one_on_one', 1.50, 100.00, 150.00, 'pending', '', '李明华', '陪练服务', NOW(), NOW()),
(UUID(), 'AST20250513003', 'store-001', '', '张先生', '13800138003', 'one_on_one', 3.00, 120.00, 360.00, 'pending', '', '李明华', '进阶教学', NOW(), NOW()),
(UUID(), 'AST20250513004', 'store-001', '', '陈女士', '13800138004', 'one_on_one', 2.00, 80.00, 160.00, 'pending', '', '李明华', '', NOW(), NOW());

-- 步骤5：插入已接单数据（进行中）
INSERT INTO `bi_busi_assistant_order` 
(`id`, `order_no`, `store_id`, `assistant_id`, `student_name`, `student_phone`, `type`, `duration`, `unit_price`, `total_amount`, `status`, `start_time`, `operator_id`, `operator_name`, `remark`, `created_at`, `updated_at`) 
VALUES 
(UUID(), 'AST20250512001', 'store-001', 'assistant_783893378500', '刘先生', '13800138005', 'one_on_one', 2.00, 150.00, 300.00, 'in_progress', DATE_SUB(NOW(), INTERVAL 1 HOUR), '', '李明华', '基础教学', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW());

-- 步骤6：插入已完成数据
INSERT INTO `bi_busi_assistant_order` 
(`id`, `order_no`, `store_id`, `assistant_id`, `student_name`, `student_phone`, `type`, `duration`, `unit_price`, `total_amount`, `status`, `start_time`, `end_time`, `operator_id`, `operator_name`, `remark`, `created_at`, `updated_at`, `completed_at`) 
VALUES 
(UUID(), 'AST20250511001', 'store-001', 'assistant_783893378500', '赵女士', '13800138006', 'one_on_one', 1.50, 100.00, 150.00, 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 22 HOUR), '', '李明华', '', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 22 HOUR), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
(UUID(), 'AST20250511002', 'store-001', 'assistant_783893378500', '孙先生', '13800138007', 'one_on_one', 2.00, 120.00, 240.00, 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR), '', '李明华', '进阶教学', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR), DATE_SUB(NOW(), INTERVAL 20 HOUR));

-- 步骤7：恢复外键检查
SET FOREIGN_KEY_CHECKS = 1;
