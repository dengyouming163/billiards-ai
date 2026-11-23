# POS 前端对接后端 API 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 POS 收银前端从本地 Mock 数据切换为对接真实后端 POS 专用控制器 API（共 13 个控制器），修正全部端点地址为 `/pos/{Controller}/{Action}` 格式，使用 `lib/api/client.ts` 统一调用。

**Architecture:** 保持现有组件层不变，只重写服务层（services/）和数据接入层（lib/api/）。AppContext 移除 localAppService 依赖，改用 apiAppService 从后端加载数据。客户端调用统一走 `lib/api/client.ts`（自动注入 Bearer token + store_id，统一解析 `{code, msg, data}` 响应）。

**Tech Stack:** Next.js 16 (App Router), TypeScript, React 19, ThinkPHP 8 后端

---

## 文件结构

| 文件 | 操作 | 职责 |
|------|------|------|
| `src/lib/api/config.ts` | 修改 | 端点修正为 `/pos/{Controller}/{Action}` |
| `src/lib/api/auth.ts` | 修改 | 登录响应字段对齐 POS 后端返回格式 |
| `src/lib/api/pos.ts` | 新建 | POS 专用 API 封装（order/member/product/assistant/shift/table/store） |
| `src/services/types.ts` | 重写 | 精简接口签名，只保留 POS 后端实际支持的方法 |
| `src/services/api-service.ts` | 重写 | 全部使用 lib/api/client.ts 调用 POS 端点 |
| `src/services/local-service.ts` | 删除 | 移除本地 Mock 服务 |
| `src/services/index.ts` | 简化 | 只导出 apiAppService |
| `src/context/AppContext.tsx` | 调整 | 移除 localAppService 引用，使用 apiAppService |
| `src/types/index.ts` | 调整 | Member/Order 字段对齐 POS 后端 |
| `src/data/mock-data.ts` | 保留 | 保留但不引用，仅作类型参考 |

---

### Task 1: 修正 API 端点配置

**Files:**
- Modify: `src/lib/api/config.ts`
- Modify: `src/lib/api/auth.ts`
- Create: `src/lib/api/pos.ts`

- [ ] **Step 1: 更新 config.ts — 端点地址修正为 POS 路由**

```typescript
// src/lib/api/config.ts
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'development') {
    return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:10002/storeapi';
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || '/storeapi';
};

export const API_TIMEOUT = 30000;
export const API_BASE_URL = getBaseUrl();

export const API_ENDPOINTS = {
  // 认证
  login: '/pos/Auth/login',
  smsLogin: '/pos/Auth/smsLogin',
  sendSms: '/pos/Auth/sendSms',
  authInfo: '/pos/Auth/info',
  logout: '/pos/Auth/logout',
  resetPassword: '/pos/Auth/resetPassword',

  // 门店
  storeLists: '/pos/Store/lists',
  storeCurrent: '/pos/Store/current',
  storeSwitch: '/pos/Store/switch',

  // 台桌
  tableLists: '/pos/Table/lists',
  tableDetail: '/pos/Table/detail',
  tableStats: '/pos/Table/stats',
  tableUpdate: '/pos/Table/update',

  // 订单
  orderLists: '/pos/Order/lists',
  orderDetail: '/pos/Order/detail',
  orderOpen: '/pos/Order/open',
  orderClose: '/pos/Order/close',
  orderCheckout: '/pos/Order/checkout',
  orderExtend: '/pos/Order/extend',
  orderPause: '/pos/Order/pause',
  orderResume: '/pos/Order/resume',
  orderMerge: '/pos/Order/merge',
  orderChangeTable: '/pos/Order/changeTable',
  orderInProgress: '/pos/Order/inProgress',
  orderTableOrders: '/pos/Order/tableOrders',
  orderRemark: '/pos/Order/remark',
  orderCancel: '/pos/Order/cancel',

  // 会员
  memberLists: '/pos/Member/lists',
  memberSearch: '/pos/Member/search',
  memberDetail: '/pos/Member/detail',
  memberCreate: '/pos/Member/create',
  memberUpdate: '/pos/Member/update',
  memberDelete: '/pos/Member/delete',
  memberRecharge: '/pos/Member/recharge',
  memberConsume: '/pos/Member/consume',
  memberRecharges: '/pos/Member/recharges',
  memberConsumes: '/pos/Member/consumes',
  memberPointsExchange: '/pos/Member/pointsExchange',
  memberLevels: '/pos/Member/levels',

  // 商品
  productAll: '/pos/Product/all',
  productLists: '/pos/Product/lists',
  productDetail: '/pos/Product/detail',
  productCategories: '/pos/ProductCategory/lists',

  // 助教
  assistantLists: '/pos/Assistant/lists',
  assistantServices: '/pos/Assistant/services',
  assistantLevels: '/pos/Assistant/levels',
  assistantDetail: '/pos/Assistant/detail',

  // 班次
  shiftCheckIn: '/pos/Shift/checkIn',
  shiftCheckOut: '/pos/Shift/checkOut',
  shiftCurrent: '/pos/Shift/current',
  shiftRecords: '/pos/Shift/records',
  shiftConfigs: '/pos/Shift/configs',

  // 预订单
  preOrderLists: '/pos/PreOrder/lists',
  preOrderByTable: '/pos/PreOrder/byTable',
  preOrderConfirm: '/pos/PreOrder/confirm',
  preOrderReject: '/pos/PreOrder/reject',

  // 通知
  notificationLists: '/pos/Notification/lists',
  notificationRead: '/pos/Notification/read',
  notificationReadAll: '/pos/Notification/readAll',
  notificationDelete: '/pos/Notification/delete',
  notificationUnreadCount: '/pos/Notification/unreadCount',
  notificationDetail: '/pos/Notification/detail',
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;
```

