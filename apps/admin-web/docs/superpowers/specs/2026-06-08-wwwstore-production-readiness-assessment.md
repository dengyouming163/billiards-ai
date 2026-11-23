# wwwstore 生产就绪度评估报告

> 日期: 2026-06-08 | 综合评分: 3.3/5 | 框架: Next.js 16 + React 19 + shadcn/ui

---

## 一、项目概况

wwwstore 是台球厅老板/店长管理后台，13 个业务模块，127 个源文件。

| 属性 | 值 |
|------|-----|
| 页面 | 14 个 (含 login/account/profile/test) |
| API 模块 | 25 个 |
| UI 组件 | 53 个 shadcn/ui + 10 个业务组件 |
| 状态管理 | React Context + useReducer |
| 数据模式 | USE_API_MODE 标记 (Mock↔API切换) |

---

## 二、P0 致命问题（4 项）

| # | 文件 | 问题 | 影响 |
|---|------|------|------|
| 1 | **auth-context.tsx:203** | `sendSmsCode` 成功判断 `response.code !== 1` 永远为 `true`。`sendSmsCode` API 返回 `data: { expire_in: 300 }`，`post()` 解包后没有 `code` 字段 | 🔴 短信验证码永远失败 |
| 2 | **use-app.tsx:222** | `useSwitchStore()` 仅 dispatch `SET_CURRENT_STORE`，不调用 API 也不写 localStorage。与 `switchStore` 行为不同 | 🔴 门店切换一半失效 |
| 3 | **pricing/page.tsx:190** | `showToast` 通过 `CustomEvent('showToast')` 派发到 `window`，但**全应用没有 `addEventListener('showToast')`** | 🔴 计价规则所有操作无反馈 |
| 4 | **reports/page.tsx:46** | `getDateByOffset` 接受 `format` 参数但**从未使用**，始终返回 `toISOString().split('T')[0]`。月/年范围的 `endDate` 永远是当天 | 🔴 月度/年度报表数据错误 |

---

## 三、P1 高优问题（9 项）

| # | 文件 | 问题 |
|---|------|------|
| 5 | data.ts:945 | `USE_API_MODE = false` 声明但从未被任何代码检查 — Mock/API 切换无效 |
| 6 | client.ts:213 | `handleApiError` 内部已 `throw error`，调用方再 `throw error` 是死代码（4 个方法重复） |
| 7 | client.ts:407 | `download()` 无 AbortController，网络故障时永久挂起 |
| 8 | members/page.tsx | **无"添加会员"按钮**，**无"充值"功能** — 会籍管理半边缺失 |
| 9 | orders/page.tsx | `page` 状态存在但 UI 无分页控件（无 prev/next 按钮） |
| 10 | dashboard/page.tsx | "本月" Tab 无 onClick 处理器 — 死按钮 |
| 11 | assistants/page.tsx:706 | 助理卡片收入固定显示 `formatCurrency(0)` — 收入永远 ¥0.00 |
| 12 | tables/page.tsx:129 | QR 二维码生成功能**全部注释掉**（~80行），TODO: "postponed" |
| 13 | finance/page.tsx:53 | `dateFilter` 状态声明了但从未传入 API 调用 |

---

## 四、P2 低优问题（7 项）

| # | 问题 |
|---|------|
| 14 | `account/page.tsx` 使用 `alert()` 而非 toast 上下文（与应用其他页面不一致） |
| 15 | `sidebar.tsx` + `header.tsx` 都是 `return null` 的死代码，但仍有 10+ 未使用的 import |
| 16 | `data.ts:527` `mockAssistantOrders` 引用不存在的助理 ID（`assistant_1` vs `asst_1`） |
| 17 | `data.ts:857` 套餐 `pkg_7` 使用 `asst_1` 作为 `product_id` — 类型错误 |
| 18 | `client.ts` 中 4 个方法的 `{id}` 占位符需手动替换，无 helper 函数 |
| 19 | `reports/page.tsx:79` 报表 useEffect 仅在 `dateRange` 改变时触发，切换门店后数据不刷新 |
| 20 | `orders/page.tsx` 定义了 `quick_order` 和 `merged` 状态但在筛选器中未暴露 |

---

## 五、亮点

1. **25 个 API 模块** — 覆盖完善，snake→camel 自动转换、storeId 自动注入、token 过期全局拦截
2. **shadcn/ui 53 组件** — UI 质量高，暗黑/亮色主题支持
3. **AppShell 权限过滤** — 侧边栏导航按角色权限动态显示/隐藏
4. **组件化清晰** — Products/Settings/Finance 页面拆分子组件，可维护性好
5. **会员导出** — 客户端 CSV 生成，Blob 下载，无需后端参与

---

## 六、就绪度评估

```
功能完整性:  ██████████████░░░░░░  70%  ← 会员管理/二维码缺失
代码质量:    ███████████████░░░░░  75%  ← 死代码/类型重复
API 覆盖:    ██████████████████░░  90%  ← 25 个模块充分
类型安全:    ████████████░░░░░░░░  60%  ← any 泄漏/重复类型
用户体验:    ████████████████░░░░  80%  ← 状态处理好/反馈缺失

综合: ~75% 就绪
```

### 四项目对比

| 项目 | 初始 | 修复后 | 亮点 |
|------|:--:|:--:|------|
| wwwstoreapp | 75% | 93% | 移动端最完整 |
| wwwtable | 60% | 93% | 暗黑金 UI+离线计费 |
| wwwpos | 47% | 85% | 20 弹窗+离线骨架 |
| **wwwstore** | **75%** | — | 25 API模块+shadcn/ui |

---

## 七、修复优先级

```
Phase 1 (P0): 短信修复 + 门店切换 + Toast事件 + 报表日期    预计 2-3h
Phase 2 (P1): 会员管理 + 订单分页 + 死配置 + 下载超时        预计 4-6h
Phase 3 (P2): 死代码清理 + alert→toast + 数据类型修复         预计 2-3h

预计总工时: 10-14h
```
