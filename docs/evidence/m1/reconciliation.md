# M1 Task 10-11 验收证据：确定性对账、SOP 证据与降级

- 验收日期：2026-11-21（Asia/Shanghai）
- 工作树：`D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1`
- 数据边界：仅合成门店 `store-a/store-b`、员工 `emp-a/emp-b`、合成订单/充值/现金流与合成制度文档；未连接生产库，未读写原仓库 `D:\wwwroot\wwwbilliards-dky`
- 代码边界：对账报告是证据 payload 的纯函数；不调用模型、RAG 或 SQL 计算金额

## 1. 确定性规则（Task 10）

新增：

- `agent/app/domain/money.py`：所有金额经 `Decimal(str(value))`，按分四舍五入
- `agent/app/domain/reconciliation.py`：证据模型、规则、报告与证据引用
- `agent/tests/fixtures/evidence/*.json`：13 份合成证据
- `agent/tests/test_reconciliation_rules.py`
- `eval/datasets/reconciliation_golden.json`：13 个完整 expected 黄金用例

规则与 Task 4 characterization 一致：

| 规则 | 实现 |
|---|---|
| 订单范围 | 只信 PHP 已按 `store_id + operator_id + end_time + completed` 过滤后的证据，Agent 不重算时间窗 |
| 订单级 vs item 级支付 | 只汇总 `classification=order`；item 级支付单独解释，不重复计入 |
| 充值 | 实收=`amount`，赠送=`gift_amount`；赠送进 `explained` |
| 充值现金流 | 与 `amount + gift_amount` 比较；差额进 `differences`，不把赠送当外部实收 |
| 合并单 | 同一门店/操作员/班次的子单按现状计入；跨店/跨操作员/跨班次父单归属 `unknown`，并阻断该分类的自动差异结论 |
| 缺失/截断 | 无快照→`NO_LEGACY_SNAPSHOT`；快照字段缺失→`SNAPSHOT_FIELD_MISSING`；截断→`EVIDENCE_TRUNCATED`；均不输出“全部一致” |
| 外部确认 | 现金实盘与外部渠道账单不可由证据证明，固定输出 `EXTERNAL_CONFIRMATION_REQUIRED`，状态最多为“系统核对一致” |
| 开台数 | 证据只含已完成订单，无法重算，输出 `OPEN_TABLE_COUNT_NOT_IN_EVIDENCE` |

`status` 语义：

- `insufficient_data`：证据为空、被截断或没有可比较快照
- `review_required`：存在差异、快照缺字段或归属未知
- `ok`：证据能支持的所有检查一致；仅表示“系统核对一致”，不代表财务对账通过

黄金用例（13 个）：正常单渠道、正常混合渠道、订单渠道与订单级 payment 不一致、item payment 不重复计、同班次 merge 父子单、充值赠送、现金流未含赠送、历史快照缺字段、handover 无快照、空班次、边界时间、外部账单/实盘、merge 归属未知。

## 2. 对账图与 API（Task 11）

新增：

- `agent/app/graphs/reconciliation.py`：`load_evidence → reconcile → (review? retrieve_sop) → narrate`
- `agent/app/services/reconciliation_runner.py`：run 持久化、SSE、Trace、追问、证据下钻
- `agent/app/api/reconciliation.py`
  - `POST /v1/reconciliation/runs/stream`，body 仅 `{store_id, shift_id}`
  - `POST /v1/reconciliation/runs/{id}/messages/stream`，body 仅 `{question}`
  - `GET /v1/reconciliation/runs/{id}/evidence?kind=orders&ids=...`
- `agent/app/schemas.py`：两个 `extra="forbid"` 请求模型
- `eval/fixtures/sop/shift-reconciliation.md`：含提示注入文本的合成 SOP

行为约束：

- 固定流程必须 `finance:cashflow`；身份只来自 Bearer，body 伪造身份字段返回 422
- 跨员工/跨门店 run 与证据下钻一律 404，不暴露存在性
- 证据 403/422 直接 `run.failed`，不生成部分报告
- 模型只生成 `summary/recommended_checks/citation_chunk_ids`；引用逐条与本次 hits 校验，伪造 chunk 被丢弃
- RAG 失败：报告数值不变，`degraded=true`、`degraded_reason=RAG_UNAVAILABLE`
- 模型失败或输出非 JSON：报告数值不变，`degraded=true`，`narrative` 为确定性降级说明
- 追问只读已持久化报告，不再次查询业务证据

## 3. 测试输出

Run from `agent`：

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

```text
........................................................................ [ 50%]
......................................................................   [100%]
142 passed in 7.03s
```

```powershell
.\.venv\Scripts\python.exe -m ruff check .
```

```text
All checks passed!
```

Task 11 关键用例：

- `test_normal_run_persists_report_and_streams`
- `test_review_items_retrieve_sop_and_drop_forged_citations`
- `test_sop_injection_text_cannot_change_report_or_tools`
- `test_other_store_evidence_fails_the_run_without_a_report`
- `test_rejected_evidence_422_does_not_produce_partial_report`
- `test_empty_shift_is_insufficient_data_not_matched`
- `test_evidence_drilldown_is_scoped_to_the_run_owner`
- `test_followup_reuses_report_without_querying_evidence_again`
- `test_model_failure_keeps_deterministic_report`
- `test_invalid_model_output_degrades_without_changing_numbers`
- `test_followup_model_failure_degrades_without_touching_report`
- `test_every_reported_number_has_resolvable_evidence_refs`

## 4. RAG 真实检索

RAG 独立运行于 `http://127.0.0.1:8000`，未修改 RAG 仓库源码。

上传合成 SOP（`eval/fixtures/sop/shift-reconciliation.md`）：

```text
POST /v1/kbs/billiards-sop-test/documents -> 202 {"job_id":16984,"doc_id":"billiards-sop-test-e4706387"}
GET  /v1/jobs/16984 -> status=succeeded
```

说明：RAG 上传接口未提供 audience 参数，上传文档按默认 `public` 入库；内部制度检索使用 Task 7 已建立的 internal 合成文档，避免把 SOP 当作公开内容。

Agent 自身 `search_sop` 真实调用（`tenant=merchant-a`、`employee=emp-a`、`audience=internal`）：

```text
hits: 3
billiards-sop-test-174cce55#2 billiards-sop-test-174cce55 0.016393 1. 交班前核对现金、微信、支付宝与 POS 流水。
billiards-sop-test-174cce55#1 billiards-sop-test-174cce55 0.016129 本制度适用于门店收银交班与财务复核。
billiards-sop-test-174cce55#3 billiards-sop-test-174cce55 0.015873 发现差异时先确认是否存在未入账订单，再检查退款与挂账记录。
```

## 5. 限制

- 未接入真实模型；Task 11 只验证结构化输出、引用校验与降级路径
- 未接入真实历史班次数据；黄金用例全部为合成证据
- RAG 上传文档为 public audience；internal SOP 检索依赖既有 internal 合成文档