- [ ] **Step 2: 更新 auth.ts — 对齐 POS AuthController 响应字段**

```typescript
// src/lib/api/auth.ts
import { post } from './client';
import { API_ENDPOINTS } from './config';

export interface PosLoginResult {
  token: string;
  id: string;
  username: string;
  name: string;
  phone: string;
  role: string;
  role_name: string;
  roles: string[];
  store_id: string;
  store_name: string;
  status: string;
}

export interface LoginParams {
  phone: string;
  password: string;
}

export interface SmsLoginParams {
  phone: string;
  code: string;
}

export interface SendSmsParams {
  phone: string;
  type: string;
}

export async function login(params: LoginParams): Promise<PosLoginResult> {
  return post<PosLoginResult>(API_ENDPOINTS.login, params as unknown as Record<string, unknown>);
}

export async function smsLogin(params: SmsLoginParams): Promise<PosLoginResult> {
  return post<PosLoginResult>(API_ENDPOINTS.smsLogin, params as unknown as Record<string, unknown>);
}

export async function sendSmsCode(params: SendSmsParams): Promise<{ code: number; msg: string }> {
  return post<{ code: number; msg: string }>(API_ENDPOINTS.sendSms, params as unknown as Record<string, unknown>);
}
```

- [ ] **Step 3: 创建 pos.ts — POS 专用 API 封装**

