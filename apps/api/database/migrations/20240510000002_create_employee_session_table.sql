CREATE TABLE IF NOT EXISTS `bi_busi_employee_session` (
    `id` VARCHAR(36) PRIMARY KEY,
    `employee_id` VARCHAR(36) NOT NULL,
    `terminal` VARCHAR(50) NOT NULL DEFAULT 'pc',
    `token` VARCHAR(32) NOT NULL,
    `expire_time` INT NOT NULL,
    `update_time` INT NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_employee_id` (`employee_id`),
    INDEX `idx_token` (`token`),
    INDEX `idx_terminal` (`terminal`),
    INDEX `idx_expire_time` (`expire_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;