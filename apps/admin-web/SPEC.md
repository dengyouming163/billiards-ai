# 多商户商业台球球房管理系统 - 商家管理端

## 1. Concept & Vision

打造一款专业、高效、智能的商业台球球房管理系统，专为连锁台球品牌设计。系统以"全局掌控、灵活运营、数据驱动"为核心价值，帮助老板和店长实现多门店统一管理、精细化运营和精准决策支持。界面风格采用深色主题配合台球元素的专业氛围，营造沉浸式的商业管理体验。

## 2. Design Language

### 2.1 Aesthetic Direction
- **风格定位**: 深色专业管理后台 + 台球运动元素
- **视觉隐喻**: 台球桌面绿色、台球杆金色点缀
- **整体调性**: 专业可靠、沉稳大气、高效务实

### 2.2 Color Palette
```css
:root {
  /* Primary - 台球绿 */
  --primary: #10B981;
  --primary-foreground: #FFFFFF;
  --primary-hover: #059669;

  /* Secondary - 深邃蓝 */
  --secondary: #1E3A5F;
  --secondary-foreground: #FFFFFF;

  /* Accent - 金色点缀 */
  --accent: #F59E0B;
  --accent-foreground: #FFFFFF;

  /* Background - 深色背景 */
  --background: #0F172A;
  --background-secondary: #1E293B;
  --background-card: #1E293B;
  --background-elevated: #334155;

  /* Text */
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --text-muted: #64748B;

  /* Status Colors */
  --success: #22C55E;
  --warning: #EAB308;
  --error: #EF4444;
  --info: #3B82F6;

  /* Table Status */
  --table-idle: #22C55E;      /* 空闲 - 绿色 */
  --table-occupied: #EF4444;  /* 使用中 - 红色 */
  --table-reserved: #F59E0B;  /* 预约中 - 橙色 */
  --table-maintenance: #6B7280; /* 维护中 - 灰色 */
}
```

### 2.3 Typography
- **Primary Font**: `"Inter", "PingFang SC", "Microsoft YaHei", sans-serif`
- **Heading Weight**: 600-700
- **Body Weight**: 400
- **Monospace**: `"JetBrains Mono", monospace` (用于数字、金额)

### 2.4 Spatial System
- **Base Unit**: 4px
- **Spacing Scale**: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64
- **Border Radius**: 6px (small), 8px (medium), 12px (large), 16px (card)
- **Card Shadow**: `0 4px 6px -1px rgba(0, 0, 0, 0.3)`

### 2.5 Motion Philosophy
- **Transitions**: 200ms ease-out for interactions
- **Page Transitions**: 300ms slide-fade
- **Data Updates**: 150ms fade-in for real-time updates
- **Loading States**: Skeleton pulse animation

## 3. Layout & Structure

### 3.1 Overall Architecture
```
┌─────────────────────────────────────────────────────────────────┐
│  Header: 门店切换 | 搜索 | 消息通知 | 用户头像/角色           │
├────────────┬────────────────────────────────────────────────────┤
│            │                                                    │
│  Sidebar   │           Main Content Area                       │
│  导航菜单   │                                                    │
│            │  ┌──────────────────────────────────────────────┐ │
│  - 首页     │  │  Page Header: 标题 | 操作按钮 | 筛选条件     │ │
│  - 台桌管理 │  ├──────────────────────────────────────────────┤ │
│  - 计费规则 │  │                                              │ │
│  - 订单管理 │  │  Content: 表格/卡片/图表                       │ │
│  - 会员管理 │  │                                              │ │
│  - 商品管理 │  │                                              │ │
│  - 员工管理 │  └──────────────────────────────────────────────┘ │
│  - 助教管理 │                                                    │
│  - 财务对账 │                                                    │
│  - 经营报表 │                                                    │
│  - 系统设置 │                                                    │
│            │                                                    │
└────────────┴────────────────────────────────────────────────────┘
```

### 3.2 Responsive Strategy
- **Desktop (≥1280px)**: 完整侧边栏 + 宽内容区
- **Tablet (768-1279px)**: 折叠侧边栏 + 自适应内容
- **Mobile (≤767px)**: 底部导航 + 全屏内容

