# 移动端人员管理功能完善方案

## 一、现状分析

### 1.1 数据一致性问题

| 问题 | 移动端 | PC端/后端 | 影响 |
|------|--------|-----------|------|
| 角色定义不一致 | `UserRole = 'owner' \| 'assistant' \| 'employee'` | `owner, admin, manager, cashier, waiter, assistant` | 角色显示错误 |
| 员工角色映射错误 | 包含 `employee` | 应为 `waiter` | 数据展示错误 |
| 排班查询未区分角色 | 统一查询 | 根据角色查询不同表 | 助教排班无法正确显示 |

### 1.2 功能缺失

| 功能 | 状态 | 说明 |
|------|------|------|
| 助教排班查询 | ✅ 部分支持 | API已支持角色参数，但页面未使用 |
| 助教个人信息 | ❌ 缺失 | 助教登录后无法查看详细信息 |
| 助教业绩统计 | ✅ 已有 | `performance.ts` API已实现 |

---

## 二、优化方案

### 2.1 统一角色定义

**目标**：移动端角色定义与PC端/后端 `RoleConstants` 完全一致

**修改文件**：`src/types/index.ts`

**角色配置表**：

| 角色标识 | 显示名称 | 说明 |
|----------|----------|------|
| `owner` | 老板 | 全部权限 |
| `admin` | 管理员 | 系统管理权限 |
| `manager` | 店长 | 门店管理权限 |
| `cashier` | 收银员 | 收银结算权限 |
| `waiter` | 服务员 | 台桌服务权限 |
| `assistant` | 助教 | 陪练教学权限 |

### 2.2 完善排班查询功能

**目标**：根据用户角色查询正确的排班数据

**修改文件**：`pages/schedule/index.vue`

**逻辑**：
```
获取当前用户角色 → 根据角色调用API → 显示排班数据
    ↓
assistant → 从 bi_busi_assistant_schedule 查询
    ↓
其他角色 → 从 bi_busi_employee_schedule 查询
```

### 2.3 完善员工列表角色映射

**目标**：修复角色显示错误

**修改文件**：`pages/employee/list.vue`

### 2.4 添加助教信息API

**目标**：支持助教登录后查看个人详细信息

**修改文件**：`src/api/modules/employee.ts`

---

## 三、实施计划

### 阶段一：统一类型定义

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 更新 `UserRole` 类型 | `src/types/index.ts` |
| 2 | 添加角色常量定义 | `src/types/index.ts` |
| 3 | 更新角色映射配置 | `src/types/index.ts` |

### 阶段二：完善排班功能

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 获取当前用户角色 | `pages/schedule/index.vue` |
| 2 | 根据角色调用排班API | `pages/schedule/index.vue` |
| 3 | 更新UI展示逻辑 | `pages/schedule/index.vue` |

### 阶段三：修复员工列表

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 修复角色映射 | `pages/employee/list.vue` |
| 2 | 支持所有角色类型 | `pages/employee/list.vue` |

### 阶段四：添加助教信息API

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 添加助教详情API | `src/api/modules/employee.ts` |
| 2 | 添加助教信息类型定义 | `src/types/index.ts` |

---

## 四、文件修改清单

### 前端修改

| 文件 | 修改内容 |
|------|----------|
| `src/types/index.ts` | 更新角色类型、添加角色常量和映射 |
| `src/api/modules/employee.ts` | 添加助教详情接口 |
| `pages/schedule/index.vue` | 根据角色查询排班 |
| `pages/employee/list.vue` | 修复角色映射 |

### 后端修改（如需）

| 文件 | 修改内容 |
|------|----------|
| 已完成 | 助教创建时自动创建员工记录 |
| 已完成 | 排班逻辑支持角色区分 |

---

## 五、预期成果

1. ✅ 角色定义统一，与PC端/后端保持一致
2. ✅ 排班查询根据角色显示正确数据
3. ✅ 员工列表角色显示正确
4. ✅ 助教可正常查看个人信息和排班