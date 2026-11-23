ALTER TABLE `bi_busi_order_item`
  ADD COLUMN `started_at` datetime DEFAULT NULL COMMENT '服务开始时间（助教模式）' AFTER `final_price`,
  ADD COLUMN `ended_at` datetime DEFAULT NULL COMMENT '服务结束时间（助教模式）' AFTER `started_at`,
  ADD COLUMN `actual_quantity` decimal(10,2) DEFAULT NULL COMMENT '实际服务时长（小时，助教模式）' AFTER `ended_at`;
