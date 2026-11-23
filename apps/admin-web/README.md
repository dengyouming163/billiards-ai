# BilliardsHub - 台球厅商业管理系统

面向台球球房商家的 SaaS 管理平台，支持多门店管理、灵活计费、员工管理、商品库存等核心功能。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| UI | React 19, shadcn/ui, Tailwind CSS 4 |
| 语言 | TypeScript 5 |
| 图表 | Recharts |
| 图标 | Lucide React |
| 状态管理 | React Context + useReducer |
| API 模式 | 前后端分离（可切换 Mock/真实 API） |

## 项目结构

```
BilliardsHub/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── layout.tsx         # 根布局
│   │   ├── page.tsx           # 首页/Dashboard
│   │   ├── tables/            # 台桌管理
│   │   ├── pricing/           # 计费规则
│   │   ├── orders/            # 订单管理
│   │   ├── members/           # 会员管理
│   │   ├── employees/         # 员工管理
│   │   ├── assistants/        # 助教管理
│   │   ├── products/          # 商品管理
│   │   ├── inventory/         # 库存管理
│   │   ├── packages/          # 套餐管理
│   │   ├── finance/           # 财务对账
│   │   ├── reports/           # 经营报表
│   │   └── settings/          # 系统设置
│   ├── components/
│   │   ├── layout/            # 布局组件
│   │   │   ├── app-shell.tsx # 主布局容器
│   │   │   ├── sidebar.tsx   # 侧边导航
│   │   │   └── header.tsx    # 顶部栏
│   │   └── ui/               # shadcn/ui 组件库
│   ├── lib/
│   │   ├── api/              # API 服务层（前后端分离）
│   │   │   ├── config.ts     # API 配置
│   │   │   ├── types.ts      # API 类型定义
│   │   │   ├── client.ts     # HTTP 客户端
│   │   │   ├── index.ts      # 统一导出
│   │   │   ├── README.ts     # API 迁移指南
│   │   │   ├── tables.ts     # 台桌 API
│   │   │   ├── members.ts    # 会员 API
│   │   │   ├── orders.ts     # 订单 API
│   │   │   ├── products.ts    # 商品 API
│   │   │   ├── employees.ts  # 员工 API
│   │   │   ├── assistants.ts # 助教 API
│   │   │   ├── pricing.ts    # 计费 API
│   │   │   ├── packages.ts   # 套餐 API
│   │   │   ├── stores.ts     # 门店 API
│   │   │   ├── settings.ts   # 设置 API
│   │   │   └── reports.ts    # 报表 API
│   │   ├── hooks/
│   │   │   └── use-api-data.ts  # API 数据 Hook
│   │   ├── types.ts          # 核心类型定义
│   │   ├── data.ts           # Mock 数据层
│   │   └── utils.ts          # 工具函数
│   └── styles/
│       └── globals.css        # 全局样式
├── public/                   # 静态资源
├── .coze                     # Coze 项目配置
└── package.json
```

## 模块说明

### 1. 台桌管理 (`/tables`)

台桌的增删改查和状态管理。

**功能：**
- 台桌卡片列表，按分区分组展示
- 状态筛选：空闲/使用中/预约/维护
- 新增/编辑/删除台桌
- 绑定计费规则
- 二维码生成（台桌扫码开台）

**API 端点：**
```
GET    /tables              # 获取台桌列表
POST   /tables              # 创建台桌
PUT    /tables/:id          # 更新台桌
DELETE /tables/:id          # 删除台桌
GET    /tables/:id/qrcode  # 获取台桌二维码
```

### 2. 计费规则 (`/pricing`)

灵活的计费规则配置，支持 6 种计费类型。

**计费类型：**
- `time` - 按计时（分时段差异化定价）
- `round` - 按局数（每局固定价格）
- `period` - 包时段（整段时间包价）
- `mixed` - 混合计费（计时+局数组合）
- `cap` - 封顶计费（超时自动封顶）
- `member` - 会员专属（会员等级折扣）

**API 端点：**
```
GET    /pricing             # 获取计费规则列表
POST   /pricing             # 创建计费规则
PUT    /pricing/:id         # 更新计费规则
DELETE /pricing/:id         # 删除计费规则
```

### 3. 订单管理 (`/orders`)

支持三种订单类型的统一管理。

