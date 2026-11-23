# M1 Task 14 验收证据：管理端对账报告与证据下钻

- 验收日期：2026-11-21（Asia/Shanghai）
- 工作树：`D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1`
- 页面：`billiards/wwwstore/src/app/finance`（原有三个财务 tab + 新增“智能交班”）
- 权限：沿用 `finance:cashflow`；无审批、退款、记账或设备控制按钮

## 1. 新增内容

- `finance/page.tsx`：新增“智能交班”tab，原收入方式/营业额/充值三个 tab 保留
- `finance/components/agent-reconciliation-tab.tsx`
  - 输入历史班次并发起固定对账流
  - 展示报告、SOP 引用、追问（只读已保存报告）
  - 链接 `/agent?run_id=...` 查看 Trace
- `finance/components/reconciliation-report.tsx`
  - 状态：`数据不足，无法判断` / `需要人工复核` / `系统核对一致（仍需外部账单确认）`
  - 快照与证据重算分列；差异、已解释项、不确定项分栏
  - 降级时展示“说明生成不可用”，确定性数值保持可见
  - 不出现“对账通过”或“财务对账通过”
- `finance/components/evidence-drawer.tsx`
  - 按 `rule_id` 将证据引用映射到 orders/payments/recharges/cash_flows
  - 调用 `GET /v1/reconciliation/runs/{id}/evidence` 展示只读字段
- `finance/components/sql-analysis-panel.tsx`
  - 明确标注“开放式只读分析，不影响固定对账”
  - 展示 guarded SQL、结果表、拒绝原因与降级状态
- `lib/api/agent.ts`
  - `streamReconciliationRun`：body 严格 `{store_id, shift_id}`
  - `streamReconciliationFollowup`：body 严格 `{question}`
  - `fetchRunEvidence`：`kind` + `ids`，携带 Bearer
  - `streamSqlAnalysis`：body 严格 `{store_id, question}`

## 2. 组件与客户端测试

Run from `billiards/wwwstore`：

```powershell
pnpm vitest run
```

```text
 ✓ src/lib/api/agent.test.ts (7 tests)
 ✓ src/app/finance/components/reconciliation-report.test.tsx (6 tests)

 Test Files  2 passed (2)
      Tests  13 passed (13)
```

覆盖：

- `insufficient_data`、`review_required` 不出现“对账通过”
- `ok` 只显示“系统核对一致”，不显示“财务对账通过”
- 降级且 `narrative=null` 时 `100.00` 仍渲染，并显示“说明生成不可用”
- 点击重算数值打开对应证据引用
- 差异/已解释项/不确定项分栏渲染
- 对账/追问/SQL 分析请求体不含 `tenant_id/employee_id/role`
- 证据下钻携带 Bearer token

## 3. 既有检查（与 Task 3 基线一致）

| 命令 | 退出码 | 结果 |
|---|---|---|
| `pnpm ts-check` | 2 | 13 个 TypeScript 错误，与基线逐条一致；新增文件无错误 |
| `pnpm lint` | 1 | `403 problems (205 errors, 198 warnings)`，与基线一致 |
| `pnpm build:win` | 1 → 0 | M1 验收时为 17 个 `@radix-ui/*` Module not found；**2026-11-23 已修复并通过**（24/24 静态页预渲染成功），详见 [acceptance.md 附录 A](acceptance.md#附录-am1-后构建修复2026-11-23) |

## 4. 浏览器验收状态

浏览器级验收在 M1 验收时被既有 `@radix-ui/*` 依赖缺失阻塞（`pnpm build:win` 在 import 阶段失败，与 Task 3/M0 相同）。因此本任务当时：

- 未伪造截图、run id 或浏览器结果
- 以组件测试覆盖状态文案、降级数值、证据点击与请求体
- 不宣称完成真实浏览器端到端验证

**2026-11-23 更新：** 该构建阻塞已修复（`build:win` 通过、24/24 页预渲染成功，详见 [acceptance.md 附录 A](acceptance.md#附录-am1-后构建修复2026-11-23)）；完整登录后端到端截图待后续补跑，本次未伪造任何浏览器结果。
