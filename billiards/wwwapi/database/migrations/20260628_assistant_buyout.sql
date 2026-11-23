-- 助教买断双模式：先付/后付
-- Date: 2026-06-28

ALTER TABLE bi_busi_order_item
  ADD COLUMN pay_mode VARCHAR(16) NOT NULL DEFAULT 'postpaid'
    COMMENT '支付模式: prepaid(先付) / postpaid(后付)',
  ADD COLUMN is_paid TINYINT(1) NOT NULL DEFAULT 0
    COMMENT '是否已支付: 0未付 / 1已付',
  ADD COLUMN paid_at DATETIME NULL
    COMMENT '支付时间（先付模式）',
  ADD INDEX idx_item_pay (order_id, assistant_id, pay_mode);

ALTER TABLE bi_busi_order_payment
  ADD COLUMN order_item_id VARCHAR(64) NULL
    COMMENT '关联 OrderItem，用于定位原支付记录',
  ADD UNIQUE KEY uk_order_item_pay (order_id, order_item_id);
