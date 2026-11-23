-- =============================================
-- 补充 admin / owner 角色的完整权限
-- 原因：default_role_permissions.sql 只配置了 boss/manager/finance/coach/cashier/assistant/waiter/employee
--       admin 和 owner 角色从未被分配权限，导致超管账号缺少 mobile:checkin / mobile:performance 等
-- 日期：2026-06-30
-- =============================================

-- 1. 确保 admin / owner 系统角色存在
INSERT IGNORE INTO bi_busi_employee_role (id, store_id, name, code, is_system, status, sort_order, created_at, updated_at)
VALUES
('sys_role_admin', '', '超级管理员', 'admin', 1, 1, 0, NOW(), NOW()),
('sys_role_owner', '', '老板(旧)',    'owner', 1, 1, 0, NOW(), NOW());

-- 2. 为 admin 角色分配全部权限（与 boss 一致，ALL permissions）
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT
    CONCAT('fix_admin_', REPLACE(p.id, '-', '_')),
    'sys_role_admin',
    p.id,
    '',
    NOW()
FROM bi_busi_permission p
WHERE p.status = 1
  AND p.code NOT LIKE '%:menu:%';

-- 3. 为 owner 角色分配全部权限（与 boss 一致，ALL permissions）
INSERT IGNORE INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at)
SELECT
    CONCAT('fix_owner_', REPLACE(p.id, '-', '_')),
    'sys_role_owner',
    p.id,
    '',
    NOW()
FROM bi_busi_permission p
WHERE p.status = 1
  AND p.code NOT LIKE '%:menu:%';

-- 验证：查看 admin 角色当前拥有的 mobile 权限数量
SELECT 'admin mobile permissions:' AS info, COUNT(*) AS count
FROM bi_busi_role_permission rp
JOIN bi_busi_permission p ON rp.permission_id = p.id
WHERE rp.role_id = 'sys_role_admin'
  AND p.module = 'mobile';

-- 验证：确认缺失的 mobile:checkin 和 mobile:performance 已分配
SELECT p.code, '已分配' AS status
FROM bi_busi_role_permission rp
JOIN bi_busi_permission p ON rp.permission_id = p.id
WHERE rp.role_id = 'sys_role_admin'
  AND p.code IN ('mobile:checkin', 'mobile:performance', 'mobile:work', 'mobile:report');
