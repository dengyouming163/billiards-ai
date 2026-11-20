-- ============================================
-- 球房管理系统 演示数据脚本
-- 适用于 MySQL 数据库
-- 表前缀: bi_busi_
-- ============================================

-- ============================================
-- 1. 门店数据 (bi_busi_store)
-- ============================================
INSERT INTO `bi_busi_store` (`id`, `name`, `merchant_id`, `code`, `address`, `phone`, `status`, `owner_id`, `created_at`, `updated_at`) VALUES
('store-001', '阳光球房', 'merchant-001', 'YG001', '北京市朝阳区建国路88号', '010-88888888', 1, 'emp-001', NOW(), NOW()),
('store-002', '星牌台球俱乐部', 'merchant-001', 'XP002', '上海市浦东新区世纪大道100号', '021-66666666', 1, 'emp-008', NOW(), NOW()),
('store-003', '来力桌球会所', 'merchant-001', 'LL003', '广州市天河区天河路123号', '020-88889999', 1, 'emp-001', NOW(), NOW());

-- ============================================
-- 2. 员工数据 (bi_busi_employee)
-- ============================================
INSERT INTO `bi_busi_employee` (`id`, `merchant_id`, `store_id`, `name`, `phone`, `role`, `password`, `status`, `hire_date`, `created_at`, `updated_at`) VALUES
('emp-001', 'merchant-001', 'store-001', '陈志强', '13700137001', 'owner', 'e10adc3949ba59abbe56e057f20f883e', 1, '2020-01-15', NOW(), NOW()),
('emp-002', 'merchant-001', 'store-001', '王小明', '13700137002', 'admin', 'e10adc3949ba59abbe56e057f20f883e', 1, '2020-03-20', NOW(), NOW()),
('emp-003', 'merchant-001', 'store-001', '李明华', '13700137003', 'manager', 'e10adc3949ba59abbe56e057f20f883e', 1, '2021-06-10', NOW(), NOW()),
('emp-004', 'merchant-001', 'store-001', '张伟', '13800138001', 'assistant', 'e10adc3949ba59abbe56e057f20f883e', 1, '2022-01-05', NOW(), NOW()),
('emp-005', 'merchant-001', 'store-001', '李娜', '13800138002', 'assistant', 'e10adc3949ba59abbe56e057f20f883e', 1, '2022-04-15', NOW(), NOW()),
('emp-006', 'merchant-001', 'store-001', '刘洋', '13900139001', 'waiter', 'e10adc3949ba59abbe56e057f20f883e', 1, '2023-02-01', NOW(), NOW()),
('emp-007', 'merchant-001', 'store-001', '赵雪', '13900139002', 'waiter', 'e10adc3949ba59abbe56e057f20f883e', 1, '2023-05-20', NOW(), NOW()),
('emp-008', 'merchant-001', 'store-002', '王建国', '13700137004', 'manager', 'e10adc3949ba59abbe56e057f20f883e', 1, '2021-08-10', NOW(), NOW()),
('emp-009', 'merchant-001', 'store-002', '陈丽', '13800138003', 'assistant', 'e10adc3949ba59abbe56e057f20f883e', 1, '2022-03-01', NOW(), NOW()),
('emp-010', 'merchant-001', 'store-002', '周杰', '13900139003', 'waiter', 'e10adc3949ba59abbe56e057f20f883e', 1, '2023-07-15', NOW(), NOW());

