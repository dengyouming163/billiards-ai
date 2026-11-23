-- =====================================================
-- 将门店级角色权限迁移到系统级预设角色
-- 执行前提：系统级预设角色已存在(sys_role_boss等)
-- =====================================================

-- 1. 按角色code映射：旧门店级角色权限 → 系统级角色权限
INSERT INTO bi_busi_role_permission (id, role_id, permission_id, store_id, created_at, updated_at)
SELECT 
    CONCAT('sys_m_', REPLACE(UUID(), '-', '')),
    CONCAT('sys_role_', er.code),
    rp.permission_id,
    '',
    NOW(),
    NOW()
FROM bi_busi_role_permission rp
JOIN bi_busi_employee_role er ON rp.role_id = er.id
WHERE er.code IN ('boss', 'manager', 'finance', 'cashier', 'assistant', 'employee')
  AND er.is_system = 0
  AND er.store_id != ''
  AND NOT EXISTS (
    SELECT 1 FROM bi_busi_role_permission rp2
    WHERE rp2.role_id = CONCAT('sys_role_', er.code)
      AND rp2.permission_id = rp.permission_id
      AND (rp2.store_id = '' OR rp2.store_id = '__system__')
  );

-- 2. 检查旧记录数量（用于验证）
SELECT COUNT(*) AS old_records
FROM bi_busi_role_permission rp
JOIN bi_busi_employee_role er ON rp.role_id = er.id
WHERE er.code IN ('boss', 'manager', 'finance', 'cashier', 'assistant', 'employee')
  AND er.is_system = 0
  AND er.store_id != '';

-- 3. 检查新记录数量（用于验证）
SELECT COUNT(*) AS new_system_records
FROM bi_busi_role_permission rp
JOIN bi_busi_employee_role er ON rp.role_id = er.id
WHERE er.is_system = 1
  AND (er.store_id = '' OR er.store_id = '__system__');
