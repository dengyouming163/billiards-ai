# POS 前端对接后端 API 设计规范

## 概述

将 POS 收银前端从本地 Mock 数据模式切换为对接真实后端 POS 控制器 API，修正所有 API 端点地址为 `/pos/{Controller}/{Action}` 格式。

## 架构变更

```
Before:
  AppContext → localAppService → mock-data.ts (本地内存)
  
After:
  AppContext → apiAppService → lib/api/client.ts (get/post/put/del)
      → 自动注入 Bearer token
      → 自动注入 store_id
      → 自动解析 {code, msg, data} 响应格式
      → 后端 POS 控制器
```

## 后端路由格式

所有 POS 接口统一前缀：`/storeapi/pos/{Controller}/{Action}`

通用请求头：
- `Authorization: Bearer {token}`
- `Content-Type: application/json`

通用响应格式：
```json
{ "code": 1, "show": 0, "msg": "success", "data": {} }
```

错误码：
- `code: 1` → 成功
- `code: 0` → 业务失败
- `code: 2001` → 未登录
- `code: 2002` → 登录超时（前端自动清除 token 并跳转登录页）

## 文件改动列表

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/api/config.ts` | 修改 | 全部端点修正为 `/pos/{Controller}/{Action}` |
| `src/lib/api/auth.ts` | 修改 | 登录响应字段对齐 POS 后端 |
| `src/services/types.ts` | 重写 | 接口签名对齐 POS 后端实际能力 |
| `src/services/api-service.ts` | 重写 | 全部使用 `lib/api/client.ts` 调用 |
| `src/services/local-service.ts` | 删除 | 去掉本地 Mock |
| `src/services/index.ts` | 简化 | 只保留 apiAppService |
| `src/context/AppContext.tsx` | 调整 | 启动时不加载 Mock，按需后端加载 |
| `src/types/index.ts` | 调整 | 类型字段对齐 POS 后端 |
| `src/data/mock-data.ts` | 保留 | 保留但不引用，仅作类型参考 |

## API 端点映射（完整清单）

### Auth 认证（AuthController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `auth.login()` | POST | `/pos/Auth/login` | `{phone, password}` | `{token, id, name, phone, store_id, store_name, ...}` |
| `auth.smsLogin()` | POST | `/pos/Auth/smsLogin` | `{phone, code}` | `{token, id, name, phone, ...}` |
| `auth.sendSmsCode()` | POST | `/pos/Auth/sendSms` | `{phone, type}` | `{code, msg}` |
| `auth.getInfo()` | GET | `/pos/Auth/info` | - | 员工信息 |
| `auth.logout()` | POST | `/pos/Auth/logout` | `{token}` | - |

### 门店 Store（StoreController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `store.lists()` | GET | `/pos/Store/lists` | - | 门店数组 |
| `store.current()` | GET | `/pos/Store/current` | - | 当前门店详情 |
| `store.switch()` | POST | `/pos/Store/switch` | `{store_id}` | 切换结果 |

### 台桌 Table（TableController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `table.lists()` | GET | `/pos/Table/lists` | - | `{lists: Table[], count}` |
| `table.detail(id)` | GET | `/pos/Table/detail/{id}` | - | Table |
| `table.stats()` | GET | `/pos/Table/stats` | - | 统计数据 |
| `table.update(id)` | PUT | `/pos/Table/update/{id}` | `{name, type, ...}` | Table |

### 订单 Order（OrderController）— 核心

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `order.lists()` | GET | `/pos/Order/lists` | page/page_size/keyword | `{lists, count}` |
| `order.detail(id)` | GET | `/pos/Order/detail/{id}` | - | Order |
| `order.open()` | POST | `/pos/Order/open` | `{table_id, customer_count, ...}` | 开台结果 |
| `order.close(id)` | POST | `/pos/Order/close/{id}` | - | 关台结果 |
| `order.checkout(id)` | POST | `/pos/Order/checkout/{id}` | `{amount, pay_type, ...}` | 结账结果 |
| `order.extend(id)` | POST | `/pos/Order/extend/{id}` | `{minutes}` | 加时结果 |
| `order.pause(id)` | POST | `/pos/Order/pause/{id}` | - | 暂停结果 |
| `order.resume(id)` | POST | `/pos/Order/resume/{id}` | - | 恢复结果 |
| `order.merge()` | POST | `/pos/Order/merge` | `{source_id, target_id}` | 并台结果 |
| `order.changeTable(id)` | POST | `/pos/Order/changeTable/{id}` | `{target_table_id}` | 换台结果 |
| `order.inProgress()` | GET | `/pos/Order/inProgress` | - | 进行中订单列表 |
| `order.tableOrders()` | GET | `/pos/Order/tableOrders` | `table_id` | 台桌关联订单 |

### 会员 Member（MemberController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `member.lists()` | GET | `/pos/Member/lists` | page/page_size/keyword | `{lists, count}` |
| `member.search()` | GET | `/pos/Member/search` | `keyword` | Member[] |
| `member.detail()` | GET | `/pos/Member/detail` | `id` | Member |
| `member.create()` | POST | `/pos/Member/create` | `{phone, name, level}` | Member |
| `member.update()` | PUT | `/pos/Member/update` | `{id, name, level, ...}` | Member |
| `member.recharge()` | POST | `/pos/Member/recharge` | `{id, amount, bonus, ...}` | Member |
| `member.consume()` | POST | `/pos/Member/consume` | `{id, amount, ...}` | 扣费结果 |
| `member.levels()` | GET | `/pos/Member/levels` | - | MemberLevel[] |

### 商品 Product（ProductController & ProductCategoryController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `product.all()` | GET | `/pos/Product/all` | - | Product[] |
| `product.lists()` | GET | `/pos/Product/lists` | page/page_size/category_id | `{lists, count}` |
| `product.categoryLists()` | GET | `/pos/ProductCategory/lists` | - | ProductCategory[] |

### 助教 Assistant（AssistantController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `assistant.lists()` | GET | `/pos/Assistant/lists` | - | Assistant[] |
| `assistant.services()` | GET | `/pos/Assistant/services` | `order_id` | 服务记录 |
| `assistant.levels()` | GET | `/pos/Assistant/levels` | - | AssistantLevel[] |

### 班次 Shift（ShiftController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `shift.checkIn()` | POST | `/pos/Shift/checkIn` | `{opening_cash}` | Shift |
| `shift.checkOut()` | POST | `/pos/Shift/checkOut` | `{closing_cash, ...}` | Shift |
| `shift.current()` | GET | `/pos/Shift/current` | - | Shift \| null |
| `shift.records()` | GET | `/pos/Shift/records` | page/page_size | `{lists, count}` |

### 预订单 PreOrder（PreOrderController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `preOrder.lists()` | GET | `/pos/PreOrder/lists` | `order_id` | PreOrder[] |
| `preOrder.byTable()` | GET | `/pos/PreOrder/byTable` | `table_id` | PreOrder[] |
| `preOrder.confirm()` | POST | `/pos/PreOrder/confirm` | `{preorder_group_id}` | 确认结果 |
| `preOrder.reject()` | POST | `/pos/PreOrder/reject` | `{preorder_group_id, reason}` | 拒绝结果 |

### 通知 Notification（NotificationController）

| 前端方法 | HTTP | 端点路径 | 请求参数 | 响应 |
|---------|------|---------|---------|------|
| `notification.lists()` | GET | `/pos/Notification/lists` | page/page_size | `{lists, count}` |
| `notification.read()` | POST | `/pos/Notification/read` | `{id}` | - |
| `notification.readAll()` | POST | `/pos/Notification/readAll` | - | - |
| `notification.unreadCount()` | GET | `/pos/Notification/unreadCount` | - | `{count}` |

## 服务层接口定义

精简后的 `AppService` 接口：

```typescript
interface AppService {
  // 初始加载
  loadInitialData(): Promise<{
    tables: Table[];
    zones: Zone[];
    assistants: Assistant[];
    products: Product[];
    categories: ProductCategory[];
    members: Member[];
  }>;

