-- ============================================================
-- 初始化助教等级数据
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

USE `billiards`;

-- ============================================================
-- 初始化助教等级数据
-- ============================================================
INSERT INTO `bi_busi_assistant_level` (`id`, `store_id`, `name`, `code`, `color`, `hourly_rate`, `description`, `sort_order`, `status`) VALUES
('level_junior', 'default', '初级助教', 'junior', '#22c55e', 60.00, '新手教练，适合入门教学', 1, 1),
('level_intermediate', 'default', '中级助教', 'intermediate', '#3b82f6', 100.00, '进阶教练，擅长技术提升', 2, 1),
('level_senior', 'default', '高级助教', 'senior', '#8b5cf6', 150.00, '资深教练，可提供比赛指导', 3, 1),
('level_gold', 'default', '金牌助教', 'gold', '#f59e0b', 200.00, '明星教练，行业顶尖水平', 4, 1);

SET FOREIGN_KEY_CHECKS = 1;

SELECT '助教等级数据初始化完成' AS result;