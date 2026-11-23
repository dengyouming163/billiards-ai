CREATE TABLE IF NOT EXISTS `bi_file` (
  `id` varchar(36) NOT NULL COMMENT '文件ID',
  `cid` varchar(36) DEFAULT NULL COMMENT '关联ID',
  `type` tinyint(1) DEFAULT '1' COMMENT '文件类型 1-图片 2-视频 3-文件',
  `name` varchar(255) DEFAULT NULL COMMENT '文件名',
  `uri` varchar(500) DEFAULT NULL COMMENT '文件路径',
  `source` tinyint(1) DEFAULT '1' COMMENT '来源 1-后台 2-前端',
  `source_id` varchar(36) DEFAULT NULL COMMENT '来源ID',
  `create_time` int(11) DEFAULT NULL COMMENT '创建时间',
  `update_time` int(11) DEFAULT NULL COMMENT '更新时间',
  `delete_time` int(11) DEFAULT NULL COMMENT '删除时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件表';