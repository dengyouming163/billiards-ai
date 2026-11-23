-- 微信特约商户进件表（修正版）
-- 日期: 2026-06-18
-- 说明: 重建表结构使列名与 WeChat API 字段和 Logic 代码 1:1 对齐

DROP TABLE IF EXISTS `bi_wechat_applyment`;
CREATE TABLE `bi_wechat_applyment` (
    `id` varchar(64) NOT NULL COMMENT '主键ID',
    `store_id` varchar(64) NOT NULL COMMENT '门店ID',
    `business_code` varchar(128) NOT NULL COMMENT '业务申请编号(幂等)',
    `applyment_id` varchar(64) DEFAULT '' COMMENT '微信返回的申请单号',
    `applyment_state` varchar(64) NOT NULL DEFAULT 'APPLYMENT_STATE_EDITTING' COMMENT '进件状态',
    `applyment_state_msg` varchar(255) DEFAULT '' COMMENT '状态中文描述',
    `sub_mchid` varchar(64) DEFAULT '' COMMENT '特约商户号(审核通过后返回)',
    `sub_mchname` varchar(255) DEFAULT '' COMMENT '商户名称',
    `sign_url` text COMMENT '签约链接',
    `audit_detail` json COMMENT '驳回原因明细',
    `request_data` json COMMENT '提交的原始数据(驳回后可复填)',
    `related_applyment_id` varchar(64) DEFAULT NULL COMMENT '关联的上次申请ID(驳回重提链路)',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    PRIMARY KEY (`id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_business_code` (`business_code`),
    KEY `idx_applyment_id` (`applyment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信特约商户进件表';