-- ============================================
-- 3. 通知数据 (bi_busi_notification)
-- ============================================
INSERT INTO `bi_busi_notification` (`id`, `store_id`, `user_id`, `type`, `title`, `content`, `is_read`, `created_at`, `updated_at`) VALUES
('notif-001', 'store-001', 'emp-001', 'system', '系统升级通知', '球房管理系统将于本周日凌晨2:00-6:00进行系统升级，届时部分功能暂停使用。', 0, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('notif-002', 'store-001', 'emp-001', 'order', '新订单提醒', '您有一笔新的台费订单，订单金额¥280，请及时处理。', 0, DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),
('notif-003', 'store-001', 'emp-001', 'finance', '审批提醒', '员工张伟提交了补签申请，等待您审批。', 0, DATE_SUB(NOW(), INTERVAL 5 HOUR), NOW()),
('notif-004', 'store-001', 'emp-001', 'alert', '打卡异常', '员工刘洋今日未按时打卡，请注意核实。', 1, DATE_SUB(NOW(), INTERVAL 1 DAY), NOW()),
('notif-005', 'store-001', 'emp-001', 'order', '订单完成', '台费订单#20240512001已完成收款，金额¥320。', 1, DATE_SUB(NOW(), INTERVAL 2 DAY), NOW());

-- ============================================
-- 4. 订单数据 (bi_busi_order)
-- ============================================
INSERT INTO `bi_busi_order` (`id`, `store_id`, `order_no`, `type`, `status`, `table_id`, `assistant_id`, `operator_id`, `operator_name`, `start_time`, `end_time`, `duration_minutes`, `table_fee`, `product_fee`, `assistant_fee`, `total_fee`, `original_amount`, `discount_amount`, `final_amount`, `wechat_paid`, `member_name`, `remark`, `created_at`, `updated_at`) VALUES
-- 进行中订单
('order-001', 'store-001', 'ORD20250512001', 'table', 'in_progress', 'table-001', 'emp-004', 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 2 HOUR), NULL, NULL, 280.00, 0.00, 0.00, 280.00, 280.00, 0.00, 280.00, 280.00, '李先生', '美式台球3小时', DATE_SUB(NOW(), INTERVAL 2 HOUR), NOW()),
('order-002', 'store-001', 'ORD20250512002', 'table', 'in_progress', 'table-003', 'emp-005', 'emp-005', '李娜', DATE_SUB(NOW(), INTERVAL 1 HOUR), NULL, NULL, 160.00, 0.00, 0.00, 160.00, 160.00, 0.00, 160.00, 160.00, '王女士', '英式台球1小时', DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW()),
-- 已完成订单
('order-003', 'store-001', 'ORD20250511001', 'table', 'completed', 'table-002', 'emp-004', 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 22 HOUR), 120, 200.00, 0.00, 0.00, 200.00, 200.00, 0.00, 200.00, 200.00, '陈先生', '英式台球2小时', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 22 HOUR)),
('order-004', 'store-001', 'ORD20250511002', 'table', 'completed', 'table-001', 'emp-005', 'emp-005', '李娜', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR), 180, 300.00, 0.00, 0.00, 300.00, 300.00, 0.00, 300.00, 300.00, '张女士', '美式台球3小时', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 20 HOUR)),
('order-005', 'store-001', 'ORD20250511003', 'product', 'completed', NULL, NULL, 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY), NULL, 0.00, 85.00, 0.00, 85.00, 85.00, 0.00, 85.00, 85.00, '', '红牛x2，矿泉水x1', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 1 DAY)),
('order-006', 'store-001', 'ORD20250510001', 'table', 'completed', 'table-003', 'emp-004', 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 44 HOUR), 240, 400.00, 0.00, 0.00, 400.00, 400.00, 0.00, 400.00, 400.00, '刘先生', '美式台球4小时', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 44 HOUR)),
('order-007', 'store-001', 'ORD20250510002', 'assistant', 'completed', NULL, 'emp-004', 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 46 HOUR), 120, 0.00, 0.00, 300.00, 300.00, 300.00, 0.00, 300.00, 300.00, '赵先生', '助教陪练2小时', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 46 HOUR)),
('order-008', 'store-001', 'ORD20250510003', 'product', 'completed', NULL, NULL, 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY), NULL, 0.00, 120.00, 0.00, 120.00, 120.00, 0.00, 120.00, 120.00, '', '球杆保养套餐', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 2 DAY)),
('order-009', 'store-001', 'ORD20250509001', 'table', 'completed', 'table-001', 'emp-005', 'emp-005', '李娜', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 68 HOUR), 180, 300.00, 0.00, 0.00, 300.00, 300.00, 0.00, 300.00, 300.00, '孙女士', '美式台球3小时', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 68 HOUR)),
('order-010', 'store-001', 'ORD20250509002', 'table', 'completed', 'table-002', 'emp-004', 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 70 HOUR), 300, 500.00, 0.00, 0.00, 500.00, 500.00, 0.00, 500.00, 500.00, '周先生', '英式台球5小时', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 70 HOUR)),
('order-011', 'store-001', 'ORD20250508001', 'product', 'completed', NULL, NULL, 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 0.00, 58.00, 0.00, 58.00, 58.00, 0.00, 58.00, 58.00, '', '红牛x2', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('order-012', 'store-001', 'ORD20250508002', 'product', 'completed', NULL, NULL, 'emp-004', '张伟', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), NULL, 0.00, 220.00, 0.00, 220.00, 220.00, 0.00, 220.00, 220.00, '', '球杆套装x1', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY));

