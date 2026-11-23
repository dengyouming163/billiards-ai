-- www/wwwapi/database/migrations/20260625_v1_0_iteration_rollback.sql
-- Rollback for V1.0 Migration

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `bi_busi_order_pause_log`;
DROP TABLE IF EXISTS `bi_busi_checkin_photo`;
DROP TABLE IF EXISTS `bi_busi_discount_config`;
DROP TABLE IF EXISTS `bi_busi_channel_verify_record`;

-- ============================================================
-- Idempotency helper: drop a column only if it exists
-- ============================================================
DROP PROCEDURE IF EXISTS drop_column_if_exists;
DELIMITER //
CREATE PROCEDURE drop_column_if_exists(
    IN tbl_name VARCHAR(128),
    IN col_name VARCHAR(128)
)
BEGIN
    IF EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = tbl_name
        AND COLUMN_NAME = col_name
    ) THEN
        SET @sql = CONCAT('ALTER TABLE `', tbl_name, '` DROP COLUMN `', col_name, '`');
        PREPARE stmt FROM @sql;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END IF;
END//
DELIMITER ;

-- bi_busi_order: drop 5 added columns (discount_amount NOT included — it is a native column)
CALL drop_column_if_exists('bi_busi_order', 'order_type');
CALL drop_column_if_exists('bi_busi_order', 'table_paused_at');
CALL drop_column_if_exists('bi_busi_order', 'assistant_paused_at');
CALL drop_column_if_exists('bi_busi_order', 'discount_type');
CALL drop_column_if_exists('bi_busi_order', 'discount_value');

-- bi_busi_commission_config: drop 5 added columns (base_salary_amount NOT included — existing base_salary is reused)
CALL drop_column_if_exists('bi_busi_commission_config', 'commission_mode');
CALL drop_column_if_exists('bi_busi_commission_config', 'guarantee_hours');
CALL drop_column_if_exists('bi_busi_commission_config', 'guarantee_amount');
CALL drop_column_if_exists('bi_busi_commission_config', 'settlement_period');
CALL drop_column_if_exists('bi_busi_commission_config', 'effective_date');

-- bi_busi_employee_attendance: drop 2 added columns
CALL drop_column_if_exists('bi_busi_employee_attendance', 'employee_type');
CALL drop_column_if_exists('bi_busi_employee_attendance', 'has_photos');

-- bi_busi_order_payment: drop 1 added column
CALL drop_column_if_exists('bi_busi_order_payment', 'channel');

DROP PROCEDURE IF EXISTS drop_column_if_exists;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'V1.0 iteration rollback complete' AS result;
