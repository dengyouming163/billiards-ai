ALTER TABLE `bi_busi_light_device`
  ADD COLUMN `bind_status` TINYINT(1) DEFAULT 0 COMMENT '绑定状态 0:未绑定 1:已绑定',
  ADD COLUMN `bound_at` DATETIME DEFAULT NULL COMMENT '绑定时间';

UPDATE `bi_busi_light_device` SET `bind_status` = 1 WHERE `store_id` != '' AND `store_id` IS NOT NULL;