-- ============================================
-- 5. 订单明细表 (bi_busi_order_item)
-- ============================================
INSERT INTO `bi_busi_order_item` (`id`, `order_id`, `product_id`, `assistant_id`, `item_type`, `item_name`, `quantity`, `unit`, `unit_price`, `total_price`, `discount_rate`, `final_price`, `created_at`) VALUES
('item-001', 'order-005', 'prod-001', NULL, 'product', '红牛', 2, '瓶', 15.00, 30.00, 0.00, 30.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('item-002', 'order-005', 'prod-002', NULL, 'product', '矿泉水', 1, '瓶', 2.00, 2.00, 0.00, 2.00, DATE_SUB(NOW(), INTERVAL 1 DAY)),
('item-003', 'order-008', 'prod-003', NULL, 'product', '球杆保养套餐', 1, '套', 120.00, 120.00, 0.00, 120.00, DATE_SUB(NOW(), INTERVAL 2 DAY)),
('item-004', 'order-011', 'prod-001', NULL, 'product', '红牛', 2, '瓶', 15.00, 30.00, 0.00, 30.00, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('item-005', 'order-012', 'prod-004', NULL, 'product', '球杆套装', 1, '套', 220.00, 220.00, 0.00, 220.00, DATE_SUB(NOW(), INTERVAL 4 DAY)),
('item-006', 'order-007', NULL, 'emp-004', 'assistant', '助教陪练', 2, '小时', 150.00, 300.00, 0.00, 300.00, DATE_SUB(NOW(), INTERVAL 2 DAY));

-- ============================================
-- 6. 考勤记录/打卡数据 (bi_busi_employee_attendance)
-- ============================================
-- 普通打卡记录 (type = 'work')
INSERT INTO `bi_busi_employee_attendance` (`id`, `employee_id`, `store_id`, `work_date`, `type`, `status`, `check_in_time`, `check_out_time`, `late_minutes`, `work_hours`, `created_at`, `updated_at`) VALUES
-- 今日打卡
('att-001', 'emp-004', 'store-001', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 9 HOUR), NULL, 0, NULL, DATE_SUB(NOW(), INTERVAL 9 HOUR), NOW()),
('att-002', 'emp-005', 'store-001', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 8 HOUR), NULL, 0, NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR), NOW()),
('att-003', 'emp-006', 'store-001', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'work', 'late', DATE_SUB(NOW(), INTERVAL 8 HOUR 30 MINUTE), NULL, 30, NULL, DATE_SUB(NOW(), INTERVAL 8 HOUR 30 MINUTE), NOW()),
('att-004', 'emp-007', 'store-001', DATE_FORMAT(NOW(), '%Y-%m-%d'), 'work', 'late', DATE_SUB(NOW(), INTERVAL 9 HOUR 15 MINUTE), NULL, 15, NULL, DATE_SUB(NOW(), INTERVAL 9 HOUR 15 MINUTE), NOW()),
-- 昨日打卡
('att-005', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 17 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 17 HOUR)),
('att-006', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 18 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 18 HOUR)),
('att-007', 'emp-006', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 17 HOUR 30 MINUTE), 0, 8.0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 17 HOUR 30 MINUTE)),
('att-008', 'emp-007', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 18 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 1 DAY), DATE_SUB(NOW(), INTERVAL 18 HOUR)),
-- 前日打卡
('att-009', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR)),
('att-010', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY), '%Y-%m-%d'), 'work', 'late', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR), 20, 8.0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR)),
('att-011', 'emp-006', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR)),
('att-012', 'emp-007', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 2 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 2 DAY), DATE_SUB(NOW(), INTERVAL 42 HOUR)),
-- 更多历史打卡
('att-013', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR)),
('att-014', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR)),
('att-015', 'emp-006', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR)),
('att-016', 'emp-007', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 3 DAY), '%Y-%m-%d'), 'work', 'late', DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR), 10, 8.0, DATE_SUB(NOW(), INTERVAL 3 DAY), DATE_SUB(NOW(), INTERVAL 66 HOUR)),
('att-017', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR)),
('att-018', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR)),
('att-019', 'emp-006', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR)),
('att-020', 'emp-007', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 4 DAY), '%Y-%m-%d'), 'work', 'normal', DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR), 0, 8.0, DATE_SUB(NOW(), INTERVAL 4 DAY), DATE_SUB(NOW(), INTERVAL 90 HOUR));