**订单类型：**
- `table` - 台桌订单（开台、计时、关台）
- `product` - 商品订单（酒水饮料等）
- `assistant` - 助教订单（陪练教学服务）

**API 端点：**
```
GET    /orders              # 获取订单列表
POST   /orders              # 创建订单
PUT    /orders/:id          # 更新订单
POST   /orders/:id/pay     # 订单支付
POST   /orders/:id/cancel  # 取消订单
```

### 4. 会员管理 (`/members`)

会员等级体系和余额管理。

**等级体系：**
- 普通会员
- 银卡会员
- 金卡会员
- 钻石会员

**API 端点：**
```
GET    /members             # 获取会员列表
POST   /members             # 创建会员
PUT    /members/:id         # 更新会员
DELETE /members/:id         # 删除会员
POST   /members/:id/recharge # 会员充值
GET    /members/:id/records  # 获取消费/充值记录
```

### 5. 员工管理 (`/employees`)

员工档案和排班考勤。

**角色权限：**
- 老板
- 店长
- 收银员
- 服务员
- 助教

**API 端点：**
```
GET    /employees           # 获取员工列表
POST   /employees           # 创建员工
PUT    /employees/:id       # 更新员工
DELETE /employees/:id       # 删除员工
GET    /employees/:id/schedule # 获取排班
POST   /employees/:id/schedule # 设置排班
```

### 6. 助教管理 (`/assistants`)

助教等级管理和业绩统计。

**等级体系：**
- 初级助教
- 中级助教
- 高级助教
- 金牌助教

**API 端点：**
```
GET    /assistants           # 获取助教列表
POST   /assistants           # 创建助教
PUT    /assistants/:id       # 更新助教
DELETE /assistants/:id       # 删除助教
GET    /assistants/:id/stats # 获取业绩统计
```

### 7. 商品管理 (`/products`)

商品分类和基础信息管理。

**API 端点：**
```
GET    /products             # 获取商品列表
POST   /products             # 创建商品
PUT    /products/:id         # 更新商品
DELETE /products/:id         # 删除商品
GET    /products/categories  # 获取分类列表
```

### 8. 库存管理 (`/inventory`)

进销存记录和库存预警。

**API 端点：**
```
GET    /inventory            # 获取库存列表
POST   /inventory/inbound    # 入库操作
POST   /inventory/outbound   # 出库操作
GET    /inventory/records    # 获取操作记录
GET    /inventory/alerts     # 获取库存预警
```

### 9. 套餐管理 (`/packages`)

多种套餐类型组合销售。

**套餐类型：**
- `time` - 时长套餐
- `product` - 商品套餐
- `mixed` - 混合套餐
- `member` - 会员套餐

**API 端点：**
```
GET    /packages             # 获取套餐列表
POST   /packages             # 创建套餐
PUT    /packages/:id         # 更新套餐
DELETE /packages/:id         # 删除套餐
```

### 10. 财务对账 (`/finance`)

营收统计和资金流水。

**API 端点：**
```
GET    /finance/summary     # 营收概览
GET    /finance/daily       # 日报表
GET    /finance/monthly     # 月报表
GET    /finance/flows       # 资金流水
GET    /finance/by-payment  # 按支付方式统计
```

### 11. 经营报表 (`/reports`)

经营数据分析和排行。

**API 端点：**
```
GET    /reports/revenue     # 营收趋势
GET    /reports/tables      # 台桌利用率
GET    /reports/products     # 商品销售排行
GET    /reports/members     # 会员消费排行
GET    /reports/assistants  # 助教业绩排行
```

### 12. 系统设置 (`/settings`)

系统配置和分区管理。

**Tab 页：**
- 门店信息
- 分区配置
- 支付设置
- 时段配置
- 通知设置
- 安全设置

**API 端点：**
```
GET    /settings/store       # 获取门店信息
PUT    /settings/store       # 更新门店信息
GET    /settings/zones      # 获取分区列表
POST   /settings/zones      # 创建分区
PUT    /settings/zones/:id  # 更新分区
DELETE /settings/zones/:id  # 删除分区
GET    /settings/payment    # 获取支付配置
PUT    /settings/payment    # 更新支付配置
GET    /settings/time-periods # 获取时段配置
POST   /settings/time-periods # 创建时段
PUT    /settings/time-periods/:id # 更新时段
DELETE /settings/time-periods/:id # 删除时段
```

## API 服务层

### 环境变量配置

创建 `.env.local` 文件：

