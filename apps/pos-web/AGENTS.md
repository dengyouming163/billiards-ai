# VenueIQ - 收银端

## 项目概览

商业台球厅收银终端，为16:9宽屏收银机优化的全栈应用。

## 架构概览

项目采用**前后端分离**架构，通过 Service 层抽象数据访问：

```
前端组件 → AppContext → Service 接口 → LocalService（开发）/ ApiService（生产）
```

- **Service 接口** (`src/services/types.ts`)：定义所有后端操作的抽象接口
- **LocalService** (`src/services/local-service.ts`)：本地实现，使用内存 + 静态数据
- **ApiService** (`src/services/api-service.ts`)：远程 API 实现，调用 `/api/*` 路由

切换实现只需修改 `src/services/index.ts` 中的导出，或设置 `NEXT_PUBLIC_SERVICE_MODE=api` 环境变量。

## 技术栈

- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI**: Tailwind CSS 4 + Custom CSS Variables
- **Icons**: Lucide React

## 目录结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── tables/       # 台球桌管理
│   │   ├── orders/        # 订单管理
│   │   ├── payments/      # 支付管理
│   │   ├── members/       # 会员管理
│   │   ├── shifts/        # 交接班管理
│   │   └── sync/          # 数据同步
│   ├── globals.css        # 全局样式
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/             # React 组件
│   ├── TableBoard.tsx     # 台球桌看板（网格/列表）
│   ├── TableDrawer.tsx    # 台球桌详情抽屉
│   ├── OpenTableModal.tsx # 开台弹窗
│   ├── ProductOrderModal.tsx # 商品点单
│   ├── CheckoutModal.tsx  # 结账收银
│   ├── MemberModal.tsx    # 会员管理
│   ├── ShiftModal.tsx     # 交接班
│   ├── QuickPanel.tsx     # 快捷面板
│   ├── HeaderBar.tsx      # 顶部栏
│   └── StatusBar.tsx       # 状态栏
├── context/               # React Context
│   └── AppContext.tsx     # 全局状态管理（委托 Service 层）
├── services/              # 服务层（前后端分离核心）
│   ├── types.ts          # Service 接口定义
│   ├── local-service.ts  # 本地实现（内存+静态数据）
│   ├── api-service.ts    # API 实现（调用后端接口）
│   └── index.ts          # 服务入口 & 切换配置
├── data/                  # 模拟数据
│   └── mock-data.ts
└── types/                 # TypeScript 类型
    └── index.ts
```

## 开发命令

```bash
pnpm install      # 安装依赖
pnpm dev         # 启动开发服务器
pnpm build       # 构建生产版本
pnpm lint        # 代码检查
pnpm ts-check    # TypeScript 检查
```

## 功能模块

### 1. 台球桌看板
- 网格/列表双模式展示
- 状态筛选（空闲/使用中/预约/清洁中）
- 实时计时器显示
- 点击打开详情抽屉

### 2. 开台/关台
- 选择人数和套餐
- 助教上桌
- 实时台费计算
- 多种支付方式

### 3. 商品点单
- 分类浏览
- 扫码枪录入
- 单品/整单备注
- 购物车管理

### 4. 多渠道收银
- 现金/微信/支付宝
- 会员余额/积分
- 美团/抖音券核销
- 组合支付

### 5. 会员管理
- 新会员开卡
- 会员充值（多档位）
- 积分/优惠券

### 6. 交接班
- 班次开始/结束
- 现金核对
- 营业汇总

### 7. 离线模式
- 网络状态检测
- 离线数据缓存
- 自动同步

## API 端点

| 端点 | 方法 | 描述 |
|------|------|------|
| `/api/tables` | GET/POST | 台球桌列表/操作 |
| `/api/orders` | GET/POST | 订单管理 |
| `/api/payments` | GET/POST/PUT | 支付管理/优惠券验证 |
| `/api/members` | GET/POST/PUT | 会员管理 |
| `/api/shifts` | GET/POST | 交接班管理 |
| `/api/sync` | POST | 离线数据同步 |

## 环境变量

- `DEPLOY_RUN_PORT`: 服务端口（默认 5000）
- `COZE_PROJECT_DOMAIN_DEFAULT`: 访问域名
- `COZE_WORKSPACE_PATH`: 工作目录