-- ============================================
-- 7. 审批数据 (bi_busi_approval)
-- ============================================
INSERT INTO `bi_busi_approval` (`id`, `store_id`, `employee_id`, `employee_name`, `type`, `status`, `reason`, `start_date`, `end_date`, `duration`, `created_at`, `updated_at`) VALUES
-- 待审批的补卡申请
('appr-001', 'store-001', 'emp-006', '刘洋', 'checkin', 'pending', '早上有事迟到，申请补卡', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), 0.5, DATE_SUB(NOW(), INTERVAL 12 HOUR), NOW()),
('appr-002', 'store-001', 'emp-007', '赵雪', 'checkin', 'pending', '交通拥堵迟到，申请补卡', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 1 DAY), '%Y-%m-%d'), 0.25, DATE_SUB(NOW(), INTERVAL 10 HOUR), NOW()),
-- 待审批的请假申请
('appr-003', 'store-001', 'emp-004', '张伟', 'leave', 'pending', '家中有事，申请休假1天', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 2 DAY), '%Y-%m-%d'), 8.0, DATE_SUB(NOW(), INTERVAL 3 HOUR), NOW()),
('appr-004', 'store-001', 'emp-005', '李娜', 'leave', 'pending', '朋友婚礼，申请休假1天', DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 3 DAY), '%Y-%m-%d'), 8.0, DATE_SUB(NOW(), INTERVAL 1 HOUR), NOW()),
-- 已通过的申请
('appr-005', 'store-001', 'emp-006', '刘洋', 'leave', 'approved', '身体不适', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 7 DAY), '%Y-%m-%d'), 8.0, DATE_SUB(NOW(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 6 DAY)),
('appr-006', 'store-001', 'emp-007', '赵雪', 'checkin', 'approved', '地铁故障', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 10 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 10 DAY), '%Y-%m-%d'), 0.5, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(NOW(), INTERVAL 9 DAY)),
-- 已拒绝的申请
('appr-007', 'store-001', 'emp-004', '张伟', 'leave', 'rejected', '店内人手不足，暂不批准', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 5 DAY), '%Y-%m-%d'), 8.0, DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY)),
('appr-008', 'store-001', 'emp-005', '李娜', 'checkin', 'rejected', '多次迟到，不予批准', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY), '%Y-%m-%d'), DATE_FORMAT(DATE_SUB(NOW(), INTERVAL 12 DAY), '%Y-%m-%d'), 1.0, DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 11 DAY));