```env
# API 基础地址（前后端分离模式）
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api

# API 密钥（可选）
# NEXT_PUBLIC_API_KEY=your_api_key

# 超时设置（毫秒）
NEXT_PUBLIC_API_TIMEOUT=30000
```

### 切换 API 模式

修改 `src/lib/data.ts`：

```typescript
// Mock 模式（开发阶段使用本地数据）
const USE_API_MODE = false;

// 真实 API 模式（对接后端服务）
const USE_API_MODE = true;
```

### 使用 API 服务

```typescript
import { useApiData } from '@/lib/hooks/use-api-data';
import { tablesApi } from '@/lib/api';

// 在组件中使用
function TablesPage() {
  const { data, loading, error, refetch } = useApiData(
    () => tablesApi.fetchTables({ storeId: 'store_1' }),
    []
  );

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      {data?.data.map(table => (
        <TableCard key={table.id} table={table} />
      ))}
    </div>
  );
}
```

### API 响应格式

所有 API 响应遵循统一格式：

```typescript
// 成功响应
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}

// 分页响应
{
  "success": true,
  "data": {
    "items": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}

// 错误响应
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数校验失败"
  }
}
```

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发环境（端口 5000，热更新）
pnpm dev

# 构建生产版本
pnpm build

# 生产环境预览
pnpm start

# 类型检查
pnpm ts-check

# 代码检查
pnpm lint
```

## 后端迁移指南

### 1. 实现 REST API

确保后端 API 遵循以下规范：

- **Base URL**: `/api/v1` 或自定义
- **认证方式**: Bearer Token (JWT)
- **内容类型**: `application/json`
- **响应格式**: 统一 JSON 格式（如上所示）

### 2. 接口对照表

| 前端模块 | 后端路由前缀 |
|---------|-------------|
| 台桌 | `/tables` |
| 计费 | `/pricing` |
| 订单 | `/orders` |
| 会员 | `/members` |
| 员工 | `/employees` |
| 助教 | `/assistants` |
| 商品 | `/products` |
| 库存 | `/inventory` |
| 套餐 | `/packages` |
| 财务 | `/finance` |
| 报表 | `/reports` |
| 设置 | `/settings` |

### 3. 认证流程

```typescript
// HTTP 客户端自动处理 Token
const client = new ApiClient({
  baseUrl: API_BASE_URL,
  getToken: () => localStorage.getItem('token'),
  onUnauthorized: () => {
    // Token 过期处理
    window.location.href = '/login';
  }
});
```

### 4. 错误处理

```typescript
// API 异常类
class ApiException extends Error {
  code: string;
  status: number;
  data?: any;
}

// 全局错误处理
client.onError = (error: ApiException) => {
  if (error.status === 401) {
    // 未授权
  } else if (error.status === 403) {
    // 无权限
  } else if (error.status >= 500) {
    // 服务器错误
  }
};
```

## 设计规范

### 主题色

| 用途 | 色值 | Tailwind |
|------|------|----------|
| 主色调 | `#00D4AA` | emerald/teal |
| 标题栏背景 | 渐变 emerald | `from-[#00D4AA] via-[#00B894] to-[#00A08A]` |
| 文字主色 | `#0f172a` | slate-900 |
| 文字次级 | `#64748b` | slate-500 |
| 页面背景 | `#f8fafc` | slate-50 |
| 卡片背景 | `#ffffff` | white |

### 圆角规范

| 组件 | 圆角 |
|------|------|
| 按钮 | `rounded-xl` |
| 卡片 | `rounded-2xl` |
| 输入框 | `rounded-xl` |
| 标签/徽章 | `rounded-lg` |
| 图标容器 | `rounded-xl` |

### 阴影规范

| 组件 | 阴影 |
|------|------|
| 按钮 | `shadow-lg` |
| 渐变图标容器 | `shadow-lg shadow-{color}-200` |
| 卡片 | `shadow-sm` |
| 标题栏 | `shadow-xl` |

## 注意事项

1. **Hydration 问题**: 避免在 JSX 中直接使用 `Date.now()`, `Math.random()` 等动态值
2. **状态管理**: 全局状态通过 `useApp()` hook 访问
3. **图标导入**: 使用 Lucide React，确保导入的图标名称正确
4. **类型检查**: 提交前运行 `pnpm ts-check` 确保无类型错误

## 许可证

私有项目，仅供内部使用。
