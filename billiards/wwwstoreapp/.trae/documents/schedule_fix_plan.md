# 助教排班功能修复计划

## 一、问题描述

当前移动端排班接口 `/mobile.Schedule/mySchedule` 和 `/mobile.Schedule/employeeSchedule` 只从 `bi_busi_employee_schedule` 表读取数据，但助教的排班数据实际存储在 `bi_busi_assistant_schedule` 表中（PC管理后台已完成排班维护）。

## 二、修复方案

修改 `ScheduleLogic.php`，根据用户角色选择正确的排班表：
- 助教角色(assistant) → 从 `bi_busi_assistant_schedule` 读取
- 其他角色(owner/admin/manager/waiter) → 从 `bi_busi_employee_schedule` 读取

## 三、修改文件

### 1. `app/storeapi/logic/mobile/ScheduleLogic.php`
- 修改 `getMySchedule()` 方法，支持根据角色选择排班表
- 修改 `getEmployeeSchedule()` 方法，支持助教排班查询

### 2. `app/storeapi/controller/mobile/ScheduleController.php`
- 添加获取助教排班列表的接口（可选）

## 四、实施步骤

1. 修改 `ScheduleLogic.php` 中的 `getMySchedule` 方法
2. 修改 `ScheduleLogic.php` 中的 `getEmployeeSchedule` 方法
3. 更新 `ScheduleController.php` 添加助教排班接口
4. 更新前端 API 调用

## 五、风险评估

- 低风险：只修改数据读取逻辑，不影响数据写入
- 需要确保两个表的数据结构兼容

## 六、验证测试

1. 使用老板账号登录，查看助教排班
2. 使用助教账号登录，查看自己的排班
3. 验证数据与PC后台一致