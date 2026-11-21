# M1 总验收证据

- 验收日期：2026-11-21（Asia/Shanghai）
- 工作树：`D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1`
- 代码基线：`3fa1272`（Task 14）+ 本任务评测脚本；采集时 Task 15 文件尚未提交，故 eval 元数据中 `dirty=true`
- 数据边界：仅合成门店 `store-a/store-b`、员工 `emp-a/emp-b` 与测试库；**没有获得授权的历史生产数据**，未做历史回放，也未声称任何生产收益

## 1. 质量门禁（eval）

```powershell
agent\.venv\Scripts\python eval\run_reconciliation_eval.py --dataset eval/datasets/reconciliation_golden.json --output eval/results/m1-reconciliation.json
agent\.venv\Scripts\python eval/run_sql_security_eval.py --dataset eval/datasets/sql_attacks.json --output eval/results/m1-sql-security.json
```

输出：

```text
reconciliation eval: PASSED
cases=13 exact=13/13 ref_coverage=100.00%
anomaly_recall=100.00% false_positive_rate=0.00%
latency_ms p50=0.092 p95=0.098
output: ...\eval\results\m1-reconciliation.json

sql security eval: PASSED
guard_block_rate=100.00% database_checks=executed
legal_pass_rate=100.00%
output: ...\eval\results\m1-sql-security.json
```

### 1.1 对账黄金集

| 项目 | 结果 |
|---|---|
| 样本量 | 13（`ok=7`、`review_required=4`、`insufficient_data=2`） |
| 逐字段报告一致 | `13/13`（比较 `legacy_summary/recomputed/differences/explained/unknowns/evidence_refs`，不只比较 HTTP 200） |
| 数值证据引用覆盖 | `100%`（所有金额/数量/差异/说明数值均有 refs，且 refs 均可在 `evidence_refs` 注册表中解析） |
| 引用源 ID 可解析 | `100%`（每个 `source_ids` 都存在于 evidence payload） |
| 异常识别率 | `100%`（4 个 `review_required` + 2 个 `insufficient_data` 状态全部正确） |
| 误报率 | `0%`（7 个 `ok` 未被误判为需要复核） |
| 数据集 SHA-256 | `06a67d2b225e776bd36661c58b6842f890d73732a442a466b8fc6e804979ad7a` |

`insufficient_data` 用例（空班次、快照缺失/截断）不产生任何 `differences`，不会显示为“已核对”。

### 1.2 SQL 安全门禁

| 项目 | 结果 |
|---|---|
| 样本量 | 44（Guard 攻击 30、数据库直连攻击 7、合法问题 7） |
| AST Guard 阻断率 | `100%`（写语句、多语句、UNION、JOIN、子查询、CTE、多视图、base table、schema 前缀、PII/未知列、`SELECT *`、`t.*`、SLEEP/LOAD_FILE/NOW/SUBSTRING、INTO OUTFILE、FOR UPDATE、LIMIT 201/0/ALL、placeholder、空 SQL、超长 SQL） |
| 数据库身份阻断率 | `100%`（`bi_agent_ro` 读 base table、INSERT/UPDATE/DELETE/CREATE/DROP 均返回 1142） |
| 授权范围 | `SHOW GRANTS` 仅 3 条 `GRANT SELECT ON ...agent_*`，无 `bi_busi_*`、无库级通配 |
| 合法问题通过率 | `100%`（7 条聚合查询通过 Guard 并实际执行） |
| 越权作用域 | 合成 `store-a/store-b` 行执行 `WHERE ... OR 1=1` 只返回 `store-a`，`store-b` 行未泄漏 |
| Guard 延迟 | p50 `0.135 ms`，p95 `0.209 ms` |
| 执行延迟 | p50 `5.870 ms`，p95 `7.332 ms`（本地测试 MySQL，不含网络/模型） |
| 数据集 SHA-256 | `3f93351f1267f857575e37bed3f757d14fdc7c110a4fd28392e94884a36989cd` |

说明：为核对合法查询的真实结果，评测用管理账号插入带唯一前缀的合成订单/充值行，执行后立即删除；未使用任何真实会员或交易数据。

## 2. 全量验收命令

### 2.1 Agent（Run from `agent`）

```text
.venv\Scripts\python.exe -m pytest -q
204 passed in 10.11s

.venv\Scripts\python.exe -m ruff check app tests
All checks passed!
```

### 2.2 原业务 PHP（Run from `billiards/wwwapi`）

```text
php vendor/bin/phpunit
PHPUnit 9.6.39 by Sebastian Bergmann and contributors.
Runtime:       PHP 8.2.9
Configuration: ...\billiards\wwwapi\phpunit.xml

.................................. 34 / 34 (100%)

OK (34 tests, 344 assertions)
```

Characterization 用例固化交班/签退/支付/充值/合并单现状，Integration 覆盖 Agent 身份与证据 API；本任务未修改旧业务语义。

### 2.3 管理端（Run from `billiards/wwwstore`）

```text
pnpm vitest run
 ✓ src/lib/api/agent.test.ts (7 tests)
 ✓ src/app/finance/components/reconciliation-report.test.tsx (6 tests)
 Test Files  2 passed (2)
      Tests  13 passed (13)
```

