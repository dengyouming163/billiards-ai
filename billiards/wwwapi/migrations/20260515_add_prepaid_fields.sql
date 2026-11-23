ALTER TABLE bi_busi_order 
ADD COLUMN prepaid_hours INT DEFAULT 0,
ADD COLUMN remaining_minutes INT DEFAULT 0,
ADD COLUMN payment_status VARCHAR(20) DEFAULT 'unpaid',
ADD COLUMN prepaid_amount DECIMAL(10,2) DEFAULT 0.00;