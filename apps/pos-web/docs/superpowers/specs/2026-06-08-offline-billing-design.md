# wwwpos 离线计费系统 — 设计文档

> 日期: 2026-06-08 | 基于已有离线骨架补全核心实现

## 一、现状分析

wwwpos 已有离线基础：

| 已实现 | 缺失 |
|--------|------|
| `window.addEventListener('online'/'offline')` 事件监听 | `syncOfflineData` 只清队列不重放 |
| `SET_NETWORK_STATUS` reducer action | 无本地计时器 |
| `ADD_OFFLINE_OPERATION` / `CLEAR_OFFLINE_QUEUE` reducer | 无本地数据缓存 |
| `closeTable` / `createOrder` 离线分发 | 无计费引擎 |
| `NetworkStatus` / `OfflineOperation` 类型 | `useCallback` 依赖 bug |

## 二、架构

```
window online/offline 事件 (已有)
        │
┌───────▼────────┐
│  离线操作队列    │  utils/offline-queue.ts  [新建]
│  · 入队+持久化   │
│  · 网络恢复重放   │
│  · localforage   │
└───────┬────────┘
        │
┌───────▼────────┐
│  本地计费引擎    │  utils/offline-billing.ts [新建]
│  · 逐分钟时段匹配 │
│  · 会员折扣       │
│  · 预付判断       │
└───────┬────────┘
        │
┌───────▼────────┐
│  本地数据缓存    │  utils/offline-cache.ts  [新建]
│  · 商品Map       │
│  · 助教Map       │
│  · 台桌Map       │
│  · 定时间隔刷新   │
└───────┬────────┘
        │
┌───────▼────────────────────────────┐
│  AppContext 改造 (context/AppContext.tsx) │
│  · 多台桌计时器 Map<tableId, timer>       │
│  · syncOfflineData 重放逻辑修复           │
│  · 离线计费 dispayFee 计算                │
└──────────────────────────────────────────┘
```

## 三、文件变更

| 文件 | 操作 | 行数 |
|------|------|------|
| `utils/offline-billing.ts` | 新建 | ~120 |
| `utils/offline-cache.ts` | 新建 | ~100 |
| `utils/offline-queue.ts` | 新建 | ~90 |
| `utils/network.ts` | 新建 | ~40 |
| `context/AppContext.tsx` | 修改 | +80 |
| `types/index.ts` | 修改 | +10 |
| **合计** | **4新+2改** | **~440行** |

## 四、关键差异 (vs wwwtable)

| 维度 | wwwtable | wwwpos |
|------|----------|--------|
| 台桌数 | 1 | N（全部） |
| 计费 | 当前台桌 | 遍历所有占用台桌 |
| 存储 | localStorage | localforage / localStorage |
| 技术栈 | Vue 3 + UniApp | React 19 + Next.js |
| 状态管理 | class Store | React Context + useReducer |
| 离线触发 | uni.onNetworkStatusChange | window.online/offline |