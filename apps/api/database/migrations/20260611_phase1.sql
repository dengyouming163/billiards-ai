ALTER TABLE bi_packages ADD COLUMN store_limit INT NOT NULL DEFAULT 3 COMMENT '门店数上限';
ALTER TABLE bi_packages ADD COLUMN table_limit INT NOT NULL DEFAULT 50 COMMENT '台桌数上限';
ALTER TABLE bi_merchants ADD COLUMN store_count INT NOT NULL DEFAULT 0 COMMENT '当前门店数';
ALTER TABLE bi_merchants ADD COLUMN admin_account VARCHAR(50) DEFAULT NULL COMMENT '商户管理员账号';
ALTER TABLE bi_merchants ADD COLUMN admin_password VARCHAR(100) DEFAULT NULL COMMENT '初始密码(md5)';
ALTER TABLE bi_wechat_config ADD COLUMN saas_enabled TINYINT(1) DEFAULT 1 COMMENT 'SaaS模式启用';