```typescript
// src/lib/api/pos.ts
import { get, post, put } from './client';
import { API_ENDPOINTS } from './config';
import { ApiResponseType } from './types';
import type {
  Table, Zone, Assistant, Product, ProductCategory,
  Member, Order, Shift, Payment, Coupon,
} from '@/types';

// ---- Store ----
export const storeApi = {
  lists: () => get<Record<string, unknown>[]>(API_ENDPOINTS.storeLists, undefined, ApiResponseType.ARRAY),
};

// ---- Table ----
export const tableApi = {
  lists: () => get<Table[]>(API_ENDPOINTS.tableLists, undefined, ApiResponseType.ARRAY),
  detail: (id: string) => get<Table>(`${API_ENDPOINTS.tableDetail}/${id}`),
  stats: () => get<Record<string, unknown>>(API_ENDPOINTS.tableStats),
  update: (id: string, data: Partial<Table>) =>
    put<Table>(`${API_ENDPOINTS.tableUpdate}/${id}`, data as unknown as Record<string, unknown>),
};

// ---- Order ----
export const orderApi = {
  lists: (params?: Record<string, unknown>) =>
    get<Order[]>(API_ENDPOINTS.orderLists, params, ApiResponseType.LIST),
  detail: (id: string) => get<Order>(`${API_ENDPOINTS.orderDetail}/${id}`),
  open: (params: Record<string, unknown>) =>
    post<Order>(API_ENDPOINTS.orderOpen, params),
  close: (id: string) => post<void>(`${API_ENDPOINTS.orderClose}/${id}`),
  checkout: (id: string, params: Record<string, unknown>) =>
    post<Record<string, unknown>>(`${API_ENDPOINTS.orderCheckout}/${id}`, params),
  extend: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderExtend}/${id}`, params),
  pause: (id: string) => post<void>(`${API_ENDPOINTS.orderPause}/${id}`),
  resume: (id: string) => post<void>(`${API_ENDPOINTS.orderResume}/${id}`),
  cancel: (id: string, params?: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderCancel}/${id}`, params),
  merge: (params: Record<string, unknown>) => post<void>(API_ENDPOINTS.orderMerge, params),
  changeTable: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderChangeTable}/${id}`, params),
  inProgress: () => get<Order[]>(API_ENDPOINTS.orderInProgress, undefined, ApiResponseType.ARRAY),
  tableOrders: (tableId: string) =>
    get<Order[]>(API_ENDPOINTS.orderTableOrders, { table_id: tableId }, ApiResponseType.ARRAY),
  remark: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.orderRemark}/${id}`, params),
};

// ---- Member ----
export const memberApi = {
  lists: (params?: Record<string, unknown>) =>
    get<Member[]>(API_ENDPOINTS.memberLists, params, ApiResponseType.LIST),
  search: (keyword: string) =>
    get<Member[]>(API_ENDPOINTS.memberSearch, { keyword }, ApiResponseType.ARRAY),
  detail: (id: string) =>
    get<Member>(`${API_ENDPOINTS.memberDetail}?id=${encodeURIComponent(id)}`),
  create: (data: Record<string, unknown>) =>
    post<Member>(API_ENDPOINTS.memberCreate, data),
  update: (id: string, data: Record<string, unknown>) =>
    put<Member>(`${API_ENDPOINTS.memberUpdate}?id=${encodeURIComponent(id)}`, data),
  recharge: (id: string, params: Record<string, unknown>) =>
    post<Member>(`${API_ENDPOINTS.memberRecharge}?id=${encodeURIComponent(id)}`, params),
  consume: (id: string, params: Record<string, unknown>) =>
    post<void>(`${API_ENDPOINTS.memberConsume}?id=${encodeURIComponent(id)}`, params),
  levels: () => get<Record<string, unknown>[]>(API_ENDPOINTS.memberLevels, undefined, ApiResponseType.ARRAY),
  recharges: (id: string, params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(`${API_ENDPOINTS.memberRecharges}?id=${encodeURIComponent(id)}`, params, ApiResponseType.LIST),
  consumes: (id: string, params?: Record<string, unknown>) =>
    get<Record<string, unknown>[]>(`${API_ENDPOINTS.memberConsumes}?id=${encodeURIComponent(id)}`, params, ApiResponseType.LIST),
};

// ---- Product ----
export const productApi = {
  all: () => get<Product[]>(API_ENDPOINTS.productAll, undefined, ApiResponseType.ARRAY),
  lists: (params?: Record<string, unknown>) =>
    get<Product[]>(API_ENDPOINTS.productLists, params, ApiResponseType.LIST),
  categories: () =>
    get<ProductCategory[]>(API_ENDPOINTS.productCategories, undefined, ApiResponseType.ARRAY),
};

// ---- Assistant ----
export const assistantApi = {
  lists: () => get<Assistant[]>(API_ENDPOINTS.assistantLists, undefined, ApiResponseType.ARRAY),
  services: (orderId?: string) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.assistantServices, orderId ? { order_id: orderId } : undefined, ApiResponseType.ARRAY),
  levels: () => get<Record<string, unknown>[]>(API_ENDPOINTS.assistantLevels, undefined, ApiResponseType.ARRAY),
};

// ---- Shift ----
export const shiftApi = {
  checkIn: (params: Record<string, unknown>) => post<Shift>(API_ENDPOINTS.shiftCheckIn, params),
  checkOut: (params: Record<string, unknown>) => post<Shift>(API_ENDPOINTS.shiftCheckOut, params),
  current: () => get<Shift | Record<string, never>>(API_ENDPOINTS.shiftCurrent),
  records: (params?: Record<string, unknown>) =>
    get<Shift[]>(API_ENDPOINTS.shiftRecords, params, ApiResponseType.LIST),
  configs: () => get<Record<string, unknown>[]>(API_ENDPOINTS.shiftConfigs, undefined, ApiResponseType.ARRAY),
};

// ---- PreOrder ----
export const preOrderApi = {
  lists: (orderId?: string) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.preOrderLists, orderId ? { order_id: orderId } : undefined, ApiResponseType.ARRAY),
  byTable: (tableId: string) =>
    get<Record<string, unknown>[]>(API_ENDPOINTS.preOrderByTable, { table_id: tableId }, ApiResponseType.ARRAY),
  confirm: (groupId: string) =>
    post<void>(API_ENDPOINTS.preOrderConfirm, { preorder_group_id: groupId }),
  reject: (groupId: string, reason?: string) =>
    post<void>(API_ENDPOINTS.preOrderReject, { preorder_group_id: groupId, reason }),
};
```

