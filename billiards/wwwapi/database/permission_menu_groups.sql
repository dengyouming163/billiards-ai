-- =============================================
-- 权限菜单分组：创建父菜单记录，建立2级树形结构
-- 执行：mysql -u billiards -p billiards < database/permission_menu_groups.sql
-- =============================================

-- ====================
-- PC 端父菜单
-- ====================

INSERT IGNORE INTO bi_busi_permission (id, store_id, parent_id, name, code, module, type, status, sort_order, created_at, updated_at) VALUES
('perm_pc_menu_dashboard', '__system__', '', '数据看板', 'pc:menu:dashboard', 'pc', 'menu', 1, 1, NOW(), NOW()),
('perm_pc_menu_employee',  '__system__', '', '员工管理', 'pc:menu:employee',  'pc', 'menu', 1, 2, NOW(), NOW()),
('perm_pc_menu_member',    '__system__', '', '会员管理', 'pc:menu:member',    'pc', 'menu', 1, 3, NOW(), NOW()),
('perm_pc_menu_order',     '__system__', '', '订单管理', 'pc:menu:order',     'pc', 'menu', 1, 4, NOW(), NOW()),
('perm_pc_menu_finance',   '__system__', '', '财务管理', 'pc:menu:finance',   'pc', 'menu', 1, 5, NOW(), NOW()),
('perm_pc_menu_table',     '__system__', '', '台桌配置', 'pc:menu:table',     'pc', 'menu', 1, 6, NOW(), NOW()),
('perm_pc_menu_product',   '__system__', '', '商品库存', 'pc:menu:product',   'pc', 'menu', 1, 7, NOW(), NOW()),
('perm_pc_menu_settings',  '__system__', '', '系统设置', 'pc:menu:settings',  'pc', 'menu', 1, 8, NOW(), NOW()),
('perm_pc_menu_report',    '__system__', '', '经营报表', 'pc:menu:report',    'pc', 'menu', 1, 9, NOW(), NOW()),
('perm_pc_menu_common',    '__system__', '', '通用',     'pc:menu:common',    'pc', 'menu', 1, 10, NOW(), NOW());

-- PC 子权限 → 父菜单
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_dashboard' WHERE code IN ('dashboard');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_employee'  WHERE code IN ('employees', 'employee:list', 'employee:role', 'employee:schedule', 'employee:attendance', 'employee:store', 'employee:approval', 'assistants', 'assistant:list');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_member'    WHERE code IN ('members', 'member:list', 'member:tier');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_order'     WHERE code IN ('orders', 'order:list', 'order:table');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_finance'   WHERE code IN ('finance', 'finance:cashflow', 'finance:revenue');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_table'     WHERE code IN ('tables', 'tables.list', 'tables.add', 'tables.edit', 'tables.delete');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_product'   WHERE code IN ('products', 'inventory', 'packages');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_settings'  WHERE code IN ('settings', 'settings:table', 'settings:product', 'settings:store', 'settings:card', 'settings:receipt', 'pricing', 'pricing:rule');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_report'    WHERE code IN ('reports', 'report:list');
UPDATE bi_busi_permission SET parent_id = 'perm_pc_menu_common'    WHERE code IN ('overview', 'cashier:pos');

-- ====================
-- Mobile 端父菜单
-- ====================

-- mobile:table 已有父记录 (perm_mobile_table) 和子权限，保持不变

INSERT IGNORE INTO bi_busi_permission (id, store_id, parent_id, name, code, module, type, status, sort_order, created_at, updated_at) VALUES
('perm_mobile_menu_attendance', '__system__', '', '考勤管理', 'mobile:menu:attendance', 'mobile', 'menu', 1, 31, NOW(), NOW());

-- Mobile 考勤子权限
UPDATE bi_busi_permission SET parent_id = 'perm_mobile_menu_attendance' WHERE code IN ('mobile:checkin', 'mobile:apply', 'mobile:schedule');

-- Mobile 其他权限保持独立（无 parent_id），作为一级菜单展示

SELECT 'Menu groups created successfully' AS result;