  // 子服务
  auth: {
    login(phone, password): Promise<LoginResult>;
    smsLogin(phone, code): Promise<LoginResult>;
    sendSmsCode(phone): Promise<void>;
    getInfo(): Promise<EmployeeInfo>;
    logout(): Promise<void>;
  };

  table: {
    getTables(): Promise<Table[]>;
    getDetail(id): Promise<Table>;
    getStats(): Promise<TableStats>;
    update(id, data): Promise<Table>;
  };

  order: {
    getLists(params?): Promise<Order[]>;
    getDetail(id): Promise<Order>;
    open(params): Promise<Order>;
    close(id): Promise<void>;
    checkout(id, params): Promise<CheckoutResult>;
    extend(id, params): Promise<void>;
    pause(id): Promise<void>;
    resume(id): Promise<void>;
    merge(params): Promise<void>;
    changeTable(id, params): Promise<void>;
    inProgress(): Promise<Order[]>;
    getByTable(tableId): Promise<Order[]>;
  };

  member: {
    getLists(params?): Promise<Member[]>;
    search(keyword): Promise<Member[]>;
    getDetail(id): Promise<Member>;
    create(data): Promise<Member>;
    update(data): Promise<Member>;
    recharge(id, params): Promise<Member>;
    consume(id, params): Promise<void>;
    getLevels(): Promise<MemberLevel[]>;
  };