---

### Task 2: 重写服务层

**Files:**
- Modify: `src/services/types.ts`
- Modify: `src/services/api-service.ts`
- Delete: `src/services/local-service.ts`
- Modify: `src/services/index.ts`

- [ ] **Step 1: 重写 types.ts — 精简接口定义，对齐 POS 后端**

```typescript
// src/services/types.ts
import type {
  Table, Zone, Assistant, Product, ProductCategory,
  Member, Order, Shift, Payment,
} from '@/types';

export interface InitialData {
  tables: Table[];
  zones: Zone[];
  assistants: Assistant[];
  products: Product[];
  categories: ProductCategory[];
  members: Member[];
  currentShift: Shift | null;
}

export interface AppService {
  loadInitialData(): Promise<InitialData>;

  table: {
    getTables(): Promise<Table[]>;
    getDetail(id: string): Promise<Table>;
    update(id: string, data: Partial<Table>): Promise<Table>;
  };

  order: {
    getLists(params?: Record<string, unknown>): Promise<Order[]>;
    getDetail(id: string): Promise<Order>;
    open(params: Record<string, unknown>): Promise<Order>;
    close(id: string): Promise<void>;
    checkout(id: string, params: Record<string, unknown>): Promise<Record<string, unknown>>;
    extend(id: string, params: Record<string, unknown>): Promise<void>;
    pause(id: string): Promise<void>;
    resume(id: string): Promise<void>;
    cancel(id: string, params?: Record<string, unknown>): Promise<void>;
    merge(params: Record<string, unknown>): Promise<void>;
    changeTable(id: string, params: Record<string, unknown>): Promise<void>;
    inProgress(): Promise<Order[]>;
    getByTable(tableId: string): Promise<Order[]>;
  };

  member: {
    getLists(params?: Record<string, unknown>): Promise<Member[]>;
    search(keyword: string): Promise<Member[]>;
    getDetail(id: string): Promise<Member>;
    create(data: { phone: string; name: string; level: string }): Promise<Member>;
    update(id: string, data: Record<string, unknown>): Promise<Member>;
    recharge(id: string, params: Record<string, unknown>): Promise<Member>;
    consume(id: string, params: Record<string, unknown>): Promise<void>;
    getLevels(): Promise<Record<string, unknown>[]>;
  };

  product: {
    getAll(): Promise<Product[]>;
    getCategories(): Promise<ProductCategory[]>;
  };

  assistant: {
    getLists(): Promise<Assistant[]>;
    getLevels(): Promise<Record<string, unknown>[]>;
  };

  shift: {
    checkIn(params: Record<string, unknown>): Promise<Shift>;
    checkOut(params: Record<string, unknown>): Promise<Shift>;
    getCurrent(): Promise<Shift | null>;
    getRecords(params?: Record<string, unknown>): Promise<Shift[]>;
  };
}
```

