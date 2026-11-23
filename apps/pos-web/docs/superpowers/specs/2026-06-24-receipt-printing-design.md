# 收银端小票打印功能 — 设计文档

**日期**: 2026-06-24 | **状态**: 已批准 | **影响范围**: wwwpos

---

## 1. 概述

为 wwwpos 收银端添加小票打印功能：
- **自动打印**：结账支付成功后自动出票
- **手动补打**：历史订单页支持补打小票

## 2. 技术方案

**方案**: HTML + CSS `@media print` 预览打印，Electron 阶段升级为静默打印。

| 阶段 | 体验 |
|------|------|
| PWA / 浏览器 | 弹出打印对话框 → 选打印机 → 打印 |
| Electron (EXE) | `webContents.print({ silent: true })` → 自动静默出票 |

## 3. 文件结构

```
wwwpos/src/
├── utils/printer.ts              # 新增: 打印核心函数
├── components/ReceiptTemplate.tsx  # 新增: 小票 HTML 模板
├── components/CheckoutModal.tsx    # 修改: 支付成功→自动打印
└── components/HistoryOrdersModal.tsx # 修改: 补打按钮
```

## 4. 数据流

```
支付成功
  ├── closeTable()
  └── setTimeout → printReceipt(data)    # 不阻塞关台
                        │
                        ├── 创建隐藏 iframe
                        ├── 渲染 ReceiptTemplate(data)
                        └── iframe.contentWindow.print()

历史订单
  └── 「打印」按钮
        ├── orderApi.getBill(orderId)    # 获取账单数据
        └── printReceipt(data)
```

## 5. 核心模块

### 5.1 `printer.ts` — 打印核心

```typescript
// 小票数据接口
interface ReceiptData {
  storeName: string
  orderNo: string
  tableName: string
  startTime: string
  endTime: string
  durationMinutes: number
  items: { name: string; price: number; quantity: number }[]
  tableFee: number
  productFee: number
  assistantFee: number
  chargingFee: number
  total: number
  paymentMethod: string
  cashier: string
  memberInfo?: { name: string; level: string }
}

// 从 billData 提取小票数据
function extractReceiptData(billData: any, tableName: string): ReceiptData

// 执行打印
function printReceipt(data: ReceiptData): void
```

### 5.2 `ReceiptTemplate.tsx` — 小票模板

- 纯 HTML + CSS，不依赖 shadcn/ui
- 宽度 58mm（标准热敏纸）
- 白底黑字，无背景色
- `@media print` 隐藏浏览器 UI

小票布局：
```
┌────────────────────────┐
│      XX台球俱乐部       │
│────────────────────────│
│ 订单号: xxx   台桌: xxx │
│ 开台: HH:mm 结账: HH:mm│
│ 时长: 1小时30分        │
│────────────────────────│
│ 台费            ¥80.00 │
│ ┄ 商品明细 ┄          │
│ 红牛  ×2        ¥30.00 │
│ 矿泉水 ×1        ¥5.00 │
│ 助教费           ¥0.00 │
│ 充电费           ¥0.00 │
│────────────────────────│
│ 合计:           ¥115.00│
│ 支付: 微信支付         │
│────────────────────────│
│ 会员: 张三 (金卡)      │
│────────────────────────│
│ 收款人: 李四           │
│ 谢谢惠顾！             │
└────────────────────────┘
```

## 6. 集成改动

### 6.1 CheckoutModal

- 现金结算成功后 → `closeTable()` → `setTimeout(() => printReceipt(...), 500)`
- 微信支付成功后 → 已有 `closeTable()` → 添加 `printReceipt(...)`
- 打印失败仅 `console.error`，不阻塞

### 6.2 HistoryOrdersModal

- 已完成订单行添加「🖨️ 打印」按钮
- 点击 → `orderApi.getBill(orderId)` → `printReceipt(data)`
- 数据不可用时 toast 提示

## 7. 错误处理

| 场景 | 处理 |
|------|------|
| `window.print()` 失败 | `console.error`，不阻塞 |
| 账单数据获取失败 | toast "无法获取订单数据" |
| 浏览器不支持 print | toast "此浏览器不支持打印" |

## 8. 后续升级 (Capacitor/Electron 阶段)

Electron 主进程添加 IPC 通道，`printReceipt()` 优先检测 `window.electronAPI?.silentPrint()`，可用则静默打印，不可用则回退到 `window.print()`。
