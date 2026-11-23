-- ============================================
-- 创建审批表 (bi_busi_approval)
-- ============================================
CREATE TABLE IF NOT EXISTS `bi_busi_approval` (
  `id` varchar(36) NOT NULL COMMENT '审批ID',
  `store_id` varchar(36) NOT NULL COMMENT '门店ID',
  `employee_id` varchar(36) NOT NULL COMMENT '员工ID',
  `employee_name` varchar(100) NOT NULL COMMENT '员工姓名',
  `type` varchar(20) NOT NULL COMMENT '审批类型: checkin(补卡), leave(请假)',
  `status` varchar(20) NOT NULL COMMENT '状态: pending(待审批), approved(已通过), rejected(已拒绝)',
  `reason` varchar(500) DEFAULT NULL COMMENT '申请理由',
  `start_date` date DEFAULT NULL COMMENT '开始日期',
  `end_date` date DEFAULT NULL COMMENT '结束日期',
  `duration` decimal(5,2) DEFAULT NULL COMMENT '时长(小时)',
  `remark` varchar(500) DEFAULT NULL COMMENT '备注',
  `approver_id` varchar(36) DEFAULT NULL COMMENT '审批人ID',
  `approver_name` varchar(100) DEFAULT NULL COMMENT '审批人姓名',
  `approve_time` datetime DEFAULT NULL COMMENT '审批时间',
  `approve_remark` varchar(500) DEFAULT NULL COMMENT '审批意见',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_employee_id` (`employee_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='审批表';

-- ============================================
-- 创建审批数据
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