### 3.3 Visual Pacing
- **首页Dashboard**: 大数据卡片 + 图表为主，密集信息展示
- **列表页**: 搜索筛选区 + 数据表格，效率优先
- **详情页**: 表单左侧 + 详情右侧，平衡布局
- **弹窗**: 居中显示，最大宽度 600px，背景遮罩 rgba(0,0,0,0.6)

## 4. Features & Interactions

### 4.1 多门店切换模块
- **门店切换器**: Header 顶部下拉选择，点击切换门店
- **切换行为**: 切换后刷新当前页面数据，保持路由
- **数据隔离**: 每个门店数据完全隔离，独立统计
- **连锁视图**: 老板角色可查看"全部门店"汇总数据

### 4.2 门店基础设置
**门店信息配置**
- 字段：门店名称、Logo、地址、联系电话、营业时间、简介
- 支持上传门店实景图片
- 营业时间可设置工作日和节假日不同配置

**分区管理**
- 创建/编辑/删除分区（A区/B区/C区）
- 每个分区可设置名称、描述、排序
- 分区颜色标识，便于区分

**分时段计价配置**
- 定义时段：闲时、忙时、黄金时段
- 每个时段设置对应折扣系数或价格加成

### 4.3 台桌管理
**台桌列表**
- 卡片/列表两种展示模式切换
- 状态颜色标识：空闲(绿)、使用中(红)、预约(橙)、维护(灰)
- 支持按分区、状态、类型筛选
- 实时状态刷新（30秒轮询）

**台桌操作**
- 新增/编辑/删除台桌
- 台桌编号（支持字母+数字自定义）
- 台型选择：标台(8球)、赛台(比赛级)、斯诺克
- 关联设备：智慧屏设备号绑定
- 快捷操作：开台、关台、暂停、转台、并台

**台桌详情**
- 当前状态和时长
- 历史订单记录
- 使用率统计
- 关联计费规则

### 4.4 台桌计费规则管理（核心模块）

#### 4.4.1 计费模式
**按计时计费**
- 支持分时段价格（闲时/忙时/黄金时段）
- 支持分台型价格（标台/赛台/斯诺克）
- 起步价设置（最低消费时长和金额）
- 超时计费规则

**按局数计费**
- 每局固定价格
- 分台型定价
- 支持最低消费局数

**包时段计费**
- 时段套餐：早场/下午场/晚场/夜场
- 整日包场
- 跨天连续包场
- 不同时长阶梯价格

**混合计费**
- 基础费 + 超时费组合
- 首小时优惠 + 后续标准价
- 会员专属混合规则

**封顶计费**
- 日封顶金额设置
- 连续使用时长的费用上限
- 超时后自动切换规则

**会员专属折扣**
- 不同会员等级享受不同折扣
- 支持积分抵扣

#### 4.4.2 差异化定价维度
- 分时段：闲时(工作日白天)、忙时(晚上/周末)、黄金时段(节假日)
- 分台型：标台、赛台、斯诺克
- 分会员等级：普通、银卡、金卡、钻石等
- 分门店：不同门店独立定价

#### 4.4.3 特殊场景处理
**暂停计费**
- 支持暂停/恢复计时
- 暂停时长是否计入总时长可配置
- 最小暂停时长限制

**转台操作**
- 原台桌自动结算
- 新台桌继承原订单时间
- 计费规则可重新选择
- 操作日志完整记录

**并台操作**
- 多单合并支付
- 账单拆分选项
- 各自结算或统一结算

**跨天包场**
- 自动识别日期变更
- 按天分别计费或统一结算
- 凌晨清台提醒

**超时提醒**
- 接近结束时语音/弹窗提醒
- 可设置提醒时间点（提前5/10/15分钟）
- 超时后自动延计或关台

#### 4.4.4 规则管理
- 新增/编辑/复制/删除规则
- 规则优先级排序
- 启用/停用切换
- 规则冲突检测与提示
- 模拟测试：输入参数测试计费结果
- 执行日志：查看历史计费明细

### 4.5 员工管理
**员工档案**
- 基本信息：姓名、工号、手机号、角色、状态
- 角色类型：老板、店长、收银员、服务员、助教
- 入职日期、合同信息
- 员工照片上传
- 员工状态：在职、离职、休假

