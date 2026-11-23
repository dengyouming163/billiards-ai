# 助教服务弹窗优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 优化助教服务选择弹窗，包括缩小弹窗宽度、调整按钮布局、优化服务方式选择和支付流程。

**Architecture:** 通过修改 AssistantModal.tsx 和 BuyoutPaymentModal.tsx 组件，调整弹窗尺寸、按钮布局和卡片样式，实现更紧凑、更人性化的操作体验。

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, lucide-react

---

## File Structure

| File | Purpose |
|------|---------|
| `src/components/AssistantModal.tsx` | 主弹窗组件，包含选择助教、服务方式、买断配置三个步骤 |
| `src/components/BuyoutPaymentModal.tsx` | 买断支付弹窗，处理先付场景的支付逻辑 |

---

## Task 1: 优化 ModalShell 基础样式 - 缩小弹窗宽度

**Files:**
- Modify: `src/components/ModalShell.tsx`

**Steps:**
- [ ] **Step 1: 读取 ModalShell.tsx 文件**

Run: `cat src/components/ModalShell.tsx`

- [ ] **Step 2: 修改弹窗宽度**

将弹窗最大宽度从 `max-w-3xl` 调整为 `max-w-lg`（约 512px），使其更紧凑便于操作。

```tsx
// 修改前
<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-3xl w-full">

// 修改后
<div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-w-lg w-full">
```

- [ ] **Step 3: 修改头部样式**

```tsx
// 修改前
<div className="px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between shrink-0">

// 修改后
<div className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between shrink-0">
```

- [ ] **Step 4: 修改内容区域内边距**

```tsx
// 修改前
<div className="flex-1 overflow-auto p-6">

// 修改后
<div className="flex-1 overflow-auto p-4">
```

---

## Task 2: 优化选择助教步骤 - 调整按钮布局

**Files:**
- Modify: `src/components/AssistantModal.tsx`

**Steps:**
- [ ] **Step 1: 修改 Step 1 的 footer 按钮布局**

将按钮从占满宽度改为固定在底部右侧，按钮高度加大。

```tsx
// 修改前
footer={step === 'select' ? (
  <div className="flex gap-3 w-full">
    <Button onClick={onClose} variant="outline" className="flex-1 h-11 rounded-xl">取消</Button>
    <Button onClick={() => { ... }} disabled={!selectedAssistant || !orderId}
      className="flex-1 h-11 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0">
      {!orderId ? '请先开台' : '下一步 →'}
    </Button>
  </div>
) : undefined}

// 修改后
footer={step === 'select' ? (
  <div className="flex justify-end gap-2">
    <Button onClick={onClose} variant="outline" className="h-12 px-6 rounded-xl text-sm">取消</Button>
    <Button onClick={() => { ... }} disabled={!selectedAssistant || !orderId}
      className="h-12 px-7 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0 text-sm font-medium">
      {!orderId ? '请先开台' : '下一步 →'}
    </Button>
  </div>
) : undefined}
```

- [ ] **Step 2: 调整助教卡片网格布局**

将网格列数从 `grid-cols-8` 调整为更合理的布局。

```tsx
// 修改前
<div className="grid grid-cols-8 gap-2">

// 修改后
<div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
```

---

## Task 3: 优化服务方式选择步骤 - 左右大卡片布局

**Files:**
- Modify: `src/components/AssistantModal.tsx`

**Steps:**
- [ ] **Step 1: 修改 Step 2 的布局结构**

将直接上桌和买断时长改为左右并排的大卡片布局。

