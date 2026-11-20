-- ============================================
-- BilliardsHub 台球厅商业管理系统
-- 数据库设计文档
-- 数据库版本: 1.0.0
-- 创建时间: 2024
-- 表前缀: bi_busi_
-- ============================================

-- ----------------------------
-- 1. 门店管理表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_store`;
CREATE TABLE `bi_busi_store` (
    `id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `name` VARCHAR(100) NOT NULL COMMENT '门店名称',
    `code` VARCHAR(50) NOT NULL COMMENT '门店编码',
    `address` VARCHAR(255) DEFAULT NULL COMMENT '门店地址',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '联系电话',
    `business_hours_start` TIME DEFAULT '09:00:00' COMMENT '营业开始时间',
    `business_hours_end` TIME DEFAULT '23:00:00' COMMENT '营业结束时间',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停业 1-营业',
    `logo` VARCHAR(255) DEFAULT NULL COMMENT '门店Logo',
    `description` TEXT DEFAULT NULL COMMENT '门店描述',
    `owner_id` VARCHAR(36) DEFAULT NULL COMMENT '负责人ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_code` (`code`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门店信息表';

-- ----------------------------
-- 2. 门店分区表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_zone`;
CREATE TABLE `bi_busi_zone` (
    `id` VARCHAR(36) NOT NULL COMMENT '分区ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(100) NOT NULL COMMENT '分区名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '分区编码',
    `color` VARCHAR(20) DEFAULT '#00D4AA' COMMENT '分区颜色',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '分区描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='门店分区表';

-- ----------------------------
-- 3. 台桌表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_table`;
CREATE TABLE `bi_busi_table` (
    `id` VARCHAR(36) NOT NULL COMMENT '台桌ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `zone_id` VARCHAR(36) DEFAULT NULL COMMENT '所属分区ID',
    `number` VARCHAR(20) NOT NULL COMMENT '台桌编号',
    `name` VARCHAR(100) DEFAULT NULL COMMENT '台桌名称',
    `type` VARCHAR(20) NOT NULL DEFAULT 'standard' COMMENT '类型：standard-标准台 tournament-比赛台 snooker-斯诺克',
    `status` VARCHAR(20) NOT NULL DEFAULT 'idle' COMMENT '状态：idle-空闲 occupied-使用中 reserved-预约 maintenance-维护',
    `pricing_id` VARCHAR(36) DEFAULT NULL COMMENT '绑定的计费规则ID',
    `qrcode` VARCHAR(255) DEFAULT NULL COMMENT '二维码地址',
    `hourly_rate` DECIMAL(10,2) DEFAULT NULL COMMENT '每小时单价',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '台桌描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `total_usage_count` INT NOT NULL DEFAULT 0 COMMENT '累计使用次数',
    `total_usage_hours` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计使用时长(小时)',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_number` (`store_id`, `number`),
    KEY `idx_zone_id` (`zone_id`),
    KEY `idx_status` (`status`),
    KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='台桌信息表';

-- ----------------------------
-- 4. 计费规则表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_pricing`;
CREATE TABLE `bi_busi_pricing` (
    `id` VARCHAR(36) NOT NULL COMMENT '计费规则ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(100) NOT NULL COMMENT '规则名称',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：time-计时 round-局数 period-包时段 mixed-混合 cap-封顶 member-会员专属',
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '价格',
    `cost_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '成本价',
    `unit` VARCHAR(20) DEFAULT 'hour' COMMENT '计费单位：hour-小时 minute-分钟 round-局',
    `min_duration` INT DEFAULT 0 COMMENT '最低消费时长(分钟)',
    `description` TEXT DEFAULT NULL COMMENT '规则描述',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计费规则表';

-- ----------------------------
-- 5. 计费规则时段配置表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_pricing_period`;
CREATE TABLE `bi_busi_pricing_period` (
    `id` VARCHAR(36) NOT NULL COMMENT '时段配置ID',
    `pricing_id` VARCHAR(36) NOT NULL COMMENT '计费规则ID',
    `name` VARCHAR(100) NOT NULL COMMENT '时段名称',
    `type` VARCHAR(20) NOT NULL DEFAULT 'off_peak' COMMENT '类型：off_peak-平时段 peak-高峰 golden-黄金',
    `start_time` TIME NOT NULL COMMENT '开始时间',
    `end_time` TIME NOT NULL COMMENT '结束时间',
    `price` DECIMAL(10,2) NOT NULL COMMENT '该时段价格',
    `coefficient` DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT '价格系数',
    `color` VARCHAR(20) DEFAULT '#00D4AA' COMMENT '颜色',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `weekdays` VARCHAR(20) DEFAULT '1,2,3,4,5,6,7' COMMENT '适用星期，逗号分隔',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_pricing_id` (`pricing_id`),
    KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='计费时段配置表';

-- ----------------------------
-- 6. 会员等级表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_member_level`;
CREATE TABLE `bi_busi_member_level` (
    `id` VARCHAR(36) NOT NULL COMMENT '等级ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(50) NOT NULL COMMENT '等级名称',
    `code` VARCHAR(20) NOT NULL COMMENT '等级编码',
    `color` VARCHAR(20) DEFAULT '#94a3b8' COMMENT '等级颜色',
    `discount_rate` DECIMAL(5,2) NOT NULL DEFAULT 100.00 COMMENT '折扣率(%)',
    `points_multiplier` DECIMAL(3,2) NOT NULL DEFAULT 1.00 COMMENT '积分倍数',
    `min_points` INT NOT NULL DEFAULT 0 COMMENT '最低积分要求',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '等级描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员等级表';

-- ----------------------------
-- 7. 会员表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_member`;
CREATE TABLE `bi_busi_member` (
    `id` VARCHAR(36) NOT NULL COMMENT '会员ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `level_id` VARCHAR(36) DEFAULT NULL COMMENT '会员等级ID',
    `name` VARCHAR(100) NOT NULL COMMENT '会员姓名',
    `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
    `gender` VARCHAR(10) DEFAULT 'unknown' COMMENT '性别：male-female-unknown',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `birthday` DATE DEFAULT NULL COMMENT '生日',
    `balance` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '账户余额',
    `points` INT NOT NULL DEFAULT 0 COMMENT '积分',
    `total_consume` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费',
    `total_recharge` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值',
    `password` VARCHAR(255) DEFAULT NULL COMMENT '登录密码(加密)',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-正常',
    `last_consume_time` DATETIME DEFAULT NULL COMMENT '最后消费时间',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_phone` (`store_id`, `phone`),
    KEY `idx_level_id` (`level_id`),
    KEY `idx_status` (`status`),
    KEY `idx_points` (`points`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员表';

-- ----------------------------
-- 8. 会员充值记录表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_member_recharge`;
CREATE TABLE `bi_busi_member_recharge` (
    `id` VARCHAR(36) NOT NULL COMMENT '充值记录ID',
    `member_id` VARCHAR(36) NOT NULL COMMENT '会员ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '充值金额',
    `gift_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '赠送金额',
    `payment_method` VARCHAR(20) NOT NULL COMMENT '支付方式：cash-wechat-alipay-bankcard',
    `gift_points` INT NOT NULL DEFAULT 0 COMMENT '赠送积分',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作员ID',
    `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '操作员姓名',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_member_id` (`member_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员充值记录表';

-- ----------------------------
-- 9. 会员消费记录表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_member_consume`;
CREATE TABLE `bi_busi_member_consume` (
    `id` VARCHAR(36) NOT NULL COMMENT '消费记录ID',
    `member_id` VARCHAR(36) NOT NULL COMMENT '会员ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `order_id` VARCHAR(36) NOT NULL COMMENT '订单ID',
    `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '消费金额',
    `points` INT NOT NULL DEFAULT 0 COMMENT '获得积分',
    `balance_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额支付',
    `other_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '其他方式支付',
    `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_member_id` (`member_id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='会员消费记录表';

-- ----------------------------
-- 10. 员工表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee`;
CREATE TABLE `bi_busi_employee` (
    `id` VARCHAR(36) NOT NULL COMMENT '员工ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(100) NOT NULL COMMENT '员工姓名',
    `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
    `gender` VARCHAR(10) DEFAULT 'unknown' COMMENT '性别',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `id_card` VARCHAR(20) DEFAULT NULL COMMENT '身份证号',
    `role` VARCHAR(20) NOT NULL COMMENT '角色：owner-boss manager-manager cashier-cashier waiter-waiter assistant-assistant',
    `position` VARCHAR(50) DEFAULT NULL COMMENT '职位',
    `salary` DECIMAL(10,2) DEFAULT NULL COMMENT '基本工资',
    `password` VARCHAR(255) NOT NULL COMMENT '登录密码',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-离职 1-在职',
    `hire_date` DATE DEFAULT NULL COMMENT '入职日期',
    `leave_date` DATE DEFAULT NULL COMMENT '离职日期',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_phone` (`store_id`, `phone`),
    KEY `idx_role` (`role`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工表';

-- ----------------------------
-- 11. 员工排班表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee_schedule`;
CREATE TABLE `bi_busi_employee_schedule` (
    `id` VARCHAR(36) NOT NULL COMMENT '排班ID',
    `employee_id` VARCHAR(36) NOT NULL COMMENT '员工ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `work_date` DATE NOT NULL COMMENT '工作日期',
    `shift_type` VARCHAR(20) NOT NULL COMMENT '班次：morning-afternoon-night',
    `start_time` TIME NOT NULL COMMENT '上班时间',
    `end_time` TIME NOT NULL COMMENT '下班时间',
    `status` VARCHAR(20) NOT NULL DEFAULT 'scheduled' COMMENT '状态：scheduled-已排班 checked-已打卡 absent-旷工',
    `check_in_time` DATETIME DEFAULT NULL COMMENT '签到时间',
    `check_out_time` DATETIME DEFAULT NULL COMMENT '签退时间',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_date_shift` (`employee_id`, `work_date`, `shift_type`),
    KEY `idx_store_date` (`store_id`, `work_date`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工排班表';

-- ----------------------------
-- 12. 员工考勤记录表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee_attendance`;
CREATE TABLE `bi_busi_employee_attendance` (
    `id` VARCHAR(36) NOT NULL COMMENT '考勤ID',
    `employee_id` VARCHAR(36) NOT NULL COMMENT '员工ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `work_date` DATE NOT NULL COMMENT '考勤日期',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：work-rest-vacation-sick',
    `status` VARCHAR(20) NOT NULL COMMENT '状态：normal-late-early-absent',
    `check_in_time` DATETIME DEFAULT NULL COMMENT '上班打卡时间',
    `check_out_time` DATETIME DEFAULT NULL COMMENT '下班打卡时间',
    `work_hours` DECIMAL(4,1) DEFAULT NULL COMMENT '工作时长',
    `late_minutes` INT DEFAULT 0 COMMENT '迟到分钟数',
    `early_minutes` INT DEFAULT 0 COMMENT '早退分钟数',
    `overtime_hours` DECIMAL(4,1) DEFAULT 0 COMMENT '加班时长',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_date` (`employee_id`, `work_date`),
    KEY `idx_store_date` (`store_id`, `work_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工考勤记录表';

-- ----------------------------
-- 13. 助教等级表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_assistant_level`;
CREATE TABLE `bi_busi_assistant_level` (
    `id` VARCHAR(36) NOT NULL COMMENT '等级ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(50) NOT NULL COMMENT '等级名称',
    `code` VARCHAR(20) NOT NULL COMMENT '等级编码',
    `color` VARCHAR(20) DEFAULT '#f59e0b' COMMENT '等级颜色',
    `hourly_rate` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '课时费',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '等级描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教等级表';

-- ----------------------------
-- 14. 助教表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_assistant`;
CREATE TABLE `bi_busi_assistant` (
    `id` VARCHAR(36) NOT NULL COMMENT '助教ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `level_id` VARCHAR(36) DEFAULT NULL COMMENT '等级ID',
    `name` VARCHAR(100) NOT NULL COMMENT '助教姓名',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `gender` VARCHAR(10) DEFAULT 'unknown' COMMENT '性别',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `skills` VARCHAR(255) DEFAULT NULL COMMENT '擅长领域，多个用逗号分隔',
    `hourly_rate` DECIMAL(10,2) DEFAULT 0.00 COMMENT '课时费',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-休息 1-空闲 2-服务中',
    `total_orders` INT NOT NULL DEFAULT 0 COMMENT '累计订单数',
    `total_hours` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计服务时长',
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计业绩',
    `rating` DECIMAL(3,2) DEFAULT 5.00 COMMENT '评分',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '简介',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_level_id` (`level_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教表';

-- ----------------------------
-- 15. 商品分类表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_product_category`;
CREATE TABLE `bi_busi_product_category` (
    `id` VARCHAR(36) NOT NULL COMMENT '分类ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(100) NOT NULL COMMENT '分类名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '分类编码',
    `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品分类表';

-- ----------------------------
-- 16. 商品表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_product`;
CREATE TABLE `bi_busi_product` (
    `id` VARCHAR(36) NOT NULL COMMENT '商品ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `category_id` VARCHAR(36) DEFAULT NULL COMMENT '分类ID',
    `name` VARCHAR(100) NOT NULL COMMENT '商品名称',
    `code` VARCHAR(50) DEFAULT NULL COMMENT '商品编码',
    `barcode` VARCHAR(50) DEFAULT NULL COMMENT '条形码',
    `unit` VARCHAR(20) NOT NULL DEFAULT '个' COMMENT '单位',
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '售价',
    `cost_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '成本价',
    `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    `min_stock` INT NOT NULL DEFAULT 0 COMMENT '最低库存',
    `image` VARCHAR(255) DEFAULT NULL COMMENT '商品图片',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '商品描述',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-下架 1-上架',
    `total_sales` INT NOT NULL DEFAULT 0 COMMENT '累计销量',
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '累计销售额',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_category_id` (`category_id`),
    KEY `idx_status` (`status`),
    KEY `idx_stock` (`stock`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商品表';

-- ----------------------------
-- 17. 库存记录表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_inventory_record`;
CREATE TABLE `bi_busi_inventory_record` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID',
    `product_id` VARCHAR(36) NOT NULL COMMENT '商品ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：inbound-入库 outbound-出库 adjustment-调整',
    `quantity` INT NOT NULL COMMENT '数量',
    `price` DECIMAL(10,2) DEFAULT NULL COMMENT '单价(入库时)',
    `total_amount` DECIMAL(10,2) DEFAULT NULL COMMENT '总金额',
    `stock_before` INT NOT NULL COMMENT '操作前库存',
    `stock_after` INT NOT NULL COMMENT '操作后库存',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作员ID',
    `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '操作员姓名',
    `reason` VARCHAR(255) DEFAULT NULL COMMENT '原因',
    `order_id` VARCHAR(36) DEFAULT NULL COMMENT '关联订单ID',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_product_id` (`product_id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='库存记录表';

-- ----------------------------
-- 18. 套餐类型表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_package_type`;
CREATE TABLE `bi_busi_package_type` (
    `id` VARCHAR(36) NOT NULL COMMENT '类型ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(50) NOT NULL COMMENT '类型名称',
    `code` VARCHAR(20) NOT NULL COMMENT '类型编码',
    `color` VARCHAR(20) DEFAULT '#6366f1' COMMENT '颜色',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '类型描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐类型表';

-- ----------------------------
-- 19. 套餐表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_package`;
CREATE TABLE `bi_busi_package` (
    `id` VARCHAR(36) NOT NULL COMMENT '套餐ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(100) NOT NULL COMMENT '套餐名称',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：time-时长 product-商品 mixed-混合 member-会员',
    `price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '售价',
    `cost_price` DECIMAL(10,2) DEFAULT 0.00 COMMENT '成本价',
    `validity_days` INT DEFAULT 365 COMMENT '有效期(天)',
    `description` TEXT DEFAULT NULL COMMENT '套餐描述',
    `image` VARCHAR(255) DEFAULT NULL COMMENT '套餐图片',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-下架 1-上架',
    `sales_count` INT NOT NULL DEFAULT 0 COMMENT '销量',
    `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '销售额',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐表';

-- ----------------------------
-- 20. 套餐明细表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_package_item`;
CREATE TABLE `bi_busi_package_item` (
    `id` VARCHAR(36) NOT NULL COMMENT '明细ID',
    `package_id` VARCHAR(36) NOT NULL COMMENT '套餐ID',
    `item_type` VARCHAR(20) NOT NULL COMMENT '项目类型：time-product-assistant',
    `item_id` VARCHAR(36) DEFAULT NULL COMMENT '关联项目ID(商品/助教等)',
    `item_name` VARCHAR(100) NOT NULL COMMENT '项目名称',
    `quantity` DECIMAL(10,2) NOT NULL DEFAULT 1 COMMENT '数量',
    `unit` VARCHAR(20) DEFAULT NULL COMMENT '单位',
    `price` DECIMAL(10,2) DEFAULT NULL COMMENT '单价',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_package_id` (`package_id`),
    KEY `idx_item_type` (`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐明细表';

-- ----------------------------
-- 21. 订单主表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_order`;
CREATE TABLE `bi_busi_order` (
    `id` VARCHAR(36) NOT NULL COMMENT '订单ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：table-台桌 product-商品 assistant-助教',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待支付 in_progress-进行中 completed-已完成 cancelled-已取消',
    `member_id` VARCHAR(36) DEFAULT NULL COMMENT '会员ID',
    `table_id` VARCHAR(36) DEFAULT NULL COMMENT '台桌ID',
    `assistant_id` VARCHAR(36) DEFAULT NULL COMMENT '助教ID',
    `original_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '原价',
    `discount_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
    `final_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实付金额',
    `balance_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '余额支付',
    `cash_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '现金支付',
    `wechat_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '微信支付',
    `alipay_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '支付宝支付',
    `card_paid` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '银行卡支付',
    `points_deduct` INT NOT NULL DEFAULT 0 COMMENT '积分抵扣',
    `points_gained` INT NOT NULL DEFAULT 0 COMMENT '获得积分',
    `start_time` DATETIME DEFAULT NULL COMMENT '开始时间',
    `end_time` DATETIME DEFAULT NULL COMMENT '结束时间',
    `duration_minutes` INT DEFAULT NULL COMMENT '时长(分钟)',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作员ID',
    `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '操作员姓名',
    `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order_no` (`order_no`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`),
    KEY `idx_member_id` (`member_id`),
    KEY `idx_table_id` (`table_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单主表';

-- ----------------------------
-- 22. 订单明细表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_order_item`;
CREATE TABLE `bi_busi_order_item` (
    `id` VARCHAR(36) NOT NULL COMMENT '明细ID',
    `order_id` VARCHAR(36) NOT NULL COMMENT '订单ID',
    `product_id` VARCHAR(36) DEFAULT NULL COMMENT '商品ID',
    `assistant_id` VARCHAR(36) DEFAULT NULL COMMENT '助教ID',
    `item_type` VARCHAR(20) NOT NULL COMMENT '项目类型：table-product-assistant-time',
    `item_name` VARCHAR(100) NOT NULL COMMENT '项目名称',
    `quantity` DECIMAL(10,2) NOT NULL DEFAULT 1 COMMENT '数量',
    `unit` VARCHAR(20) DEFAULT NULL COMMENT '单位',
    `unit_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '单价',
    `total_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '小计',
    `discount_rate` DECIMAL(5,2) DEFAULT 100.00 COMMENT '折扣率',
    `final_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实付价格',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_product_id` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单明细表';

-- ----------------------------
-- 23. 订单支付记录表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_order_payment`;
CREATE TABLE `bi_busi_order_payment` (
    `id` VARCHAR(36) NOT NULL COMMENT '支付记录ID',
    `order_id` VARCHAR(36) NOT NULL COMMENT '订单ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `order_no` VARCHAR(50) NOT NULL COMMENT '订单号',
    `payment_method` VARCHAR(20) NOT NULL COMMENT '支付方式：cash-wechat-alipay-card-points-balance',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    `transaction_no` VARCHAR(100) DEFAULT NULL COMMENT '交易流水号',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待支付 success-成功 failed-失败',
    `paid_at` DATETIME DEFAULT NULL COMMENT '支付时间',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作员ID',
    `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '操作员姓名',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '备注',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_order_id` (`order_id`),
    KEY `idx_payment_method` (`payment_method`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单支付记录表';

-- ----------------------------
-- 24. 资金流水表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_cash_flow`;
CREATE TABLE `bi_busi_cash_flow` (
    `id` VARCHAR(36) NOT NULL COMMENT '流水ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `order_id` VARCHAR(36) DEFAULT NULL COMMENT '订单ID',
    `order_no` VARCHAR(50) DEFAULT NULL COMMENT '订单号',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：income-收入 expense-支出',
    `category` VARCHAR(50) NOT NULL COMMENT '类别：table-台桌 product-商品 assistant-助教 member_recharge-会员充值 other-其他',
    `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
    `payment_method` VARCHAR(20) DEFAULT NULL COMMENT '支付方式',
    `balance_before` DECIMAL(10,2) DEFAULT NULL COMMENT '变动前余额',
    `balance_after` DECIMAL(10,2) DEFAULT NULL COMMENT '变动后余额',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作员ID',
    `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '操作员姓名',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`),
    KEY `idx_category` (`category`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='资金流水表';

-- ----------------------------
-- 25. 系统配置表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_config`;
CREATE TABLE `bi_busi_config` (
    `id` VARCHAR(36) NOT NULL COMMENT '配置ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `category` VARCHAR(50) NOT NULL COMMENT '配置分类：store-payment-notification-display',
    `key` VARCHAR(100) NOT NULL COMMENT '配置键',
    `value` TEXT DEFAULT NULL COMMENT '配置值',
    `type` VARCHAR(20) DEFAULT 'string' COMMENT '类型：string-number-boolean-json',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_key` (`store_id`, `category`, `key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ----------------------------
-- 26. 通知设置表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_notification_setting`;
CREATE TABLE `bi_busi_notification_setting` (
    `id` VARCHAR(36) NOT NULL COMMENT '设置ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `type` VARCHAR(50) NOT NULL COMMENT '通知类型：order_reminder-stock_alert-low_balance-member_birthday',
    `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    `config` JSON DEFAULT NULL COMMENT '配置JSON',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='通知设置表';

-- ----------------------------
-- 27. 操作日志表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_operate_log`;
CREATE TABLE `bi_busi_operate_log` (
    `id` VARCHAR(36) NOT NULL COMMENT '日志ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `operator_id` VARCHAR(36) DEFAULT NULL COMMENT '操作员ID',
    `operator_name` VARCHAR(100) DEFAULT NULL COMMENT '操作员姓名',
    `operator_type` VARCHAR(20) DEFAULT 'employee' COMMENT '操作者类型：employee-member-system',
    `module` VARCHAR(50) NOT NULL COMMENT '操作模块',
    `action` VARCHAR(50) NOT NULL COMMENT '操作动作：create-update-delete-login',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '操作对象类型',
    `target_id` VARCHAR(36) DEFAULT NULL COMMENT '操作对象ID',
    `target_name` VARCHAR(100) DEFAULT NULL COMMENT '操作对象名称',
    `content` TEXT DEFAULT NULL COMMENT '操作内容',
    `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'User-Agent',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-失败 1-成功',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_operator_id` (`operator_id`),
    KEY `idx_module` (`module`),
    KEY `idx_action` (`action`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- ----------------------------
-- 28. 登录日志表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_login_log`;
CREATE TABLE `bi_busi_login_log` (
    `id` VARCHAR(36) NOT NULL COMMENT '日志ID',
    `user_type` VARCHAR(20) NOT NULL COMMENT '用户类型：employee-member',
    `user_id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `user_name` VARCHAR(100) NOT NULL COMMENT '用户名称',
    `store_id` VARCHAR(36) DEFAULT NULL COMMENT '门店ID',
    `login_type` VARCHAR(20) DEFAULT 'password' COMMENT '登录方式：password-sms-qrcode',
    `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'User-Agent',
    `device` VARCHAR(100) DEFAULT NULL COMMENT '设备信息',
    `location` VARCHAR(255) DEFAULT NULL COMMENT '登录地点',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-失败 1-成功',
    `fail_reason` VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_user_id` (`user_id`),
    KEY `idx_user_type` (`user_type`),
    KEY `idx_status` (`status`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='登录日志表';

-- ----------------------------
-- 29. 微信用户表(小程序)
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_wx_user`;
CREATE TABLE `bi_busi_wx_user` (
    `id` VARCHAR(36) NOT NULL COMMENT '用户ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `openid` VARCHAR(100) NOT NULL COMMENT '微信OpenID',
    `unionid` VARCHAR(100) DEFAULT NULL COMMENT '微信UnionID',
    `member_id` VARCHAR(36) DEFAULT NULL COMMENT '绑定的会员ID',
    `nickname` VARCHAR(100) DEFAULT NULL COMMENT '昵称',
    `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像',
    `gender` VARCHAR(10) DEFAULT 'unknown' COMMENT '性别',
    `country` VARCHAR(50) DEFAULT NULL COMMENT '国家',
    `province` VARCHAR(50) DEFAULT NULL COMMENT '省份',
    `city` VARCHAR(50) DEFAULT NULL COMMENT '城市',
    `language` VARCHAR(20) DEFAULT NULL COMMENT '语言',
    `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-正常',
    `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_openid` (`openid`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_member_id` (`member_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='微信用户表';

-- ----------------------------
-- 30. 文件存储表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_file`;
CREATE TABLE `bi_busi_file` (
    `id` VARCHAR(36) NOT NULL COMMENT '文件ID',
    `store_id` VARCHAR(36) DEFAULT NULL COMMENT '所属门店ID',
    `category` VARCHAR(50) NOT NULL COMMENT '文件分类：avatar-product-table-qrcode-document',
    `file_name` VARCHAR(255) NOT NULL COMMENT '文件名',
    `original_name` VARCHAR(255) DEFAULT NULL COMMENT '原始文件名',
    `file_path` VARCHAR(500) NOT NULL COMMENT '文件路径',
    `file_url` VARCHAR(500) NOT NULL COMMENT '访问URL',
    `file_type` VARCHAR(50) DEFAULT NULL COMMENT '文件类型/MIME',
    `file_size` BIGINT DEFAULT NULL COMMENT '文件大小(字节)',
    `width` INT DEFAULT NULL COMMENT '图片宽度',
    `height` INT DEFAULT NULL COMMENT '图片高度',
    `uploader_id` VARCHAR(36) DEFAULT NULL COMMENT '上传者ID',
    `uploader_name` VARCHAR(100) DEFAULT NULL COMMENT '上传者姓名',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_category` (`category`),
    KEY `idx_uploader_id` (`uploader_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件存储表';

-- ----------------------------
-- 31. 消息模板表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_message_template`;
CREATE TABLE `bi_busi_message_template` (
    `id` VARCHAR(36) NOT NULL COMMENT '模板ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：sms-wechat-notify',
    `name` VARCHAR(100) NOT NULL COMMENT '模板名称',
    `code` VARCHAR(50) NOT NULL COMMENT '模板编码',
    `title` VARCHAR(200) DEFAULT NULL COMMENT '消息标题',
    `content` TEXT NOT NULL COMMENT '模板内容',
    `variables` VARCHAR(500) DEFAULT NULL COMMENT '变量列表，JSON格式',
    `enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_type` (`type`),
    KEY `idx_enabled` (`enabled`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息模板表';

-- ----------------------------
-- 32. 消息发送记录表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_message_log`;
CREATE TABLE `bi_busi_message_log` (
    `id` VARCHAR(36) NOT NULL COMMENT '记录ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `template_id` VARCHAR(36) DEFAULT NULL COMMENT '模板ID',
    `type` VARCHAR(20) NOT NULL COMMENT '类型：sms-wechat-notify',
    `recipient` VARCHAR(100) NOT NULL COMMENT '接收者',
    `recipient_type` VARCHAR(20) NOT NULL COMMENT '接收者类型：member-employee-wx_user',
    `recipient_id` VARCHAR(36) DEFAULT NULL COMMENT '接收者ID',
    `title` VARCHAR(200) DEFAULT NULL COMMENT '消息标题',
    `content` TEXT NOT NULL COMMENT '消息内容',
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待发送 sending-发送中 success-成功 failed-失败',
    `send_time` DATETIME DEFAULT NULL COMMENT '发送时间',
    `complete_time` DATETIME DEFAULT NULL COMMENT '完成时间',
    `fail_reason` VARCHAR(255) DEFAULT NULL COMMENT '失败原因',
    `response` TEXT DEFAULT NULL COMMENT '第三方响应',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_type` (`type`),
    KEY `idx_status` (`status`),
    KEY `idx_recipient_id` (`recipient_id`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='消息发送记录表';

-- ----------------------------
-- 33. 员工角色表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee_role`;
CREATE TABLE `bi_busi_employee_role` (
    `id` VARCHAR(36) NOT NULL COMMENT '角色ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `name` VARCHAR(50) NOT NULL COMMENT '角色名称',
    `code` VARCHAR(20) NOT NULL COMMENT '角色编码',
    `description` VARCHAR(255) DEFAULT NULL COMMENT '角色描述',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-停用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工角色表';

-- ----------------------------
-- 34. 权限菜单表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_permission`;
CREATE TABLE `bi_busi_permission` (
    `id` VARCHAR(36) NOT NULL COMMENT '权限ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `parent_id` VARCHAR(36) DEFAULT NULL COMMENT '父级权限ID',
    `name` VARCHAR(100) NOT NULL COMMENT '权限名称',
    `code` VARCHAR(100) NOT NULL COMMENT '权限标识',
    `uri` VARCHAR(255) DEFAULT NULL COMMENT '访问路径',
    `icon` VARCHAR(50) DEFAULT NULL COMMENT '图标',
    `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序',
    `type` VARCHAR(20) NOT NULL DEFAULT 'menu' COMMENT '类型：menu-菜单 button-按钮',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-禁用 1-启用',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_store_code` (`store_id`, `code`),
    KEY `idx_parent_id` (`parent_id`),
    KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='权限菜单表';

-- ----------------------------
-- 35. 角色权限关联表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_role_permission`;
CREATE TABLE `bi_busi_role_permission` (
    `id` VARCHAR(36) NOT NULL COMMENT '关联ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `role_id` VARCHAR(36) NOT NULL COMMENT '角色ID',
    `permission_id` VARCHAR(36) NOT NULL COMMENT '权限ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_role_permission` (`role_id`, `permission_id`),
    KEY `idx_role_id` (`role_id`),
    KEY `idx_permission_id` (`permission_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='角色权限关联表';

-- ----------------------------
-- 36. 员工角色关联表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee_role_relation`;
CREATE TABLE `bi_busi_employee_role_relation` (
    `id` VARCHAR(36) NOT NULL COMMENT '关联ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `employee_id` VARCHAR(36) NOT NULL COMMENT '员工ID',
    `role_id` VARCHAR(36) NOT NULL COMMENT '角色ID',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_employee_role` (`employee_id`, `role_id`),
    KEY `idx_employee_id` (`employee_id`),
    KEY `idx_role_id` (`role_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工角色关联表';

-- ----------------------------
-- 37. 员工登录会话表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee_session`;
CREATE TABLE `bi_busi_employee_session` (
    `id` VARCHAR(36) NOT NULL COMMENT '会话ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '所属门店ID',
    `employee_id` VARCHAR(36) NOT NULL COMMENT '员工ID',
    `token` VARCHAR(100) NOT NULL COMMENT '登录令牌',
    `terminal` VARCHAR(50) DEFAULT 'pc' COMMENT '终端类型',
    `login_ip` VARCHAR(50) DEFAULT NULL COMMENT '登录IP',
    `expire_time` INT NOT NULL COMMENT '过期时间戳',
    `update_time` INT NOT NULL COMMENT '更新时间戳',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_token` (`token`),
    KEY `idx_employee_id` (`employee_id`),
    KEY `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工登录会话表';

-- ----------------------------
-- 38. 员工操作日志表
-- ----------------------------
DROP TABLE IF EXISTS `bi_busi_employee_operate_log`;
CREATE TABLE `bi_busi_employee_operate_log` (
    `id` VARCHAR(36) NOT NULL COMMENT '日志ID',
    `store_id` VARCHAR(36) NOT NULL COMMENT '门店ID',
    `employee_id` VARCHAR(36) DEFAULT NULL COMMENT '员工ID',
    `employee_name` VARCHAR(100) DEFAULT NULL COMMENT '员工姓名',
    `module` VARCHAR(50) NOT NULL COMMENT '操作模块',
    `action` VARCHAR(50) NOT NULL COMMENT '操作动作',
    `target_type` VARCHAR(50) DEFAULT NULL COMMENT '操作对象类型',
    `target_id` VARCHAR(36) DEFAULT NULL COMMENT '操作对象ID',
    `target_name` VARCHAR(100) DEFAULT NULL COMMENT '操作对象名称',
    `content` TEXT DEFAULT NULL COMMENT '操作内容',
    `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
    `user_agent` VARCHAR(255) DEFAULT NULL COMMENT 'User-Agent',
    `status` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '状态：0-失败 1-成功',
    `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_employee_id` (`employee_id`),
    KEY `idx_module` (`module`),
    KEY `idx_action` (`action`),
    KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='员工操作日志表';

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认会员等级
INSERT INTO `bi_busi_member_level` (`id`, `store_id`, `name`, `code`, `color`, `discount_rate`, `points_multiplier`, `min_points`, `description`, `sort_order`, `status`) VALUES
('level_normal', 'store_1', '普通会员', 'normal', '#94a3b8', 100.00, 1.00, 0, '普通会员，无折扣优惠', 1, 1),
('level_silver', 'store_1', '银卡会员', 'silver', '#c0c0c0', 95.00, 1.20, 1000, '银卡会员，享受95折优惠', 2, 1),
('level_gold', 'store_1', '金卡会员', 'gold', '#ffd700', 90.00, 1.50, 5000, '金卡会员，享受9折优惠', 3, 1),
('level_diamond', 'store_1', '钻石会员', 'diamond', '#b9f2ff', 85.00, 2.00, 20000, '钻石会员，享受85折优惠', 4, 1);

-- 插入默认助教等级
INSERT INTO `bi_busi_assistant_level` (`id`, `store_id`, `name`, `code`, `color`, `hourly_rate`, `description`, `sort_order`, `status`) VALUES
('alevel_junior', 'store_1', '初级助教', 'junior', '#94a3b8', 50.00, '初级助教，适合初学者', 1, 1),
('alevel_intermediate', 'store_1', '中级助教', 'intermediate', '#3b82f6', 80.00, '中级助教，有一定教学经验', 2, 1),
('alevel_senior', 'store_1', '高级助教', 'senior', '#8b5cf6', 120.00, '高级助教，教学经验丰富', 3, 1),
('alevel_gold', 'store_1', '金牌助教', 'gold', '#f59e0b', 200.00, '金牌助教，专业级教学', 4, 1);

-- 插入默认套餐类型
INSERT INTO `bi_busi_package_type` (`id`, `store_id`, `name`, `code`, `color`, `description`, `sort_order`, `status`) VALUES
('ptype_time', 'store_1', '时长套餐', 'time', '#3b82f6', '按打球时长计费的套餐', 1, 1),
('ptype_product', 'store_1', '商品套餐', 'product', '#10b981', '包含商品组合的套餐', 2, 1),
('ptype_mixed', 'store_1', '混合套餐', 'mixed', '#8b5cf6', '时长+商品的混合套餐', 3, 1),
('ptype_member', 'store_1', '会员套餐', 'member', '#f59e0b', '会员专属优惠套餐', 4, 1);

-- 插入默认员工角色
INSERT INTO `bi_busi_employee_role` (`id`, `store_id`, `name`, `code`, `description`, `sort_order`, `status`) VALUES
('role_owner', 'store_1', '老板', 'owner', '拥有所有权限', 1, 1),
('role_manager', 'store_1', '店长', 'manager', '管理门店日常运营', 2, 1),
('role_cashier', 'store_1', '收银员', 'cashier', '负责收银结算', 3, 1),
('role_waiter', 'store_1', '服务员', 'waiter', '负责服务工作', 4, 1),
('role_assistant', 'store_1', '助教', 'assistant', '负责教学工作', 5, 1);

-- 插入权限菜单
INSERT INTO `bi_busi_permission` (`id`, `store_id`, `parent_id`, `name`, `code`, `uri`, `icon`, `sort_order`, `type`, `status`) VALUES
('perm_dashboard', 'store_1', NULL, '数据看板', 'dashboard', '/dashboard', 'LayoutDashboard', 1, 'menu', 1),
('perm_tables', 'store_1', NULL, '台桌管理', 'tables', '/tables', 'Table', 2, 'menu', 1),
('perm_tables_list', 'store_1', 'perm_tables', '台桌列表', 'tables.list', '/tables', '', 1, 'button', 1),
('perm_tables_add', 'store_1', 'perm_tables', '添加台桌', 'tables.add', '/tables/create', '', 2, 'button', 1),
('perm_tables_edit', 'store_1', 'perm_tables', '编辑台桌', 'tables.edit', '/tables/{id}/edit', '', 3, 'button', 1),
('perm_tables_delete', 'store_1', 'perm_tables', '删除台桌', 'tables.delete', '/tables/{id}', '', 4, 'button', 1),
('perm_pricing', 'store_1', NULL, '计费规则', 'pricing', '/pricing', 'Percent', 3, 'menu', 1),
('perm_orders', 'store_1', NULL, '订单管理', 'orders', '/orders', 'ShoppingCart', 4, 'menu', 1),
('perm_members', 'store_1', NULL, '会员管理', 'members', '/members', 'Users', 5, 'menu', 1),
('perm_employees', 'store_1', NULL, '员工管理', 'employees', '/employees', 'User', 6, 'menu', 1),
('perm_assistants', 'store_1', NULL, '助教管理', 'assistants', '/assistants', 'UserCheck', 7, 'menu', 1),
('perm_products', 'store_1', NULL, '商品管理', 'products', '/products', 'Package', 8, 'menu', 1),
('perm_inventory', 'store_1', NULL, '库存管理', 'inventory', '/inventory', 'PackageCheck', 9, 'menu', 1),
('perm_packages', 'store_1', NULL, '套餐管理', 'packages', '/packages', 'Gift', 10, 'menu', 1),
('perm_finance', 'store_1', NULL, '财务对账', 'finance', '/finance', 'Wallet', 11, 'menu', 1),
('perm_reports', 'store_1', NULL, '经营报表', 'reports', '/reports', 'BarChart3', 12, 'menu', 1),
('perm_settings', 'store_1', NULL, '系统设置', 'settings', '/settings', 'Settings', 13, 'menu', 1);

-- 插入角色权限关联数据（老板拥有所有权限）
INSERT INTO `bi_busi_role_permission` (`id`, `store_id`, `role_id`, `permission_id`) VALUES
('rp_1', 'store_1', 'role_owner', 'perm_dashboard'),
('rp_2', 'store_1', 'role_owner', 'perm_tables'),
('rp_3', 'store_1', 'role_owner', 'perm_tables_list'),
('rp_4', 'store_1', 'role_owner', 'perm_tables_add'),
('rp_5', 'store_1', 'role_owner', 'perm_tables_edit'),
('rp_6', 'store_1', 'role_owner', 'perm_tables_delete'),
('rp_7', 'store_1', 'role_owner', 'perm_pricing'),
('rp_8', 'store_1', 'role_owner', 'perm_orders'),
('rp_9', 'store_1', 'role_owner', 'perm_members'),
('rp_10', 'store_1', 'role_owner', 'perm_employees'),
('rp_11', 'store_1', 'role_owner', 'perm_assistants'),
('rp_12', 'store_1', 'role_owner', 'perm_products'),
('rp_13', 'store_1', 'role_owner', 'perm_inventory'),
('rp_14', 'store_1', 'role_owner', 'perm_packages'),
('rp_15', 'store_1', 'role_owner', 'perm_finance'),
('rp_16', 'store_1', 'role_owner', 'perm_reports'),
('rp_17', 'store_1', 'role_owner', 'perm_settings');

-- ============================================
-- 视图定义
-- ============================================

-- 营收日报视图
CREATE OR REPLACE VIEW `v_daily_revenue` AS
SELECT 
    DATE(created_at) as revenue_date,
    store_id,
    category,
    COUNT(*) as order_count,
    SUM(amount) as total_amount,
    SUM(CASE WHEN payment_method = 'wechat' THEN amount ELSE 0 END) as wechat_amount,
    SUM(CASE WHEN payment_method = 'alipay' THEN amount ELSE 0 END) as alipay_amount,
    SUM(CASE WHEN payment_method = 'cash' THEN amount ELSE 0 END) as cash_amount,
    SUM(CASE WHEN payment_method = 'balance' THEN amount ELSE 0 END) as balance_amount
FROM bi_busi_cash_flow
WHERE type = 'income' AND deleted_at IS NULL
GROUP BY DATE(created_at), store_id, category;

-- 台桌使用统计视图
CREATE OR REPLACE VIEW `v_table_usage_stats` AS
SELECT 
    t.id,
    t.store_id,
    t.number,
    t.name,
    t.type,
    t.status,
    z.name as zone_name,
    COUNT(o.id) as usage_count,
    SUM(COALESCE(o.duration_minutes, 0)) as total_minutes,
    SUM(o.final_amount) as total_amount
FROM bi_busi_table t
LEFT JOIN bi_busi_zone z ON t.zone_id = z.id
LEFT JOIN bi_busi_order o ON t.id = o.table_id AND o.status = 'completed'
WHERE t.deleted_at IS NULL
GROUP BY t.id, t.store_id, t.number, t.name, t.type, t.status, z.name;

-- 库存预警视图
CREATE OR REPLACE VIEW `v_stock_alert` AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.code,
    p.category_id,
    c.name as category_name,
    p.stock,
    p.min_stock,
    p.price,
    (p.stock - p.min_stock) as diff_stock
FROM bi_busi_product p
LEFT JOIN bi_busi_product_category c ON p.category_id = c.id
WHERE p.deleted_at IS NULL AND p.stock <= p.min_stock;

-- ============================================
-- 存储过程
-- ============================================



-- ============================================
-- 索引优化（针对查询性能的额外索引）
-- ============================================

-- 订单相关索引优化
CREATE INDEX `idx_order_date_status` ON `bi_busi_order`(`store_id`, `created_at`, `status`);
CREATE INDEX `idx_order_member_date` ON `bi_busi_order`(`member_id`, `created_at`);

-- 库存预警索引
CREATE INDEX `idx_product_stock_alert` ON `bi_busi_product`(`store_id`, `status`, `stock`);

-- 资金流水统计索引
CREATE INDEX `idx_cashflow_date_type` ON `bi_busi_cash_flow`(`store_id`, `created_at`, `type`);

-- 会员积分排行索引
CREATE INDEX `idx_member_points_rank` ON `bi_busi_member`(`store_id`, `points` DESC);

-- 助教业绩排行索引
CREATE INDEX `idx_assistant_amount_rank` ON `bi_busi_assistant`(`store_id`, `total_amount` DESC);