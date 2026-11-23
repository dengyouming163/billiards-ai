-- 台桌管理功能完整数据库脚本
-- 执行前请备份数据库

-- 1. 为台桌表添加 table_type_id 字段
ALTER TABLE `bi_busi_table`
ADD COLUMN `table_type_id` varchar(32) DEFAULT '' COMMENT '台型ID' AFTER `zone_id`,
ADD KEY `idx_table_type_id` (`table_type_id`);

-- 2. 为分区表添加 code 字段（如果不存在）
ALTER TABLE `bi_busi_zone`
ADD COLUMN `code` varchar(50) DEFAULT '' COMMENT '分区编码' AFTER `name`;

-- 3. 为分区表添加 deleted_at 字段（如果不存在）
ALTER TABLE `bi_busi_zone`
ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT '删除时间' AFTER `updated_at`,
ADD KEY `idx_deleted_at` (`deleted_at`);

-- 4. 为台型表添加 code 和 icon 字段（如果不存在）
ALTER TABLE `bi_busi_table_type`
ADD COLUMN `code` varchar(50) DEFAULT '' COMMENT '台型编码' AFTER `name`,
ADD COLUMN `icon` varchar(255) DEFAULT '' COMMENT '台型图标' AFTER `description`;

-- 5. 为台型表添加 deleted_at 字段（如果不存在）
ALTER TABLE `bi_busi_table_type`
ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT '删除时间' AFTER `updated_at`,
ADD KEY `idx_deleted_at` (`deleted_at`);