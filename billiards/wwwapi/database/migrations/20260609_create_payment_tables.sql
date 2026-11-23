-- 支付记录表
-- 日期: 2026-06-09

CREATE TABLE IF NOT EXISTS `bi_payment_records` (
    `id` varchar(64) NOT NULL COMMENT '主键ID',
    `order_id` varchar(64) NOT NULL COMMENT '订单ID',
    `payment_id` varchar(128) NOT NULL COMMENT 'pay-hub支付ID',
    `client_id` varchar(64) DEFAULT 'pms-server' COMMENT 'pay-hub接入方ID',
    `request_id` varchar(128) NOT NULL COMMENT '请求幂等键',
    `channel` varchar(32) DEFAULT 'wechat' COMMENT '支付渠道',
    `amount` int NOT NULL DEFAULT 0 COMMENT '金额(分)',
    `status` varchar(20) DEFAULT 'pending' COMMENT '状态: pending/paid/refunded/failed',
    `pay_url` text COMMENT '支付链接/二维码URL',
    `channel_trade_no` varchar(128) DEFAULT '' COMMENT '渠道交易号',
    `paid_amount` int DEFAULT 0 COMMENT '已付金额(分)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_order` (`order_id`),
    UNIQUE KEY `uk_payment` (`payment_id`),
    KEY `idx_request` (`request_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- 微信特约商户进件表
CREATE TABLE IF NOT EXISTS `bi_wechat_applyment` (
    `id` varchar(64) NOT NULL COMMENT '主键ID',
    `store_id` varchar(64) NOT NULL COMMENT '门店ID',
    `applyment_id` varchar(64) DEFAULT '' COMMENT '微信返回的申请单号',
    `status` varchar(20) DEFAULT 'draft' COMMENT '状态: draft/submitted/auditing/approved/rejected',
    `business_info` json COMMENT '主体信息(加密存储)',
    `identity_info` json COMMENT '法人身份信息(加密)',
    `account_info` json COMMENT '结算账户信息(加密)',
    `contact_info` json COMMENT '联系信息',
    `sub_mch_id` varchar(64) DEFAULT '' COMMENT '审核通过后返回的子商户号',
    `reject_reason` text COMMENT '拒绝原因',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信特约商户进件表';
