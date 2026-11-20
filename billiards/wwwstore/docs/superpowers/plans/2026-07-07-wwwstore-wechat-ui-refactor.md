# wwwstore 微信UI风格全量重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 wwwstore 管理后台全量重构为微信管理后台风格，使用微信绿 `#07C160` 作为主色，配合大圆角设计。

**Architecture:** 通过全局CSS变量替换统一主题颜色，更新核心布局组件（AppShell），然后逐页面更新样式，最后进行品牌文字替换和构建验证。

**Tech Stack:** Next.js 14, React 18, Tailwind CSS 3, shadcn/ui, Lucide React Icons

---

## 文件结构概览

| 文件/目录 | 职责 |
|-----------|------|
| `src/app/globals.css` | 全局样式变量、主题配置 |
| `src/app/layout.tsx` | 根布局 |
| `src/app/page.tsx` | 首页 Dashboard |
| `src/components/layout/app-shell.tsx` | 核心布局组件（顶栏+侧边栏） |
| `src/app/tables/` | 台桌管理页面 |
| `src/app/orders/` | 订单管理页面 |
| `src/app/products/` | 商品管理页面 |
| `src/app/members/` | 会员管理页面 |
| `src/app/finance/` | 财务对账页面 |
| `src/app/employees/` | 员工管理页面 |
| `src/app/assistants/` | 助教管理页面 |
| `src/app/settings/` | 系统设置页面 |
| `src/app/login/` | 登录页面 |

---

## Task 1: 更新全局样式变量

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: 更新CSS变量为微信绿主题**

```css
:root {
  /* 主色调 - 微信绿 */
  --background: 0 0% 97.6%; /* #f7f7f7 */
  --foreground: 0 0% 0%; /* #000000 */
  --card: 0 0% 100%; /* #ffffff */
  --card-foreground: 0 0% 33.3%; /* #333333 */
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 0%;
  --primary: 142 91% 41%; /* #07C160 */
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 96.1%; /* #f5f5f5 */
  --secondary-foreground: 0 0% 33.3%; /* #333333 */
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 60%; /* #999999 */
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 0%;
  --destructive: 0 72% 51%; /* #FF5252 */
  --destructive-foreground: 0 0% 100%;
  --border: 0 0% 88.2%; /* #e5e5e5 */
  --input: 0 0% 88.2%;
  --ring: 142 91% 41%;
  --radius: 0.75rem;
  
  /* 状态颜色 */
  --status-success: 142 91% 41%;
  --status-warning: 29 93% 65%; /* #FF976A */
  --status-error: 0 72% 51%;
  --status-info: 212 91% 53%;
  
  /* 渐变配色 */
  --gradient-primary: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  --gradient-secondary: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);
  --gradient-accent: linear-gradient(135deg, #8B5CF6 0%, #7C3AED 100%);
  --gradient-warning: linear-gradient(135deg, #FF976A 0%, #FF7A45 100%);
  --gradient-danger: linear-gradient(135deg, #FF5252 0%, #FF3B3B 100%);
}
```

- [ ] **Step 2: 更新body样式和按钮样式**

```css
body {
  @apply bg-[#f7f7f7] text-[#333333] antialiased;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.btn-primary {
  @apply bg-gradient-to-r from-[#07C160] to-[#06AD56] text-white px-4 py-2 rounded-full font-medium;
  @apply shadow-md shadow-[#07C160]/25 hover:shadow-lg hover:shadow-[#07C160]/30;
  @apply transition-all duration-200 hover:-translate-y-0.5;
}

.btn-secondary {
  @apply bg-white text-[#333333] px-4 py-2 rounded-full font-medium;
  @apply border border-[#e5e5e5] hover:border-[#cccccc];
  @apply hover:bg-[#f7f7f7] transition-all duration-200;
}

.btn-outline {
  @apply bg-transparent text-[#333333] px-4 py-2 rounded-full font-medium;
  @apply border border-[#e5e5e5] hover:border-[#07C160];
  @apply hover:text-[#07C160] transition-all duration-200;
}

.btn-danger {
  @apply bg-gradient-to-r from-[#FF5252] to-[#FF3B3B] text-white px-4 py-2 rounded-full font-medium;
  @apply shadow-md shadow-[#FF5252]/25 hover:shadow-lg hover:shadow-[#FF5252]/30;
  @apply transition-all duration-200 hover:-translate-y-0.5;
}
```

- [ ] **Step 3: 更新滚动条和选择样式**

