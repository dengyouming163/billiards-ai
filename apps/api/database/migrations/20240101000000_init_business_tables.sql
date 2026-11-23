-- ============================================================
-- 多商户SaaS通用管理平台 - 完整数据库脚本
-- 适用行业：台球球房
-- 数据库：MySQL 8.0+
-- 字符集：utf8mb4
-- 表前缀：bi_
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 创建数据库（如果不存在）
CREATE DATABASE IF NOT EXISTS `billiards` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `billiards`;

-- ============================================================
-- 1. 系统角色表 - bi_system_role
-- ============================================================
DROP TABLE IF EXISTS `bi_system_role`;
CREATE TABLE `bi_system_role` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '角色名称',
  `describe` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '角色描述',
  `rules` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci COMMENT '权限节点',
  `create_time` int(10) NOT NULL COMMENT '创建时间',
  `update_time` int(10) NULL DEFAULT NULL COMMENT '修改时间',
  `delete_time` int(10) NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '角色表';

-- ============================================================
-- 2. 系统菜单表 - bi_system_menu
-- ============================================================
DROP TABLE IF EXISTS `bi_system_menu`;
CREATE TABLE `bi_system_menu` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `pid` int(11) UNSIGNED NOT NULL DEFAULT 0 COMMENT '父级菜单id',
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '菜单名称',
  `icon` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '菜单图标',
  `route` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '路由地址',
  `params` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '路由参数',
  `sort` int(11) NULL DEFAULT 0 COMMENT '排序',
  `is_show` tinyint(1) NULL DEFAULT 1 COMMENT '是否显示：0-不显示；1-显示；',
  `is_auth` tinyint(1) NULL DEFAULT 1 COMMENT '是否需要权限验证：0-不需要；1-需要；',
  `create_time` int(10) NOT NULL COMMENT '创建时间',
  `update_time` int(10) NULL DEFAULT NULL COMMENT '修改时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '菜单表';