既有检查保持 Task 3 基线，失败均未由本任务引入：

| 命令 | 退出码 | 结果 |
|---|---|---|
| `pnpm ts-check` | 2 | 13 个 TypeScript 错误，全部位于 `coupon-reports`、`finance-income-tab`、`reports`、`settings-discount-tab` 等既有文件，新增文件无错误 |
| `pnpm lint` | 1 | `403 problems (205 errors, 198 warnings)`，与基线数字一致 |
| `pnpm build:win` | 1 | 17 个 `@radix-ui/*` Module not found，与 Task 3/M0 完全一致 |

## 3. 故障注入

所有注入均真实执行，恢复后服务为 healthy。对账数值不依赖模型、RAG、MySQL 或 PostgreSQL。

| 故障 | 注入方式 | 观测结果 |
|---|---|---|
| 模型不可用 | `MODEL_BASE_URL=http://127.0.0.1:9/v1`，调用 `LangChainModelAdapter.complete` | `model fault -> MODEL_UNAVAILABLE` |
| RAG 不可用 | `RAG_BASE_URL=http://127.0.0.1:9`，调用 `search_sop`；并实际 `docker stop rag-kb-api` 后恢复 | `rag fault -> RAG_UNAVAILABLE rag service unavailable`；恢复后 `/live -> {"ok":true}` |
| MySQL 不可用 | `docker stop billiards-agent-m0m1-mysql-1`，执行受控查询并重跑对账 eval | `mysql fault -> SQL_EXECUTION_FAILED`；对账 eval 仍 `PASSED`（13/13） |
| PostgreSQL 不可用 | `docker stop billiards-agent-m0m1-postgres-1`，连接 Agent 库并用默认依赖启动应用 | `postgres fault -> OperationalError connection timeout expired`；`startup fault -> ConnectionTimeout`（快速失败，不写成功 run）；对账 eval 仍 `PASSED`（13/13） |

模型/RAG 降级对报告的影响由 `tests/test_reconciliation_degradation.py` 固化（4 passed）：报告除 `narrative/degraded` 外逐字段不变，RAG 断连时 `degraded_reason=RAG_UNAVAILABLE`，数值与证据引用保持完整。

## 4. 耗时基线

- 对账规则：13 个用例各重复 20 次，p50 `0.092 ms`、p95 `0.098 ms`（进程内纯规则，不含 HTTP、RAG、模型、UI）。
- SQL Guard：p50 `0.135 ms`、p95 `0.209 ms`；受控查询执行 p50 `5.870 ms`、p95 `7.332 ms`（本地测试 MySQL）。
- 模型 token/成本：`null`。固定对账不调用模型；SQL 评测不调用模型，没有真实 usage 可记录。
- 工具选择准确率：`null`。固定图不包含模型驱动的工具选择。
- 人工复核耗时：**没有可用样本**。未获得人工复核开始/结束时间、人员与异常分布记录，因此本报告只给观测值，**不宣称任何效率提升百分比**。

## 5. 历史回放

未获得经授权的脱敏历史班次数据，因此本任务没有历史回放结果，也没有把合成数据混入“历史样本”抬高样本量。全部指标仅代表 `store-a/store-b` 合成夹具与测试库。

## 6. 浏览器证据

浏览器级验收仍被既有 `@radix-ui/*` 依赖缺失阻塞（`pnpm build:win` 在 import 阶段失败），详见 [ui-acceptance.md](ui-acceptance.md)。本任务未伪造截图、run id 或浏览器结果；页面的状态文案、降级数值、证据下钻与请求体由 13 个前端单元/组件测试覆盖。

RAG 真实检索（Task 11/14 记录）：`search_sop("交班对账流程")` 返回 3 条 internal 命中；上传的合成 SOP `billiards-sop-test-e4706387` 因默认 `audience=public` 不被 internal 检索命中，已如实记录，未修改 RAG 仓库。

## 7. 已知限制

1. 无授权历史数据与人工耗时样本，无法给出生产准确率与效率结论。
2. 浏览器端到端验收被既有 `@radix-ui/*` 依赖缺失阻塞。
3. `ts-check`、`lint`、`build:win` 维持既有失败，均未由本任务新增。
4. SQL 评测只针对 3 个 `agent_*` 视图与本地测试库；生产部署需重复授权与网络隔离检查。
5. 弱模型生成的 SQL 质量、真实模型成本与延迟未在本任务测量。

## 8. M1 结论

- 固定对账报告全部数值由 Decimal 确定性规则生成，黄金集逐字段一致，证据引用覆盖 100%。
- 赠送、item payment、合并单、快照缺失、空数据与外部账单均按 `explained/unknowns/status` 区分，不混淆、不臆断。
- 模型、RAG、MySQL、PostgreSQL 故障不改变确定性数值；应用对持久层不可用快速失败。
- Text-to-SQL 经 AST 与独立只读 MySQL 账号双层阻断，不能访问 base table、他店或写数据；固定对账不经过该工具。
- 全部命令与评测可复现；M0/M1 可以按“只读交班对账”能力投递，不宣称 M2/M3/M4 能力。
