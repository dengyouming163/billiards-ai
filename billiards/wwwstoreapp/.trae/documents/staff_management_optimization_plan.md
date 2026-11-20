# 人员管理系统优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化人员管理系统，解决排班数据分散、员工与助教表无关联、权限标识不统一问题

**Architecture:** 
1. 修改排班逻辑，根据角色选择不同排班表查询
2. 在助教表添加 employee_id 字段实现关联
3. 创建角色常量类标准化权限标识

**Tech Stack:** ThinkPHP 6.x, MySQL, UniApp

---

## 文件结构

| 文件 | 类型 | 说明 |
|------|------|------|
| `app/common/constants/RoleConstants.php` | 新建 | 角色常量定义 |
| `app/storeapi/logic/mobile/ScheduleLogic.php` | 修改 | 排班查询逻辑 |
| `app/storeapi/controller/mobile/ScheduleController.php` | 修改 | 排班接口 |
| `app/common/model/merchant/Assistant.php` | 修改 | 助教模型添加字段 |
| `database/migrations/add_employee_id_to_assistant.sql` | 新建 | 数据库迁移脚本 |

---

### Task 1: 创建角色常量类

**Files:**
- Create: `app/common/constants/RoleConstants.php`

- [ ] **Step 1: 创建常量类**

```php
<?php

namespace app\common\constants;

class RoleConstants
{
    const ROLE_OWNER = 'owner';
    const ROLE_ADMIN = 'admin';
    const ROLE_MANAGER = 'manager';
    const ROLE_ASSISTANT = 'assistant';
    const ROLE_WAITER = 'waiter';

    public static function getAllRoles(): array
    {
        return [
            self::ROLE_OWNER,
            self::ROLE_ADMIN,
            self::ROLE_MANAGER,
            self::ROLE_ASSISTANT,
            self::ROLE_WAITER,
        ];
    }

    public static function getRoleName(string $role): string
    {
        $names = [
            self::ROLE_OWNER => '老板',
            self::ROLE_ADMIN => '管理员',
            self::ROLE_MANAGER => '店长',
            self::ROLE_ASSISTANT => '助教',
            self::ROLE_WAITER => '服务员',
        ];
        return $names[$role] ?? '未知';
    }
}
```

- [ ] **Step 2: 验证文件创建**

检查文件是否正确创建：`ls -la app/common/constants/RoleConstants.php`

---

### Task 2: 修改排班逻辑支持助教排班

**Files:**
- Modify: `app/storeapi/logic/mobile/ScheduleLogic.php`

- [ ] **Step 1: 修改 getMySchedule 方法**

```php
public static function getMySchedule($employeeId, $week = 0, $role = 'waiter')
{
    $startDate = date('Y-m-d', strtotime("+" . ($week * 7) . " days", strtotime('monday this week')));
    $endDate = date('Y-m-d', strtotime('+6 days', strtotime($startDate)));

    // 根据角色选择排班表
    if ($role == 'assistant') {
        $schedules = AssistantSchedule::where('assistant_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->whereNull('deleted_at')
            ->order('date', 'asc')
            ->select();
    } else {
        $schedules = EmployeeSchedule::where('employee_id', $employeeId)
            ->whereBetween('date', [$startDate, $endDate])
            ->order('date', 'asc')
            ->select();
    }

    $result = [];
    for ($i = 0; $i < 7; $i++) {
        $date = date('Y-m-d', strtotime("+{$i} days", strtotime($startDate)));
        $schedule = null;
        foreach ($schedules as $s) {
            if ($s['date'] == $date) {
                $schedule = $s;
                break;
            }
        }
        
        $shiftType = $schedule ? ($role == 'assistant' ? $schedule['shift'] : $schedule['shift_type']) : 'off';
        $result[] = [
            'id' => $schedule ? $schedule['id'] : 0,
            'employee_id' => $employeeId,
            'date' => $date,
            'shift_type' => $shiftType,
            'shift_name' => self::getShiftName($shiftType),
            'start_time' => $schedule ? $schedule['start_time'] : '',
            'end_time' => $schedule ? $schedule['end_time'] : '',
        ];
    }

    return $result;
}
```

- [ ] **Step 2: 修改 getEmployeeSchedule 方法**

```php
public static function getEmployeeSchedule($employeeId, $week = 0, $role = 'waiter')
{
    return self::getMySchedule($employeeId, $week, $role);
}
```

---

### Task 3: 修改排班控制器

**Files:**
- Modify: `app/storeapi/controller/mobile/ScheduleController.php`

- [ ] **Step 1: 修改 employeeSchedule 接口**

```php
public function employeeSchedule()
{
    $employeeId = $this->request->get('employee_id', $this->employeeId);
    $week = $this->request->get('week', 0);
    $role = $this->request->get('role', 'waiter');

    $result = ScheduleLogic::getEmployeeSchedule($employeeId, $week, $role);
    return JsonService::data($result);
}
```

---

### Task 4: 数据库迁移 - 助教表添加 employee_id

**Files:**
- Create: `database/migrations/add_employee_id_to_assistant.sql`

- [ ] **Step 1: 创建迁移脚本**

```sql
ALTER TABLE `bi_busi_assistant` 
ADD COLUMN `employee_id` VARCHAR(64) NULL COMMENT '关联员工ID' AFTER `id`,
ADD INDEX `idx_employee_id` (`employee_id`);
```

- [ ] **Step 2: 执行迁移**

```bash
mysql -h 132.232.166.40 -P 13306 -u billiards -pdengyouming2tll billiards < database/migrations/add_employee_id_to_assistant.sql
```

---

### Task 5: 修改助教模型

**Files:**
- Modify: `app/common/model/merchant/Assistant.php`

- [ ] **Step 1: 添加 employee_id 字段**

```php
protected $schema = [
    'id' => 'string',
    'employee_id' => 'string',  // 新增
    'store_id' => 'string',
    'level_id' => 'string',
    'name' => 'string',
    'phone' => 'string',
    'gender' => 'string',
    'avatar' => 'string',
    'skills' => 'string',
    'hourly_rate' => 'decimal',
    'status' => 'integer',
    'total_orders' => 'integer',
    'total_hours' => 'decimal',
    'total_amount' => 'decimal',
    'rating' => 'decimal',
    'description' => 'string',
    'created_at' => 'datetime',
    'updated_at' => 'datetime',
    'deleted_at' => 'datetime',
];

// 添加关联方法
public function employee()
{
    return $this->hasOne(Employee::class, 'id', 'employee_id');
}
```

---

### Task 6: 更新前端 API

**Files:**
- Modify: `src/api/modules/schedule.ts`

- [ ] **Step 1: 更新 API 调用**

```typescript
export function getEmployeeSchedule(employeeId?: string, week: number = 0, role: string = 'waiter'): Promise<any> {
    return get('/mobile.Schedule/employeeSchedule', { employee_id: employeeId, week, role })
}
```

---

## 验证测试

1. 使用老板账号登录，查看助教排班是否正确显示
2. 使用助教账号登录，查看自己的排班
3. 验证数据与PC后台一致
4. 验证角色常量类可以正常使用

---

## 执行选项

**Plan complete.** Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**