- [ ] **Step 2: 重写 api-service.ts — 使用 lib/api/client + POS 端点**

```typescript
// src/services/api-service.ts
import { get, post, put } from '@/lib/api/client';
import { ApiResponseType } from '@/lib/api/types';
import {
  tableApi, orderApi, memberApi, productApi, assistantApi, shiftApi,
} from '@/lib/api/pos';
import type {
  Table, Zone, Assistant, Product, ProductCategory,
  Member, Order, Shift,
} from '@/types';
import type { AppService, InitialData } from './types';

export const apiAppService: AppService = {
  async loadInitialData(): Promise<InitialData> {
    const [tables, zones, assistants, products, categories, members, shiftResult] = await Promise.all([
      tableApi.lists().catch(() => [] as Table[]),
      get<Zone[]>('/pos/Zone/lists', undefined, ApiResponseType.ARRAY).catch(() => [] as Zone[]),
      assistantApi.lists().catch(() => [] as Assistant[]),
      productApi.all().catch(() => [] as Product[]),
      productApi.categories().catch(() => [] as ProductCategory[]),
      memberApi.lists().catch(() => [] as Member[]),
      shiftApi.current().catch(() => null),
    ]);

    const currentShift = shiftResult && 'id' in shiftResult ? (shiftResult as Shift) : null;

    return { tables, zones, assistants, products, categories, members, currentShift };
  },

  table: {
    getTables: () => tableApi.lists(),
    getDetail: (id) => tableApi.detail(id),
    update: (id, data) => tableApi.update(id, data),
  },

  order: {
    getLists: (params) => orderApi.lists(params),
    getDetail: (id) => orderApi.detail(id),
    open: (params) => orderApi.open(params),
    close: (id) => orderApi.close(id),
    checkout: (id, params) => orderApi.checkout(id, params),
    extend: (id, params) => orderApi.extend(id, params),
    pause: (id) => orderApi.pause(id),
    resume: (id) => orderApi.resume(id),
    cancel: (id, params) => orderApi.cancel(id, params),
    merge: (params) => orderApi.merge(params),
    changeTable: (id, params) => orderApi.changeTable(id, params),
    inProgress: () => orderApi.inProgress(),
    getByTable: (tableId) => orderApi.tableOrders(tableId),
  },

  member: {
    getLists: (params) => memberApi.lists(params),
    search: (keyword) => memberApi.search(keyword),
    getDetail: (id) => memberApi.detail(id),
    create: (data) => memberApi.create(data as unknown as Record<string, unknown>),
    update: (id, data) => memberApi.update(id, data),
    recharge: (id, params) => memberApi.recharge(id, params),
    consume: (id, params) => memberApi.consume(id, params),
    getLevels: () => memberApi.levels(),
  },

  product: {
    getAll: () => productApi.all(),
    getCategories: () => productApi.categories(),
  },

  assistant: {
    getLists: () => assistantApi.lists(),
    getLevels: () => assistantApi.levels(),
  },

  shift: {
    checkIn: (params) => shiftApi.checkIn(params),
    checkOut: (params) => shiftApi.checkOut(params),
    getCurrent: async () => {
      const result = await shiftApi.current();
      return result && 'id' in result ? (result as Shift) : null;
    },
    getRecords: (params) => shiftApi.records(params),
  },
};
```

- [ ] **Step 3: 删除 local-service.ts**

```bash
rm src/services/local-service.ts
```

- [ ] **Step 4: 简化 index.ts — 只导出 apiAppService**

```typescript
// src/services/index.ts
export type { AppService, InitialData } from './types';
export { apiAppService } from './api-service';
export const appService = apiAppService;
```

