-- Rollback: 助教买断双模式
-- Date: 2026-06-28

ALTER TABLE bi_busi_order_item
  DROP INDEX idx_item_pay,
  DROP COLUMN pay_mode,
  DROP COLUMN is_paid,
  DROP COLUMN paid_at;

ALTER TABLE bi_busi_order_payment
  DROP INDEX uk_order_item_pay,
  DROP COLUMN order_item_id;
