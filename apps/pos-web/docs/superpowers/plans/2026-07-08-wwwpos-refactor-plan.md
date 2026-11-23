# wwwpos 前端产品化重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wwwpos 项目重构为微信 UI 风格，实现颠覆性视觉变化，保持所有功能逻辑不变。

**Architecture:** 
1. 更新全局 CSS 变量为微信绿主题（#07C160）
2. 重构布局：快捷操作栏从右侧移至左侧（340px）
3. 重设计核心组件（HeaderBar、QuickPanel、TableBoard、TableDrawer）
4. 更新所有页面（登录页、选择门店页）为微信风格
5. 替换品牌名称为"客稻云"

**Tech Stack:** Next.js 16, React 19, Tailwind CSS 4, Lucide React Icons

---

## 文件结构

| 文件路径 | 职责 | 操作 |
|---------|------|------|
| `src/app/globals.css` | 全局样式和主题变量 | 修改 |
| `src/app/page.tsx` | POS主页面布局 | 修改 |
| `src/components/HeaderBar.tsx` | 顶部导航栏 | 修改 |
| `src/components/QuickPanel.tsx` | 快捷操作栏 | 修改 |
| `src/components/TableBoard.tsx` | 台桌区域 | 修改 |
| `src/components/tableConfig.ts` | 台桌配置（状态颜色等） | 修改 |
| `src/components/TableDrawer.tsx` | 台桌详情抽屉 | 修改 |
| `src/app/login/page.tsx` | 登录页面 | 修改 |
| `src/app/select-store/page.tsx` | 选择门店页面 | 修改 |
| `src/components/ui/button.tsx` | 按钮组件 | 修改 |
| `src/components/ui/input.tsx` | 输入框组件 | 修改 |
| `src/components/ui/card.tsx` | 卡片组件 | 修改 |

---

## Task 1: 更新全局样式和主题变量

**Files:**
- Modify: `src/app/globals.css`

**目标:** 将全局主题变量更新为微信风格

- [ ] **Step 1: 更新 CSS 主题变量**

```css
@theme inline {
  --color-primary: #07C160;
  --color-primary-light: #34D399;
  --color-primary-dark: #06AD56;
  --color-primary-bg: #D1FAE5;
  --color-primary-glow: rgba(7, 193, 96, 0.2);
  
  --color-bg-primary: #f7f7f7;
  --color-bg-secondary: #ffffff;
  --color-bg-card: #ffffff;
  --color-bg-hover: #f1f5f9;
  --color-bg-elevated: #ffffff;

  --color-text-primary: #333333;
  --color-text-secondary: #999999;
  --color-text-muted: #cccccc;

  --color-accent: #FF976A;
  --color-accent-light: #FED7AA;
  --color-accent-dark: #F97316;

  --color-status-idle: #3b82f6;
  --color-status-idle-bg: #eff6ff;
  --color-status-inuse: #10b981;
  --color-status-inuse-bg: #ecfdf5;
  --color-status-reserved: #f97316;
  --color-status-reserved-bg: #fff7ed;
  --color-status-cleaning: #6b7280;
  --color-status-cleaning-bg: #f3f4f6;
  --color-status-vip: #ec4899;
  --color-status-vip-bg: #fce7f3;

  --color-border-subtle: #e5e5e5;
  --color-border-active: rgba(7, 193, 96, 0.5);

  --color-wechat: #07C160;
  --color-alipay: #06B6D4;
  --color-cash: #FF976A;

  --color-success: #07C160;
  --color-success-dark: #06AD56;

  --color-danger: #f43f5e;
  --color-danger-dark: #e11d48;

  --font-sans: "Noto Sans SC", system-ui, sans-serif;
  --font-mono: "Roboto Mono", monospace;

  --radius-card: 1.5rem;
  --radius-button: 9999px;
  --radius-input: 1.5rem;
  --radius-modal: 2rem;

  --spacing-card: 1.5rem;
  --spacing-button: 1rem;
}
```

- [ ] **Step 2: 更新基础样式**

```css
body {
  font-family: var(--font-sans);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

- [ ] **Step 3: 更新按钮样式**

```css
.btn-primary {
  @apply bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white hover:opacity-90 shadow-lg hover:shadow-xl h-14 rounded-full;
}

