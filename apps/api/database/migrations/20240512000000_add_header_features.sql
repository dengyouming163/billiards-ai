-- ============================================================
-- 头部功能新增表迁移脚本
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- ============================================================
-- 1. 创建消息通知表 bi_busi_notification
-- ============================================================
CREATE TABLE IF NOT EXISTS `bi_busi_notification` (
  `id` varchar(36) NOT NULL COMMENT '通知ID',
  `store_id` varchar(36) DEFAULT NULL COMMENT '门店ID',
  `user_id` varchar(36) DEFAULT NULL COMMENT '用户ID',
  `type` varchar(20) DEFAULT 'system' COMMENT '通知类型: system/order/finance/alert',
  `title` varchar(100) NOT NULL COMMENT '通知标题',
  `content` text COMMENT '通知内容',
  `is_read` tinyint(1) DEFAULT 0 COMMENT '是否已读: 0-未读 1-已读',
  `read_at` datetime DEFAULT NULL COMMENT '阅读时间',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_store_user` (`store_id`, `user_id`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息通知表';

-- ============================================================
-- 2. 创建帮助中心表 bi_busi_help
-- ============================================================
CREATE TABLE IF NOT EXISTS `bi_busi_help` (
  `id` varchar(36) NOT NULL COMMENT '帮助ID',
  `category` varchar(50) DEFAULT 'common' COMMENT '分类: common/order/finance/table/product',
  `title` varchar(200) NOT NULL COMMENT '问题标题',
  `content` text COMMENT '回答内容',
  `sort` int(11) DEFAULT 0 COMMENT '排序',
  `status` tinyint(1) DEFAULT 1 COMMENT '状态: 0-禁用 1-启用',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_category_status` (`category`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='帮助中心表';

-- ============================================================
-- 3. 插入默认帮助数据
-- ============================================================
INSERT INTO `bi_busi_help` (`id`, `category`, `title`, `content`, `sort`, `status`) VALUES
('help_001', 'common', '如何使用台球管理系统？', '台球管理系统是一款专为台球房设计的数字化管理工具。您可以通过系统管理台桌、订单、会员、员工等，实现智能化经营。', 1, 1),
('help_002', 'common', '如何新增台桌？', '进入"台球"页面，点击"新增台桌"按钮，填写台桌编号、类型等信息即可创建。', 2, 1),
('help_003', 'common', '如何处理订单？', '在"订单"页面可以查看所有订单，选中订单可以进行合并、拆分、结账等操作。', 3, 1),
('help_004', 'order', '如何创建新订单？', '在台球页面选中空闲台桌，点击"开台"即可创建新订单。系统会自动计费。', 1, 1),
('help_005', 'order', '如何进行订单结账？', '选中使用中的台桌，点击"结账"按钮，选择支付方式即可完成结账。', 2, 1),
('help_006', 'finance', '如何查看财务报表？', '进入"财务"页面可以查看资金流水，进入"报表"页面可以查看营收趋势和分析。', 1, 1),
('help_007', 'table', '台桌状态说明', '空闲：台桌可正常使用；使用中：已有顾客在使用；暂停：临时暂停计费；维修：台桌正在维护。', 1, 1),
('help_008', 'product', '如何管理商品库存？', '进入"商品"页面，可以新增、编辑商品。进入"库存"页面可以管理库存数量。', 1, 1);

-- ============================================================
-- 4. 插入测试通知数据
-- ============================================================
INSERT INTO `bi_busi_notification` (`id`, `store_id`, `user_id`, `type`, `title`, `content`, `is_read`, `created_at`) VALUES
('notif_001', 'store_001', 'user_001', 'system', '系统升级通知', '系统将于本周日凌晨2:00-4:00进行升级维护，请提前做好相关操作。', 0, NOW()),
('notif_002', 'store_001', 'user_001', 'order', '新订单提醒', '3号台桌已开台，请注意服务。', 0, NOW()),
('notif_003', 'store_001', 'user_001', 'finance', '日结提醒', '今日营收已达5000元，较昨日增长15%。', 1, NOW());

SET FOREIGN_KEY_CHECKS = 1;

SELECT '头部功能表创建完成' AS result;