**权限分配**
- 基于角色的权限控制(RBAC)
- 不同角色看到不同菜单和数据范围
- 店长仅可管理本店数据
- 收银员仅可操作收银相关功能

**排班管理**
- 周排班视图/日排班视图
- 拖拽调整排班
- 班次设置：早班/中班/晚班/通班
- 排班冲突检测

**考勤管理**
- 打卡记录查询
- 考勤异常标记
- 请假/调休申请审批
- 月度考勤统计报表

### 4.6 助教管理
**助教档案**
- 个人信息：姓名、年龄、联系方式
- 照片和介绍视频上传
- 等级：初级/中级/高级/金牌
- 擅长领域：8球/9球/斯诺克/花式
- 服务价格（按时长/按课程）
- 状态：可用/忙碌/休息

**助教排班**
- 周排班视图
- 可预约时段设置
- 休假申请

**业绩统计**
- 上钟时长统计（日/周/月）
- 服务订单数量
- 客户满意度评分
- 业绩排行榜
- 提成计算规则配置

**助教计费规则**
- 按时长计费：元/小时
- 按课程计费：单次课程价格
- 等级加成：高级助教价格上浮
- 时段加成：高峰期价格上浮

### 4.7 商品与库存管理
**商品分类**
- 创建/编辑/删除分类
- 分类排序
- 分类图标设置

**商品管理**
- 商品列表（支持扫码枪扫码快速搜索）
- 商品信息：名称、规格、单位、进货价、售价、库存
- 商品图片上传
- 条形码/二维码打印

**库存操作**
- 入库：采购入库、调拨入库
- 出库：销售出库、损耗出库
- 库存盘点
- 库存预警阈值设置
- 低库存提醒

**进销存报表**
- 入库记录查询
- 销售记录查询
- 库存台账
- 利润统计

### 4.8 订单管理

#### 4.8.1 台桌订单
**开台流程**
1. 选择空闲台桌
2. 选择计费规则（可手动或自动匹配）
3. 选择服务员工（如需要）
4. 选择助教（如需要）
5. 确认开台

**计时计费**
- 实时计时显示
- 当前费用实时计算
- 暂停/恢复操作
- 超时提醒

**换台操作**
1. 选择当前使用中的台桌
2. 选择目标空台桌
3. 确认换台，原台桌自动结算
4. 新台桌继续计时

**并台操作**
1. 选择需要合并的台桌订单
2. 确认合并，可选拆分比例
3. 生成合并账单

**关台结算**
- 显示使用时长、各项费用明细
- 优惠抵扣（优惠券/会员折扣）
- 支付方式选择
- 小票打印

#### 4.8.2 商品订单
- 与台桌订单关联
- 支持追加商品
- 即时结算或挂账

#### 4.8.3 助教订单
- 关联台桌订单
- 记录服务时长
- 单独结算或合并结算

#### 4.8.4 合并支付
- 多类型订单合并支付
- 支持部分支付
- 支持找零
- 支持挂账

### 4.9 会员管理
**会员列表**
- 会员信息：姓名、手机、卡号、等级
- 会员状态：正常/冻结/已过期
- 支持按手机/姓名搜索

**会员等级规则**
- 等级名称、图标
- 等级门槛：累计消费/累计充值/累计积分
- 等级折扣设置
- 等级权益说明

**积分规则**
- 消费积分比例（元=积分）
- 充值积分比例
- 积分抵扣比例
- 积分兑换商品

**会员操作**
- 充值：余额充值、赠送金额
- 扣款：消费扣款、余额不足提示
- 积分：积分兑换、积分抵扣
- 升级：满足条件自动升级或手动调整

**会员记录**
- 充值记录
- 消费记录
- 积分变动记录
- 等级变动记录

### 4.10 财务对账
**营收报表**
- 日报：每日营收汇总
- 月报：每月营收汇总
- 自定义时间范围查询
- 营收构成分析：台桌收入/商品收入/助教收入

**资金流水**
- 所有收支明细记录
- 筛选：时间、类型、支付方式、关联订单
- 流水导出Excel

**订单查询**
- 全量订单列表
- 筛选条件：订单类型、支付状态、时间范围
- 订单详情查看
- 订单导出Excel

