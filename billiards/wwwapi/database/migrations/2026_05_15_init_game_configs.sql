-- ============================================================
-- 台球计分系统 - 游戏配置表
-- 日期：2026-05-15
-- 表名：bi_busi_game_config
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 创建游戏配置表
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_game_config`;
CREATE TABLE `bi_busi_game_config` (
  `id` VARCHAR(32) NOT NULL COMMENT '主键ID',
  `code` VARCHAR(32) NOT NULL COMMENT '玩法代码',
  `name` VARCHAR(64) NOT NULL COMMENT '玩法名称',
  `icon` VARCHAR(16) NOT NULL COMMENT '图标',
  `description` TEXT COMMENT '玩法简介',
  `ball_count` INT(11) NOT NULL DEFAULT 0 COMMENT '球数量',
  `ball_type` VARCHAR(16) NOT NULL COMMENT '球类型: mixed/numbered/colored/simple',
  `scoring_type` VARCHAR(16) NOT NULL COMMENT '计分类型: win_only/simple/cumulative/special',
  `target_score` INT(11) DEFAULT NULL COMMENT '目标分数',
  `default_player_count` INT(11) NOT NULL DEFAULT 2 COMMENT '默认玩家数量',
  `sort_order` INT(11) NOT NULL DEFAULT 0 COMMENT '排序',
  `status` TINYINT(4) NOT NULL DEFAULT 1 COMMENT '状态: 1启用 0禁用',
  `created_at` DATETIME DEFAULT NULL COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_code` (`code`),
  KEY `idx_status` (`status`),
  KEY `idx_sort_order` (`sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='游戏配置表';

-- ============================================================
-- 初始化游戏配置数据（10种玩法）
-- ============================================================
INSERT INTO `bi_busi_game_config` (`id`, `code`, `name`, `icon`, `description`, `ball_count`, `ball_type`, `scoring_type`, `target_score`, `default_player_count`, `sort_order`, `status`, `created_at`, `updated_at`) VALUES
('gc_001', 'eight_ball', '中式八球', '🎱', '中国最流行的台球玩法，规则简单易上手，深受广大台球爱好者喜爱。定色后打完己方7颗球，再打进8号球即可获胜。', 16, 'mixed', 'win_only', NULL, 2, 1, 1, NOW(), NOW()),
('gc_002', 'nine_ball', '美式九球', '🔴', '美国流行的台球玩法，必须先碰到最小号码的球，先打进9号球者获胜。规则简单，节奏快。', 9, 'numbered', 'win_only', NULL, 2, 2, 1, NOW(), NOW()),
('gc_003', 'snooker', '斯诺克', '🟢', '世界流行的台球项目，红球+彩球循环计分。红球1分，彩球2-7分，总分高者获胜。', 22, 'colored', 'simple', NULL, 2, 3, 1, NOW(), NOW()),
('gc_004', 'carom', '开仑台球', '⚪', '经典的无袋台球玩法，一杆碰两球得分。先达到目标分（默认40分）者获胜。', 3, 'simple', 'simple', 40, 2, 4, 1, NOW(), NOW()),
('gc_005', 'straight_pool', '14-1直池', '🎯', '经典台球玩法，每进一球得1分。先达到目标分（默认100分）者获胜。', 15, 'numbered', 'cumulative', 100, 2, 5, 1, NOW(), NOW()),
('gc_006', 'ten_ball', '美式10球', '🔢', '类似九球，但必须指球定袋。先打进10号球者获胜。', 10, 'numbered', 'win_only', NULL, 2, 6, 1, NOW(), NOW()),
('gc_007', 'chasing', '追分', '🏆', '多人趣味玩法，采用大金/小金/普胜的结算方式。总分最高者获胜。', 9, 'numbered', 'special', NULL, 3, 7, 1, NOW(), NOW()),
('gc_008', 'draw_lots', '摸牌/挂杆', '🎴', '趣味玩法，抽取扑克牌对应球号。完成手牌对应球即获胜。', 15, 'numbered', 'special', NULL, 2, 8, 1, NOW(), NOW()),
('gc_009', 'shootout', '打枪', '🎯', '点球大战，固定目标球位置轮流击打。先达到目标分（默认3分）者获胜。', 1, 'simple', 'win_only', 3, 2, 9, 1, NOW(), NOW()),
('gc_010', 'rolling_score', '摇分', '🎲', '进球号码即分数，打进15号球得15分。累积分值高者获胜。', 15, 'numbered', 'simple', NULL, 2, 10, 1, NOW(), NOW());

SET FOREIGN_KEY_CHECKS = 1;

SELECT '游戏配置数据初始化完成 - 共10种玩法' AS result;
