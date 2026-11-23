-- ============================================================
-- 更新员工密码为统一密码 111111（使用MD5加密，与现有系统兼容）
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- 更新所有员工密码为 111111（MD5加密）
UPDATE `bi_busi_employee` 
SET `password` = '96e79218965eb72c92a549dd5a330112' 
WHERE `password` = '' OR `password` IS NULL OR LENGTH(`password`) < 32;

-- 更新所有员工密码为 111111（针对明文密码或其他格式）
UPDATE `bi_busi_employee` 
SET `password` = '96e79218965eb72c92a549dd5a330112' 
WHERE `password` NOT REGEXP '^[a-f0-9]{32}$';

SET FOREIGN_KEY_CHECKS = 1;

SELECT '员工密码更新完成' AS result;