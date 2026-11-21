# M0 验收证据

- 验收日期：2026-11-21（Asia/Shanghai）
- 工作树：`D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1`，分支 `feature/m0-m1`
- 数据边界：仅使用合成门店 `store-a/store-b`、员工 `emp-a/emp-b` 与合成制度文档；未连接生产库，未读写原仓库 `D:\wwwroot\wwwbilliards-dky`
- 原业务基线：见 `docs/evidence/m0/business-baseline.md`

## 1. 管理端 Agent 页面

新增文件：

- `billiards/wwwstore/src/lib/api/agent.ts`：Bearer 取自 `localStorage.token`，SSE 逐帧解析，请求体仅 `store_id/question/scene`
- `billiards/wwwstore/src/app/agent/page.tsx`：制度问答、运行状态、run id、降级错误
- `billiards/wwwstore/src/app/agent/components/run-trace.tsx`：`GET /v1/runs/{id}` 的 Trace、事件、工具调用和引用
- `billiards/wwwstore/src/components/layout/app-shell.tsx`：新增导航 `Agent 运行`，权限 `overview`
- `billiards/wwwstore/vitest.config.mts`、`src/test/setup.ts`、`src/lib/api/agent.test.ts`

页面约束：无开台、支付、退款、记账或设备控制按钮；不显示任何前端自算或伪造的对账金额。

### 1.1 单元测试

Run from `billiards/wwwstore`：

```powershell
pnpm vitest run
```

输出：

```text
 RUN  v3.2.4 D:/wwwroot/projectwork/projects/billiards-ai/.worktrees/m0-m1/billiards/wwwstore

 ✓ src/lib/api/agent.test.ts (3 tests) 11ms

 Test Files  1 passed (1)
      Tests  3 passed (3)
```

覆盖点：

- 跨 chunk 的 SSE 帧拼接，事件顺序为 `run.started → message.delta → run.completed`
- `Authorization: Bearer <localStorage.token>`
- 请求体严格等于 `{ store_id, question }`，不含 `tenant_id/employee_id/role`
- 服务 503 时透出后端 `detail.message`（降级错误）
- Trace 查询携带同一 Bearer token

### 1.2 既有检查（与 Task 3 基线逐项一致）

| 命令 | 退出码 | 结果 |
|---|---|---|
| `pnpm ts-check` | 2 | 13 个 TypeScript 错误，与 `business-baseline.md` 第 100/110-119 行逐条一致；无新增文件错误 |
| `pnpm lint` | 1 | `403 problems (205 errors, 198 warnings)`，与基线完全相同；`agent`/`vitest`/`src/test` 无告警 |
| `pnpm build:win` | 1 | `Turbopack build failed with 17 errors`，模块清单与基线完全相同（`@radix-ui/react-checkbox/dialog/dropdown-menu/popover/presence/primitive/roving-focus/select/switch`）；无 Agent 页面错误 |

说明：这三项均为基线已记录的 pre-existing 失败，本次未通过补装依赖或修改既有业务源码改写结果。前端浏览器级冒烟因此受同一依赖缺失阻塞，Agent 页面以单元测试与 `ts-check` 覆盖；此限制如实保留。

工具链说明：`vitest.config.ts` 使用 `.mts` 后缀，因为 `package.json` 未声明 `type: module`，CJS 加载 `.ts` 配置会失败；`jsdom` 固定为 26.x，避免 jsdom 31 在当前 Node v22.11.0 下的 ESM `require` 失败。

## 2. Agent 内核

Run from `agent`：

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

输出：

```text
........................................................................ [ 65%]
......................................                                   [100%]
110 passed in 8.06s
```

关键子集（`tests/test_runs_api.py tests/test_checkpoint.py tests/test_graph_limits.py tests/test_rag_tool.py -v`，38 passed）：

```text
test_stream_events_are_ordered_persisted_and_queryable PASSED
test_tool_failure_event_and_trace_are_preserved PASSED
test_model_failure_finishes_run_and_keeps_events PASSED
test_identity_fields_in_body_are_rejected PASSED
test_missing_or_unknown_bearer_token_is_rejected PASSED
test_get_run_hides_foreign_store_as_404 PASSED
test_get_run_does_not_oracle_existence_with_bad_token PASSED
test_sse_sends_keep_alive_pings PASSED
test_last_event_id_replays_only_newer_persisted_events PASSED
test_stream_disconnect_marks_run_cancelled PASSED
test_checkpoint_survives_new_app_instance PASSED
test_checkpoint_does_not_store_raw_phone_numbers PASSED
test_model_tool_loop_stops_after_four_model_calls PASSED
```

## 3. 原业务冒烟

Run from `billiards/wwwapi`：

```powershell
php vendor/bin/phpunit
```

输出：

