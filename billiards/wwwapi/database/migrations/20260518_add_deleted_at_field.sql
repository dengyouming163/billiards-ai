-- 为分区表添加缺失的 deleted_at 字段
ALTER TABLE `bi_busi_zone`
ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT '删除时间' AFTER `updated_at`,
ADD KEY `idx_deleted_at` (`deleted_at`);

-- 为台型表添加缺失的 deleted_at 字段
ALTER TABLE `bi_busi_table_type`
ADD COLUMN `deleted_at` datetime DEFAULT NULL COMMENT '删除时间' AFTER `updated_at`,
ADD KEY `idx_deleted_at` (`deleted_at`);