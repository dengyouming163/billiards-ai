CREATE TABLE IF NOT EXISTS `bi_sys_assistant_tag` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'ID',
  `name` VARCHAR(50) NOT NULL COMMENT '标签名称',
  `category` VARCHAR(50) DEFAULT '' COMMENT '标签分类',
  `sort_order` INT DEFAULT 0 COMMENT '排序',
  `status` TINYINT DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME,
  `deleted_at` DATETIME,
  INDEX idx_category (`category`),
  INDEX idx_status (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教预设标签表';

INSERT INTO `bi_sys_assistant_tag` (`id`, `name`, `category`, `sort_order`, `status`) VALUES
('tag-001', '专业教练', '技能', 1, 1),
('tag-002', '经验丰富', '经验', 2, 1),
('tag-003', '耐心教学', '风格', 3, 1),
('tag-004', '快速提升', '效果', 4, 1),
('tag-005', '一对一指导', '方式', 5, 1),
('tag-006', '零基础教学', '受众', 6, 1),
('tag-007', '比赛指导', '类型', 7, 1),
('tag-008', '杆法技巧', '技能', 8, 1),
('tag-009', '走位教学', '技能', 9, 1),
('tag-010', '心理素质', '能力', 10, 1),
('tag-011', '战术分析', '能力', 11, 1),
('tag-012', '灵活授课', '风格', 12, 1);