```text
PHPUnit 9.6.39 by Sebastian Bergmann and contributors.
Runtime:       PHP 8.2.9

.................................. 34 / 34 (100%)

Time: 00:34, Memory: 30.00 MB

OK (34 tests, 344 assertions)
```

其中 Characterization 9 个用例固化交班/支付/充值/合并单现状，Integration 25 个用例覆盖 Agent 身份与证据 API；M0 未修改旧业务语义。

## 4. RAG 真实 smoke

RAG 服务独立运行于 `http://127.0.0.1:8000`（未修改 RAG 仓库源码）。

```text
GET /live  -> 200 {"ok":true}
GET /ready -> 200 {"ok":true,"db":"up"}
```

知识库为 Task 7 已建立的合成库：

```text
billiards-sop-test | merchant-a | 6 chunks
```

使用 Agent 自身的 `search_sop`（而非直接 curl）发起真实请求：

```powershell
# Run from agent
.\.venv\Scripts\python.exe -
# principal = Principal(tenant_id="merchant-a", employee_id="emp-a", store_id="store-a", role="owner", permissions={"*"})
# hits = await search_sop("交班对账流程", principal)
```

输出：

```text
hits: 3
billiards-sop-test-174cce55#2 billiards-sop-test-174cce55 0.008197 1. 交班前核对现金、微信、支付宝与 POS 流水。 2. 差异超过 50 元时填写差异说明并由
billiards-sop-test-174cce55#1 billiards-sop-test-174cce55 0.008065 本制度适用于门店收银交班与财务复核。
billiards-sop-test-174cce55#3 billiards-sop-test-174cce55 0.007937 发现差异时先确认是否存在未入账订单，再检查退款与挂账记录。
```

## 5. 越权阻断

PHP（`phpunit --testdox`）：

```text
✔ Boss cannot access another merchant store
✔ Boss cannot access disabled store
✔ Employee without membership cannot access store
✔ Employee with membership cannot access disabled store
✔ Employee with membership but without finance permission cannot read evidence
✔ Employee cannot read another store shift
✔ Forged identity fields are rejected in query and body without changing context
✔ Shift from another store is not found inside authorized store
```

Agent：

```text
test_identity_fields_in_body_are_rejected PASSED
test_missing_or_unknown_bearer_token_is_rejected PASSED
test_get_run_hides_foreign_store_as_404 PASSED
test_get_run_does_not_oracle_existence_with_bad_token PASSED
```

## 6. SSE 与 Trace

- SSE 事件顺序、持久化与可查询：`test_stream_events_are_ordered_persisted_and_queryable`
- 保活 ping：`test_sse_sends_keep_alive_pings`
- `Last-Event-ID` 续传：`test_last_event_id_replays_only_newer_persisted_events`
- 客户端断连落 `cancelled`：`test_stream_disconnect_marks_run_cancelled`
- 终态失败不丢 Trace：`test_terminal_event_write_failure_keeps_single_consistent_terminal`
- Trace 仅本人可查：`test_get_run_hides_foreign_store_as_404`
- 前端 Trace 查询：`src/lib/api/agent.test.ts` 的 `queries the run trace with the bearer token`

## 7. Checkpoint

- `test_checkpoint_survives_new_app_instance`：关闭首个 lifespan，使用同一 PostgreSQL 新建应用实例后仍可读取同一 `thread_id` 的 checkpoint
- `test_checkpoint_does_not_store_raw_phone_numbers`：checkpoint 内不保留原始手机号
- `test_prepare_checkpointer_takes_and_releases_advisory_lock` / `test_prepare_checkpointer_unlocks_when_setup_fails`：多实例初始化互斥与异常释放

## 8. Agent 停止后手工流程可用

上述 PHPUnit 34 个用例在 Agent 进程未启动的情况下全部通过，说明原业务的身份、交班与证据读取不依赖 Agent。Agent 失败仅影响制度问答页面，并在页面显示降级提示，不阻塞原手工交班与对账。

## 9. M0 门禁结论

- Agent 身份、有限工具调用、RAG、SSE、PostgreSQL run/tool/audit/checkpoint、本人 Trace：测试证据齐全
- 跨店/跨商户/停用门店/伪造身份：PHP 与 Agent 双侧阻断
- 原业务：characterization + integration 全通过，未改变旧语义
- 前端新增检查：单元测试通过；`ts-check`、`lint`、`build:win` 保持 Task 3 记录的 pre-existing 失败，无新增错误
- 限制：前端浏览器级可视化冒烟被既有 `@radix-ui/*` 依赖缺失阻塞，已在基线记录，本次未修复

结论：M0 代码级验收完成，可进入 M1（Task 10）。不得把本页面的存在当作 M1 对账能力或任何自动执行业务操作的证据。
