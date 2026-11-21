-- Non-PII analysis views for the open-ended read-only SQL agent.
-- Only these views are granted to bi_agent_ro; base tables stay inaccessible.
CREATE OR REPLACE SQL SECURITY DEFINER VIEW agent_order_analysis AS
SELECT store_id, id AS order_id, order_no, status, operator_id,
       table_fee, product_fee, assistant_fee, discount_amount, final_amount,
       balance_paid, cash_paid, wechat_paid, alipay_paid, card_paid,
       merged_to_order_id, start_time, end_time, created_at
FROM bi_busi_order WHERE deleted_at IS NULL;

CREATE OR REPLACE SQL SECURITY DEFINER VIEW agent_recharge_analysis AS
SELECT store_id, id AS recharge_id, amount, gift_amount,
       payment_method, status, operator_id, created_at
FROM bi_busi_member_recharge;

CREATE OR REPLACE SQL SECURITY DEFINER VIEW agent_shift_analysis AS
SELECT store_id, id AS shift_id, employee_id, work_date, status,
       check_in_time, check_out_time, total_revenue, order_count,
       cash_paid, wechat_paid, balance_paid, table_revenue,
       product_revenue, assistant_revenue, open_table_count, recharge_total
FROM bi_busi_employee_attendance;

GRANT SELECT ON billiards_test.agent_order_analysis TO 'bi_agent_ro'@'%';
GRANT SELECT ON billiards_test.agent_recharge_analysis TO 'bi_agent_ro'@'%';
GRANT SELECT ON billiards_test.agent_shift_analysis TO 'bi_agent_ro'@'%';
