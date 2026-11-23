-- ============================================================
-- 台球计分系统 - 计分板表和进球记录表
-- 日期：2026-05-15
-- 表名：bi_busi_score_board, bi_busi_sinking_record
-- ============================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- 创建计分板表
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_score_board`;
CREATE TABLE `bi_busi_score_board` (
  `id` VARCHAR(32) NOT NULL COMMENT '主键ID',
  `table_id` VARCHAR(32) NOT NULL COMMENT '桌台ID',
  `game_type` VARCHAR(32) NOT NULL COMMENT '玩法类型',
  `game_name` VARCHAR(64) NOT NULL COMMENT '玩法名称',
  `status` VARCHAR(16) NOT NULL DEFAULT 'waiting' COMMENT '状态: waiting/playing/ended',
  `players` JSON NOT NULL COMMENT '玩家信息',
  `current_player_index` INT(11) NOT NULL DEFAULT 0 COMMENT '当前玩家索引',
  `balls_remaining` JSON NOT NULL COMMENT '剩余球',
  `balls_sunk` JSON NOT NULL COMMENT '已进球',
  `scores` JSON NOT NULL COMMENT '分数',
  `target_score` INT(11) DEFAULT NULL COMMENT '目标分数',
  `winner` INT(11) DEFAULT NULL COMMENT '胜者索引',
  `created_at` DATETIME DEFAULT NULL COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT NULL COMMENT '更新时间',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`),
  KEY `idx_table_id` (`table_id`),
  KEY `idx_status` (`status`),
  KEY `idx_game_type` (`game_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='计分板表';

-- ============================================================
-- 创建进球记录表
-- ============================================================
DROP TABLE IF EXISTS `bi_busi_sinking_record`;
CREATE TABLE `bi_busi_sinking_record` (
  `id` VARCHAR(32) NOT NULL COMMENT '主键ID',
  `score_board_id` VARCHAR(32) NOT NULL COMMENT '计分板ID',
  `player_index` INT(11) NOT NULL COMMENT '玩家索引',
  `ball_id` VARCHAR(8) NOT NULL COMMENT '球ID',
  `points` INT(11) NOT NULL DEFAULT 0 COMMENT '分值',
  `round_number` INT(11) NOT NULL COMMENT '回合数',
  `created_at` DATETIME DEFAULT NULL COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_score_board_id` (`score_board_id`),
  KEY `idx_player_index` (`player_index`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='进球记录表';

SET FOREIGN_KEY_CHECKS = 1;

SELECT '计分板表和进球记录表创建完成' AS result;
