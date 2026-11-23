-- 微信支付全局配置表（平台服务商参数）
CREATE TABLE IF NOT EXISTS `bi_wechat_config` (
    `id` varchar(64) NOT NULL,
    `type` varchar(32) DEFAULT 'partner' COMMENT '配置类型: partner=服务商模式',
    `app_id` varchar(64) DEFAULT '' COMMENT '服务商AppID',
    `mch_id` varchar(64) DEFAULT '' COMMENT '服务商商户号',
    `api_v3_key` varchar(128) DEFAULT '' COMMENT 'APIv3密钥',
    `serial_no` varchar(64) DEFAULT '' COMMENT '证书序列号',
    `private_key` text COMMENT '商户API证书私钥',
    `cert_content` text COMMENT '平台证书内容',
    `cert_path` varchar(256) DEFAULT '' COMMENT '证书路径',
    `key_path` varchar(256) DEFAULT '' COMMENT '私钥路径',
    `platform_cert_path` varchar(256) DEFAULT '' COMMENT '平台证书路径',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='微信支付全局配置表';
