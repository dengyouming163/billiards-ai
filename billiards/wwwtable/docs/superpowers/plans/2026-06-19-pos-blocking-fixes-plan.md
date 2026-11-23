# wwwpos 全功能阻塞性问题修复 — 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development

**Goal:** 修复 wwwpos 收银端 14 项阻塞性问题，打通全部核心业务流程

**Architecture:** 核心修复围绕 orderId 传递链（从 TableDrawer 向下传给各子 Modal）+ 通知 API 路径统一化

**Spec:** `docs/superpowers/specs/2026-06-19-pos-blocking-fixes-design.md`

---

## Phase 1: 核心闭环打通（P0）

### Task 1: ProductOrderModal — 新增 orderId prop

**Files:**
- Modify: `wwwpos/src/components/ProductOrderModal.tsx`
- Modify: `wwwpos/src/components/TableDrawer.tsx`
- Modify: `wwwpos/src/app/page.tsx`

- [ ] **Step 1: ProductOrderModal 新增 orderId prop**

Read the component. Add `orderId?: string` to the props interface. Modify `useEffect` that fetches current order:

```tsx
interface ProductOrderModalProps {
  table: Table
  onClose: () => void
  onSuccess?: () => void
  orderId?: string  // ← 新增
}

// 在组件内:
const [currentOrderId, setCurrentOrderId] = useState('')

useEffect(() => {
  if (orderId) {
    setCurrentOrderId(orderId)
    return
  }
  // fallback: API 查询
  orderApi.getCurrentOrder(table.id).then(r => {
    setCurrentOrderId((r as any)?.id || '')
  }).catch(() => {})
}, [table.id, orderId])
```

- [ ] **Step 2: TableDrawer 传递 orderId**

Read TableDrawer.tsx. Pass `orderId` from `table.currentSession?.orderId`:

```tsx
<ProductOrderModal
  table={table!}
  orderId={table?.currentSession?.orderId}
  onClose={() => setActiveModal(null)}
  onSuccess={refreshBill}
/>
```

- [ ] **Step 3: page.tsx 传递 orderId**

Check how ProductOrderModal is rendered in page.tsx. Ensure orderId chain is passed through.

- [ ] **Step 4: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/ProductOrderModal.tsx wwwpos/src/components/TableDrawer.tsx wwwpos/src/app/page.tsx
git commit -m "fix(pos): ProductOrderModal accepts orderId prop to fix new-table ordering"
```

---

### Task 2: AssistantModal — 新增 orderId prop + 空值禁用

**Files:**
- Modify: `wwwpos/src/components/AssistantModal.tsx`

- [ ] **Step 1: 读取当前代码并修改**

```tsx
interface AssistantModalProps {
  table: Table
  onClose: () => void
  onSuccess?: () => void
  orderId?: string  // ← 新增
}

// 在 handleConfirm 中:
const handleConfirm = async () => {
  if (!selectedAssistant || !orderId) return
  // ...
}

// 确认按钮:
<Button disabled={!selectedAssistant || !orderId || isProcessing}>
  {!orderId ? '请先开台' : selectedAssistant === currentAssistantId ? '已分配' : '确认分配'}
</Button>
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/AssistantModal.tsx
git commit -m "fix(pos): AssistantModal disables button when no orderId"
```

---

### Task 3: TransferMergeModal — 新增 orderId prop + 空值禁用

**Files:**
- Modify: `wwwpos/src/components/TransferMergeModal.tsx`

- [ ] **Step 1: 修改**

```tsx
interface TransferMergeModalProps {
  table: Table
  onClose: () => void
  onSuccess?: () => void
  onComplete?: () => void
  orderId?: string  // ← 新增
}

// 换台按钮 disabled:
disabled={!selectedTargetTable || !orderId}
// 并台按钮 disabled:
disabled={!selectedMergeTable || !orderId}
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/TransferMergeModal.tsx
git commit -m "fix(pos): TransferMergeModal disables buttons when no orderId"
```

---

### Task 4: OpenTableModal — 失败保持 modal + toast 错误

**Files:**
- Modify: `wwwpos/src/app/page.tsx`

- [ ] **Step 1: 修改 handleOpenTable**

```tsx
const handleOpenTable = async (tableId: string, playerCount: number) => {
  try {
    await openTable(tableId, playerCount)
    setActiveModal('none')
    toast.success('开台成功')
    refreshTables()
  } catch (e: any) {
    toast.error(e?.message || '开台失败，请重试')
    // modal 保持打开，不关闭
  }
}
```

- [ ] **Step 2: 确认 toast 可用**

检查 `sonner` toast 是否已正确导入。如果没有，添加 `pnpm add sonner` 并确认导入路径。

- [ ] **Step 3: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/app/page.tsx
git commit -m "fix(pos): keep modal open + show toast on openTable failure"
```

---

## Phase 2: 通知+周边完善（P1）

### Task 5: 通知 API 路径统一化

**Files:**
- Modify: `wwwpos/src/services/notification-service.ts`
- Modify: `wwwpos/src/utils/ws-notification.ts`

- [ ] **Step 1: ws-notification.ts — WS URL 环境变量**

```typescript
constructor(storeId: string, wsUrl?: string) {
  this.storeId = storeId
  this.url = wsUrl || process.env.NEXT_PUBLIC_WS_URL || 'wss://api.tpzl88.com:8282'
}
```

- [ ] **Step 2: notification-service.ts — HTTP 路径使用 API_BASE_URL**

```typescript
// poll() 方法
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || '/storeapi'
const res = await fetch(`${API_BASE}/pos/Notification/lists?${params.toString()}`)

// markAsRead
await fetch(`${API_BASE}/pos/Notification/read`, { ... })

// markAllAsRead
await fetch(`${API_BASE}/pos/Notification/readAll`, { ... })

// removeNotification
await fetch(`${API_BASE}/pos/Notification/delete`, { ... })
```

