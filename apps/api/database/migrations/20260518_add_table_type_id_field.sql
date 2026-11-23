-- 为台桌表添加 table_type_id 字段
ALTER TABLE `bi_busi_table`
ADD COLUMN `table_type_id` varchar(32) DEFAULT '' COMMENT '台型ID' AFTER `zone_id`,
ADD KEY `idx_table_type_id` (`table_type_id`);