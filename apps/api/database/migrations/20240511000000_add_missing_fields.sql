-- ============================================================
-- 补充缺失字段迁移脚本
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- ============================================================
-- 1. 为 bi_busi_member_recharge 表添加 status 字段
-- ============================================================
DELIMITER //
DROP PROCEDURE IF EXISTS add_status_column //
CREATE PROCEDURE add_status_column()
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = 'billiards' 
        AND table_name = 'bi_busi_member_recharge' 
        AND column_name = 'status';
    
    IF col_exists = 0 THEN
        ALTER TABLE `bi_busi_member_recharge`
        ADD COLUMN `status` tinyint(1) NOT NULL DEFAULT 1 COMMENT '状态 1-正常 0-取消';
        SELECT 'Added status column to bi_busi_member_recharge' AS result;
    ELSE
        SELECT 'status column already exists in bi_busi_member_recharge' AS result;
    END IF;
END //
DELIMITER ;
CALL add_status_column();

-- ============================================================
-- 2. 为 bi_busi_order 表添加 member_name 字段
-- ============================================================
DELIMITER //
DROP PROCEDURE IF EXISTS add_member_name_column //
CREATE PROCEDURE add_member_name_column()
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = 'billiards' 
        AND table_name = 'bi_busi_order' 
        AND column_name = 'member_name';
    
    IF col_exists = 0 THEN
        ALTER TABLE `bi_busi_order`
        ADD COLUMN `member_name` varchar(50) DEFAULT '' COMMENT '会员姓名（冗余）';
        SELECT 'Added member_name column to bi_busi_order' AS result;
    ELSE
        SELECT 'member_name column already exists in bi_busi_order' AS result;
    END IF;
END //
DELIMITER ;
CALL add_member_name_column();

-- ============================================================
-- 3. 为 bi_busi_assistant 表添加 level_id 字段
-- ============================================================
DELIMITER //
DROP PROCEDURE IF EXISTS add_level_id_column //
CREATE PROCEDURE add_level_id_column()
BEGIN
    DECLARE col_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO col_exists 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE table_schema = 'billiards' 
        AND table_name = 'bi_busi_assistant' 
        AND column_name = 'level_id';
    
    IF col_exists = 0 THEN
        ALTER TABLE `bi_busi_assistant`
        ADD COLUMN `level_id` varchar(36) DEFAULT NULL COMMENT '等级ID';
        SELECT 'Added level_id column to bi_busi_assistant' AS result;
    ELSE
        SELECT 'level_id column already exists in bi_busi_assistant' AS result;
    END IF;
END //
DELIMITER ;
CALL add_level_id_column();

SET FOREIGN_KEY_CHECKS = 1;

SELECT '所有缺失字段添加完成' AS final_result;