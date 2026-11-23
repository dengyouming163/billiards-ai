-- =============================================
-- 系统角色默认权限配置
-- 执行: mysql -u billiards -p billiards < database/default_role_permissions.sql
-- =============================================

-- Boss：全部权限（排除 menu 父记录）
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_boss_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'boss' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%';

-- Manager：不含 employee:role, employee:store, finance 组
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_mgr_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'manager' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND p.code NOT IN ('employee:role', 'employee:store', 'finance:cashflow', 'finance:revenue', 'finance');

-- Finance：dashboard + finance + report + mobile(首页/报表/通知/个人)
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_fin_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'finance' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND p.code IN ('dashboard', 'overview', 'finance:cashflow', 'finance:revenue', 'finance',
               'report:list', 'reports',
               'mobile:dashboard', 'mobile:work', 'mobile:order', 'mobile:report',
               'mobile:notification', 'mobile:profile', 'mobile:settings');

-- Coach：dashboard + assistant:list + mobile(打卡/排班/业绩/通知/个人)
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_coach_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'coach' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND p.code IN ('dashboard', 'overview', 'assistant:list', 'assistants',
               'mobile:checkin', 'mobile:apply', 'mobile:schedule', 'mobile:performance',
               'mobile:notification', 'mobile:profile', 'mobile:settings');

-- Cashier：dashboard + member + order + table(台桌配置) + cashier:pos + mobile(打卡/台桌/通知/个人)
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_cash_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'cashier' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND (p.code IN ('dashboard', 'overview', 'member:list', 'member:tier', 'members',
                'order:list', 'order:table', 'orders', 'cashier:pos',
                'tables', 'tables.list', 'tables.add', 'tables.edit', 'tables.delete')
     OR p.code IN ('mobile:checkin', 'mobile:apply', 'mobile:schedule', 'mobile:settings',
                   'mobile:table', 'mobile:table:open', 'mobile:table:order',
                   'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:member',
                   'mobile:table:checkout', 'mobile:table:log', 'mobile:notification', 'mobile:profile'));

-- Assistant：dashboard + mobile(接单/打卡/业绩/通知/个人)
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_asst_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'assistant' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND p.code IN ('dashboard', 'overview',
               'mobile:dashboard', 'mobile:orders', 'mobile:checkin', 'mobile:apply', 'mobile:schedule',
               'mobile:performance', 'mobile:notification', 'mobile:profile', 'mobile:settings');

-- Waiter：dashboard + mobile(打卡/台桌/通知/个人)
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_wait_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'waiter' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND p.code IN ('dashboard', 'overview',
               'mobile:checkin', 'mobile:apply', 'mobile:schedule',
               'mobile:table', 'mobile:table:open', 'mobile:table:order',
               'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:member',
               'mobile:table:checkout', 'mobile:table:log', 'mobile:notification', 'mobile:profile', 'mobile:settings');

-- Employee：dashboard + mobile(打卡/台桌/通知/个人/设置)
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT CONCAT('def_emp_', p.id), r.id, p.id, '', NOW()
FROM bi_busi_employee_role r, bi_busi_permission p
WHERE r.code = 'employee' AND r.is_system = 1 AND p.status = 1 AND p.code NOT LIKE '%:menu:%'
AND p.code IN ('dashboard', 'overview',
               'mobile:checkin', 'mobile:apply', 'mobile:schedule',
               'mobile:table', 'mobile:table:open', 'mobile:table:order',
               'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:member',
               'mobile:table:checkout', 'mobile:table:log', 'mobile:notification', 'mobile:profile', 'mobile:settings');

SELECT 'Default role permissions initialized' AS result;