-- 初始化菜单数据
INSERT INTO `bi_system_menu` (`id`, `pid`, `name`, `icon`, `route`, `params`, `sort`, `is_show`, `is_auth`, `create_time`, `update_time`) VALUES
(1, 0, '商户管理', 'Store', 'merchant', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(2, 1, '球房列表', '', 'merchant.list', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(3, 1, '入驻申请', '', 'merchant.apply', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(4, 0, '套餐管理', 'Package', 'package', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(5, 4, '套餐列表', '', 'package.list', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(6, 4, '计费规则', '', 'package.bill', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(7, 0, '工单管理', 'Ticket', 'ticket', '', 3, 1, 1, UNIX_TIMESTAMP(), NULL),
(8, 7, '工单列表', '', 'ticket.list', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(9, 7, '工单统计', '', 'ticket.statistics', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(10, 0, '公告管理', 'Announcement', 'announcement', '', 4, 1, 1, UNIX_TIMESTAMP(), NULL),
(11, 10, '公告列表', '', 'announcement.list', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(12, 0, '系统管理', 'Settings', 'system', '', 5, 1, 1, UNIX_TIMESTAMP(), NULL),
(13, 12, '账号管理', '', 'system.users', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(14, 12, '角色权限', '', 'system.roles', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(15, 12, '操作日志', '', 'system.logs', '', 3, 1, 1, UNIX_TIMESTAMP(), NULL),
(16, 0, '增值服务', 'Service', 'service', '', 6, 1, 1, UNIX_TIMESTAMP(), NULL),
(17, 16, '服务列表', '', 'service.list', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(18, 16, '服务订单', '', 'service.orders', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(19, 16, '收入统计', '', 'service.statistics', '', 3, 1, 1, UNIX_TIMESTAMP(), NULL),
(20, 0, '球房支持', 'Support', 'support', '', 7, 1, 1, UNIX_TIMESTAMP(), NULL),
(21, 20, '工单中心', '', 'support.tickets', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(22, 20, '帮助文档', '', 'support.help', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(23, 20, '公告管理', '', 'support.announcements', '', 3, 1, 1, UNIX_TIMESTAMP(), NULL),
(24, 0, '数据分析', 'Analytics', 'dashboard', '', 8, 1, 1, UNIX_TIMESTAMP(), NULL),
(25, 24, '数据概览', '', 'dashboard.overview', '', 1, 1, 1, UNIX_TIMESTAMP(), NULL),
(26, 24, '订单趋势', '', 'dashboard.orders', '', 2, 1, 1, UNIX_TIMESTAMP(), NULL),
(27, 24, 'GMV趋势', '', 'dashboard.gmv', '', 3, 1, 1, UNIX_TIMESTAMP(), NULL);

-- ============================================================
-- 3. 角色菜单关联表 - bi_system_role_menu
-- ============================================================
DROP TABLE IF EXISTS `bi_system_role_menu`;
CREATE TABLE `bi_system_role_menu` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `role_id` int(11) UNSIGNED NOT NULL COMMENT '角色id',
  `menu_id` int(11) UNSIGNED NOT NULL COMMENT '菜单id',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '角色菜单关联表';

-- ============================================================
-- 4. 管理员表 - bi_admin
-- ============================================================
DROP TABLE IF EXISTS `bi_admin`;
CREATE TABLE `bi_admin` (
  `id` int(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `root` tinyint(1) UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否超级管理员 0-否 1-是',
  `name` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '名称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '用户头像',
  `account` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '账号',
  `password` varchar(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '密码',
  `login_time` int(10) NULL DEFAULT NULL COMMENT '最后登录时间',
  `login_ip` varchar(39) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '最后登录ip',
  `multipoint_login` tinyint(1) UNSIGNED NULL DEFAULT 1 COMMENT '是否支持多处登录：1-是；0-否；',
  `disable` tinyint(1) UNSIGNED NULL DEFAULT 0 COMMENT '是否禁用：0-否；1-是；',
  `create_time` int(10) NOT NULL COMMENT '创建时间',
  `update_time` int(10) NULL DEFAULT NULL COMMENT '修改时间',
  `delete_time` int(10) NULL DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '管理员表';

-- ============================================================
-- 4. 管理员角色关联表 - bi_admin_role
-- ============================================================
DROP TABLE IF EXISTS `bi_admin_role`;
CREATE TABLE `bi_admin_role` (
  `admin_id` int(10) NOT NULL COMMENT '管理员id',
  `role_id` int(10) NOT NULL COMMENT '角色id',
  PRIMARY KEY (`admin_id`, `role_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '角色关联表';

-- ============================================================
-- 5. 管理员部门关联表 - bi_admin_dept
-- ============================================================
DROP TABLE IF EXISTS `bi_admin_dept`;
CREATE TABLE `bi_admin_dept` (
  `admin_id` int(10) NOT NULL DEFAULT 0 COMMENT '管理员id',
  `dept_id` int(10) NOT NULL DEFAULT 0 COMMENT '部门id',
  PRIMARY KEY (`admin_id`, `dept_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '部门关联表';

-- ============================================================
-- 6. 管理员岗位关联表 - bi_admin_jobs
-- ============================================================
DROP TABLE IF EXISTS `bi_admin_jobs`;
CREATE TABLE `bi_admin_jobs` (
  `admin_id` int(10) NOT NULL COMMENT '管理员id',
  `jobs_id` int(10) NOT NULL COMMENT '岗位id',
  PRIMARY KEY (`admin_id`, `jobs_id`) USING BTREE
) ENGINE = InnoDB CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '岗位关联表';

-- ============================================================
-- 7. 管理员会话表 - bi_admin_session
-- ============================================================
DROP TABLE IF EXISTS `bi_admin_session`;
CREATE TABLE `bi_admin_session` (
  `id`          INT(11) UNSIGNED NOT NULL AUTO_INCREMENT,
  `admin_id`    INT(11) UNSIGNED NOT NULL COMMENT '用户id',
  `terminal`    TINYINT(1) NOT NULL DEFAULT 1 COMMENT '客户端类型：1-pc管理后台 2-mobile手机管理后台',
  `token`       VARCHAR(32) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '令牌',
  `update_time` INT(10) NULL DEFAULT NULL COMMENT '更新时间',
  `expire_time` INT(10) NOT NULL COMMENT '到期时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_admin_id_terminal` (`admin_id`, `terminal`) USING BTREE COMMENT '一个用户在一个终端只有一个token',
  UNIQUE INDEX `uk_token` (`token`) USING BTREE COMMENT 'token是唯一的'
) ENGINE=InnoDB AUTO_INCREMENT=1 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='管理员会话表';

-- ============================================================
-- 4. 商户表 - bi_merchants
-- ============================================================
DROP TABLE IF EXISTS `bi_merchants`;
CREATE TABLE `bi_merchants` (
  `id`                    VARCHAR(36)  NOT NULL COMMENT '商户ID',
  `name`                  VARCHAR(200) NOT NULL COMMENT '球房名称',
  `business_license_no`   VARCHAR(50)           COMMENT '营业执照编号',
  `legal_person`          VARCHAR(50)           COMMENT '法人姓名',
  `legal_id_card`         VARCHAR(50)           COMMENT '法人身份证号',
  `legal_id_card_front`   TEXT                  COMMENT '身份证正面照URL',
  `legal_id_card_back`    TEXT                  COMMENT '身份证背面照URL',
  `business_license_url`  TEXT                  COMMENT '营业执照照片URL',
  `contact_name`          VARCHAR(50)           COMMENT '联系人姓名',
  `contact_phone`         VARCHAR(20)           COMMENT '联系人电话',
  `contact_email`         VARCHAR(100)          COMMENT '联系人邮箱',
  `address`               TEXT                  COMMENT '详细地址',
  `province`              VARCHAR(50)           COMMENT '省份',
  `city`                  VARCHAR(50)           COMMENT '城市',
  `district`              VARCHAR(50)           COMMENT '区县',
  `industry_category`     VARCHAR(50)  NOT NULL DEFAULT '台球' COMMENT '经营类型（固定：台球）',
  `table_count`           INT                   COMMENT '球桌数量',
  `package_id`            VARCHAR(36)           COMMENT '申请时选择的套餐ID',
  `status`                VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待审核, approved-已通过, rejected-已驳回, disabled-已禁用',
  `rejection_reason`      TEXT                  COMMENT '驳回原因',
  `approved_at`           DATETIME              COMMENT '审核通过时间',
  `approved_by`           VARCHAR(36)           COMMENT '审核人ID',
  `created_at`            DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`            DATETIME              COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户（球房）表';

-- ============================================================
-- 4. 合同表 - bi_contracts
-- ============================================================
DROP TABLE IF EXISTS `bi_contracts`;
CREATE TABLE `bi_contracts` (
  `id`          VARCHAR(36) NOT NULL COMMENT '合同ID',
  `merchant_id` VARCHAR(36) NOT NULL COMMENT '商户ID',
  `contract_no` VARCHAR(50)          COMMENT '合同编号',
  `start_date`  DATE                 COMMENT '合同开始日期',
  `end_date`    DATE                 COMMENT '合同结束日期',
  `file_url`    TEXT                 COMMENT '合同文件URL',
  `status`      VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态：active-生效中, expired-已过期, terminated-已终止',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_bi_contracts_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `bi_merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='合同表';

-- ============================================================
-- 5. 套餐表 - bi_packages
-- ============================================================
DROP TABLE IF EXISTS `bi_packages`;
CREATE TABLE `bi_packages` (
  `id`          VARCHAR(36)   NOT NULL COMMENT '套餐ID',
  `name`        VARCHAR(100)  NOT NULL COMMENT '套餐名称（基础版/标准版/高级版/旗舰版）',
  `description` TEXT                   COMMENT '套餐描述',
  `base_price`  DECIMAL(10,2) NOT NULL COMMENT '月费（元）',
  `store_range` VARCHAR(20)            COMMENT '球房数范围，如 "1-3"',
  `table_range` VARCHAR(20)            COMMENT '球桌数范围，如 "1-10"',
  `modules`     JSON                   COMMENT '包含功能模块，如 ["基础管理","预约系统","会员管理"]',
  `sort_order`  INT           NOT NULL DEFAULT 0 COMMENT '排序权重',
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'active' COMMENT '状态：active-上架, inactive-下架',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`  DATETIME               COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='套餐表';

-- ============================================================
-- 6. 商户套餐订阅表 - bi_merchant_packages
-- ============================================================
DROP TABLE IF EXISTS `bi_merchant_packages`;
CREATE TABLE `bi_merchant_packages` (
  `id`          VARCHAR(36) NOT NULL COMMENT '订阅ID',
  `merchant_id` VARCHAR(36) NOT NULL COMMENT '商户ID',
  `package_id`  VARCHAR(36) NOT NULL COMMENT '套餐ID',
  `start_date`  DATE        NOT NULL COMMENT '订阅开始日期',
  `end_date`    DATE        NOT NULL COMMENT '订阅结束日期',
  `status`      VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT '状态：active-生效中, expired-已过期, cancelled-已取消',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_package_id` (`package_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_bi_merchant_packages_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `bi_merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bi_merchant_packages_package` FOREIGN KEY (`package_id`) REFERENCES `bi_packages` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='商户套餐订阅表';

-- ============================================================
-- 7. 账单表 - bi_bills
-- ============================================================
DROP TABLE IF EXISTS `bi_bills`;
CREATE TABLE `bi_bills` (
  `id`          VARCHAR(36)   NOT NULL COMMENT '账单ID',
  `merchant_id` VARCHAR(36)   NOT NULL COMMENT '商户ID',
  `bill_no`     VARCHAR(50)   NOT NULL COMMENT '账单编号',
  `bill_period` VARCHAR(20)            COMMENT '账单周期，如 "2024-03"',
  `amount`      DECIMAL(10,2) NOT NULL COMMENT '账单总金额',
  `base_fee`    DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础套餐费',
  `overage_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '超量费用',
  `extra_fee`   DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '增值服务费',
  `status`      VARCHAR(20)   NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待支付, paid-已支付, overdue-已逾期, cancelled-已取消',
  `due_date`    DATE          NOT NULL COMMENT '到期日期',
  `paid_at`     DATETIME               COMMENT '支付时间',
  `created_at`  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_bill_no` (`bill_no`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_due_date` (`due_date`),
  CONSTRAINT `fk_bi_bills_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `bi_merchants` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='账单表';

-- ============================================================
-- 8. 分账规则表 - bi_split_rules
-- ============================================================
DROP TABLE IF EXISTS `bi_split_rules`;
CREATE TABLE `bi_split_rules` (
  `id`               VARCHAR(36)   NOT NULL COMMENT '规则ID',
  `name`             VARCHAR(100)  NOT NULL COMMENT '规则名称（球房服务/增值服务/广告收入）',
  `type`             VARCHAR(20)   NOT NULL COMMENT '类型：service-球房服务, value_added-增值服务, advertising-广告收入',
  `platform_rate`    DECIMAL(5,2)  NOT NULL COMMENT '平台抽成比例（%），如 15.00',
  `merchant_rate`    DECIMAL(5,2)  NOT NULL COMMENT '商户分成比例（%），如 85.00',
  `settlement_cycle` VARCHAR(20)   NOT NULL DEFAULT 'monthly' COMMENT '结算周期：monthly-月结, weekly-周结, daily-日结',
  `min_amount`       DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '最低结算金额（元）',
  `description`      TEXT                   COMMENT '费用明细说明',
  `status`           VARCHAR(20)   NOT NULL DEFAULT 'active' COMMENT '状态：active-生效中, inactive-已停用',
  `created_at`       DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`       DATETIME               COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分账规则表';

-- ============================================================
-- 9. 增值服务表 - bi_value_added_services
-- ============================================================
DROP TABLE IF EXISTS `bi_value_added_services`;
CREATE TABLE `bi_value_added_services` (
  `id`            VARCHAR(36)   NOT NULL COMMENT '服务ID',
  `name`          VARCHAR(100)  NOT NULL COMMENT '服务名称',
  `type`          VARCHAR(50)   NOT NULL COMMENT '服务类型：marketing-营销推广, data-数据分析, tech-技术支持, content-内容服务',
  `description`   TEXT                   COMMENT '服务描述',
  `unit`          VARCHAR(20)            COMMENT '计费单位：month-月, quarter-季, year-年, time-次',
  `unit_price`    DECIMAL(10,2) NOT NULL COMMENT '单价（元）',
  `merchant_count` INT          NOT NULL DEFAULT 0 COMMENT '已订购商户数',
  `total_revenue`  DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计收入',
  `status`        VARCHAR(20)   NOT NULL DEFAULT 'active' COMMENT '状态：active-上架, inactive-下架',
  `created_at`    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`    DATETIME               COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='增值服务表';

-- ============================================================
-- 10. 增值服务订单表 - bi_value_added_orders
-- ============================================================
DROP TABLE IF EXISTS `bi_value_added_orders`;
CREATE TABLE `bi_value_added_orders` (
  `id`           VARCHAR(36)   NOT NULL COMMENT '订单ID',
  `order_no`     VARCHAR(50)   NOT NULL COMMENT '订单编号',
  `merchant_id`  VARCHAR(36)   NOT NULL COMMENT '商户ID',
  `service_id`   VARCHAR(36)   NOT NULL COMMENT '服务ID',
  `quantity`     INT           NOT NULL DEFAULT 1 COMMENT '数量',
  `unit_price`   DECIMAL(10,2) NOT NULL COMMENT '单价',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '总金额',
  `status`       VARCHAR(20)   NOT NULL DEFAULT 'pending' COMMENT '状态：pending-待支付, paid-已支付, cancelled-已取消, refunded-已退款',
  `paid_at`      DATETIME               COMMENT '支付时间',
  `created_at`   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_order_no` (`order_no`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_service_id` (`service_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `fk_bi_vao_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `bi_merchants` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bi_vao_service` FOREIGN KEY (`service_id`) REFERENCES `bi_value_added_services` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='增值服务订单表';

-- ============================================================
-- 11. 工单表 - bi_tickets
-- ============================================================
DROP TABLE IF EXISTS `bi_tickets`;
CREATE TABLE `bi_tickets` (
  `id`             VARCHAR(36)  NOT NULL COMMENT '工单ID',
  `ticket_no`      VARCHAR(50)  NOT NULL COMMENT '工单编号',
  `merchant_id`    VARCHAR(36)           COMMENT '商户ID',
  `merchant_name`  VARCHAR(200)          COMMENT '商户名称（冗余）',
  `type`           VARCHAR(20)  NOT NULL DEFAULT 'consultation' COMMENT '类型：consultation-咨询, technical-技术, complaint-投诉, other-其他',
  `priority`       VARCHAR(20)  NOT NULL DEFAULT 'normal' COMMENT '优先级：low-低, normal-普通, high-高, urgent-紧急',
  `title`          VARCHAR(200) NOT NULL COMMENT '工单标题',
  `content`        TEXT                  COMMENT '工单内容',
  `attachments`    JSON                  COMMENT '附件列表',
  `status`         VARCHAR(20)  NOT NULL DEFAULT 'submitted' COMMENT '状态：submitted-已提交, accepted-已受理, processing-处理中, completed-已完成, closed-已关闭',
  `assigned_to`    VARCHAR(36)           COMMENT '处理人ID',
  `internal_notes` TEXT                  COMMENT '内部备注',
  `created_at`     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`     DATETIME              COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ticket_no` (`ticket_no`),
  KEY `idx_merchant_id` (`merchant_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_priority` (`priority`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_bi_tickets_merchant` FOREIGN KEY (`merchant_id`) REFERENCES `bi_merchants` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单表';

-- ============================================================
-- 12. 工单回复表 - bi_ticket_replies
-- ============================================================
DROP TABLE IF EXISTS `bi_ticket_replies`;
CREATE TABLE `bi_ticket_replies` (
  `id`          VARCHAR(36) NOT NULL COMMENT '回复ID',
  `ticket_id`   VARCHAR(36) NOT NULL COMMENT '工单ID',
  `sender_type` VARCHAR(20) NOT NULL COMMENT '发送者类型：admin-管理员, merchant-商户',
  `sender_id`   VARCHAR(36)          COMMENT '发送者ID',
  `sender_name` VARCHAR(50)          COMMENT '发送者姓名',
  `content`     TEXT        NOT NULL COMMENT '回复内容',
  `attachments` JSON                 COMMENT '附件列表',
  `created_at`  DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_ticket_id` (`ticket_id`),
  CONSTRAINT `fk_bi_ticket_replies_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `bi_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='工单回复表';

-- ============================================================
-- 13. 帮助文档表 - bi_help_articles
-- ============================================================
DROP TABLE IF EXISTS `bi_help_articles`;
CREATE TABLE `bi_help_articles` (
  `id`         VARCHAR(36)  NOT NULL COMMENT '文档ID',
  `title`      VARCHAR(200) NOT NULL COMMENT '文档标题',
  `category`   VARCHAR(50)  NOT NULL DEFAULT 'guide' COMMENT '分类：guide-入门指南, manual-操作手册, faq-常见问题',
  `content`    TEXT                  COMMENT '文档内容（支持富文本/Markdown）',
  `author`     VARCHAR(50)           COMMENT '作者',
  `view_count` INT          NOT NULL DEFAULT 0 COMMENT '阅读数',
  `status`     VARCHAR(20)  NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿, published-已发布',
  `sort_order` INT          NOT NULL DEFAULT 0 COMMENT '排序权重',
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME              COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category` (`category`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='帮助文档表';

-- ============================================================
-- 14. 公告表 - bi_announcements
-- ============================================================
DROP TABLE IF EXISTS `bi_announcements`;
CREATE TABLE `bi_announcements` (
  `id`                  VARCHAR(36)  NOT NULL COMMENT '公告ID',
  `title`               VARCHAR(200) NOT NULL COMMENT '公告标题',
  `type`                VARCHAR(20)  NOT NULL DEFAULT 'system' COMMENT '类型：system-系统通知, update-版本更新, activity-活动公告',
  `content`             TEXT                  COMMENT '公告内容',
  `target_scope`        VARCHAR(20)  NOT NULL DEFAULT 'all' COMMENT '发布范围：all-全平台, specified-指定商户',
  `target_merchant_ids` JSON                  COMMENT '指定商户ID列表（target_scope=specified时有效）',
  `publish_at`          DATETIME              COMMENT '定时发布时间',
  `status`              VARCHAR(20)  NOT NULL DEFAULT 'draft' COMMENT '状态：draft-草稿, published-已发布, revoked-已撤回',
  `created_at`          DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at`          DATETIME              COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='公告表';

-- ============================================================
-- 15. 文件表 - bi_file
-- ============================================================
DROP TABLE IF EXISTS `bi_file`;
CREATE TABLE `bi_file` (
  `id` varchar(36) NOT NULL COMMENT '文件ID',
  `cid` varchar(36) DEFAULT NULL COMMENT '关联ID',
  `type` tinyint(1) DEFAULT '1' COMMENT '文件类型 1-图片 2-视频 3-文件',
  `name` varchar(255) DEFAULT NULL COMMENT '文件名',
  `uri` varchar(500) DEFAULT NULL COMMENT '文件路径',
  `source` tinyint(1) DEFAULT '1' COMMENT '来源 1-后台 2-前端',
  `source_id` varchar(36) DEFAULT NULL COMMENT '来源ID',
  `create_time` int(11) DEFAULT NULL COMMENT '创建时间',
  `update_time` int(11) DEFAULT NULL COMMENT '更新时间',
  `delete_time` int(11) DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';

-- ============================================================
-- 16. 操作日志表 - bi_operation_log
-- ============================================================
DROP TABLE IF EXISTS `bi_operation_log`;
CREATE TABLE `bi_operation_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT 'id',
  `admin_id` int(11) NOT NULL COMMENT '管理员ID',
  `admin_name` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '管理员名称',
  `account` varchar(16) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '管理员账号',
  `action` varchar(64) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT '' COMMENT '操作名称',
  `type` varchar(8) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '请求方式',
  `url` varchar(600) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '访问链接',
  `params` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '请求数据',
  `result` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '请求结果',
  `ip` varchar(39) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT 'ip地址',
  `create_time` int(10) NULL DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统日志表';

-- ============================================================
-- 初始化数据
-- ============================================================

-- 系统角色
INSERT INTO `bi_system_role` (`id`, `name`, `describe`, `rules`, `create_time`) VALUES
(1, '超级管理员', '拥有所有权限', '', UNIX_TIMESTAMP()),
(2, '管理员', '拥有部分权限', '', UNIX_TIMESTAMP());

-- 默认管理员账号（密码：admin123，MD5加密）
INSERT INTO `bi_admin` (`id`, `root`, `name`, `avatar`, `account`, `password`, `multipoint_login`, `disable`, `create_time`) VALUES
(1, 1, '超级管理员', '', 'admin', '21232f297a57a5a743894a0e4a801fc3', 1, 0, UNIX_TIMESTAMP()),
(2, 0, '运营管理员', '', 'operator', '21232f297a57a5a743894a0e4a801fc3', 1, 0, UNIX_TIMESTAMP());

-- 管理员角色关联
INSERT INTO `bi_admin_role` (`admin_id`, `role_id`) VALUES
(1, 1),
(2, 2);

-- 套餐数据
INSERT INTO `bi_packages` (`id`, `name`, `description`, `base_price`, `store_range`, `table_range`, `modules`, `sort_order`, `status`) VALUES
('pkg-basic', '基础版', '适合小型球房，满足基础管理需求', 299.00, '1家', '1-5桌', '["基础管理","预约系统"]', 1, 'active'),
('pkg-standard', '标准版', '适合中型球房，功能更全面', 699.00, '1-3家', '1-15桌', '["基础管理","预约系统","会员管理","数据统计"]', 2, 'active'),
('pkg-premium', '高级版', '适合大型球房，高级功能赋能', 1299.00, '3-10家', '1-30桌', '["基础管理","预约系统","会员管理","数据统计","营销工具","财务分析"]', 3, 'active'),
('pkg-flagship', '旗舰版', '连锁球房首选，全部功能开放', 2499.00, '不限', '不限', '["基础管理","预约系统","会员管理","数据统计","营销工具","财务分析","API开放","专属客服"]', 4, 'active');

-- 分账规则
INSERT INTO `bi_split_rules` (`id`, `name`, `type`, `platform_rate`, `merchant_rate`, `settlement_cycle`, `min_amount`, `description`, `status`) VALUES
('split-service', '球房服务分账', 'service', 15.00, 85.00, 'monthly', 100.00, '平台抽成15%，商户分成85%，按月结算', 'active'),
('split-value-added', '增值服务分账', 'value_added', 20.00, 80.00, 'monthly', 50.00, '平台抽成20%，商户分成80%，按月结算', 'active'),
('split-advertising', '广告收入分账', 'advertising', 30.00, 70.00, 'monthly', 200.00, '平台抽成30%，商户分成70%，按月结算', 'active');

-- 增值服务数据
INSERT INTO `bi_value_added_services` (`id`, `name`, `type`, `description`, `unit`, `unit_price`, `merchant_count`, `total_revenue`, `status`) VALUES
('vas-ai-table', '智能排桌系统', 'tech', 'AI智能调度球桌，提升翻台率', 'month', 599.00, 0, 0.00, 'active'),
('vas-data-analysis', '经营数据分析', 'data', '多维度经营数据报表与洞察', 'month', 299.00, 0, 0.00, 'active'),
('vas-member-system', '会员储值系统', 'tech', '会员充值、积分、等级管理', 'month', 199.00, 0, 0.00, 'active'),
('vas-sms-notify', '短信通知', 'marketing', '预约提醒、营销推送', 'time', 0.10, 0, 0.00, 'active');

-- ============================================================
-- 16. 系统配置表 - bi_config
-- ============================================================
DROP TABLE IF EXISTS `bi_config`;
CREATE TABLE `bi_config` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '主键',
  `type` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '类型',
  `name` varchar(60) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT '' COMMENT '名称',
  `value` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '值',
  `create_time` int(10) NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` int(10) NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci COMMENT = '系统配置表';

-- 系统配置初始数据
INSERT INTO `bi_config` (`id`, `type`, `name`, `value`, `create_time`, `update_time`) VALUES
(1, 'admin_token', 'expire_duration', '86400', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(2, 'admin_token', 'be_expire_duration', '3600', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(3, 'project', 'name', 'VenueIQ', UNIX_TIMESTAMP(), UNIX_TIMESTAMP()),
(4, 'project', 'version', '1.0.0', UNIX_TIMESTAMP(), UNIX_TIMESTAMP());

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- 脚本执行完成
-- ============================================================
SELECT '数据库迁移脚本执行完成' AS result;