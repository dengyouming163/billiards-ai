# M1 面试证据卡

> 只写已经实现并有命令/测试/评测证据的内容。没有授权历史数据与人工耗时样本，因此不引用生产准确率或效率提升。

## 1. 固定对账为什么不用 Text-to-SQL

- 班次对账的字段语义来自 PHP 现状：订单按 `store_id + operator_id + end_time + status=completed`；订单级/商品级/助教级支付不能相加；充值实收是 `member_recharge.amount`，赠送是 `gift_amount`；部分充值现金流记录 `amount + gift_amount`；合并单仅在父单同店、同操作员、同班次时才可按现状计入。
- 这些规则由 `agent/app/domain/reconciliation.py` 的纯函数实现，金额全程 `Decimal`，报告是证据 payload 的确定性输出；模型只生成解释，不能改数值、差异分类或证据引用。
- 开放式分析才允许模型写 SQL，并且必须经过 `agent/app/guard/sql_guard.py`（单条 SELECT、单视图、列/函数白名单、禁 JOIN/UNION/子查询/CTE/`SELECT *`/锁/INTO、LIMIT ≤ 200、强制 `store_id` 作用域）与独立只读账号 `bi_agent_ro`（仅 3 个 `agent_*` 视图 SELECT）。
- 证据：`agent/tests/test_reconciliation_rules.py` 13 个黄金用例逐字段一致；`eval/run_reconciliation_eval.py` 退出码 0，`exact=13/13`、`ref_coverage=100%`；`eval/run_sql_security_eval.py` 对 30 个 Guard 攻击、7 个数据库直连攻击 `100%` 阻断，7 个合法问题 `100%` 通过并实际执行。

## 2. 为什么不做全自动

- M0/M1 只注册只读工具；没有开台、收银、退款、记账、设备控制或任何业务表写入。报告与异常建议由财务人工采纳。
- `status` 只有三种：`insufficient_data`（空/截断/无快照）、`review_required`（差异/缺字段/归属未知）、`ok`（系统核对一致，但仍需外部现金与渠道账单）。`ok` 不渲染为“财务对账通过”。
- 合并单归属不清、支付分类不明、支付时间不明、现金流无法归属都会进入 `unknowns` 并阻断自动差异结论，不当作 0，也不按通过率调整黄金答案。
- 证据：`agent/app/domain/reconciliation.py` 的 `BLOCKING_UNKNOWN_CODES` 与 `comparison_blocked`；黄金集中的 `merge-attribution-unknown`、`handover-no-snapshot`、`empty-shift`、`external-confirmation-required`。

## 3. 为什么是单 Agent

- M0/M1 使用一张明确的 LangGraph 状态图：`load_evidence → route → reconcile → route(review_required) → retrieve_sop → narrate`，工具数量有限、状态可枚举。
- 没有主管/专家角色、没有多 Agent 投票、没有模型路由表或 MCP Server。多 Agent 包装简单对账只会增加不可解释性。
- 证据：`agent/app/graphs/reconciliation.py`、`agent/app/graphs/sql_analysis.py`；`eval/results/m1-reconciliation.json` 中 `tool_selection_accuracy=null` 并注明“固定图不包含模型驱动的工具选择”。

## 4. 身份与门店隔离

- 浏览器提交 `tenant_id/employee_id/role/权限数组` 一律 422；`store_id` 只是请求范围，服务端通过球房身份服务校验员工门店访问与 `finance:cashflow` 权限。
- 跨员工、跨店 run 与证据查询统一 404，不泄露存在性。
- SQL 层再做一次服务端作用域：Guard 把原 `WHERE` 加括号后追加 `AND store_id = :__agent_store_id`，执行器绑定已验证身份的门店。
- 证据：`test_identity_fields_in_body_are_rejected`、`test_get_run_hides_foreign_store_as_404`；`eval/run_sql_security_eval.py` 的 `scoped-order-escape` 在 `OR 1 = 1` 下仍只返回 `store-a`，`store-b` 行未泄漏。

## 5. Trace 与可复核性