.btn-secondary {
  @apply bg-white text-[#07C160] border-2 border-[#07C160] hover:bg-[#D1FAE5] shadow-sm h-14 rounded-full;
}

.btn-danger {
  @apply bg-white text-[#f43f5e] border-2 border-[#f43f5e] hover:bg-rose-50 shadow-sm h-14 rounded-full;
}

.btn-ghost {
  @apply bg-transparent text-[#999999] hover:bg-[#f7f7f7] shadow-none;
}
```

- [ ] **Step 4: 更新卡片样式**

```css
.card {
  @apply rounded-2xl bg-white shadow-sm border border-[#e5e5e5];
}

.card-hover {
  @apply transition-all duration-200 hover:shadow-md;
}
```

- [ ] **Step 5: 更新输入框样式**

```css
.input {
  @apply w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-[#333333] placeholder:text-[#cccccc] focus:border-[#07C160] focus:ring-2 focus:ring-[#D1FAE5] focus:outline-none transition-all;
}
```

- [ ] **Step 6: Commit**

```bash
git add src/app/globals.css
git commit -m "style: update global styles to WeChat theme"
```

---

## Task 2: 重构 POS 主页面布局（快捷操作栏移至左侧）

**Files:**
- Modify: `src/app/page.tsx`

**目标:** 将 QuickPanel 从右侧移至左侧

- [ ] **Step 1: 修改布局结构**

将以下代码：
```tsx
<div className="flex-1 flex overflow-hidden">
  {/* Left - Table board */}
  <div className="flex-1 p-4 overflow-hidden">
    <TableBoard onRefresh={refreshTables} />
  </div>

  {/* Right - Quick panel */}
  <div className="w-[340px] border-l border-[var(--color-border-subtle)]">
    <QuickPanel ... />
  </div>
</div>
```

修改为：
```tsx
<div className="flex-1 flex overflow-hidden">
  {/* Left - Quick panel */}
  <div className="w-[340px] border-r border-[var(--color-border-subtle)] bg-white">
    <QuickPanel ... />
  </div>

  {/* Right - Table board */}
  <div className="flex-1 p-4 overflow-hidden">
    <TableBoard onRefresh={refreshTables} />
  </div>
</div>
```

- [ ] **Step 2: 更新页面容器背景**

将：
```tsx
<div className="h-screen flex flex-col bg-[var(--color-bg-primary)]">
```

修改为：
```tsx
<div className="h-screen flex flex-col bg-[#f7f7f7]">
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: move QuickPanel to left side"
```

---

## Task 3: 重设计 HeaderBar（白色背景 + 微信风格）

**Files:**
- Modify: `src/components/HeaderBar.tsx`

**目标:** 将 HeaderBar 从深色渐变背景改为白色背景，替换品牌名为"客稻云"

- [ ] **Step 1: 修改 HeaderBar 主容器样式**

将：
```tsx
<header className="h-20 bg-gradient-to-r from-slate-800 to-slate-700 px-7 flex items-center justify-between shadow-lg">
```

修改为：
```tsx
<header className="h-20 bg-white px-6 flex items-center justify-between shadow-sm border-b border-[#e5e5e5]">
```

- [ ] **Step 2: 修改 Logo 区域**

将：
```tsx
<div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200/30">
```

修改为：
```tsx
<div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-md">
```

- [ ] **Step 3: 修改标题文字颜色**

将：
```tsx
<h1 className="text-xl font-bold text-white">台球厅收银系统</h1>
<p className="text-sm text-slate-300">Billiards POS</p>
```

修改为：
```tsx
<h1 className="text-xl font-bold text-[#333333]">客稻云</h1>
<p className="text-sm text-[#999999]">台球厅收银系统</p>
```

- [ ] **Step 4: 修改分隔线颜色**

将：
```tsx
<div className="h-10 w-px bg-slate-500 mx-2" />
```

修改为：
```tsx
<div className="h-10 w-px bg-[#e5e5e5] mx-4" />
```

- [ ] **Step 5: 修改时间日期文字颜色**

将：
```tsx
<p className="text-sm font-medium text-slate-300">...</p>
<p className="text-xl font-bold font-mono text-white">...</p>
```

修改为：
```tsx
<p className="text-sm font-medium text-[#999999]">...</p>
<p className="text-xl font-bold font-mono text-[#333333]">...</p>
```

- [ ] **Step 6: 修改网络状态样式**

将：
```tsx
<div className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-sm font-medium ${
  networkStatus === 'online'
    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
    : networkStatus === 'offline'
    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
    : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
}`}>
```

修改为：
```tsx
<div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
  networkStatus === 'online'
    ? 'bg-[#D1FAE5] text-[#07C160]'
    : networkStatus === 'offline'
    ? 'bg-[#FEF3C7] text-[#F59E0B]'
    : 'bg-[#DBEAFE] text-[#3B82F6]'
}`}>
```

- [ ] **Step 7: 修改用户信息区域样式**

将：
```tsx
<div className="flex items-center gap-4 pl-5 border-l border-slate-500">
```

修改为：
```tsx
<div className="flex items-center gap-4 pl-5 border-l border-[#e5e5e5]">
```

将：
```tsx
<button
  onClick={onShiftClick}
  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-300 text-sm font-medium hover:bg-emerald-500/30 transition-colors"
>
```

修改为：
```tsx
<button
  onClick={onShiftClick}
  className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#D1FAE5] text-[#07C160] text-sm font-medium hover:bg-[#A7F3D0] transition-colors"
>
```

将：
```tsx
<button
  onClick={onShiftClick}
  className="flex items-center gap-3 hover:bg-white/10 rounded-2xl px-3 py-2 transition-colors"
```

修改为：
```tsx
<button
  onClick={onShiftClick}
  className="flex items-center gap-3 hover:bg-[#f7f7f7] rounded-xl px-3 py-2 transition-colors"
```

将：
```tsx
<div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
```

修改为：
```tsx
<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center shadow-md">
```

将：
```tsx
<p className="text-base font-medium text-white">...</p>
<p className="text-sm text-slate-300">...</p>
```

修改为：
```tsx
<p className="text-base font-medium text-[#333333]">...</p>
<p className="text-sm text-[#999999]">...</p>
```

- [ ] **Step 8: 修改登录按钮样式**

将：
```tsx
<button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-slate-300 hover:text-emerald-400 transition-colors">
```

修改为：
```tsx
<button onClick={() => window.location.href = '/login'} className="flex items-center gap-2 text-[#999999] hover:text-[#07C160] transition-colors">
```

- [ ] **Step 9: Commit**

```bash
git add src/components/HeaderBar.tsx
git commit -m "style: redesign HeaderBar with WeChat style"
```

---

## Task 4: 重设计 QuickPanel（左侧快捷操作栏）

**Files:**
- Modify: `src/components/QuickPanel.tsx`

**目标:** 更新 QuickPanel 为微信风格，白色背景，微信绿主题

- [ ] **Step 1: 修改容器样式**

将：
```tsx
<div className="w-full max-w-[320px] bg-gradient-to-b from-slate-50 to-white p-4 flex flex-col h-full border-l border-slate-100 overflow-hidden">
```

修改为：
```tsx
<div className="w-full bg-white p-4 flex flex-col h-full border-r border-[#e5e5e5] overflow-hidden">
```

- [ ] **Step 2: 修改标题样式**

将：
```tsx
<h2 className="text-xl font-bold text-slate-800">快捷操作</h2>
```

修改为：
```tsx
<h2 className="text-lg font-bold text-[#333333]">快捷操作</h2>
```

- [ ] **Step 3: 修改网络状态样式**

将：
```tsx
<span className="flex items-center gap-1.5 text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full font-medium">
```

修改为：
```tsx
<span className="flex items-center gap-1.5 text-sm text-[#07C160] bg-[#D1FAE5] px-3 py-1.5 rounded-full font-medium">
```

- [ ] **Step 4: 修改 ActionCard 样式**

将：
```tsx
<button
  onClick={onClick}
  className={`${gradient} rounded-xl flex items-center gap-4 p-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md relative overflow-hidden group`}
>
```

修改为：
```tsx
<button
  onClick={onClick}
  className="bg-[#f7f7f7] rounded-xl flex items-center gap-4 p-4 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 hover:bg-[#e8f5ef] relative overflow-hidden group border border-[#e5e5e5]"
>
```

将：
```tsx
<div className="w-12 h-12 rounded-lg bg-white/90 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
```

修改为：
```tsx
<div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center shadow-sm border border-[#e5e5e5] group-hover:border-[#07C160] transition-colors">
```

将：
```tsx
<span className="text-base font-bold text-slate-800 whitespace-nowrap">
```

修改为：
```tsx
<span className="text-base font-bold text-[#333333] whitespace-nowrap">
```

- [ ] **Step 5: 修改操作按钮图标颜色**

将所有图标颜色从各种颜色改为微信绿或灰色：

```tsx
<Bell className="w-6 h-6 text-[#07C160]" />
<UserCheck className="w-6 h-6 text-[#07C160]" />
<ShoppingCart className="w-6 h-6 text-[#07C160]" />
<CalendarClock className="w-6 h-6 text-[#07C160]" />
<UserPlus className="w-6 h-6 text-[#07C160]" />
<Receipt className="w-6 h-6 text-[#999999]" />
<Ticket className="w-6 h-6 text-[#FF976A]" />
```

- [ ] **Step 6: 修改班次统计卡片样式**

将：
```tsx
<div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-5 border border-emerald-100 mb-4">
```

修改为：
```tsx
<div className="bg-[#D1FAE5] rounded-2xl p-5 border border-[#A7F3D0] mb-4">
```

将：
```tsx
<p className="text-emerald-600 text-sm font-medium mb-2">...</p>
<p className="text-4xl font-bold text-emerald-600 mb-1">...</p>
```

修改为：
```tsx
<p className="text-[#065f46] text-sm font-medium mb-2">...</p>
<p className="text-4xl font-bold text-[#07C160] mb-1">...</p>
```

将：
```tsx
<div className="bg-white/60 rounded-lg p-3">
```

修改为：
```tsx
<div className="bg-white rounded-xl p-3 shadow-sm">
```

将：
```tsx
<p className="font-bold text-slate-700 text-base">...</p>
<p className="text-slate-400 text-sm">...</p>
```

修改为：
```tsx
<p className="font-bold text-[#333333] text-base">...</p>
<p className="text-[#999999] text-sm">...</p>
```

- [ ] **Step 7: 修改未当班卡片样式**

将：
```tsx
<div className="bg-white rounded-xl p-4 border border-slate-100 mb-4 text-center">
```

修改为：
```tsx
<div className="bg-white rounded-2xl p-4 border border-[#e5e5e5] mb-4 text-center">
```

将：
```tsx
<p className="text-slate-400 text-sm mb-2">尚未当班</p>
<button onClick={onShift}
  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm">
  开始班次
</button>
```

修改为：
```tsx
<p className="text-[#999999] text-sm mb-2">尚未当班</p>
<button onClick={onShift}
  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white font-bold text-sm shadow-md">
  开始班次
</button>
```

- [ ] **Step 8: Commit**

```bash
git add src/components/QuickPanel.tsx
git commit -m "style: redesign QuickPanel with WeChat style"
```

---

## Task 5: 更新台桌状态配置

**Files:**
- Modify: `src/components/tableConfig.ts`

**目标:** 更新台桌状态颜色为微信风格配置

- [ ] **Step 1: 更新 STATUS_CONFIG**

将所有状态配置的颜色更新为微信风格：

```typescript
export const STATUS_CONFIG: Record<string, StatusConfig> = {
  idle: {
    label: '空闲',
    bgClass: 'from-blue-50 to-slate-50',
    borderClass: 'border-blue-300',
    textClass: 'text-blue-700',
    dotClass: 'bg-blue-500',
  },
  occupied: {
    label: '使用中',
    bgClass: 'from-emerald-50 to-teal-50',
    borderClass: 'border-emerald-300',
    textClass: 'text-emerald-700',
    dotClass: 'bg-emerald-500',
  },
  reserved: {
    label: '预约',
    bgClass: 'from-amber-50 to-orange-50',
    borderClass: 'border-amber-300',
    textClass: 'text-amber-700',
    dotClass: 'bg-amber-500',
  },
  maintenance: {
    label: '维护中',
    bgClass: 'from-slate-100 to-slate-50',
    borderClass: 'border-slate-300',
    textClass: 'text-slate-600',
    dotClass: 'bg-slate-500',
  },
  cleaning: {
    label: '打扫中',
    bgClass: 'from-purple-50 to-violet-50',
    borderClass: 'border-purple-300',
    textClass: 'text-purple-700',
    dotClass: 'bg-purple-500',
  },
};
```

- [ ] **Step 2: Commit**

```bash
git add src/components/tableConfig.ts
git commit -m "style: update table status colors to WeChat style"
```

---

## Task 6: 重设计 TableBoard（微信风格卡片）

**Files:**
- Modify: `src/components/TableBoard.tsx`

**目标:** 更新 TableBoard 组件为微信风格，白色卡片 + 圆角

- [ ] **Step 1: 修改 toolbar 样式**

将：
```tsx
<div className="flex bg-slate-100 rounded-xl p-1">
```

修改为：
```tsx
<div className="flex bg-[#f7f7f7] rounded-full p-1">
```

将：
```tsx
className={`p-2.5 rounded-lg transition-all duration-150 ${
  viewMode === 'grid'
    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
    : 'text-slate-600 hover:bg-slate-200'
}`}
```

修改为：
```tsx
className={`p-2.5 rounded-full transition-all duration-150 ${
  viewMode === 'grid'
    ? 'bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white shadow-md'
    : 'text-[#999999] hover:bg-white'
}`}
```

- [ ] **Step 2: 修改搜索框样式**

将：
```tsx
<input
  type="text"
  ...
  className="w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 focus:outline-none transition-all"
/>
```

修改为：
```tsx
<input
  type="text"
  ...
  className="w-full pl-11 pr-4 py-2.5 bg-white border border-[#e5e5e5] rounded-2xl text-[#333333] placeholder:text-[#cccccc] focus:border-[#07C160] focus:ring-2 focus:ring-[#D1FAE5] focus:outline-none transition-all"
/>
```

- [ ] **Step 3: 修改筛选下拉框样式**

将：
```tsx
className="select text-sm pr-8"
```

修改为：
```tsx
className="select text-sm pr-8 rounded-2xl"
```

- [ ] **Step 4: 修改刷新按钮样式**

将：
```tsx
className={`p-2.5 rounded-xl border transition-all disabled:opacity-50 ${
  refreshError
    ? 'bg-rose-50 border-rose-300 text-rose-500'
    : 'bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50'
}`}
```

修改为：
```tsx
className={`p-2.5 rounded-xl border transition-all disabled:opacity-50 ${
  refreshError
    ? 'bg-rose-50 border-rose-300 text-rose-500'
    : 'bg-white border-[#e5e5e5] text-[#999999] hover:text-[#07C160] hover:border-[#07C160] hover:bg-[#D1FAE5]'
}`}
```

- [ ] **Step 5: 修改统计标签样式**

将：
```tsx
<div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-50 border border-slate-200">
```

修改为：
```tsx
<div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#f7f7f7] border border-[#e5e5e5]">
```

将：
```tsx
<span className="text-sm text-slate-600">...</span>
```

修改为：
```tsx
<span className="text-sm text-[#999999]">...</span>
```

- [ ] **Step 6: 修改 TableCard 选中状态样式**

将：
```tsx
className={`table-card group relative overflow-hidden flex flex-col justify-start aspect-square ${
  isSelected 
    ? 'ring-2 ring-emerald-400 shadow-xl scale-[1.02]' 
    : 'hover:shadow-lg hover:scale-[1.01]'
}`}
```

修改为：
```tsx
className={`table-card group relative overflow-hidden flex flex-col justify-start aspect-square ${
  isSelected 
    ? 'ring-2 ring-[#07C160] shadow-md scale-[1.02]' 
    : 'hover:shadow-md hover:scale-[1.01]'
}`}
```

- [ ] **Step 7: 修改 TabRow 选中状态样式**

将：
```tsx
className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
  isSelected
    ? 'ring-2 ring-emerald-400 shadow-lg bg-gradient-to-r from-emerald-50 to-teal-50'
    : `bg-gradient-to-r ${statusConfig.bgClass} hover:shadow-md border ${statusConfig.borderClass}`
}`}
```

修改为：
```tsx
className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
  isSelected
    ? 'ring-2 ring-[#07C160] shadow-md bg-[#D1FAE5]'
    : `bg-white hover:shadow-md border ${statusConfig.borderClass}`
}`}
```

- [ ] **Step 8: 修改列表视图标题行样式**

将：
```tsx
<div className="flex items-center gap-4 px-4 py-2.5 text-sm text-slate-600 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200">
```

修改为：
```tsx
<div className="flex items-center gap-4 px-4 py-2.5 text-sm text-[#999999] bg-[#f7f7f7] rounded-xl border border-[#e5e5e5]">
```

- [ ] **Step 9: 修改右键菜单样式**

将：
```tsx
<div
  className="fixed bg-white shadow-xl rounded-xl border border-slate-200 z-50 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95"
```

修改为：
```tsx
<div
  className="fixed bg-white shadow-xl rounded-2xl border border-[#e5e5e5] z-50 overflow-hidden min-w-[180px] animate-in fade-in zoom-in-95"
```

- [ ] **Step 10: Commit**

```bash
git add src/components/TableBoard.tsx
git commit -m "style: redesign TableBoard with WeChat style"
```

---

## Task 7: 重设计 TableDrawer（微信风格抽屉）

**Files:**
- Modify: `src/components/TableDrawer.tsx`

**目标:** 更新 TableDrawer 为微信风格

- [ ] **Step 1: 读取完整文件内容**

```bash
cat src/components/TableDrawer.tsx
```

- [ ] **Step 2: 更新抽屉容器样式**

查找并修改抽屉容器的 className，将所有圆角改为 2xl/3xl，颜色改为微信风格

- [ ] **Step 3: 更新按钮样式**

将所有按钮改为微信绿渐变按钮或白色边框按钮

- [ ] **Step 4: 更新卡片样式**

将所有卡片背景改为白色，圆角改为 2xl

- [ ] **Step 5: Commit**

```bash
git add src/components/TableDrawer.tsx
git commit -m "style: redesign TableDrawer with WeChat style"
```

---

## Task 8: 重设计登录页面（微信风格）

**Files:**
- Modify: `src/app/login/page.tsx`

**目标:** 更新登录页面为微信风格，替换品牌名为"客稻云"

- [ ] **Step 1: 修改背景样式**

将：
```tsx
<div className="h-screen w-screen overflow-hidden flex bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50">
```

修改为：
```tsx
<div className="h-screen w-screen overflow-hidden flex bg-[#f7f7f7]">
```

- [ ] **Step 2: 修改品牌 Logo 区域**

将：
```tsx
<div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-[3rem] shadow-2xl mb-12">
```

修改为：
```tsx
<div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-[3rem] shadow-2xl mb-12">
```

将：
```tsx
<h1 className="text-6xl font-bold text-slate-800 mb-6 tracking-tight">
  客稻云
</h1>
```

修改为：
```tsx
<h1 className="text-6xl font-bold text-[#333333] mb-6 tracking-tight">
  客稻云
</h1>
```

将：
```tsx
<p className="text-2xl text-slate-600 mb-10 font-light">
  台球行业 SaaS 管理平台
</p>
```

修改为：
```tsx
<p className="text-2xl text-[#999999] mb-10 font-light">
  台球行业数字化管理平台
</p>
```

- [ ] **Step 3: 修改登录卡片样式**

将：
```tsx
<div className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-xl shadow-slate-200/50 border border-white/60 p-8">
```

修改为：
```tsx
<div className="bg-white rounded-3xl shadow-lg border border-[#e5e5e5] p-8">
```

- [ ] **Step 4: 修改登录表单标题**

将：
```tsx
<h2 className="text-2xl font-bold text-slate-800 mb-1">欢迎回来</h2>
<p className="text-sm text-slate-500">登录商家管理中心</p>
```

修改为：
```tsx
<h2 className="text-2xl font-bold text-[#333333] mb-1">欢迎回来</h2>
<p className="text-sm text-[#999999]">登录商家管理中心</p>
```

- [ ] **Step 5: 修改错误提示样式**

将：
```tsx
<div className="bg-red-50 border-2 border-red-200 text-red-600 px-6 py-5 rounded-3xl text-base">
```

修改为：
```tsx
<div className="bg-rose-50 border-2 border-rose-200 text-rose-600 px-6 py-5 rounded-2xl text-base">
```

- [ ] **Step 6: 修改输入框样式**

将：
```tsx
<input type="tel" ...
  className="w-full pl-12 pr-4 py-3 bg-slate-50/80 border border-slate-200 rounded-xl text-base placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 focus:bg-white transition-all"
/>
```

修改为：
```tsx
<input type="tel" ...
  className="w-full pl-12 pr-4 py-3 bg-white border border-[#e5e5e5] rounded-2xl text-base placeholder:text-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#D1FAE5] focus:border-[#07C160] transition-all"
/>
```

- [ ] **Step 7: 修改登录按钮样式**

将：
```tsx
<button type="submit" disabled={loading}
  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-semibold text-base rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:from-emerald-600 hover:to-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
```

修改为：
```tsx
<button type="submit" disabled={loading}
  className="w-full py-3 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white font-semibold text-base rounded-full shadow-lg shadow-[#07C160]/25 hover:shadow-xl hover:shadow-[#07C160]/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
>
```

- [ ] **Step 8: 修改底部版权信息**

将：
```tsx
<p className="text-center text-base text-slate-400 mt-10">
  © 2026 客稻云 · 台球行业数字化管理平台
</p>
```

修改为：
```tsx
<p className="text-center text-base text-[#999999] mt-10">
  © 2026 客稻云 · 台球行业数字化管理平台
</p>
```

- [ ] **Step 9: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "style: redesign login page with WeChat style"
```

---

## Task 9: 重设计选择门店页面（微信风格）

**Files:**
- Modify: `src/app/select-store/page.tsx`

**目标:** 更新选择门店页面为微信风格，替换品牌名为"客稻云"

- [ ] **Step 1: 修改背景样式**

将：
```tsx
<div className="h-screen w-screen bg-gradient-to-br from-sky-50 via-emerald-50 to-amber-50 flex items-center justify-center p-6">
```

修改为：
```tsx
<div className="h-screen w-screen bg-[#f7f7f7] flex items-center justify-center p-6">
```

- [ ] **Step 2: 修改 Logo 区域**

将：
```tsx
<div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-3xl shadow-xl mb-6">
```

修改为：
```tsx
<div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-3xl shadow-xl mb-6">
```

- [ ] **Step 3: 修改标题样式**

将：
```tsx
<h1 className="text-4xl font-bold text-slate-800 mb-3">选择门店</h1>
<p className="text-lg text-slate-500">请选择您要管理的门店</p>
```

修改为：
```tsx
<h1 className="text-4xl font-bold text-[#333333] mb-3">选择门店</h1>
<p className="text-lg text-[#999999]">请选择您要管理的门店</p>
```

- [ ] **Step 4: 修改门店列表卡片样式**

将：
```tsx
<div className="bg-white rounded-[3rem] shadow-2xl p-10">
```

修改为：
```tsx
<div className="bg-white rounded-3xl shadow-lg border border-[#e5e5e5] p-10">
```

- [ ] **Step 5: 修改门店项样式**

将：
```tsx
<button
  ...
  className="w-full flex items-center justify-between p-6 rounded-3xl border-2 border-slate-100 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all group disabled:opacity-50"
>
```

修改为：
```tsx
<button
  ...
  className="w-full flex items-center justify-between p-6 rounded-2xl border-2 border-[#e5e5e5] hover:border-[#07C160] hover:bg-[#D1FAE5]/50 transition-all group disabled:opacity-50"
>
```

- [ ] **Step 6: 修改门店图标样式**

将：
```tsx
<div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
```

修改为：
```tsx
<div className="w-16 h-16 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-xl flex items-center justify-center text-white font-bold text-2xl">
```

- [ ] **Step 7: 修改门店名称样式**

将：
```tsx
<h3 className="font-bold text-xl text-slate-800">{store.name}</h3>
<p className="text-base text-slate-400">{store.address}</p>
```

修改为：
```tsx
<h3 className="font-bold text-xl text-[#333333]">{store.name}</h3>
<p className="text-base text-[#999999]">{store.address}</p>
```

- [ ] **Step 8: 修改 ChevronRight 颜色**

将：
```tsx
<ChevronRight className="w-7 h-7 text-slate-300 group-hover:text-emerald-500 transition-colors" />
```

修改为：
```tsx
<ChevronRight className="w-7 h-7 text-[#cccccc] group-hover:text-[#07C160] transition-colors" />
```

- [ ] **Step 9: 修改重新加载按钮样式**

将：
```tsx
<button
  onClick={loadStores}
  className="px-8 py-4 bg-emerald-500 text-white text-base rounded-2xl hover:bg-emerald-600 transition-colors shadow-lg"
>
```

修改为：
```tsx
<button
  onClick={loadStores}
  className="px-8 py-4 bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white text-base rounded-full hover:opacity-90 transition-all shadow-lg"
>
```

- [ ] **Step 10: 修改底部版权信息**

将：
```tsx
<p className="text-center text-base text-slate-400 mt-10">
  © 2026 客稻云 · 台球行业数字化管理平台
</p>
```

修改为：
```tsx
<p className="text-center text-base text-[#999999] mt-10">
  © 2026 客稻云 · 台球行业数字化管理平台
</p>
```

- [ ] **Step 11: Commit**

```bash
git add src/app/select-store/page.tsx
git commit -m "style: redesign select-store page with WeChat style"
```

---

## Task 10: 更新 UI 组件（按钮、输入框、卡片）

**Files:**
- Modify: `src/components/ui/button.tsx`
- Modify: `src/components/ui/input.tsx`
- Modify: `src/components/ui/card.tsx`

**目标:** 更新 UI 组件为微信风格

- [ ] **Step 1: 更新按钮组件**

修改 `src/components/ui/button.tsx`，将主色调改为微信绿 (#07C160)

- [ ] **Step 2: 更新输入框组件**

修改 `src/components/ui/input.tsx`，将边框色改为浅灰，聚焦色改为微信绿

- [ ] **Step 3: 更新卡片组件**

修改 `src/components/ui/card.tsx`，将圆角改为 2xl，边框改为浅灰

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/button.tsx src/components/ui/input.tsx src/components/ui/card.tsx
git commit -m "style: update UI components to WeChat style"
```

---

## Task 11: 更新其他模态框组件

**Files:**
- Modify: `src/components/OpenTableModal.tsx`
- Modify: `src/components/CheckoutModal.tsx`
- Modify: `src/components/MemberModal.tsx`
- Modify: `src/components/ShiftModal.tsx`
- Modify: `src/components/ProductOrderModal.tsx`

**目标:** 更新所有模态框为微信风格

- [ ] **Step 1: 更新 OpenTableModal**

修改按钮和卡片样式为微信风格

- [ ] **Step 2: 更新 CheckoutModal**

修改支付按钮和卡片样式为微信风格

- [ ] **Step 3: 更新 MemberModal**

修改按钮和表单样式为微信风格

- [ ] **Step 4: 更新 ShiftModal**

修改按钮和卡片样式为微信风格

- [ ] **Step 5: 更新 ProductOrderModal**

修改按钮和卡片样式为微信风格

- [ ] **Step 6: Commit**

```bash
git add src/components/OpenTableModal.tsx src/components/CheckoutModal.tsx src/components/MemberModal.tsx src/components/ShiftModal.tsx src/components/ProductOrderModal.tsx
git commit -m "style: update modals to WeChat style"
```

---

## Task 12: 验证构建和测试

**Files:**
- Run: `pnpm build`

**目标:** 验证重构后的项目能正常构建

- [ ] **Step 1: 运行构建命令**

```bash
pnpm build
```

预期输出：构建成功，无错误警告

- [ ] **Step 2: 验证页面功能**

启动开发服务器验证页面功能：
```bash
pnpm dev:win
```

- [ ] **Step 3: Commit**

```bash
git add .
git commit -m "style: complete wwwpos refactoring to WeChat UI style"
```

---

## 自审查

### 1. Spec 覆盖检查

| 需求 | 对应任务 |
|------|---------|
| 微信绿主题（#07C160） | Task 1 |
| 浅灰背景（#f7f7f7） | Task 1 |
| 大圆角设计（24rpx） | Task 1 |
| 快捷操作栏移至左侧（340px） | Task 2 |
| HeaderBar 白色背景 | Task 3 |
| QuickPanel 微信风格 | Task 4 |
| TableBoard 微信风格卡片 | Task 6 |
| TableDrawer 微信风格 | Task 7 |
| 登录页微信风格 | Task 8 |
| 选择门店页微信风格 | Task 9 |
| 品牌替换为"客稻云" | Task 3, 8, 9 |
| 所有模态框微信风格 | Task 11 |

### 2. 占位符扫描

无占位符，所有步骤都有具体代码和命令

### 3. 类型一致性

所有任务使用统一的颜色变量和样式命名

---

## 执行方式

Plan complete and saved to `docs/superpowers/plans/2026-07-08-wwwpos-refactor-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