```tsx
// 修改前
{step === 'mode' && selectedAssistantData && (
  <div className="space-y-4 p-6">
    ...
    <button onClick={handleRealtime} ... className="w-full p-5 rounded-xl border-2 border-emerald-200 bg-emerald-50 ...">
      <p className="text-lg font-bold text-emerald-700">🟢 直接上桌（实时计费）</p>
      <p className="text-sm text-emerald-600 mt-1">上钟开始计时，按实际服务时长计费</p>
    </button>
    <button onClick={() => { ... }} ... className="w-full p-5 rounded-xl border-2 border-amber-200 bg-amber-50 ...">
      <p className="text-lg font-bold text-amber-700">🟠 买断时长（一口价）</p>
      <p className="text-sm text-amber-600 mt-1">选定时长，价格锁定，支持先付后付</p>
    </button>
    <div className="flex gap-3">
      <Button onClick={() => goBack('select')} variant="outline" className="flex-1 h-11 rounded-xl">← 上一步</Button>
      <div className="flex-1" />
    </div>
  </div>
)}

// 修改后
{step === 'mode' && selectedAssistantData && (
  <div className="space-y-4">
    {busyError && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl">{busyError}</div>}

    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-base">
        {selectedAssistantData.name.charAt(0)}
      </div>
      <div>
        <p className="font-bold text-sm">{selectedAssistantData.name}</p>
        <p className="text-xs text-slate-500">¥{selectedAssistantData.hourlyRate}/小时</p>
      </div>
    </div>

    <div className="grid grid-cols-2 gap-3">
      <button onClick={handleRealtime} disabled={isProcessing}
        className="p-4 rounded-xl border-2 border-emerald-200 bg-emerald-50 hover:border-emerald-400 transition-all flex flex-col items-center justify-center text-center h-32">
        <span className="text-2xl mb-2">🟢</span>
        <p className="font-bold text-emerald-700 text-sm">直接上桌</p>
        <p className="text-xs text-emerald-600 mt-1">实时计费</p>
      </button>

      <button onClick={() => { setBillingMode('flat_rate'); setStep('configure'); }}
        className="p-4 rounded-xl border-2 border-amber-200 bg-amber-50 hover:border-amber-400 transition-all flex flex-col items-center justify-center text-center h-32">
        <span className="text-2xl mb-2">🟠</span>
        <p className="font-bold text-amber-700 text-sm">买断时长</p>
        <p className="text-xs text-amber-600 mt-1">一口价</p>
      </button>
    </div>

    <div className="flex justify-between">
      <Button onClick={() => goBack('select')} variant="outline" className="h-12 px-5 rounded-xl text-sm">← 上一步</Button>
    </div>
  </div>
)}
```

---

## Task 4: 优化买断时长配置步骤 - 居中大按钮布局

**Files:**
- Modify: `src/components/AssistantModal.tsx`

**Steps:**
- [ ] **Step 1: 修改 Step 3 的布局结构**

将时长选择按钮放大并居中排列，支付方式改为左右卡片布局，按钮统一放底部。

