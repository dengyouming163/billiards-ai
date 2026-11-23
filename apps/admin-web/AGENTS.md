# VenueIQ - 多业态场馆智能运营平台

## 项目概览

这是一个面向台球、KTV、棋牌等多业态场馆商家的 SaaS 管理平台，支持多门店管理、灵活计费、员工管理、商品库存等核心功能。

### 技术栈

- **框架**: Next.js 16 (App Router)
- **UI**: React 19, shadcn/ui, Tailwind CSS 4
- **语言**: TypeScript 5
- **图表**: Recharts
- **图标**: Lucide React
- **状态管理**: React Context + useReducer
- **数据**: localStorage Mock 数据层

### 访问地址

- 开发环境: `http://localhost:5000`
- 线上地址: `${COZE_PROJECT_DOMAIN_DEFAULT}`

## 开发命令

```bash
# 安装依赖
pnpm install

# 开发环境 (端口 5000)
pnpm dev

# 构建生产版本
pnpm build

# 生产环境预览
pnpm start
```

## 项目结构

```
src/
├── app/                    # Next.js App Router 页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页/Dashboard
│   ├── tables/page.tsx    # 台桌管理
│   ├── pricing/page.tsx   # 计费规则管理
│   ├── orders/page.tsx    # 订单管理
│   ├── members/page.tsx   # 会员管理
│   ├── employees/page.tsx # 员工管理
│   ├── assistants/page.tsx# 助教管理
│   ├── products/page.tsx  # 商品管理
│   ├── inventory/page.tsx # 库存管理
│   ├── finance/page.tsx   # 财务对账
│   ├── reports/page.tsx   # 经营报表
│   └── settings/page.tsx  # 系统设置
├── components/
│   ├── layout/            # 布局组件
│   │   ├── app-shell.tsx # 主布局容器
│   │   ├── sidebar.tsx   # 侧边导航
│   │   └── header.tsx    # 顶部栏
│   └── ui/               # shadcn/ui 组件库
├── hooks/
│   └── use-app.tsx       # 全局状态管理
└── lib/
    ├── types.ts           # TypeScript 类型定义
    ├── data.ts            # Mock 数据层
    └── utils.ts           # 工具函数
```

## 核心功能模块

### 1. 多门店切换
- 顶部门店选择器一键切换
- 各门店数据独立管理
- 门店切换自动刷新数据

### 2. 台桌管理
- 卡片/列表双视图
- 状态筛选（空闲/使用中/预约/维护）
- 分区筛选
- 实时状态卡片展示

### 3. 计费规则管理
- **6种计费类型**:
  - 按计时: 分时段差异化定价
  - 按局数: 每局固定价格
  - 包时段: 整段时间包价
  - 混合计费: 计时+局数组合
  - 封顶计费: 超时自动封顶
  - 会员专属: 会员等级折扣

### 4. 订单管理
- 台桌订单: 开台、计时、关台
- 商品订单: 酒水饮料等
- 助教订单: 陪练教学服务
- 合并支付与结算

### 5. 会员管理
- 等级体系: 普通/银卡/金卡/钻石
- 余额与积分管理
- 充值记录与消费记录

### 6. 员工管理
- 多角色权限: 老板/店长/收银员/服务员/助教
- 员工档案管理
- 排班与考勤

### 7. 助教管理
- 等级体系: 初级/中级/高级/金牌
- 擅长领域标签
- 业绩统计排行

### 8. 商品与库存
- 商品分类管理
- 进销存记录
- 库存预警

### 9. 财务对账
- 营收日报/月报
- 资金流水明细
- 订单导出

### 10. 经营报表
- 营收趋势图
- 台桌利用率排行
- 商品/会员/助教排行榜

### 11. 系统设置
- 门店信息编辑
- 分区管理
- 时段配置
- 通知/安全/显示设置

## 类型定义

核心类型定义在 `src/lib/types.ts`:

```typescript
// 门店
interface Store {
  id: string;
  name: string;
  businessHours: { start: string; end: string };
  status: 'active' | 'inactive';
}

// 台桌
interface Table {
  id: string;
  number: string;
  type: 'standard' | 'tournament' | 'snooker';
  status: 'idle' | 'occupied' | 'reserved' | 'maintenance';
}

// 计费规则
interface PricingRule {
  type: 'time' | 'round' | 'period' | 'mixed' | 'cap' | 'member';
  config: PricingConfig;
  status: 'active' | 'inactive';
}

// 订单
interface Order {
  type: 'table' | 'product' | 'assistant';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}
```

## Mock 数据层

`src/lib/data.ts` 中的 `DataStore` 类管理所有数据:

```typescript
const dataStore = new DataStore();

// 获取数据
dataStore.getStores()
dataStore.getTables(storeId)
dataStore.getOrders(storeId)
dataStore.getMembers(storeId)

// 更新数据
dataStore.setTables(tables)
dataStore.setOrders(orders)
```

## 注意事项

1. **Hydration 问题**: 避免在 JSX 中直接使用 `Date.now()`, `Math.random()` 等动态值
2. **状态管理**: 全局状态通过 `useApp()` hook 访问
3. **图标导入**: 使用 Lucide React，确保导入的图标名称正确
4. **类型检查**: 提交前运行 `pnpm ts-check` 确保无类型错误