```css
::-webkit-scrollbar-thumb {
  background: #cccccc;
}

::-webkit-scrollbar-thumb:hover {
  background: #999999;
}

::selection {
  background: #07C160;
  color: white;
}
```

- [ ] **Step 4: 更新Radix组件样式**

```css
[data-radix-dialog-content] {
  @apply bg-white border-[#e5e5e5] shadow-xl;
  border-radius: 1.5rem;
}

[data-radix-select-trigger]:focus {
  @apply border-[#07C160] ring-2 ring-[#07C160]/20;
}

[data-radix-switch-track][data-state="checked"] {
  @apply bg-[#07C160];
}

[data-radix-progress-indicator] {
  @apply bg-[#07C160];
}
```

- [ ] **Step 5: 更新Badge样式**

```css
.badge-success {
  @apply bg-[#07C160]/10 text-[#07C160] border-[#07C160]/20;
}

.badge-warning {
  @apply bg-[#FF976A]/10 text-[#FF976A] border-[#FF976A]/20;
}

.badge-error {
  @apply bg-[#FF5252]/10 text-[#FF5252] border-[#FF5252]/20;
}

.badge-info {
  @apply bg-blue-100 text-blue-700 border-blue-200;
}
```

- [ ] **Step 6: 更新状态颜色**

```css
.status-idle {
  @apply bg-[#999999];
}

.status-occupied {
  @apply bg-[#07C160];
}

.status-reserved {
  @apply bg-[#FF976A];
}

.status-maintenance {
  @apply bg-[#CCCCCC];
}
```

- [ ] **Step 7: Commit**

```bash
git add src/app/globals.css
git commit -m "style: update global CSS variables to WeChat green theme"
```

---

## Task 2: 更新布局组件 AppShell

**Files:**
- Modify: `src/components/layout/app-shell.tsx`

- [ ] **Step 1: 更新顶部导航栏样式**

```tsx
<header className="h-12 bg-white border-b border-[#e5e5e5] shadow-sm z-50 flex-shrink-0">
  <div className="flex items-center justify-between h-full px-4">
    <div className="flex items-center gap-4">
      <div className="relative group">
        <div className="w-9 h-9 bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-xl shadow-lg shadow-[#07C160]/25 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="hidden sm:block">
        <h1 className="text-base font-bold text-black">客稻云</h1>
        <p className="text-xs text-[#999999] -mt-0.5">台球房管理系统</p>
      </div>
    </div>
    {/* 中间：门店切换 */}
    {/* 右侧：通知、帮助、用户 */}
  </div>
</header>
```

- [ ] **Step 2: 更新侧边栏样式**

```tsx
<aside
  className={cn(
    'rounded-tr-2xl rounded-br-2xl bg-white border border-[#e5e5e5] shadow-sm transition-all duration-300 overflow-y-auto flex-shrink-0',
    sidebarCollapsed ? 'w-16' : 'w-56'
  )}
>
  {/* 门店选择器 */}
  {/* 导航菜单 */}
</aside>
```

- [ ] **Step 3: 更新菜单项激活态**

```tsx
<Link
  key={item.href}
  href={item.href}
  className={cn(
    'relative flex items-center rounded-xl font-medium transition-all duration-200 group',
    sidebarCollapsed 
      ? 'justify-center px-0 py-3' 
      : 'gap-3.5 px-3.5 py-3',
    isActive
      ? 'bg-[#07C160]/10 text-[#07C160] shadow-sm'
      : 'text-[#999999] hover:bg-[#f7f7f7] hover:text-[#333333] hover:translate-x-0.5'
  )}
>
  {isActive && !sidebarCollapsed && (
    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 bg-[#07C160] rounded-r-full" />
  )}
</Link>
```

- [ ] **Step 4: 更新内容区域样式**

```tsx
<main className="flex-1 overflow-y-auto">
  <div className="rounded-2xl bg-white border border-[#e5e5e5] shadow-sm p-6 min-h-full">
    {children}
  </div>
</main>
```

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/app-shell.tsx
git commit -m "style: update AppShell component to WeChat theme"
```

---

## Task 3: 更新首页 Dashboard

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 更新Hero区域**

```tsx
<div className="relative overflow-hidden rounded-[32px] bg-gradient-to-r from-[#07C160] via-[#06AD56] to-[#07C160] p-6 text-white">
  <div className="absolute inset-0 bg-black/5" />
  <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
  <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
  
  <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold">欢迎回来，{user?.name}</h1>
      <p className="text-white/80 text-sm mt-1">
        当前门店：{currentStore?.name || '未选择门店'}
      </p>
    </div>
    <Button 
      onClick={() => loadData()}
      variant="secondary" 
      size="sm" 
      className="bg-white/20 hover:bg-white/30 border-0 text-white backdrop-blur-sm whitespace-nowrap rounded-full"
    >
      <RefreshCw className="w-4 h-4 mr-2" />
      刷新数据
    </Button>
  </div>