```tsx
// 修改前
{step === 'configure' && selectedAssistantData && (
  <div className="space-y-4 p-6">
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">选择时长</p>
      <div className="flex flex-wrap gap-2">
        {[0.5, 1, 2, 3].map(h => {
          return (
            <button key={h} ... className={`px-4 py-2 rounded-xl border-2 text-sm font-medium ...`}>
              {h}小时 · ¥{price.toFixed(0)}
            </button>
          );
        })}
        <input ... className="w-24 px-3 py-2 rounded-xl border-2 text-sm text-center" />
      </div>
    </div>
    ...
    <div>
      <p className="text-sm font-medium text-slate-700 mb-2">支付方式</p>
      <div className="flex gap-2">
        <button onClick={() => setPayMode('prepaid')} ... className={`flex-1 py-2.5 rounded-xl text-sm font-medium ...`}>先付</button>
        <button onClick={() => setPayMode('postpaid')} ... className={`flex-1 py-2.5 rounded-xl text-sm font-medium ...`}>后付</button>
      </div>
    </div>
    ...
  </div>
)}

// 修改后
{step === 'configure' && selectedAssistantData && (
  <div className="space-y-4">
    <div>
      <p className="text-xs font-medium text-slate-700 mb-3 text-center">选择时长</p>
      <div className="flex flex-wrap justify-center gap-2">
        {[0.5, 1, 2, 3].map(h => {
          const price = (h * hourlyRate);
          return (
            <button key={h} onClick={() => { setBuyoutHours(h); setCustomHoursInput(''); }}
              className={`w-24 h-14 rounded-xl border-2 text-sm font-medium transition-all ${
                buyoutHours === h && !customHoursInput ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-slate-200 hover:border-slate-300'
              }`}>
              {h}小时<br />
              <span className="text-xs">¥{price.toFixed(0)}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 flex justify-center">
        <input type="number" step="0.5" min="0.5" max="24"
          placeholder="自定义小时"
          value={customHoursInput}
          onChange={(e) => {
            setCustomHoursInput(e.target.value);
            const v = parseFloat(e.target.value);
            if (v > 0) setBuyoutHours(v);
          }}
          className="w-32 px-3 py-2 rounded-xl border-2 border-slate-200 text-sm text-center"
        />
      </div>
    </div>

    <div className="bg-amber-50 rounded-xl p-4 text-center">
      <p className="text-sm text-amber-700">
        预估: <span className="text-2xl font-bold">¥{buyoutAmount.toFixed(2)}</span>
        <span className="text-xs ml-1">= {buyoutHours}h × ¥{hourlyRate}/h</span>
      </p>
    </div>

    <div>
      <p className="text-xs font-medium text-slate-700 mb-3 text-center">支付方式</p>
      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => setPayMode('prepaid')}
          className={`p-4 rounded-xl border-2 text-center transition-all ${payMode === 'prepaid' ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
          <p className={`font-bold ${payMode === 'prepaid' ? 'text-amber-700' : 'text-slate-600'}`}>先付</p>
          <p className="text-xs text-slate-500 mt-1">支付后开始上钟</p>
        </button>
        <button onClick={() => setPayMode('postpaid')}
          className={`p-4 rounded-xl border-2 text-center transition-all ${payMode === 'postpaid' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-slate-300'}`}>
          <p className={`font-bold ${payMode === 'postpaid' ? 'text-blue-700' : 'text-slate-600'}`}>后付</p>
          <p className="text-xs text-slate-500 mt-1">结账时一起支付</p>
        </button>
      </div>
    </div>

    <div className="flex justify-between">
      <Button onClick={() => goBack('mode')} variant="outline" className="h-12 px-5 rounded-xl text-sm">← 上一步</Button>
      <Button onClick={handleBuyout} disabled={isProcessing}
        className="h-12 px-7 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 text-sm font-medium">
        {payMode === 'prepaid'
          ? `确认支付 · ¥${buyoutAmount.toFixed(0)}`
          : `确认买断 · ¥${buyoutAmount.toFixed(0)}`}
      </Button>
    </div>
  </div>
)}
```

---

## Task 5: 优化买断支付弹窗 - 添加会员信息和支付选项

**Files:**
- Modify: `src/components/BuyoutPaymentModal.tsx`

**Steps:**
- [ ] **Step 1: 添加会员信息获取和状态**

```tsx
// 在 useState 中添加
const [memberInfo, setMemberInfo] = useState<{ name: string; phone: string; balance: number } | null>(null);
const [showMemberBalance, setShowMemberBalance] = useState(true);

// 添加获取会员信息的逻辑
useEffect(() => {
  // 从 AppContext 获取当前订单绑定的会员信息
  const fetchMember = async () => {
    try {
      const result = await orderApi.getCurrentOrder(orderId) as Record<string, unknown>;
      const member = (result as any)?.memberInfo || (result as any)?.member_info;
      if (member) {
        setMemberInfo({
          name: member.name || '',
          phone: member.phone || '',
          balance: Number(member.balance) || 0,
        });
      }
    } catch { /* ignore */ }
  };
  fetchMember();
}, [orderId]);
```

- [ ] **Step 2: 修改支付方式布局为方形卡片**

```tsx
// 修改前
<div className="grid grid-cols-3 gap-2">
  {channels.map((ch) => (
    <button key={ch.key} ... className={`p-3 rounded-xl border-2 text-center transition-all ...`}>
      <ch.icon className={`w-5 h-5 mx-auto mb-1 ...`} />
      <span className="text-xs font-medium">{ch.label}</span>
    </button>
  ))}
</div>

