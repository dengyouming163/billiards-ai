-- www/wwwapi/database/migrations/20260625_v1_0_iteration.sql
-- V1.0 Migration: 4 new tables + 4 altered tables

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- 1. Order Pause Log Table
CREATE TABLE IF NOT EXISTS `bi_busi_order_pause_log` (
  `id` varchar(64) NOT NULL COMMENT 'Primary Key UUID',
  `store_id` varchar(64) NOT NULL COMMENT 'Store ID',
  `order_id` varchar(64) NOT NULL COMMENT 'Order ID',
  `pause_type` varchar(16) NOT NULL COMMENT 'Pause type: table/assistant',
  `start_time` datetime NOT NULL COMMENT 'Segment actual start time',
  `end_time` datetime NOT NULL COMMENT 'Segment actual end time',
  `duration_seconds` int NOT NULL DEFAULT 0 COMMENT 'Segment duration in seconds',
  `fee` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Segment calculated fee',
  `rate_coefficient` decimal(5,2) NOT NULL DEFAULT 1.00 COMMENT 'Time period coefficient snapshot',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_pause_type` (`pause_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Order pause billing log';

-- 2. Checkin Photo Table
CREATE TABLE IF NOT EXISTS `bi_busi_checkin_photo` (
  `id` varchar(64) NOT NULL COMMENT 'Primary Key UUID',
  `attendance_id` varchar(64) NOT NULL COMMENT 'Attendance record ID',
  `employee_id` varchar(64) NOT NULL COMMENT 'Employee/Assistant ID',
  `photo_url` varchar(500) NOT NULL COMMENT 'Photo URL',
  `sort_order` tinyint NOT NULL DEFAULT 1 COMMENT 'Sort order (1-5)',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_attendance_id` (`attendance_id`),
  KEY `idx_employee_id` (`employee_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Check-in photo table';

-- 3. Discount Config Table
CREATE TABLE IF NOT EXISTS `bi_busi_discount_config` (
  `id` varchar(64) NOT NULL COMMENT 'Primary Key UUID',
  `store_id` varchar(64) NOT NULL COMMENT 'Store ID',
  `discount_name` varchar(64) NOT NULL COMMENT 'Discount name',
  `discount_type` varchar(16) NOT NULL COMMENT 'Discount type: rate/amount',
  `discount_value` decimal(10,2) NOT NULL COMMENT 'Discount value (90=10% off for rate, or fixed amount)',
  `rounding_mode` varchar(16) NOT NULL DEFAULT 'yuan' COMMENT 'Rounding: none/yuan/jiao/half_yuan',
  `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1=enabled/0=disabled',
  `sort_order` int NOT NULL DEFAULT 0 COMMENT 'Display order',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Discount config table';

-- 4. Channel Verify Record Table
CREATE TABLE IF NOT EXISTS `bi_busi_channel_verify_record` (
  `id` varchar(64) NOT NULL COMMENT 'Primary Key UUID',
  `store_id` varchar(64) NOT NULL COMMENT 'Store ID',
  `order_id` varchar(64) NOT NULL COMMENT 'Order ID',
  `channel` varchar(32) NOT NULL COMMENT 'Channel: meituan/douyin/coupon',
  `verify_code` varchar(64) NOT NULL COMMENT 'Coupon code',
  `verify_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'Verification amount',
  `status` varchar(16) NOT NULL DEFAULT 'success' COMMENT 'success/failed',
  `remark` varchar(255) DEFAULT NULL COMMENT 'Remark',
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_store_id` (`store_id`),
  KEY `idx_channel` (`channel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Channel coupon verification records';

-- ============================================================
-- Idempotency helper: add a column only if it does not exist
-- ============================================================
DROP PROCEDURE IF EXISTS add_column_if_not_exists;
DELIMITER //
CREATE PROCEDURE add_column_if_not_exists(
    IN tbl_name VARCHAR(128),
    IN col_name VARCHAR(128),
    IN col_definition VARCHAR(1024)
)
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tbl_name
        AND COLUMN_NAME = col_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl_name, '` ADD COLUMN `', col_name, '` ', col_definition);
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//
DELIMITER ;

-- 5. Alter bi_busi_order — add 5 columns
-- NOTE: discount_amount already exists in the original bi_busi_order schema;
--       discount_type and discount_value are the new discount-config-reference columns.
CALL add_column_if_not_exists('bi_busi_order', 'order_type', "varchar(16) NOT NULL DEFAULT 'normal' COMMENT 'Order type: normal/temp_cleaning/temp_free'");
CALL add_column_if_not_exists('bi_busi_order', 'table_paused_at', "datetime DEFAULT NULL COMMENT 'Table fee pause start time'");
CALL add_column_if_not_exists('bi_busi_order', 'assistant_paused_at', "datetime DEFAULT NULL COMMENT 'Assistant fee pause start time'");
CALL add_column_if_not_exists('bi_busi_order', 'discount_type', "varchar(16) DEFAULT NULL COMMENT 'Discount type: rate/amount'");
CALL add_column_if_not_exists('bi_busi_order', 'discount_value', "decimal(10,2) DEFAULT NULL COMMENT 'Discount value'");

-- 6. Alter bi_busi_commission_config — add 5 columns
-- NOTE: base_salary column already exists from 20260525000000_create_commission_tables.sql
--       (originally for legacy commission_type='mixed'). It is reused for the new
--       commission_mode='base_salary' instead of adding a duplicate base_salary_amount column.
CALL add_column_if_not_exists('bi_busi_commission_config', 'commission_mode', "varchar(16) NOT NULL DEFAULT 'no_guarantee' COMMENT 'Commission mode: no_guarantee/with_guarantee/base_salary'");
CALL add_column_if_not_exists('bi_busi_commission_config', 'guarantee_hours', "decimal(10,2) DEFAULT NULL COMMENT 'Guarantee hours threshold'");
CALL add_column_if_not_exists('bi_busi_commission_config', 'guarantee_amount', "decimal(10,2) DEFAULT NULL COMMENT 'Guarantee amount (yuan)'");
CALL add_column_if_not_exists('bi_busi_commission_config', 'settlement_period', "varchar(16) NOT NULL DEFAULT 'monthly' COMMENT 'Settlement period'");
CALL add_column_if_not_exists('bi_busi_commission_config', 'effective_date', "date DEFAULT NULL COMMENT 'Effective date'");

-- 7. Alter bi_busi_employee_attendance — add 2 columns
CALL add_column_if_not_exists('bi_busi_employee_attendance', 'employee_type', "varchar(16) NOT NULL DEFAULT 'employee' COMMENT 'employee/assistant'");
CALL add_column_if_not_exists('bi_busi_employee_attendance', 'has_photos', "tinyint(1) NOT NULL DEFAULT 0 COMMENT 'Has check-in photos flag'");

-- 8. Alter bi_busi_order_payment — add 1 column
CALL add_column_if_not_exists('bi_busi_order_payment', 'channel', "varchar(32) NOT NULL DEFAULT 'cash' COMMENT 'Payment channel: cash/wechat/member_balance/meituan/douyin/coupon'");

DROP PROCEDURE IF EXISTS add_column_if_not_exists;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'V1.0 iteration migration complete' AS result;