### 4.11 经营报表
**营收趋势图**
- 日/周/月/季/年视图
- 同比/环比分析
- 趋势预测

**台桌利用率**
- 各台桌使用时长统计
- 使用率 = 实际使用时⻓ / 营业时⻓
- 空闲时段分析

**商品销量排行**
- 商品销售数量排行
- 商品销售额排行
- 滞销商品预警

**会员分析**
- 新增会员统计
- 会员消费贡献
- 会员活跃度分析

**员工/助教业绩**
- 个人业绩排行
- 业绩趋势图
- 提成计算明细

## 5. Component Inventory

### 5.1 Layout Components
**AppShell**
- 侧边栏 + Header + 内容区容器
- 侧边栏折叠/展开状态
- 路由守卫：未登录跳转

**Sidebar**
- Logo区 + 导航菜单 + 底部设置
- 菜单项：图标 + 文字 + 徽标(数量)
- 折叠时显示图标
- 当前路由高亮

**Header**
- 门店切换器
- 全局搜索
- 消息通知铃铛
- 用户头像 + 角色 + 下拉菜单

### 5.2 Data Display
**DataTable**
- 表头：排序、筛选、多选
- 表格体：数据行、加载态、空状态
- 表格操作：查看、编辑、删除等
- 分页：页码 + 每页条数
- 支持行拖拽排序

**StatCard**
- 标题 + 数值 + 变化趋势
- 图标 + 颜色标识
- 加载骨架

**Chart**
- 支持折线图、柱状图、饼图
- 响应式尺寸
- 图例 + tooltip

### 5.3 Form Components
**FormField**
- 标签 + 输入控件 + 错误提示
- 支持输入框、下拉、日期选择等

**FormSection**
- 分组表单字段
- 标题 + 描述

### 5.4 Feedback Components
**Modal**
- 遮罩层 + 内容框
- 标题 + 内容 + 底部操作
- 关闭：X按钮/ESC键/遮罩点击
- 确认/取消按钮

**Drawer**
- 右侧滑出面板
- 用于详情查看、编辑表单
- 宽度可选：400/600/800px

**Toast**
- 顶部居中弹出
- 类型：success/error/warning/info
- 自动消失：3秒

**ConfirmDialog**
- 确认操作对话框
- 标题 + 描述 + 确认/取消按钮

### 5.5 Business Components
**TableCard**
- 台桌状态卡片
- 显示：台号、状态、时长、当前用户
- 操作按钮：开台/关台/暂停

**PricingRuleCard**
- 计费规则卡片
- 显示规则名称、类型、适用台型
- 启用/停用开关
- 操作按钮

**OrderTimeline**
- 订单时间轴
- 显示订单状态流转

**MemberCard**
- 会员信息卡片
- 显示：头像、姓名、等级、余额
- 快捷操作：充值、消费

## 6. Technical Approach

### 6.1 Technology Stack
- **Framework**: Next.js 16 (App Router)
- **UI Library**: shadcn/ui + Radix UI
- **Styling**: Tailwind CSS 4
- **State Management**: React Context + useReducer
- **Data Fetching**: React Query (simulated with localStorage)
- **Charts**: Recharts
- **Icons**: Lucide React

