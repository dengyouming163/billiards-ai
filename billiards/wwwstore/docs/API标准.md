# API 标准使用规范

## 概述

本文档定义了前后端数据交互的标准格式和使用方法，所有新开发的模块必须遵循此标准。

---

## 一、后端API规范

### 1.1 响应格式标准

后端必须返回统一的JSON格式：

```php
{
  "code": 1,           // 1=成功, 0=失败, 2=需特殊处理
  "show": 1,           // 1=显示msg提示, 0=不显示
  "msg": "success",    // 提示信息
  "data": [...]        // 业务数据
}
```

### 1.2 列表数据格式（带分页）

```php
{
  "code": 1,
  "show": 0,
  "msg": "",
  "data": {
    "lists": [],       // 列表数据
    "count": 100,      // 总数
    "page_no": 1,      // 当前页
    "page_size": 20    // 每页数量
  }
}
```

### 1.3 API命名规范

- **列表接口**: `lists` - 返回分页数据
- **全部接口**: `all` - 返回全部数据（无分页）
- **详情接口**: `detail` - 返回单条详情
- **新增接口**: `create` - 创建数据
- **更新接口**: `update` - 更新数据
- **删除接口**: `delete` - 删除数据
- **切换状态**: `toggle` - 启用/禁用

---

## 二、前端API使用规范

### 2.1 导入方式

```typescript
import { get, post, put, del } from "@/lib/api/client";
import { ApiResponseType } from "@/lib/api/types";
import { API_ENDPOINTS } from "@/lib/api/config";
```

### 2.2 响应类型

| 类型 | 说明 | 使用场景 |
|------|------|---------|
| `ApiResponseType.NORMAL` | 普通数据 | 单个对象、详情等 |
| `ApiResponseType.ARRAY` | 数组数据 | 简单列表、全部数据 |
| `ApiResponseType.LIST` | 列表数据（带分页） | 分页列表，提取 `lists` 字段 |

### 2.3 使用示例

#### GET请求（获取数组数据）

```typescript
const data = await get<Store[]>(
  API_ENDPOINTS.stores,
  undefined,
  ApiResponseType.ARRAY
);
```

#### GET请求（获取列表数据，带分页）

```typescript
const data = await get<User[]>(
  API_ENDPOINTS.users,
  { page: 1, pageSize: 20 },
  ApiResponseType.LIST
);
```

#### GET请求（获取详情）

```typescript
const data = await get<User>(
  `${API_ENDPOINTS.users}/detail?id=123`,
  undefined,
  ApiResponseType.NORMAL
);
```

#### POST请求（新增数据）

```typescript
const result = await post(
  API_ENDPOINTS.users,
  { name: "张三", age: 25 },
  ApiResponseType.NORMAL
);
```

#### PUT请求（更新数据）

```typescript
const result = await put(
  API_ENDPOINTS.users,
  { id: 123, name: "李四" },
  ApiResponseType.NORMAL
);
```

#### DELETE请求（删除数据）

```typescript
const result = await del(
  API_ENDPOINTS.users,
  { id: 123 },
  ApiResponseType.NORMAL
);
```

---

## 三、错误处理

### 3.1 业务错误

当 `code !== 1` 时，会自动抛出错误，错误消息为 `msg` 字段。

### 3.2 登录超时

当 `code === 2002` 时：
- 自动清除 token 和 userInfo
- 显示"登录超时"提示
- 1.5秒后自动跳转到登录页

### 3.3 网络错误

当请求失败时：
- 显示"请求失败，请稍后重试"提示
- 抛出错误供调用方处理

---

## 四、API端点配置

新模块的API端点必须在 `src/lib/api/config.ts` 中定义：

```typescript
export const API_ENDPOINTS = {
  // 已有端点...

  // 新模块端点
  模块名: {
    lists: "/模块名.模块类名/lists",
    all: "/模块名.模块类名/all",
    detail: "/模块名.模块类名/detail",
    create: "/模块名.模块类名/create",
    update: "/模块名.模块类名/update",
    delete: "/模块名.模块类名/delete",
    toggle: "/模块名.模块类名/toggle",
  },
} as const;
```

---

## 五、迁移指南

### 5.1 旧代码迁移步骤

1. **导入新类型**：添加 `ApiResponseType` 导入
2. **选择响应类型**：根据接口返回格式选择正确的类型
3. **更新调用**：添加第三个参数 `ApiResponseType.XXX`
4. **简化处理**：移除手动兼容代码

### 5.2 迁移示例

**迁移前**：
```typescript
const result = await get<Store[]>(API_ENDPOINTS.stores);
const data = Array.isArray(result) ? result : 
             (result as any)?.data ? 
             (Array.isArray((result as any).data) ? (result as any).data : []) : [];
```

**迁移后**：
```typescript
const data = await get<Store[]>(
  API_ENDPOINTS.stores,
  undefined,
  ApiResponseType.ARRAY
);
```

---

## 六、最佳实践

### 6.1 类型安全

始终为泛型参数指定具体类型：

```typescript
// ✅ 正确
const data = await get<User[]>(API_ENDPOINTS.users, undefined, ApiResponseType.ARRAY);

// ❌ 错误
const data = await get(API_ENDPOINTS.users);
```

### 6.2 错误捕获

使用 try-catch 捕获可能的错误：

```typescript
try {
  const data = await get<User[]>(API_ENDPOINTS.users, undefined, ApiResponseType.ARRAY);
  // 处理数据
} catch (error) {
  // 错误已由API客户端处理，这里可以做额外处理
  console.error("加载失败:", error);
}
```

### 6.3 避免重复调用

使用 `useEffect` 的依赖项避免重复调用：

```typescript
useEffect(() => {
  const loadData = async () => {
    if (!currentStore) return;
    const data = await get<Table[]>(
      API_ENDPOINTS.tables,
      { store_id: currentStore.id },
      ApiResponseType.ARRAY
    );
    setTables(data);
  };
  loadData();
}, [currentStore]); // 仅在 currentStore 变化时执行
```

---

## 七、FAQ

### Q: 接口返回格式不确定怎么办？

A: 使用 `ApiResponseType.ARRAY`，它会自动兼容多种格式。

### Q: 如何处理自定义的错误消息？

A: 错误已自动通过 toast 显示，不需要额外处理。

### Q: 如何取消自动显示的成功提示？

A: 不可以，成功提示由后端的 `show` 字段控制。

### Q: 分页数据中除了 lists 外的其他字段怎么获取？

A: 目前不支持，请使用 `ApiResponseType.ARRAY` 获取完整数据后自行处理。

---

## 八、版本历史

| 版本 | 日期 | 说明 |
|------|------|------|
| 1.0 | 2026-05-10 | 初始版本，建立API标准 |

---

**文档维护者**: 全栈开发团队
**最后更新**: 2026-05-10