- SSE 事件：`run.started`、`tool.started/completed/failed`、`message.delta`、`sql.drafted`、`run.completed/failed`；run/event/tool_calls 持久化 PostgreSQL，客户端断连落 `cancelled`，终态写失败不丢 Trace。
- 报告每个数值携带 `refs`；前端点击数值按 `rule_id` 下钻订单/支付/充值/现金流只读字段。
- 证据：`agent/tests/test_runs_api.py`、`test_reconciliation_api.py`、`test_sql_analysis_api.py`；`billiards/wwwstore/src/app/finance/components/evidence-drawer.tsx` 与 6 个报告组件测试；`pnpm vitest run` 13 passed。

## 6. 降级

- 模型或 RAG 失败只影响解释文案：报告除 `narrative/degraded` 外逐字段不变，`degraded_reason` 区分 `MODEL_UNAVAILABLE`、`MODEL_OUTPUT_INVALID`、`RAG_UNAVAILABLE`。
- 故障注入实测：模型端点不可达 → `MODEL_UNAVAILABLE`；RAG 端点不可达 → `RAG_UNAVAILABLE`；MySQL 停服 → 受控查询 `SQL_EXECUTION_FAILED`，但对账 eval 仍 `PASSED`；PostgreSQL 停服 → 连接 `OperationalError`，应用启动 `ConnectionTimeout` 快速失败，对账 eval 仍 `PASSED`。
- 证据：`agent/tests/test_reconciliation_degradation.py` 4 passed；`docs/evidence/m1/acceptance.md` 第 3 节。

## 7. SQL 双层防护

- 第一层 AST：拒绝非 SELECT、多语句、UNION、JOIN、子查询、CTE、多视图、base table、schema 前缀、PII/未知列、`SELECT *`、危险函数、INTO、锁、超限 LIMIT、placeholder、空/超长 SQL。
- 第二层数据库：独立只读账号只有 3 个视图的 SELECT；实测读 base table 与写/DDL 全部 1142。执行器另加只读事务、`MAX_EXECUTION_TIME`、行数上限。
- 证据：`eval/datasets/sql_attacks.json`（30 Guard + 7 DB + 7 legal）；`eval/results/m1-sql-security.json` 中 `ast_guard_block_rate=1.0`、`database_block_rate=1.0`、`legal_case_pass_rate=1.0`、`SHOW GRANTS` 仅 3 条视图 SELECT。

## 8. 实测指标（合成数据，非生产）

| 指标 | 值 | 口径 |
|---|---|---|
| 黄金集逐字段一致 | 13/13 | `eval/results/m1-reconciliation.json` |
| 数值证据引用覆盖 | 100% | 所有数值 claim 的 refs 均可解析 |
| 异常识别率 / 误报率 | 100% / 0% | 13 个合成班次 |
| SQL Guard / DB 阻断 | 100% / 100% | 30 + 7 个攻击 |
| 合法 SQL 执行通过 | 100% | 7 条聚合查询 |
| 对账规则延迟 | p50 0.092 ms / p95 0.098 ms | 进程内规则，20 次/例 |
| SQL Guard 延迟 | p50 0.135 ms / p95 0.209 ms | 进程内 AST |
| 模型 token / 成本 | 未记录 | 固定对账与 SQL 安全评测均不调用模型 |
| 人工复核耗时 | 无样本 | 未采集，不宣称效率提升 |

## 9. 原业务回归

- `billiards/wwwapi`：`php vendor/bin/phpunit` → `OK (34 tests, 344 assertions)`；Characterization 固化交班/签退/支付/充值/合并单现状，未修改旧业务语义。
- Agent 停止或故障不影响原手工交班与对账；前端既有 `ts-check`/`lint` 失败与基线一致，未新增错误；`build:win` 的 `@radix-ui/*` 构建阻塞已于 2026-11-23 修复（详见 [acceptance.md 附录 A](acceptance.md#附录-am1-后构建修复2026-11-23)），`vitest` 仍 13 passed。

## 10. 未实现，不在 M1 宣称

- MCP Server、策略化模型路由、多 Agent、Redis、outbox、后台 worker：均未创建。
- 上述复杂方案统一写为 **M4 待同集评估**：必须用同一数据集对比原生工具 vs 只读 MCP、单模型 vs 路由、单 Agent vs 多 Agent，实测无质量/成本/延迟/隔离收益则不进入主架构。
