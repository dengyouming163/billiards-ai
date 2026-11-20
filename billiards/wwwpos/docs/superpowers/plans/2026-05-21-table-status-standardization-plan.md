# 台桌状态标准化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 将前端 TableStatus 从 6 种状态（idle/inuse/occupied/reserved/cleaning/maintenance）标准化为后端一致的 4 种状态（idle/occupied/reserved/maintenance），去掉 `inuse` 和 `cleaning`。

**Architecture:** 修改类型定义 → 更新 STATUS_CONFIG 配置 → 替换所有组件中的 `'inuse'` 为 `'occupied'` → 修改 AppContext reducer 状态变更 → 构建验证。

**Tech Stack:** TypeScript, React 19, Next.js 16

---

### Task 1: 修改类型定义 + STATUS_CONFIG

**Files:**
- Modify: `src/types/index.ts`
- Modify: `src/components/TableBoard.tsx`

- [ ] **Step 1: 修改 types/index.ts 中 TableStatus 类型定义**

```typescript
// 原: export type TableStatus = 'idle' | 'inuse' | 'occupied' | 'reserved' | 'cleaning' | 'maintenance';
// 改: 去掉 inuse 和 cleaning
export type TableStatus = 'idle' | 'occupied' | 'reserved' | 'maintenance';
```

- [ ] **Step 2: 修改 TableBoard.tsx 中 STATUS_CONFIG**

删除 `inuse` 和 `cleaning` 条目，将 `occupied` 的配置改为原来 `inuse` 的绿色主题（"使用中"），更新 `occupied` 的 label 为 `'使用中'`：

```typescript
const STATUS_CONFIG: Record<TableStatus, { label: string; bgClass: string; borderClass: string; textClass: string; dotClass: string }> = {
  idle: { 
    label: '空闲', 
    bgClass: 'from-slate-100 to-slate-200', 
    borderClass: 'border-slate-300',
    textClass: 'text-slate-700',
    dotClass: 'bg-slate-500'
  },
  occupied: { 
    label: '使用中', 
    bgClass: 'from-emerald-200 to-teal-200', 
    borderClass: 'border-emerald-400',
    textClass: 'text-emerald-800',
    dotClass: 'bg-emerald-600'
  },
  reserved: { 
    label: '预约', 
    bgClass: 'from-amber-200 to-orange-200', 
    borderClass: 'border-amber-400',
    textClass: 'text-amber-800',
    dotClass: 'bg-amber-600'
  },
  maintenance: {
    label: '维护中',
    bgClass: 'from-gray-200 to-slate-300',
    borderClass: 'border-gray-400',
    textClass: 'text-gray-700',
    dotClass: 'bg-gray-500'
  },
};
```

- [ ] **Step 3: 更新筛选选项列表**

在 TableBoard.tsx 中找到 `statusOptions` 数组（约第 366 行），去掉 `cleaning` 选项：

```typescript
const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'idle', label: '空闲' },
  { value: 'occupied', label: '使用中' },
  { value: 'reserved', label: '预约' },
  { value: 'maintenance', label: '维护中' },
];
```

- [ ] **Step 4: 替换 TableBoard.tsx 中的 status 判断**

查找所有 `table.status === 'inuse'` 替换为 `table.status === 'occupied'`。约 9 处需要替换（第 92, 149, 155, 240, 291, 298, 307, 336, 470 行）。

---

### Task 2: 替换 AppContext reducer 中的状态值

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: 替换 AppContext.tsx 中所有 `'inuse'` 为 `'occupied'`**

查找替换以下位置：
- 第 191 行：`status: 'inuse' as const` → `status: 'occupied' as const`
- 第 422 行：`status: 'inuse' as const` → `status: 'occupied' as const`
- 第 588 行：`table.status === 'inuse'` → `table.status === 'occupied'`
- 其他任何 `'inuse'` 字符串

- [ ] **Step 2: 检查 filterStatus 类型**

确保 filterStatus 也是 4 种状态，去除 `cleaning`。

---

### Task 3: 替换组件中的状态判断

**Files:**
- Modify: `src/components/TableDrawer.tsx`
- Modify: `src/components/TransferMergeModal.tsx`
- Modify: `src/components/QuickPanel.tsx`
- Modify: `src/components/QuickOrderModal.tsx`
- Modify: `src/components/ShiftModal.tsx`
- Modify: `src/components/ReservationModal.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 替换 TableDrawer.tsx**

约 8 处：
- `table.status === 'inuse'` → `table.status === 'occupied'`
- `table.status !== 'inuse'` → `table.status !== 'occupied'`
- `isInUse = table.status === 'inuse'` → `isInUse = table.status === 'occupied'`
- 第 406 行 `!isIdle && !isInUse` 条件不再需要检查 `cleaning`（因为只剩 reserved/maintenance）

- [ ] **Step 2: 替换 TransferMergeModal.tsx**

约 5 处：
- `t.status === 'inuse'` → `t.status === 'occupied'`
- `status: 'inuse',` → `status: 'occupied',`

- [ ] **Step 3: 替换 page.tsx 第 65 行**

```typescript
// 原: if (t && t.status === 'inuse')
// 改:
if (t && t.status === 'occupied')
```

- [ ] **Step 4: 替换其他组件**

QuickPanel.tsx: `t.status === 'inuse'` → `t.status === 'occupied'`
QuickOrderModal.tsx: `t.status === 'idle'`（原使用 idle，正确，但检查上下文确认）
ShiftModal.tsx: `t.status === 'inuse'` → `t.status === 'occupied'`
ReservationModal.tsx: `t.status === 'idle'`（正确，无需修改）

---

### Task 4: 构建验证

- [ ] **Step 1: 运行构建**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwpos
npx next build 2>&1 | Select-String -Pattern "Error|error|Failed"
```

Expected: 无错误

- [ ] **Step 2: 搜索残留 `inuse` 确保全部替换**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwpos
Select-String -Path "src/**/*.tsx","src/**/*.ts" -Pattern "inuse" -SimpleMatch
```

Expected: 无匹配结果
