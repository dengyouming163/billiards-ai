-- 意见反馈表
-- 创建时间: 2026-06-08
-- 说明: 存储移动端用户提交的意见反馈

CREATE TABLE IF NOT EXISTS `bi_feedback` (
    `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '主键',
    `employee_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '提交人ID',
    `store_id` int(11) unsigned NOT NULL DEFAULT 0 COMMENT '所属门店ID',
    `type` varchar(32) NOT NULL DEFAULT 'other' COMMENT '反馈类型: bug/feature/other',
    `content` text NOT NULL COMMENT '反馈内容',
    `contact` varchar(128) NOT NULL DEFAULT '' COMMENT '联系方式',
    `status` tinyint(1) NOT NULL DEFAULT 0 COMMENT '处理状态: 0-待处理 1-已处理 2-已关闭',
    `remark` varchar(512) NOT NULL DEFAULT '' COMMENT '处理备注',
    `create_time` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '创建时间',
    `update_time` int(10) unsigned NOT NULL DEFAULT 0 COMMENT '处理时间',
    PRIMARY KEY (`id`),
    KEY `idx_employee_id` (`employee_id`),
    KEY `idx_store_id` (`store_id`),
    KEY `idx_status` (`status`),
    KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='意见反馈表';