---

### Task 3: 调整 Context 层

**Files:**
- Modify: `src/context/AppContext.tsx`

- [ ] **Step 1: 移除本地服务引用，改用 apiAppService**

关键修改点：
1. 第 35 行：`import { localAppService } from '@/services/local-service'` → 删除此导入
2. 第 36 行：`import type { AppService } from '@/services/types'` → 保留
3. 第 532 行：`const [service] = useState<AppService>(localAppService)` → 改为 `const [service] = useState<AppService>(apiAppService)`
4. 添加导入：`import { apiAppService } from '@/services/api-service'`

```typescript
// src/context/AppContext.tsx 修改导入部分
import { apiAppService } from '@/services/api-service';
import type { AppService } from '@/services/types';

// Provider 内
const [service] = useState<AppService>(apiAppService);
```

- [ ] **Step 2: 调整 loadInitialData 适配新的 InitialData 结构**

移除不再返回的字段引用（technicians, packages, promotions, reservations, timeSlots 等从后端按需加载）：

```typescript
// loadData 函数内部
useEffect(() => {
  let mounted = true;

  async function loadData() {
    try {
      const data = await service.loadInitialData();
      if (mounted) {
        dispatch({
          type: 'INIT_DATA',
          payload: {
            tables: data.tables,
            zones: data.zones,
            assistants: data.assistants,
            products: data.products,
            categories: data.categories,
            members: data.members,
          },
        });
        if (data.currentShift) {
          dispatch({ type: 'SET_CURRENT_SHIFT', payload: data.currentShift });
        }
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
      if (mounted) {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
  }

  loadData();
  return () => { mounted = false; };
}, [service]);
```

---

### Task 4: 调整类型定义

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: 添加 POS 后端兼容字段**

在 `Member` 接口中添加 `totalConsume` 和 `totalRecharge` 字段（已存在），添加 POS 后端的 `level_id`/`level_name` 兼容别名：

```typescript
// Member 接口尾部增加
export interface Member {
  id: string;
  phone: string;
  name: string;
  level: MemberLevel;
  level_id?: string;    // POS 后端原始字段
  level_name?: string;  // POS 后端原始字段
  balance: number;
  points: number;
  totalConsume: number;
  totalRecharge: number;
  status: 'active' | 'inactive';
  password?: string;
  createdAt: string;
  updatedAt: string;
}
```

在 `Order` 接口中添加 POS 后端的兼容字段：

```typescript
export interface Order {
  id: string;
  order_no?: string;        // POS 后端订单号
  tableId: string;
  table_name?: string;       // POS 后端桌名
  zone_name?: string;        // POS 后端分区名
  store_id?: string;         // POS 后端门店ID
  customer_count?: number;   // POS 后端人数
  tableNumber?: string;
  tableName?: string;
  sessionId: string;
  items: OrderItem[];
  totalAmount: number;
  productAmount?: number;
  tableAmount?: number;
  assistantAmount?: number;
  discount_amount?: number;  // POS 后端优惠金额
  payAmount?: number;
  payType?: string;
  pay_status?: string;       // POS 后端支付状态
  payTime?: string;
  start_time?: string;       // POS 后端开始时间
  end_time?: string;         // POS 后端结束时间
  duration_minutes?: number; // POS 后端时长
  duration?: number;
  status: OrderStatus;
  remarks?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'pending' | 'synced';
}
```

---

### Task 5: 构建验证

**Files:**
- Entire project

- [ ] **Step 1: 运行构建**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwpos
npx next build
```

- [ ] **Step 2: 修复所有类型错误**

逐个修复构建报告中的类型错误，确保继续：
- 检查 `OrderItem` 是否需要 `status` 字段
- 检查 `Shift` 接口中 `payments` 字段
- 检查 `totalAmount` 字段类型一致性

- [ ] **Step 3: 最终确认**

```bash
npx next build 2>&1 | Select-String -Pattern "Error|error|Failed"
```
Expected: 无错误输出，构建成功