  product: {
    getAll(): Promise<Product[]>;
    getLists(params?): Promise<Product[]>;
    getCategories(): Promise<ProductCategory[]>;
  };

  assistant: {
    getLists(): Promise<Assistant[]>;
    getServices(orderId?): Promise<AssistantService[]>;
    getLevels(): Promise<AssistantLevel[]>;
  };

  shift: {
    checkIn(params): Promise<Shift>;
    checkOut(params): Promise<Shift>;
    getCurrent(): Promise<Shift | null>;
    getRecords(params?): Promise<Shift[]>;
  };

  preOrder: {
    getLists(orderId?): Promise<PreOrder[]>;
    getByTable(tableId): Promise<PreOrder[]>;
    confirm(groupId): Promise<void>;
    reject(groupId, reason): Promise<void>;
  };
}
```

## 数据流

```
应用启动
  │
  ▼
AuthProvider.initAuth()
  ├── localStorage 读取 token + userInfo
  │
  ▼
/login 页面 → auth.login(phone, password)
  ├── POST /pos/Auth/login
  ├── 保存 token → localStorage ('token') + cookie ('token')
  ├── 保存 userInfo → localStorage ('userInfo')
  │
  ▼
/select-store 页面 → store.lists()
  ├── GET /pos/Store/lists (Bearer token)
  ├── 选择门店 → 更新 localStorage userInfo.storeId
  │
  ▼
主页面 → AppProvider.loadInitialData()
  ├── GET /pos/Table/lists           (并行)
  ├── GET /pos/Product/all            (并行)
  ├── GET /pos/ProductCategory/lists  (并行)
  ├── GET /pos/Assistant/lists        (并行)
  ├── GET /pos/Member/lists           (并行)
  ├── GET /pos/Shift/current          (并行)
  │
  ▼
state 填充完毕 → UI 渲染 → 用户操作
  │
  ├── 开台 → POST /pos/Order/open
  ├── 加时 → POST /pos/Order/extend/{id}
  ├── 结账 → POST /pos/Order/checkout/{id}
  ├── 换台 → POST /pos/Order/changeTable/{id}
  ├── 关台 → POST /pos/Order/close/{id}
  └── ...
```

## 类型对齐

### Member 对齐 POS 后端

```typescript
interface Member {
  id: string;
  phone: string;
  name: string;
  level_id: string;
  level_name: string;
  balance: number;
  points: number;
  total_consume: number;
  total_recharge: number;
  status: number;          // 1=active, 0=inactive
  created_at: string;
  updated_at: string;
}
```

### Order 对齐 POS 后端

```typescript
interface Order {
  id: string;
  order_no: string;
  table_id: string;
  table_name: string;
  zone_name: string;
  store_id: string;
  customer_count: number;
  start_time: string;
  end_time?: string;
  duration_minutes: number;
  status: string;          // 'pending'|'in_progress'|'paused'|'completed'|'cancelled'
  total_amount: number;
  table_amount: number;
  product_amount: number;
  discount_amount: number;
  pay_status: string;      // 'unpaid'|'paid'
  remark?: string;
  items: OrderItem[];
  created_at: string;
  updated_at: string;
}
```

## 删除的文件

- `src/services/local-service.ts` — 完整删除
- `src/data/mock-data.ts` — 保留但不引用，仅作类型参考
