-- 为台型表添加缺失的 code 和 icon 字段
ALTER TABLE `bi_busi_table_type`
ADD COLUMN `code` varchar(50) DEFAULT '' COMMENT '台型编码' AFTER `name`,
ADD COLUMN `icon` varchar(255) DEFAULT '' COMMENT '台型图标' AFTER `description`;

-- 为分区表添加缺失的 code 字段
ALTER TABLE `bi_busi_zone`
ADD COLUMN `code` varchar(50) DEFAULT '' COMMENT '分区编码' AFTER `name`;