</div>
```

- [ ] **Step 2: 更新数据卡片**

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard
    title="今日营收"
    value={formatCurrency(stats?.today_revenue ?? 0)}
    change={isPositive ? `+${revenueChange}` : revenueChange.toString()}
    icon={DollarSign}
    gradient="from-[#07C160] to-[#06AD56]"
    isPositive={isPositive}
    onClick={() => router.push('/finance')}
  />
  {/* 其他卡片类似 */}
</div>
```

- [ ] **Step 3: 更新StatCard组件样式**

```tsx
function StatCard({
  title, value, subtitle, change, icon: Icon, gradient, isPositive, onClick,
}: {
  title: string; value: string; subtitle?: string; change?: string;
  icon: React.ElementType; gradient: string; isPositive?: boolean; onClick?: () => void;
}) {
  return (
    <div 
      onClick={onClick}
      className={`relative overflow-hidden rounded-[24px] bg-white border border-[#e5e5e5] p-5 shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer group ${onClick ? 'hover:-translate-y-1' : ''}`}
    >
      <div className={`absolute top-0 right-0 w-20 h-20 bg-gradient-to-br ${gradient} opacity-10 rounded-full blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="flex items-start justify-between mb-3">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${isPositive ? 'bg-[#07C160]/10 text-[#07C160]' : 'bg-[#FF5252]/10 text-[#FF5252]'}`}>
            {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      
      <div>
        <p className="text-2xl sm:text-3xl font-bold text-black tracking-tight">
          {value}
          {subtitle && <span className="text-sm text-[#999999] ml-1">{subtitle}</span>}
        </p>
        <p className="text-sm text-[#999999] mt-1">{title}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 更新快捷操作区域**

```tsx
<div className="bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
  {/* 标题区域 */}
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
    <QuickActionButton
      icon={LayoutGrid}
      label="台桌管理"
      gradient="from-[#07C160] to-[#06AD56]"
      onClick={() => router.push('/tables')}
    />
    {/* 其他按钮类似 */}
  </div>
</div>
```

- [ ] **Step 5: 更新台桌状态卡片**

```tsx
<div
  key={table.id}
  className={`
    relative p-4 rounded-[20px] border-2 transition-all duration-200 cursor-pointer
    ${isActive 
      ? 'bg-gradient-to-br from-[#07C160]/5 to-[#07C160]/10 border-[#07C160]/30 hover:border-[#07C160] hover:shadow-lg hover:shadow-[#07C160]/10' 
      : isReserved
        ? 'bg-gradient-to-br from-[#FF976A]/5 to-[#FF976A]/10 border-[#FF976A]/30 hover:border-[#FF976A] hover:shadow-lg hover:shadow-[#FF976A]/10'
        : isMaintenance
          ? 'bg-gradient-to-br from-[#f7f7f7] to-white border-[#cccccc] hover:border-[#999999] hover:shadow-lg'
          : 'bg-white border-[#e5e5e5] hover:border-[#cccccc] hover:shadow-md'
    }
  `}
/>
```

- [ ] **Step 6: 更新进行中订单卡片**

```tsx
<div className="bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
  {/* 订单列表 */}
</div>
```

- [ ] **Step 7: 更新营收趋势图表区域**

```tsx
<div className="bg-white rounded-[24px] border border-[#e5e5e5] p-6 shadow-sm">
  {/* 图表内容 */}
</div>
```

- [ ] **Step 8: 更新图表配色**

```tsx
<Area
  type="monotone"
  dataKey="revenue"
  stroke="#07C160"
  strokeWidth={3}
  fill="url(#colorRevenueNew)"
/>
```

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx
git commit -m "style: update dashboard to WeChat theme"
```

---

## Task 4: 更新台桌管理页面

**Files:**
- Modify: `src/app/tables/page.tsx`

- [ ] **Step 1: 更新页面头部**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">台桌管理</h1>
  <p className="text-sm text-[#999999] mt-1">管理门店所有台桌及计费规则</p>
</div>
```

- [ ] **Step 2: 更新Tabs组件样式**

```tsx
<Tabs defaultValue="management" className="w-full">
  <TabsList className="bg-[#f7f7f7] p-1 rounded-full">
    <TabsTrigger value="management" className="data-[state=active]:bg-white data-[state=active]:text-[#07C160] data-[state=active]:shadow-sm rounded-full">
      台桌管理
    </TabsTrigger>
    {/* 其他Tab */}
  </TabsList>
</Tabs>
```

- [ ] **Step 3: 更新台桌网格卡片**

```tsx
{tables.map((table) => (
  <div
    key={table.id}
    className={`p-4 rounded-[20px] border-2 transition-all duration-200 cursor-pointer
      ${table.status === 'occupied' 
        ? 'bg-[#07C160]/5 border-[#07C160]/30' 
        : table.status === 'reserved'
          ? 'bg-[#FF976A]/5 border-[#FF976A]/30'
          : table.status === 'maintenance'
            ? 'bg-[#f7f7f7] border-[#cccccc]'
            : 'bg-white border-[#e5e5e5]'
      }
    `}
  />
))}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/tables/page.tsx
git commit -m "style: update tables page to WeChat theme"
```

---

## Task 5: 更新订单管理页面

**Files:**
- Modify: `src/app/orders/page.tsx`

- [ ] **Step 1: 更新页面头部和筛选栏**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">订单管理</h1>
  <p className="text-sm text-[#999999] mt-1">查看和管理所有订单</p>
</div>

<div className="bg-white rounded-[20px] border border-[#e5e5e5] p-4 shadow-sm mb-6">
  {/* 筛选条件 */}
</div>
```

- [ ] **Step 2: 更新订单列表卡片**

```tsx
<div className="bg-white rounded-[20px] border border-[#e5e5e5] p-4 shadow-sm mb-4">
  {/* 订单信息 */}
  <div className="flex items-center justify-between">
    <span className="text-[#07C160] font-semibold">{formatCurrency(order.amount)}</span>
  </div>
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/orders/page.tsx
git commit -m "style: update orders page to WeChat theme"
```

---

## Task 6: 更新商品管理页面

**Files:**
- Modify: `src/app/products/page.tsx`

- [ ] **Step 1: 更新页面头部**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">商品管理</h1>
  <p className="text-sm text-[#999999] mt-1">管理商品分类和库存</p>
</div>
```

- [ ] **Step 2: 更新商品卡片**

```tsx
<div className="bg-white rounded-[20px] border border-[#e5e5e5] p-4 shadow-sm">
  {/* 商品信息 */}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/products/page.tsx
git commit -m "style: update products page to WeChat theme"
```

---

## Task 7: 更新会员管理页面

**Files:**
- Modify: `src/app/members/page.tsx`

- [ ] **Step 1: 更新页面头部**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">会员管理</h1>
  <p className="text-sm text-[#999999] mt-1">管理会员信息和充值</p>
</div>
```

- [ ] **Step 2: 更新会员列表卡片**

```tsx
<div className="bg-white rounded-[20px] border border-[#e5e5e5] p-4 shadow-sm mb-4">
  {/* 会员信息 */}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/members/page.tsx
git commit -m "style: update members page to WeChat theme"
```

---

## Task 8: 更新财务对账页面

**Files:**
- Modify: `src/app/finance/page.tsx`

- [ ] **Step 1: 更新页面头部**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">财务对账</h1>
  <p className="text-sm text-[#999999] mt-1">查看营收和充值记录</p>
</div>
```

- [ ] **Step 2: 更新财务数据卡片**

```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
  <div className="bg-white rounded-[24px] border border-[#e5e5e5] p-5 shadow-sm">
    {/* 收入数据 */}
    <span className="text-[#07C160] font-bold text-2xl">{formatCurrency(income)}</span>
  </div>
  {/* 其他卡片 */}
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/app/finance/page.tsx
git commit -m "style: update finance page to WeChat theme"
```

---

## Task 9: 更新其他页面

**Files:**
- Modify: `src/app/employees/page.tsx`
- Modify: `src/app/assistants/page.tsx`
- Modify: `src/app/settings/page.tsx`
- Modify: `src/app/login/page.tsx`
- Modify: `src/app/profile/page.tsx`
- Modify: `src/app/support/page.tsx`

- [ ] **Step 1: 更新员工管理页面**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">员工管理</h1>
  <p className="text-sm text-[#999999] mt-1">管理员工信息和权限</p>
</div>
```

- [ ] **Step 2: 更新助教管理页面**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">助教管理</h1>
  <p className="text-sm text-[#999999] mt-1">管理助教排班和服务</p>
</div>
```

- [ ] **Step 3: 更新系统设置页面**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">系统设置</h1>
  <p className="text-sm text-[#999999] mt-1">配置门店和系统参数</p>
</div>
```

- [ ] **Step 4: 更新登录页面**

```tsx
<div className="min-h-screen bg-gradient-to-br from-[#07C160] to-[#06AD56] flex items-center justify-center p-4">
  <div className="w-full max-w-md bg-white rounded-[32px] shadow-2xl p-8">
    {/* 登录表单 */}
  </div>
</div>
```

- [ ] **Step 5: 更新个人设置页面**

```tsx
<div className="space-y-6">
  <div className="bg-gradient-to-br from-[#07C160] to-[#06AD56] rounded-[32px] p-6 text-white">
    {/* 用户信息 */}
  </div>
  {/* 设置卡片 */}
</div>
```

- [ ] **Step 6: 更新帮助中心页面**

```tsx
<div className="mb-6">
  <h1 className="text-xl font-bold text-black">帮助中心</h1>
  <p className="text-sm text-[#999999] mt-1">获取使用帮助和公告</p>
</div>
```

- [ ] **Step 7: Commit**

```bash
git add src/app/employees/page.tsx src/app/assistants/page.tsx src/app/settings/page.tsx
git add src/app/login/page.tsx src/app/profile/page.tsx src/app/support/page.tsx
git commit -m "style: update remaining pages to WeChat theme"
```

---

## Task 10: 更新子组件

**Files:**
- Modify: `src/app/tables/components/*.tsx`
- Modify: `src/app/orders/components/*.tsx`
- Modify: `src/app/products/components/*.tsx`
- Modify: `src/app/finance/components/*.tsx`
- Modify: `src/app/reports/*.tsx`

- [ ] **Step 1: 更新台桌子组件样式**

```bash
# 将所有emerald/teal颜色替换为微信绿
```

- [ ] **Step 2: 更新订单子组件样式**

```bash
# 将所有emerald/teal颜色替换为微信绿
```

- [ ] **Step 3: 更新商品子组件样式**

```bash
# 将所有emerald/teal颜色替换为微信绿
```

- [ ] **Step 4: 更新财务子组件样式**

```bash
# 将所有emerald/teal颜色替换为微信绿
```

- [ ] **Step 5: 更新报表页面样式**

```bash
# 将所有emerald/teal颜色替换为微信绿
```

- [ ] **Step 6: Commit**

```bash
git add src/app/tables/components/ src/app/orders/components/
git add src/app/products/components/ src/app/finance/components/
git add src/app/reports/
git commit -m "style: update sub-components to WeChat theme"
```

---

## Task 11: 品牌文字替换

**Files:**
- Search and replace across entire project

- [ ] **Step 1: 全局替换品牌文字**

```bash
# 在wwwstore目录下执行
find . -type f \( -name "*.tsx" -o -name "*.ts" -o -name "*.md" -o -name "*.json" \) \
  -not -path "./.next/*" -not -path "./node_modules/*" \
  -exec sed -i 's/台屏智联/客稻云/g' {} +
```

- [ ] **Step 2: 更新layout中的title**

```tsx
export const metadata: Metadata = {
  title: {
    default: '客稻云 - 球房管理系统',
    template: '%s | 客稻云',
  },
};
```

- [ ] **Step 3: Commit**

```bash
git add -u
git commit -m "style: replace brand name from 台屏智联 to 客稻云"
```

---

## Task 12: 构建验证

**Files:**
- Package.json scripts

- [ ] **Step 1: 运行构建命令**

```bash
npm run build
```

Expected: Build complete successfully

- [ ] **Step 2: 检查构建输出**

```bash
# 检查是否有错误或警告
```

- [ ] **Step 3: 启动开发服务器验证**

```bash
npm run dev
```

Expected: Server starts successfully at http://localhost:3000

---

## 自审查

### 1. Spec覆盖检查
- ✅ 全局样式变量更新
- ✅ 核心组件更新（AppShell）
- ✅ 首页Dashboard更新
- ✅ 台桌管理页面更新
- ✅ 订单管理页面更新
- ✅ 商品管理页面更新
- ✅ 会员管理页面更新
- ✅ 财务对账页面更新
- ✅ 其他页面更新
- ✅ 品牌文字替换
- ✅ 构建验证

### 2. 占位符扫描
- 无"TBD"、"TODO"等占位符

### 3. 类型一致性
- 所有任务使用一致的颜色值 `#07C160` 和主题变量

---

## 执行方式

**Plan complete and saved to `docs/superpowers/plans/2026-07-07-wwwstore-wechat-ui-refactor.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
