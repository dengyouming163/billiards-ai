# 首页优化实施计划

**Goal:** 修复分区数据绑定、hourly_rate 显示、卡片布局响应式、名称溢出四个问题。

**Architecture:** 在 API client 层添加通用 snake_case→camelCase 转换，一劳永逸解决字段映射；独立修复 TableBoard 布局和样式。

---

### Task 1: API client 添加字段名转换

**Files:**
- Modify: `src/lib/api/client.ts`

- [ ] **Step 1: 在 client.ts 中添加 snakeToCamel 转换函数**

在文件顶部（import 之后, handleApiResult 之前）添加：

```typescript
function snakeToCamel<T>(obj: unknown): T {
  if (obj === null || obj === undefined) return obj as T;
  if (Array.isArray(obj)) return obj.map(snakeToCamel) as T;
  if (typeof obj === 'object') {
    return Object.keys(obj as Record<string, unknown>).reduce((acc, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
      (acc as Record<string, unknown>)[camelKey] = snakeToCamel((obj as Record<string, unknown>)[key]);
      return acc;
    }, {} as T);
  }
  return obj as T;
}
```

- [ ] **Step 2: 在 handleApiResult 中调用转换**

在每个 `return` 语句前对结果应用 `snakeToCamel`。关键位置：

a) `case ApiResponseType.LIST:` 中，`return listData.lists as T;` 改为：
```typescript
return snakeToCamel<T>(listData.lists);
```

b) `case ApiResponseType.ARRAY:` 中，所有 return 前加 `snakeToCamel`：
```typescript
return snakeToCamel<T>(data);
```

c) `case ApiResponseType.NORMAL:` 中：
```typescript
return snakeToCamel<T>(data);
```

d) `if (Array.isArray(result))` 的 return：
```typescript
return snakeToCamel<T>(result);
```

- [ ] **Step 3: 构建验证**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwpos
npx next build 2>&1 | Select-String -Pattern "Error|error|Failed"
```

---

### Task 2: TableBoard 样式优化（布局 + 名称溢出）

**Files:**
- Modify: `src/components/TableBoard.tsx`

- [ ] **Step 1: 修改网格布局为响应式 5 列**

将第 488 行：
```typescript
<div className="grid grid-cols-5 gap-4">
```
改为：
```typescript
<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5 gap-4">
```

- [ ] **Step 2: 修复台桌名称溢出**

将第 129-133 行（名称图标区域）改为截断处理：

```typescript
<div className="flex items-center gap-2 min-w-0 flex-1">
  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusConfig.bgClass} border ${statusConfig.borderClass} flex items-center justify-center shadow-sm flex-shrink-0`}>
    <span className={`text-lg font-bold ${statusConfig.textClass}`}>{table.name.charAt(0)}</span>
  </div>
  <span className={`text-sm font-semibold ${statusConfig.textClass} truncate max-w-[80px]`}>{table.name}</span>
</div>
```

同时在第 128 行的 Header 区域将原来的 `justify-between` 调整，第 128-138 行整体改为：

```typescript
<div className="flex items-center justify-between mb-3 flex-shrink-0 gap-2">
  <div className="flex items-center gap-2 min-w-0 flex-1">
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${statusConfig.bgClass} border ${statusConfig.borderClass} flex items-center justify-center shadow-sm flex-shrink-0`}>
      <span className={`text-lg font-bold ${statusConfig.textClass}`}>{table.name.charAt(0)}</span>
    </div>
    <span className={`text-sm font-semibold ${statusConfig.textClass} truncate max-w-[80px]`}>{table.name}</span>
  </div>
  <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-white/80 backdrop-blur-sm border ${statusConfig.borderClass} ${statusConfig.textClass} flex-shrink-0`}>
    <span className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotClass} ${table.status === 'occupied' ? 'animate-pulse' : ''}`} />
    {statusConfig.label}
  </span>
</div>
```

- [ ] **Step 3: 构建验证**

```bash
cd d:\wwwroot\wwwbilliards\www\wwwpos
npx next build 2>&1 | Select-String -Pattern "Error|error|Failed"
```
