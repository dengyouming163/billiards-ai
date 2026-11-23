-- 为 OrderItem 添加拒绝相关字段
ALTER TABLE `bi_busi_order_item`
ADD COLUMN `rejected_at` datetime DEFAULT NULL COMMENT '拒绝时间' AFTER `accepted_at`,
ADD COLUMN `reject_reason` varchar(500) DEFAULT '' COMMENT '拒绝原因' AFTER `rejected_at`;
