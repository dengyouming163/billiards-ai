-- ============================================================
-- 助教宣传表 - bi_busi_assistant_profile
-- ============================================================
DROP TABLE IF EXISTS bi_busi_assistant_profile;
CREATE TABLE bi_busi_assistant_profile (
  id VARCHAR(36) NOT NULL PRIMARY KEY COMMENT 'ID',
  employee_id VARCHAR(36) NOT NULL COMMENT '员工ID',
  store_id VARCHAR(36) NOT NULL COMMENT '门店ID',
  avatar VARCHAR(255) DEFAULT '' COMMENT '头像URL',
  nickname VARCHAR(50) DEFAULT '' COMMENT '昵称',
  signature VARCHAR(255) DEFAULT '' COMMENT '个人签名',
  tags JSON COMMENT '个人标签(JSON数组)',
  album JSON COMMENT '个人相册(JSON数组URL)',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  deleted_at DATETIME,
  UNIQUE KEY uk_employee_id (employee_id),
  INDEX idx_store_id (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教宣传表';

-- ============================================================
-- 助教服务表 - bi_busi_assistant_service
-- ============================================================
DROP TABLE IF EXISTS bi_busi_assistant_service;
CREATE TABLE bi_busi_assistant_service (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  employee_id VARCHAR(36) NOT NULL COMMENT '员工ID',
  store_id VARCHAR(36) NOT NULL COMMENT '门店ID',
  icon VARCHAR(50) DEFAULT '👨‍🏫' COMMENT '服务图标',
  name VARCHAR(100) NOT NULL COMMENT '服务名称',
  description VARCHAR(255) DEFAULT '' COMMENT '服务描述',
  price DECIMAL(10,2) NOT NULL COMMENT '价格',
  unit VARCHAR(20) DEFAULT '小时' COMMENT '计费单位',
  sort_order INT DEFAULT 0 COMMENT '排序',
  status TINYINT DEFAULT 1 COMMENT '状态 1-启用 0-禁用',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME,
  deleted_at DATETIME,
  INDEX idx_employee_id (employee_id),
  INDEX idx_store_id (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='助教服务项目表';