### 6.2 Data Architecture
```typescript
// 核心数据模型

interface Store {
  id: string;
  name: string;
  address: string;
  phone: string;
  businessHours: { start: string; end: string };
  zones: Zone[];
  status: 'active' | 'inactive';
}

interface Zone {
  id: string;
  storeId: string;
  name: string;
  color: string;
  sort: number;
}

interface Table {
  id: string;
  storeId: string;
  zoneId: string;
  number: string;
  type: 'standard' | 'tournament' | 'snooker';
  status: 'idle' | 'occupied' | 'reserved' | 'maintenance';
  deviceId?: string;
  currentOrderId?: string;
}

interface PricingRule {
  id: string;
  storeId: string;
  name: string;
  type: 'time' | 'round' | 'period' | 'mixed' | 'cap' | 'member';
  priority: number;
  config: PricingConfig;
  applicableTables: string[]; // table types or IDs
  applicablePeriods: string[]; // time periods
  memberLevels: string[]; // applicable member levels
  status: 'active' | 'inactive';
}

interface Employee {
  id: string;
  storeId: string;
  name: string;
  phone: string;
  role: 'owner' | 'manager' | 'cashier' | 'waiter' | 'assistant';
  status: 'active' | 'inactive' | 'vacation';
  schedule: Schedule[];
}

interface Assistant {
  id: string;
  storeId: string;
  name: string;
  photo: string;
  video?: string;
  level: 'junior' | 'intermediate' | 'senior' | 'gold';
  skills: string[];
  hourlyRate: number;
  status: 'available' | 'busy' | 'rest';
}

interface Product {
  id: string;
  storeId: string;
  categoryId: string;
  name: string;
  unit: string;
  purchasePrice: number;
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  status: 'active' | 'inactive';
}

interface Order {
  id: string;
  storeId: string;
  type: 'table' | 'product' | 'assistant';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  items: OrderItem[];
  totalAmount: number;
  discount: number;
  actualAmount: number;
  paymentMethod: 'cash' | 'wechat' | 'alipay' | 'member';
  memberId?: string;
  employeeId: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### 6.3 State Management
- **Global Store**: 使用 React Context 管理全局状态
  - 当前选中门店
  - 当前登录用户
  - 权限信息
- **Page State**: 各页面独立状态管理
- **Mock API**: localStorage 模拟后端API

### 6.4 Routing Structure
```
/                           # 首页/Dashboard
/stores                     # 门店切换
/tables                     # 台桌管理
/tables/[id]                # 台桌详情
/pricing                    # 计费规则列表
/pricing/new                # 新建计费规则
/pricing/[id]/edit          # 编辑计费规则
/pricing/[id]/simulate      # 模拟测试
/orders                     # 订单管理
/orders/[id]                # 订单详情
/members                    # 会员管理
/members/[id]               # 会员详情
/products                   # 商品管理
/products/[id]              # 商品详情
/inventory                  # 库存管理
/employees                  # 员工管理
/employees/[id]             # 员工详情
/assistants                 # 助教管理
/assistants/[id]            # 助教详情
/finance                    # 财务对账
/reports                    # 经营报表
/settings                   # 系统设置
/settings/store             # 门店设置
/settings/zones             # 分区管理
/settings/periods           # 时段设置
```

## 7. Page Specifications

### 7.1 Dashboard 首页
**数据概览卡片**
- 今日营收（同比昨日）
- 今日订单数
- 当前在用台桌数
- 会员总数

**实时状态区**
- 当前所有台桌状态概览
- 在线用户数
- 今日热门时段

**快捷操作区**
- 快速开台
- 快速结账
- 添加订单

**经营概览图**
- 近7天营收趋势
- 台桌使用率
- 商品销量排行

### 7.2 台桌管理页
**视图切换**
- 卡片视图：台桌状态卡片网格
- 列表视图：传统表格

**状态筛选**
- 全部/空闲/使用中/预约/维护

**操作按钮**
- 新增台桌
- 批量操作

### 7.3 计费规则页
**规则列表**
- 规则卡片展示
- 启用/停用开关
- 优先级拖拽调整

**操作**
- 新建规则
- 复制规则
- 编辑规则
- 模拟测试
- 查看日志

### 7.4 订单管理页
**筛选条件**
- 订单类型
- 支付状态
- 时间范围
- 关键词搜索

**订单列表**
- 订单编号、时间、类型、金额、状态
- 操作：查看详情、结账、退款

### 7.5 会员管理页
**会员列表**
- 头像、姓名、手机、等级、余额
- 快捷操作：充值、消费

**会员详情**
- 基本信息
- 充值记录
- 消费记录
- 积分记录

### 7.6 财务对账页
**时间切换**
- 今日/本周/本月/自定义

**营收概览**
- 总营收
- 台桌收入
- 商品收入
- 其他收入

**流水明细**
- 收支类型筛选
- 导出Excel

### 7.7 经营报表页
**图表区**
- 营收趋势图
- 营收构成饼图
- 台桌使用率柱状图

**数据表格**
- 排行数据
- 明细数据

**导出功能**
- 导出PDF/Excel