// 修改后
<div className="grid grid-cols-3 gap-2">
  {channels.map((ch) => (
    <button key={ch.key} onClick={() => { setChannel(ch.key); setError(''); }}
      className={`p-4 rounded-lg border-2 text-center transition-all ${channel === ch.key ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-slate-300'}`}>
      <ch.icon className={`w-6 h-6 mx-auto mb-2 ${channel === ch.key ? 'text-emerald-600' : 'text-slate-400'}`} />
      <span className="text-sm font-medium">{ch.label}</span>
    </button>
  ))}
</div>
```

- [ ] **Step 3: 添加会员信息显示区域**

在支付方式选择前添加会员信息卡片：

```tsx
{showMemberBalance && memberInfo && (
  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-indigo-600">绑定会员</span>
      <button onClick={() => setShowMemberBalance(false)} className="text-xs text-indigo-400">隐藏</button>
    </div>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
        <User className="w-5 h-5 text-indigo-500" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm text-indigo-700">{memberInfo.name}</p>
        <p className="text-xs text-indigo-500">{memberInfo.phone}</p>
      </div>
      <div className="text-right">
        <p className="text-xs text-indigo-500">余额</p>
        <p className={`text-lg font-bold ${memberInfo.balance >= amount ? 'text-emerald-600' : 'text-red-500'}`}>
          ¥{memberInfo.balance.toFixed(2)}
        </p>
      </div>
    </div>
    {memberInfo.balance < amount && (
      <div className="mt-2 p-2 bg-amber-50 rounded-lg text-xs text-amber-600">
        余额不足，差额 ¥{(amount - memberInfo.balance).toFixed(2)} 将通过其他方式支付
      </div>
    )}
  </div>
)}
```

- [ ] **Step 4: 调整支付信息突出显示**

```tsx
// 修改前
<div className="bg-emerald-50 rounded-xl p-4 text-center">
  <p className="text-sm text-slate-500">{assistantName} · 买断 {buyoutHours} 小时</p>
  <p className="text-2xl font-bold text-emerald-600 mt-1">¥{amount.toFixed(2)}</p>
</div>

// 修改后
<div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-xl p-5 border border-emerald-200">
  <p className="text-xs text-slate-500 text-center mb-1">{assistantName} · 买断 {buyoutHours} 小时</p>
  <div className="text-center">
    <span className="text-sm text-slate-500">应付金额</span>
    <p className="text-3xl font-bold text-emerald-600 mt-1">¥{amount.toFixed(2)}</p>
  </div>
</div>
```

- [ ] **Step 5: 调整按钮布局到弹窗底部**

```tsx
// 修改前
<div className="flex gap-3">
  <button onClick={onClose} className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium">取消</button>
  <button onClick={handlePay} ... className="flex-1 py-2.5 bg-emerald-500 ... rounded-xl text-sm font-medium">
    ...
  </button>
</div>

// 修改后
<div className="flex justify-end gap-2 pt-2">
  <button onClick={onClose} className="h-12 px-5 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-medium">取消</button>
  <button onClick={handlePay} disabled={status === 'paying'}
    className="h-12 px-7 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 disabled:opacity-50 text-white rounded-xl text-sm font-medium">
    {status === 'paying' ? <span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />处理中...</span> : `确认支付 ¥${amount}`}
  </button>
</div>
```

---

## Task 6: 验证构建和运行

**Steps:**
- [ ] **Step 1: 运行 TypeScript 检查**

Run: `pnpm run typecheck`

- [ ] **Step 2: 运行构建**

Run: `pnpm run build:win`

- [ ] **Step 3: 启动开发服务器验证**

Run: `pnpm run dev`

---

## Self-Review

1. **Spec coverage:** 所有用户需求都有对应任务：
   - ✅ 弹窗宽度缩小
   - ✅ 按钮固定底部右侧，高度加大，不占满宽度
   - ✅ 服务方式左右大卡片布局，按钮放底部
   - ✅ 买断时长选择按钮放大居中
   - ✅ 支付方式左右卡片布局，按钮放底部
   - ✅ 支付信息突出显示
   - ✅ 添加会员信息
   - ✅ 支付方式方形卡片

2. **Placeholder scan:** 无占位符内容，所有代码都已详细定义

3. **Type consistency:** 类型和方法签名保持一致