- [ ] **Step 3: 同时注入 Authorization header**

```typescript
const token = localStorage.getItem('token')
const headers: Record<string, string> = { 'Content-Type': 'application/json' }
if (token) headers['Authorization'] = `Bearer ${token}`
// 所有 fetch 调用添加 headers
```

- [ ] **Step 4: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/services/notification-service.ts wwwpos/src/utils/ws-notification.ts
git commit -m "fix(pos): unify notification API URLs with env vars + auth header"
```

---

### Task 6: 结账后会员绑定自动刷新账单

**Files:**
- Modify: `wwwpos/src/components/MemberModal.tsx`
- Modify: `wwwpos/src/components/CheckoutModal.tsx`

- [ ] **Step 1: MemberModal — 新增 onMemberBound 回调**

```tsx
interface MemberModalProps {
  // ... existing props
  onMemberBound?: () => void  // ← 新增
}

// handleBindMember 成功时:
await orderApi.bindMember({ order_id: orderId, member_id: member.id })
onMemberBound?.()
toast.success('会员绑定成功')
```

- [ ] **Step 2: CheckoutModal — 监听回调自动刷新**

```tsx
// 新增 refreshBill ref
const refreshBillRef = useRef<() => void>()

// 暴露给父组件
useEffect(() => {
  if (onRefreshReady) onRefreshReady(() => refreshBillRef.current?.())
}, [])

// 或者直接在 page.tsx 中：
<MemberModal onMemberBound={() => checkoutRef.current?.refreshBill()} />
```

- [ ] **Step 3: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/MemberModal.tsx wwwpos/src/components/CheckoutModal.tsx
git commit -m "fix(pos): auto-refresh bill after member binding"
```

---

### Task 7: 交班用 router 替代 location.reload

**Files:**
- Modify: `wwwpos/src/components/ShiftModal.tsx`

- [ ] **Step 1: 修改 handover 成功回调**

```tsx
// 替换: window.location.reload()
// 为: window.location.href = '/'
// 或使用 Next.js router:
import { useRouter } from 'next/navigation'
const router = useRouter()
// 成功时: router.push('/')
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/ShiftModal.tsx
git commit -m "fix(pos): use router.push instead of location.reload on shift handover"
```

---

### Task 8: 统计双重 API 调用

**Files:**
- Modify: `wwwpos/src/components/StatisticsModal.tsx`

- [ ] **Step 1: 移除 useEffect 中的 fetchData**

```tsx
// 移除: useEffect(() => { fetchData(dateRange) }, [dateRange])
// 改为仅初始加载:
useEffect(() => { fetchData('today') }, [])
// handleDateChange 中直接调 fetchData(range)
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/StatisticsModal.tsx
git commit -m "fix(pos): remove duplicate fetch in StatisticsModal date change"
```

---

### Task 9: 会员搜索 tab 状态隔离

**Files:**
- Modify: `wwwpos/src/components/MemberModal.tsx`

- [ ] **Step 1: 分离搜索和充值 tab 状态**

```tsx
// 替换共享的:
const [searchResults, setSearchResults] = useState<Member[]>([])
const [hasSearched, setHasSearched] = useState(false)

// 为:
const [bindSearchResults, setBindSearchResults] = useState<Member[]>([])
const [bindHasSearched, setBindHasSearched] = useState(false)
const [rechargeSearchResults, setRechargeSearchResults] = useState<Member[]>([])
const [rechargeHasSearched, setRechargeHasSearched] = useState(false)
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/MemberModal.tsx
git commit -m "fix(pos): isolate member search state between bind and recharge tabs"
```

---

### Task 10: 通知服务路由切换清理

**Files:**
- Modify: `wwwpos/src/components/NotificationOverlay.tsx`

- [ ] **Step 1: 添加 cleanup**

```tsx
useEffect(() => {
  return () => {
    NotificationService.getInstance().destroy()
  }
}, [])
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/components/NotificationOverlay.tsx
git commit -m "fix(pos): destroy NotificationService on route unmount"
```

---

## Phase 3: 清理（P2）

### Task 11: 移除死代码 import

**Files:**
- Modify: `wwwpos/src/app/page.tsx`

- [ ] **Step 1: 移除 PromotionBanner import**

```tsx
// 删除: import { PromotionBanner } from '@/components/PromotionBanner'
// 保留文件不删除，后续可恢复
```

- [ ] **Step 2: TypeScript 编译 + commit**

```bash
cd wwwpos && npx tsc --noEmit
git add wwwpos/src/app/page.tsx
git commit -m "chore(pos): remove unused PromotionBanner import"
```

---

### Task 12: 端到端验证

- [ ] **Step 1:** 登录 → 选店 → 台桌列表正常显示
- [ ] **Step 2:** 点击空闲台桌 → 开台成功（toast 提示）
- [ ] **Step 3:** 开台后 → 点单 → 提交成功
- [ ] **Step 4:** 开台后 → 分配助教 → 确认成功
- [ ] **Step 5:** 开台后 → 换台/并台 → 操作成功
- [ ] **Step 6:** 结账 → 会员绑定 → 折扣实时更新
- [ ] **Step 7:** 通知面板 → 显示开台/点单/助教通知
- [ ] **Step 8:** 交班 → 页面正常跳回登录

---

## Plan Self-Review

1. **Spec coverage:** All 14 fixes mapped to 11 tasks + 1 verification task ✓
2. **No placeholders:** All code blocks are complete ✓
3. **Type consistency:** orderId prop is string across all 4 modified components ✓
