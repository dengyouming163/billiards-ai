CREATE USER IF NOT EXISTS 'bi_agent_ro'@'%' IDENTIFIED BY 'test-readonly-only';
-- 视图创建后由 Task 12 精确授权；此处不授予 base table 权限。
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'bi_agent_ro'@'%';
