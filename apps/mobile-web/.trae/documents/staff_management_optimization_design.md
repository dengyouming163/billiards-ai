# 人员管理系统优化设计方案

## 一、问题分析

### 1.1 当前问题概述

| 问题 | 描述 | 影响 |
|------|------|------|
| 排班数据分散 | 助教排班在 `bi_busi_assistant_schedule`，员工排班在 `bi_busi_employee_schedule` | 老板无法统一查看所有人员排班 |
| 员工与助教无关联 | `Employee` 表和 `Assistant` 表独立 | 助教登录后无法查询详细信息 |
| 权限标识不统一 | 角色使用字符串硬编码 | 代码可维护性差 |

### 1.2 当前数据模型

**Employee表** (`bi_busi_employee`)：
- id, name, phone, role, password, hire_date...

**Assistant表** (`bi_busi_assistant`)：
- id, store_id, level_id, name, phone, hourly_rate, skills...

---

## 二、解决方案

### 2.1 排班功能优化

**设计原则**：保留双排班体系，统一查询接口

**修改内容**：

| 文件 | 修改内容 |
|------|----------|
| `ScheduleLogic.php` | 根据角色选择排班表查询 |
| `ScheduleController.php` | 添加助教排班查询接口 |

**排班表选择逻辑**：
```php
if (role == 'assistant') {
    // 从 bi_busi_assistant_schedule 查询
    return AssistantSchedule::where('assistant_id', $employeeId)->...;
} else {
    // 从 bi_busi_employee_schedule 查询
    return EmployeeSchedule::where('employee_id', $employeeId)->...;
}
```

### 2.2 员工与助教表关联（方案A）

**设计原则**：在助教表中添加 `employee_id` 字段，实现一对一关联

**数据库修改**：
```sql
ALTER TABLE bi_busi_assistant ADD COLUMN employee_id VARCHAR(64) NULL AFTER id;
ALTER TABLE bi_busi_assistant ADD INDEX idx_employee_id (employee_id);
```

**关联逻辑**：
- 助教创建时自动创建对应的员工记录
- 通过 `employee_id` 关联查询助教详细信息
- 登录统一通过员工表验证

### 2.3 权限标识标准化

**定义角色常量**：

| 角色 | 常量名 | 标识值 |
|------|--------|--------|
| 老板 | `ROLE_OWNER` | `'owner'` |
| 管理员 | `ROLE_ADMIN` | `'admin'` |
| 店长 | `ROLE_MANAGER` | `'manager'` |
| 助教 | `ROLE_ASSISTANT` | `'assistant'` |
| 服务员 | `ROLE_WAITER` | `'waiter'` |

**存储位置**：`app/common/constants/RoleConstants.php`

---

## 三、实施步骤

### 阶段一：数据库修改
1. 为 `bi_busi_assistant` 表添加 `employee_id` 字段
2. 为现有数据建立关联关系

### 阶段二：后端逻辑修改
1. 创建 `RoleConstants.php` 常量类
2. 修改 `ScheduleLogic.php` 支持助教排班查询
3. 更新 `ScheduleController.php` 添加接口

### 阶段三：前端适配
1. 更新排班API调用
2. 更新助教详情查询逻辑

---

## 四、风险评估

| 风险 | 等级 | 应对措施 |
|------|------|----------|
| 数据一致性 | 中 | 事务保证关联数据同步 |
| 接口兼容性 | 低 | 保持原有接口不变，新增接口 |
| 测试覆盖 | 低 | 编写单元测试 |

---

## 五、设计确认

请确认以上设计方案是否符合您的预期？

- [ ] 排班功能优化方案
- [ ] 员工与助教表关联方案（方案A）
- [ ] 权限标识标准化方案