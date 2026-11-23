-- 添加员工门店关联字段
-- 日期: 2026-06-08

ALTER TABLE `bi_busi_employee`
ADD COLUMN `store_id` varchar(64) DEFAULT '' COMMENT '所属门店ID' AFTER `id_card`,
ADD INDEX `idx_store_id` (`store_id`);