-- ============================================
-- 8. 排班数据 (bi_busi_employee_schedule)
-- ============================================
INSERT INTO `bi_busi_employee_schedule` (`id`, `employee_id`, `store_id`, `work_date`, `shift_type`, `start_time`, `end_time`, `status`, `description`, `created_at`, `updated_at`) VALUES
-- 本周排班
('sched-001', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY), '%Y-%m-%d'), 'morning', '09:00:00', '18:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-002', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 1) DAY), '%Y-%m-%d'), 'morning', '09:00:00', '18:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-003', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 2) DAY), '%Y-%m-%d'), 'morning', '09:00:00', '18:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-004', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 3) DAY), '%Y-%m-%d'), 'morning', '09:00:00', '18:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-005', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 4) DAY), '%Y-%m-%d'), 'morning', '09:00:00', '18:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-006', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 5) DAY), '%Y-%m-%d'), 'morning', '10:00:00', '20:00:00', 'scheduled', '周末班', NOW(), NOW()),
('sched-007', 'emp-004', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 6) DAY), '%Y-%m-%d'), 'morning', '10:00:00', '20:00:00', 'scheduled', '周末班', NOW(), NOW()),
('sched-008', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL WEEKDAY(NOW()) DAY), '%Y-%m-%d'), 'afternoon', '14:00:00', '22:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-009', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 1) DAY), '%Y-%m-%d'), 'afternoon', '14:00:00', '22:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-010', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 2) DAY), '%Y-%m-%d'), 'afternoon', '14:00:00', '22:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-011', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 3) DAY), '%Y-%m-%d'), 'afternoon', '14:00:00', '22:00:00', 'scheduled', NULL, NOW(), NOW()),
('sched-012', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 4) DAY), '%Y-%m-%d'), 'rest', '00:00:00', '00:00:00', 'scheduled', '休息', NOW(), NOW()),
('sched-013', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 5) DAY), '%Y-%m-%d'), 'morning', '10:00:00', '20:00:00', 'scheduled', '周末班', NOW(), NOW()),
('sched-014', 'emp-005', 'store-001', DATE_FORMAT(DATE_SUB(NOW(), INTERVAL (WEEKDAY(NOW()) - 6) DAY), '%Y-%m-%d'), 'morning', '10:00:00', '20:00:00', 'scheduled', '周末班', NOW(), NOW());

-- ============================================
-- 演示数据说明
-- ============================================
-- 1. 登录账号（密码都是123456，MD5加密后：e10adc3949ba59abbe56e057f20f883e）：
--    - 老板：陈志强，ID: emp-001（门店1）
--    - 管理员：王小明，ID: emp-002（门店1）
--    - 店长：李明华，ID: emp-003（门店1）
--    - 助教：张伟，ID: emp-004（门店1）
--    - 助教：李娜，ID: emp-005（门店1）
--    - 员工：刘洋，ID: emp-006（门店1）
--    - 员工：赵雪，ID: emp-007（门店1）
--    - 店长：王建国，ID: emp-008（门店2）
--    - 助教：陈丽，ID: emp-009（门店2）
--    - 员工：周杰，ID: emp-010（门店2）
--
-- 2. 数据关联：
--    - 所有业务数据通过 store_id 关联到对应门店
--    - 员工数据通过 employee_id 关联
--
-- 3. 状态说明：
--    - order.status: pending(待支付), in_progress(进行中), completed(已完成), cancelled(已取消)
--    - employee.status: 1(在职), 0(离职)
--    - notification.is_read: 0(未读), 1(已读)
--    - attendance.status (type=work): normal(正常), late(迟到), early(早退), absent(缺勤)
--    - approval.status: pending(待审批), approved(已通过), rejected(已拒绝)
--    - approval.type: checkin(补卡申请), leave(请假申请)
--    - schedule.shift_type: morning(早班), afternoon(下午班), night(晚班), rest(休息)
--
-- 4. 注意事项：
--    - 密码使用了MD5加密，默认密码为：123456
--    - 时间相关数据使用了 DATE_SUB(NOW(), ...) 动态计算
--    - 如需重置数据，只需重新执行此脚本即可