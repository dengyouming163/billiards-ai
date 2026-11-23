-- =============================================
-- 补充移动端权限码到 bi_busi_permission 表
-- =============================================

-- 1. 新增 mobile:work（工作台 tab）
INSERT IGNORE INTO bi_busi_permission (id, store_id, parent_id, name, code, module, uri, icon, sort_order, type, status, created_at, updated_at)
VALUES ('perm_mobile_work', '__system__', '', '工作台', 'mobile:work', 'mobile', '', 'work', 50, 'menu', 1, NOW(), NOW());

-- 2. 补充 mobile:table 及其子权限（确保父记录存在后设置变量）
INSERT IGNORE INTO bi_busi_permission (id, store_id, parent_id, name, code, module, uri, icon, sort_order, type, status, created_at, updated_at)
VALUES ('perm_mobile_table', '__system__', '', '台桌管理', 'mobile:table', 'mobile', '', 'table', 40, 'menu', 1, NOW(), NOW());

SET @mobile_table_id = (SELECT id FROM bi_busi_permission WHERE code = 'mobile:table' AND (store_id = '__system__' OR store_id = '') LIMIT 1);

INSERT IGNORE INTO bi_busi_permission (id, store_id, parent_id, name, code, module, uri, icon, sort_order, type, status, created_at, updated_at) VALUES
('perm_mobile_table_open', '__system__', @mobile_table_id, '开台', 'mobile:table:open', 'mobile', '', '', 1, 'action', 1, NOW(), NOW()),
('perm_mobile_table_order', '__system__', @mobile_table_id, '点单', 'mobile:table:order', 'mobile', '', '', 2, 'action', 1, NOW(), NOW()),
('perm_mobile_table_assistant', '__system__', @mobile_table_id, '助教服务', 'mobile:table:assistant', 'mobile', '', '', 3, 'action', 1, NOW(), NOW()),
('perm_mobile_table_transfer', '__system__', @mobile_table_id, '换台并台', 'mobile:table:transfer', 'mobile', '', '', 4, 'action', 1, NOW(), NOW()),
('perm_mobile_table_member', '__system__', @mobile_table_id, '绑定会员', 'mobile:table:member', 'mobile', '', '', 5, 'action', 1, NOW(), NOW()),
('perm_mobile_table_checkout', '__system__', @mobile_table_id, '结账收银', 'mobile:table:checkout', 'mobile', '', '', 6, 'action', 1, NOW(), NOW()),
('perm_mobile_table_log', '__system__', @mobile_table_id, '操作日志', 'mobile:table:log', 'mobile', '', '', 7, 'action', 1, NOW(), NOW());

-- 3. 补充其他可能缺失的移动端权限
INSERT IGNORE INTO bi_busi_permission (id, store_id, parent_id, name, code, module, uri, icon, sort_order, type, status, created_at, updated_at) VALUES
('perm_mobile_dashboard', '__system__', '', '数据看板', 'mobile:dashboard', 'mobile', '', 'chart', 10, 'menu', 1, NOW(), NOW()),
('perm_mobile_orders', '__system__', '', '接单中心', 'mobile:orders', 'mobile', '', 'order', 20, 'menu', 1, NOW(), NOW()),
('perm_mobile_order', '__system__', '', '订单管理', 'mobile:order', 'mobile', '', 'order', 21, 'menu', 1, NOW(), NOW()),
('perm_mobile_report', '__system__', '', '经营报表', 'mobile:report', 'mobile', '', 'chart', 22, 'menu', 1, NOW(), NOW()),
('perm_mobile_checkin', '__system__', '', '打卡签到', 'mobile:checkin', 'mobile', '', 'location', 30, 'menu', 1, NOW(), NOW()),
('perm_mobile_apply', '__system__', '', '申请中心', 'mobile:apply', 'mobile', '', 'edit', 31, 'menu', 1, NOW(), NOW()),
('perm_mobile_approval', '__system__', '', '审批管理', 'mobile:approval', 'mobile', '', 'approval', 32, 'menu', 1, NOW(), NOW()),
('perm_mobile_employee', '__system__', '', '员工管理', 'mobile:employee', 'mobile', '', 'people', 33, 'menu', 1, NOW(), NOW()),
('perm_mobile_schedule', '__system__', '', '排班查询', 'mobile:schedule', 'mobile', '', 'calendar', 34, 'menu', 1, NOW(), NOW()),
('perm_mobile_performance', '__system__', '', '我的业绩', 'mobile:performance', 'mobile', '', 'stats', 35, 'menu', 1, NOW(), NOW()),
('perm_mobile_notification', '__system__', '', '通知中心', 'mobile:notification', 'mobile', '', 'bell', 60, 'menu', 1, NOW(), NOW()),
('perm_mobile_profile', '__system__', '', '个人资料', 'mobile:profile', 'mobile', '', 'user', 70, 'menu', 1, NOW(), NOW()),
('perm_mobile_settings', '__system__', '', '门店设置', 'mobile:settings', 'mobile', '', 'settings', 80, 'menu', 1, NOW(), NOW()),
('perm_mobile_assistant', '__system__', '', '助教宣传', 'mobile:assistant', 'mobile', '', 'star', 90, 'menu', 1, NOW(), NOW());
