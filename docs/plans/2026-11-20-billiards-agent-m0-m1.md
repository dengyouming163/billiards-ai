# 球房经营 Agent M0/M1 实施计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在不改动原球房仓库的前提下，交付可重复验证的脱敏业务副本、Agent 最小内核，以及具有确定性对账、证据下钻和受约束只读 Text-to-SQL 的交班对账 Agent。

**Architecture:** 复制后的 ThinkPHP 继续作为身份、权限和业务事实权威；FastAPI + LangGraph 只负责编排，PostgreSQL 保存运行、工具调用、审计与 checkpoint，现有 RAG 仅通过 HTTP Search API 提供制度证据。固定对账使用只读证据 API + Decimal 确定性规则；模型只生成解释。开放式分析才允许模型生成 SQL，并经过独立 MySQL 只读账号、专用视图、sqlglot AST、服务端门店作用域、LIMIT、超时和行数上限。

**Tech Stack:** PHP 8 / ThinkPHP 8 / Think ORM 3 / MySQL 8；Python 3.11+ / FastAPI / Pydantic 2 / SQLAlchemy 2 / LangGraph / PostgreSQL 16 / OpenAI 兼容 API / sqlglot；Next.js 16 / React 19 / TypeScript / pnpm 9 / Vitest；pytest / PHPUnit 9.6 / Docker Compose。

---

## 0. 范围、架构取舍与验收红线

### 0.1 本计划交付

- **M0**：脱敏源码副本、测试环境、原业务基线、PHP 测试 harness、Agent 身份与运行内核、模型工具调用适配器、RAG Search 工具、SSE、运行 Trace、管理端基础 Agent 页面。
- **M1**：历史班次只读证据 API、确定性对账图、SOP 引用、无数据/缺数据/外部账单不可判断状态、管理端报告与证据下钻、受约束 Text-to-SQL、黄金集、故障注入、评测与业务耗时基线。

### 0.2 明确的架构取舍

| 取舍 | 本计划中的强制实现 |
|---|---|
| 不使用无约束 Text-to-SQL | 固定对账禁止生成 SQL；开放式分析只能访问 `agent_*` 视图，数据库账号只对视图有 SELECT，AST 与执行器两层防护缺一不可 |
| 不盲目全自动 | M0/M1 只有只读工具自动执行；报告和异常建议由人工采纳；不实现开台、支付、退款、记账、设备控制或任何业务表写入 |
| 不滥用多 Agent | M0/M1 保持单 Agent、明确状态图、多工具；不设置主管/专家角色，不用多 Agent 包装简单流程 |
| 模型不口算账务 | 所有金额用 `Decimal`，由 SQL/规则计算；模型输出不能修改报告数值、差异分类和证据引用 |
| RAG 不是实时事实源 | RAG 只返回 SOP 证据；订单、支付、充值、班次数值只能来自球房只读证据 API 或受控分析视图 |

### 0.3 高级扩展门禁

**MCP、策略化模型路由、多 Agent 不属于 M0/M1。** M1 核心验收全部通过后，另写 M4 计划和同集对比实验：原生工具 vs 只读 MCP、单模型 vs 模型路由、单 Agent vs 多 Agent。只有质量、成本、延迟或隔离有实测收益才保留复杂方案；本计划不得提前创建 MCP Server、模型路由表、专家 Agent、Redis、outbox 或后台 worker。

### 0.4 不可妥协边界

1. 原目录 `D:\wwwroot\wwwbilliards-dky` 只读；所有写操作只发生在新仓库 `D:\wwwroot\projectwork\projects\billiards-ai`。
2. 不复制 `.git`、真实 `.env`/密钥、数据库或会员数据、`node_modules`、`vendor`、构建产物、缓存、日志和生产上传文件。保留配置模板、结构迁移和合成测试夹具。
3. `D:\wwwroot\projectwork\projects\rag-knowledge-base` 独立复用，不复制、不修改；生产仅允许受信内网 Agent 服务调用，不能把 RAG 当前占位身份请求头暴露给浏览器。
4. 浏览器提交的 `tenant_id`、`employee_id`、`role`、权限数组一律 422；`store_id` 只是请求范围，必须经服务端员工门店访问校验。
5. 新增证据接口不改变现有 `pos.Shift/summary`、签退、交接班行为；旧行为用 characterization test 固化。
6. 任何截断、缺字段、支付映射不清或需要实际现金/外部账单的情况都进入 `unknowns`，不得当作 0 或已核实差异。
7. 文档中的“Expected”是执行时的预期，不是预先宣称的结果；没有真实命令输出和评测数据就不写性能或收益结论。

## 1. 已核查的源码事实（实施时不得重新假设）

- 实际源码位于原仓库 `www\` 下；`deploy/wwwstore` 不是源目录。
- `ShiftLogic::shiftSummary()` 只查当天 `checked_in` 班次；订单按 `store_id + operator_id + end_time + status=completed`，充值按 `created_at`。
- `checkOut()` 冻结部分字段，但未冻结 `alipayPaid`、`cardPaid`、`rechargeCount`；`handover()` 没有冻结同一组财务快照。历史班次不能直接复用当前 `summary`。
- 订单主表有各渠道金额；`bi_busi_order_payment` 同时存在订单级、商品/助教项级（`order_item_id`）及合并支付记录，不能无条件求和。当前代码写支付状态 `paid`，旧 `wwwstore/docs/database.sql` 的 `success` 描述不是当前权威。
- 充值实收是 `member_recharge.amount`，赠送是 `gift_amount`；部分充值现金流 `cash_flow.amount = amount + gift_amount`，不能直接当外部实收。
- `BaseStoreController` 会接受请求 `store_id`，所以新接口必须显式校验 `EmployeeStore`，或老板与同商户门店的服务端关系；不能仅依赖 token 中门店。
- RAG 合约：`POST /v1/kbs/{kb_id}/search`，body 仅含 `query/top_k/mode/audience`，`audience ∈ public|internal`；响应 hits 含 `chunk_id/doc_id/score/text/metadata`。Agent 服务端映射 `X-Tenant-Id` 和 `X-User-Id`。
- `wwwapi` 虽有 `phpunit.xml`，但缺 bootstrap、tests 目录及 PHPUnit 依赖；必须先建立可运行 harness，不能宣称已有测试可跑。

## 2. 执行约定

- 所有 git 命令均从仓库根目录执行；测试/运行命令均从仓库根目录执行，除非邻近命令明确写出 `Run from`。
- 每个任务严格按“失败测试 → 最小实现 → 通过测试 → 提交”执行； characterization test 用于记录现状，不为迎合预期修改旧业务。
- 测试只使用合成门店 `store-a/store-b`、员工 `emp-a/emp-b` 和合成订单；禁止连接生产库。
- 若实际导出 Schema 与计划字段不符，先更新测试夹具和语义记录，再实现；不得从过期 SQL 文档猜字段。
- 合并订单或支付记录无法唯一归属时，阻断该分类的自动差异结论并记为 `unknown`，不得为通过率调整黄金答案。
- 每个提交只加入任务列出的文件，不使用 `git add -A`、`git add .`、`--no-verify`。

---

## M0：迁移基线与 Agent 最小内核

### Task 1：建立仓库防泄漏规则并迁移脱敏源码

**Files:**
- Create: `.gitignore`
- Create: `docs/evidence/m0/source-manifest.txt`
- Copy: `billiards/wwwapi`, `billiards/wwwstore`, `billiards/wwwpos`, `billiards/wwwstoreapp`, `billiards/wwwtable`, `billiards/wwwsocket`

**Step 1: 写入排除规则**

```gitignore
# secrets and local configuration
.env
.env.local
.env.*.local
.env.production
.env.development
*.pem
*.key
# dependencies and build output
**/node_modules/
**/vendor/
**/.next/
**/dist/
**/dist-electron/
**/coverage/
# runtime data
**/runtime/
**/logs/
**/log/
**/uploads/
*.log
# local Python
**/__pycache__/
**/.pytest_cache/
**/.venv/
# Agent data and evaluation output with sensitive content
agent/data/
eval/results/*.json
!eval/results/.gitkeep
```

**Step 2: 只读记录原仓库状态并复制**

```powershell
git -C D:\wwwroot\wwwbilliards-dky status --short
$src = 'D:\wwwroot\wwwbilliards-dky\www'
$dst = 'D:\wwwroot\projectwork\projects\billiards-ai\billiards'
$modules = 'wwwapi','wwwstore','wwwpos','wwwstoreapp','wwwtable','wwwsocket'
foreach ($m in $modules) {
  robocopy "$src\$m" "$dst\$m" /E /R:1 /W:1 `
    /XD .git node_modules vendor .next dist dist-electron coverage runtime logs log uploads `
    /XF .env .env.local .env.production .env.development .env.test '.env.*.local' '*.log' '*.pem' '*.key'
  if ($LASTEXITCODE -gt 7) { throw "robocopy failed for $m : $LASTEXITCODE" }
}
```

Expected: robocopy 退出码 0–7；原仓库 status 与执行前一致。`.env.example`、结构 SQL 和测试模板允许保留。

**Step 3: 验证迁移边界并生成文件清单**

```powershell
New-Item -ItemType Directory -Force docs/evidence/m0 | Out-Null
$forbidden = Get-ChildItem billiards -Recurse -Force -File | Where-Object {
  $_.Name -in '.env','.env.local','.env.production','.env.development','.env.test' -or
  $_.Name -like '.env.*.local' -or $_.Extension -in '.pem','.key','.log'
}
$forbidden
Get-ChildItem billiards -Recurse -File | ForEach-Object {
  $_.FullName.Substring((Get-Location).Path.Length + 1)
} | Sort-Object | Set-Content -Encoding utf8 docs/evidence/m0/source-manifest.txt
```

Expected: `$forbidden` 无输出；清单不含依赖、生产上传、缓存或真实数据文件。若发现密钥/个人信息，停止提交，删除副本中的敏感内容并重新检查。

**Step 4: 提交**

```bash
git add .gitignore billiards docs/evidence/m0/source-manifest.txt
git commit -m "chore: import sanitized billiards source baseline"
```

### Task 2：建立可重复的 MySQL/PostgreSQL 测试环境和真实结构基线

**Files:**
- Create: `deploy/compose.test.yml`
- Create: `deploy/mysql/init/001-schema.sql`（仅结构）
- Create: `deploy/mysql/init/002-agent-readonly.sql`
- Create: `agent/.env.example`
- Create: `docs/evidence/m0/environment.md`

**Step 1: 写 Compose，先只启动数据库**

```yaml
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: test-root-only
      MYSQL_DATABASE: billiards_test
      MYSQL_USER: billiards
      MYSQL_PASSWORD: test-billiards-only
    ports: ["13306:3306"]
    volumes:
      - mysql-test-data:/var/lib/mysql
      - ./mysql/init:/docker-entrypoint-initdb.d:ro
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-ptest-root-only"]
      interval: 5s
      timeout: 3s
      retries: 30
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: agent_test
      POSTGRES_USER: agent
      POSTGRES_PASSWORD: test-agent-only
    ports: ["15432:5432"]
    volumes: ["postgres-test-data:/var/lib/postgresql/data"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U agent -d agent_test"]
      interval: 5s
      timeout: 3s
      retries: 30
volumes:
  mysql-test-data:
  postgres-test-data:
```

`agent/.env.example` 只放测试占位：

```dotenv
APP_ENV=test
AGENT_DATABASE_URL=postgresql+psycopg://agent:test-agent-only@127.0.0.1:15432/agent_test
LANGGRAPH_DATABASE_URL=postgresql://agent:test-agent-only@127.0.0.1:15432/agent_test
BILLIARDS_BASE_URL=http://127.0.0.1:10002/storeapi
BILLIARDS_MYSQL_RO_URL=mysql+mysqlconnector://bi_agent_ro:test-readonly-only@127.0.0.1:13306/billiards_test
RAG_BASE_URL=http://127.0.0.1:8000
RAG_KB_ID=billiards-sop-test
RAG_AUDIENCE=internal
MODEL_BASE_URL=http://127.0.0.1:9999/v1
MODEL_API_KEY=test-only
MODEL_NAME=test-tool-model
MODEL_TIMEOUT_SECONDS=20
SQL_TIMEOUT_MS=2000
SQL_MAX_ROWS=200
```

**Step 2: 从经批准的测试环境导出“仅结构”，不使用生产数据**

```powershell
# 仅在获得测试库授权后填写临时环境变量；不要把值写入仓库。
mysqldump --host=$env:SCHEMA_HOST --port=$env:SCHEMA_PORT `
  --user=$env:SCHEMA_USER --password --no-data --single-transaction `
  --skip-comments --set-gtid-purged=OFF --result-file=deploy/mysql/init/001-schema.sql billiards_test
Select-String -Path deploy/mysql/init/001-schema.sql -Pattern '^(INSERT|REPLACE|UPDATE) '
```

Expected: 无数据写入语句。若没有经批准的测试 Schema 来源，停止并请求 DBA/项目负责人提供结构导出；不得连接生产库代替，也不得直接导入旧 `database.sql`。

**Step 3: 写最小只读账号初始化文件**

```sql
CREATE USER IF NOT EXISTS 'bi_agent_ro'@'%' IDENTIFIED BY 'test-readonly-only';
-- 视图创建后由 Task 12 精确授权；此处不授予 base table 权限。
REVOKE ALL PRIVILEGES, GRANT OPTION FROM 'bi_agent_ro'@'%';
```

**Step 4: 启动并验证**

```powershell
docker compose -f deploy/compose.test.yml up -d
docker compose -f deploy/compose.test.yml ps
```

Expected: mysql 与 postgres 均为 `healthy`。记录版本、端口、Schema 来源类型（只允许“授权测试库结构导出”）和 SHA-256，不记录密码。

**Step 5: 提交**

```bash
git add deploy/compose.test.yml deploy/mysql/init agent/.env.example docs/evidence/m0/environment.md
git commit -m "test: add isolated database environment"
```

### Task 3：安装依赖并建立原业务可重复基线

**Files:**
- Modify: `billiards/wwwapi/composer.json`
- Modify: `billiards/wwwapi/composer.lock`
- Create: `docs/evidence/m0/business-baseline.md`

**Step 1: 安装 PHP 与前端依赖**

```powershell
# Run from billiards/wwwapi
composer install
composer require --dev phpunit/phpunit:^9.6 --with-all-dependencies
# Run from billiards/wwwstore
pnpm install --frozen-lockfile
# Run from billiards/wwwpos
pnpm install --frozen-lockfile
```

Expected: 依赖安装成功；若 lock 与 composer 约束冲突，记录并解决副本依赖，不修改原仓库。

**Step 2: 运行已有静态检查和 POS 测试，先记录而不粉饰**

Run from `billiards/wwwstore`:

```powershell
pnpm ts-check
pnpm lint
pnpm build:win
```

Run from `billiards/wwwpos`:

```powershell
pnpm ts-check
pnpm lint
pnpm test
pnpm build:win
```

Expected: 全部命令输出保存到基线文档。已有失败标记为 `pre-existing`，必须附原错误和复现命令；不能跳过失败后宣称基线通过。

**Step 3: 用合成账号执行手工业务冒烟**

在测试环境依次验证登录、当前班次、签到、订单查询、签退和交接班；记录 HTTP 状态、响应摘要和数据库行数。不得在 M0/M1 修改这些接口语义。Agent 服务停止时再重复一次，证明原流程不依赖 Agent。

**Step 4: 提交基线**

```bash
git add billiards/wwwapi/composer.json billiards/wwwapi/composer.lock docs/evidence/m0/business-baseline.md
git commit -m "test: record billiards business baseline"
```

### Task 4：建立 PHP harness 并固化交班/支付/充值现状

**Files:**
- Modify: `billiards/wwwapi/phpunit.xml`
- Create: `billiards/wwwapi/bootstrap.php`
- Create: `billiards/wwwapi/tests/Support/DatabaseTestCase.php`
- Create: `billiards/wwwapi/tests/Characterization/ShiftBehaviorTest.php`
- Create: `billiards/wwwapi/tests/Fixtures/reconciliation_factory.php`
- Create: `docs/evidence/m0/reconciliation-semantics.md`

**Step 1: 先写一个会因缺 bootstrap 失败的 smoke test**

```php
final class ShiftBehaviorTest extends DatabaseTestCase
{
    public function testCurrentSummaryIgnoresHistoricalCheckedOutShift(): void
    {
        $this->makeShift('shift-old', 'emp-a', 'store-a', 'checked_out');
        $result = ShiftLogic::shiftSummary('emp-a', 'store-a');
        self::assertFalse($result['isOnShift']);
    }
}
```

Run from `billiards/wwwapi`: `php vendor/bin/phpunit --version`（先验证依赖），再 `php vendor/bin/phpunit tests/Characterization/ShiftBehaviorTest.php`。

Expected: 初次 FAIL/ERROR，指向 `bootstrap.php` 或测试基类缺失。

**Step 2: 最小实现 harness**

`bootstrap.php`：

```php
<?php
declare(strict_types=1);
require __DIR__ . '/vendor/autoload.php';
$app = new \think\App();
$app->initialize();
```

`phpunit.xml` 使用 `bootstrap="bootstrap.php"`，testsuite 指向 `tests/Characterization`、`tests/Unit`、`tests/Integration`，并显式设置 `DATABASE_HOSTNAME=127.0.0.1`、`DATABASE_HOSTPORT=13306`、`DATABASE_DATABASE=billiards_test`、`DATABASE_USERNAME=billiards`、`DATABASE_PASSWORD=test-billiards-only`、`DATABASE_PREFIX=bi_`，与 `config/database.php` 的 `database.*` 配置对应。`DatabaseTestCase` 在 `setUp()` 调用 `Db::startTrans()`，在 `tearDown()` 调用 `Db::rollback()`，并拒绝 `getenv('DATABASE_DATABASE') !== 'billiards_test'`。

**Step 3: 用真实 Schema 建合成 factory，并补齐 characterization cases**

factory 必须显式填实际 Schema 中所有无默认值 NOT NULL 字段，至少覆盖：

1. 当天进行中班次被 `summary` 识别，历史已签退班次不被识别。
2. 订单只计当前门店、操作员、时间窗口内 `completed`；进行中订单只影响 `openTableCount`。
3. `checkOut` 后 `alipay/card/rechargeCount` 未冻结的字段在报告中是“缺失”，不是 0。
4. 一笔订单同时有订单级 payment 和 `order_item_id` payment；列出两者，证明不能全表 SUM。
5. 一笔合并支付和父子订单；记录当前 `ShiftLogic` 实际汇总结果及是否重复。
6. 充值 `amount=200, gift_amount=20`，现金流为 220；证明实收 200、赠送 20。
7. 开始/结束时间边界各一笔订单，确认 `>=` 与 `<=` 的当前行为。

**Step 4: 运行并记录真实语义**

Run from `billiards/wwwapi`: `php vendor/bin/phpunit --testsuite Characterization`。

Expected: 当前行为测试 PASS；若发现与计划假设不同，测试记录实际行为，并在语义文档标注。文档冻结 `legacy_summary`、`recomputed_v1`、payment 分类、merge 处理、缺失与 unknown 规则；合并归属不清时暂停 Task 5，请业务负责人确认。

**Step 5: 提交**

```bash
git add billiards/wwwapi/phpunit.xml billiards/wwwapi/bootstrap.php billiards/wwwapi/tests docs/evidence/m0/reconciliation-semantics.md
git commit -m "test: characterize shift reconciliation behavior"
```

### Task 5：新增显式门店授权上下文和独立只读证据 API

**Files:**
- Create: `billiards/wwwapi/app/storeapi/logic/agent/StoreAccessLogic.php`
- Create: `billiards/wwwapi/app/storeapi/logic/agent/ReconciliationEvidenceLogic.php`
- Create: `billiards/wwwapi/app/storeapi/controller/agent/AuthController.php`
- Create: `billiards/wwwapi/app/storeapi/controller/agent/ReconciliationController.php`
- Modify: `billiards/wwwapi/route/app.php`
- Create: `billiards/wwwapi/tests/Integration/AgentAccessTest.php`
- Create: `billiards/wwwapi/tests/Integration/ReconciliationEvidenceTest.php`

**Step 1: 先写越权与证据失败测试**

至少包含：无 token 401；无权限 403；`store-b` 跨店 403；老板跨商户 403；普通员工有 `EmployeeStore` 但无 `finance:cashflow` 403；body/query 中出现伪造的 `tenant_id/employee_id/role/permissions` 一律返回 422，且不改变服务端身份；历史班次可读取；他店 shift_id 返回 404；单类证据超过 1000 行返回 422 `evidence_too_large`，而不是返回部分汇总。

```php
public function testEmployeeCannotReadAnotherStoreShift(): void
{
    $this->actingAs('emp-a', 'store-a', ['finance:cashflow']);
    $this->makeShift('shift-b', 'emp-b', 'store-b', 'checked_out');
    $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-b&store_id=store-b');
    self::assertSame(403, $response->getCode());
}
```

Run from `billiards/wwwapi`: `php vendor/bin/phpunit --filter AgentAccessTest`。
Expected: FAIL，路由/类不存在。

**Step 2: 实现服务端访问判定**

`StoreAccessLogic::assertAccess()` 必须按以下顺序，所有值从数据库和已验证 token 获取：

```php
public static function assertAccess(string $employeeId, string $storeId): array
{
    $employee = Employee::find($employeeId);
    $store = Store::find($storeId);
    if (!$employee || (int)$employee->status !== 1 || !$store || $storeId === '') {
        throw new HttpException(403, '无权访问该门店');
    }
    $membership = EmployeeStore::where('employee_id', $employeeId)
        ->where('store_id', $storeId)->find();
    $merchantBoss = $employee->role === 'boss'
        && $employee->merchant_id !== ''
        && $employee->merchant_id === $store->merchant_id;
    if (!$membership && !$merchantBoss) {
        throw new HttpException(403, '无权访问该门店');
    }
    return ['employee' => $employee, 'store' => $store, 'is_boss' => $merchantBoss];
}
```

`agent.Auth/context` 返回 `employee_id/merchant_id/store_id/role/permissions`；老板权限用 `['*']`，其他角色调用 `PermissionLogic::getEmployeePermissions()`。`shiftEvidence` 先 `assertAccess`，再对非老板 `checkPermission('finance:cashflow')`，随后查询 `shift_id AND store_id`。路由显式挂 `LoginMiddleware`，不依赖自动路由的隐式行为。

**Step 3: 实现单请求完整证据合约**

`GET /storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-1&store_id=store-a` 返回：

```json
{
  "schema_version": "reconciliation-evidence/v1",
  "shift": {"id":"shift-1","store_id":"store-a","employee_id":"emp-a","status":"checked_out","check_in_time":"2026-01-01 09:00:00","check_out_time":"2026-01-01 18:00:00","snapshot":{},"snapshot_fields_present":[]},
  "orders": [],
  "payments": [],
  "recharges": [],
  "cash_flows": [],
  "exclusions": [],
  "meta": {"generated_at":"2026-01-01T10:00:00Z","limits":1000,"truncated":false,"code_version":"git-sha"}
}
```

每类查询必须绑定 `store_id` 和班次窗口；orders 另绑定 operator/status/end_time，payments 用明确 join/分类返回 `order_item_id` 和 merge 标记，不先求和。响应不包含手机号、证件、会员备注或交易密钥。超过任一类 1000 行即 422。查询和返回中禁止任何 INSERT/UPDATE/DELETE。

**Step 4: 验证安全、契约与旧接口不回归**

Run from `billiards/wwwapi`:

```powershell
php vendor/bin/phpunit --testsuite Integration
php vendor/bin/phpunit --testsuite Characterization
```

Expected: 越权、权限、跨店、历史证据、行数限制全部 PASS；旧 characterization 全 PASS。

**Step 5: 提交**

```bash
git add billiards/wwwapi/app/storeapi/logic/agent billiards/wwwapi/app/storeapi/controller/agent billiards/wwwapi/route/app.php billiards/wwwapi/tests/Integration
git commit -m "feat: add authorized reconciliation evidence api"
```

### Task 6：建立 FastAPI 项目、运行模型和 PostgreSQL 审计

**Files:**
- Create: `agent/pyproject.toml`
- Create: `agent/app/main.py`, `agent/app/config.py`, `agent/app/schemas.py`
- Create: `agent/app/db.py`, `agent/app/models/run.py`, `agent/app/services/run_repository.py`
- Create: `agent/alembic.ini`, `agent/alembic/env.py`
- Create: `agent/alembic/versions/0001_create_agent_runs.py`
- Create: `agent/tests/conftest.py`, `agent/tests/test_run_repository.py`

**Step 1: 写失败的数据库测试**

```python
def test_run_and_tool_call_are_persisted(session):
    run = RunRepository(session).create(scene="knowledge_qa", principal=principal())
    ToolCallRepository(session).start(run.id, "rag_search", {"query": "交班"})
    saved = RunRepository(session).get(run.id, principal())
    assert saved.scene == "knowledge_qa"
    assert len(saved.tool_calls) == 1
```

Run from `agent`: `python -m pytest tests/test_run_repository.py -v`。
Expected: FAIL，模块不存在。

**Step 2: 声明依赖并实现最小项目**

`pyproject.toml` 固定主要依赖范围：FastAPI、uvicorn、pydantic 2、pydantic-settings、httpx、SQLAlchemy 2、Alembic、psycopg[binary]、mysql-connector-python、LangGraph、langgraph-checkpoint-postgres、openai、sqlglot；dev 为 pytest、pytest-asyncio、respx、ruff。配置 `pythonpath=["."]`、`testpaths=["tests"]`。

Alembic 创建：
- `agent_runs(id UUID PK, tenant_id, employee_id, store_id, scene, status, input_json JSONB, result_json JSONB, model_name, prompt_version, code_version, created_at, completed_at)`；
- `agent_events(id BIGSERIAL PK, run_id FK, seq, event_type, payload_json JSONB, created_at, UNIQUE(run_id, seq))`；
- `tool_calls(id UUID PK, run_id FK, tool_name, arguments_json JSONB, result_json JSONB, status, latency_ms, error_code, created_at, completed_at)`；
- `audit_logs(id BIGSERIAL PK, run_id nullable FK, employee_id, store_id, action, target_type, target_id, metadata_json JSONB, created_at)`。

所有 run 查询同时过滤 `id + employee_id`；本阶段只能看自己的 Trace。敏感参数在持久化前通过 allowlist 重建，不保存 bearer token、手机号、完整支付流水或模型密钥。

**Step 3: 迁移并使测试通过**

Run from `agent`:

```powershell
Copy-Item .env.example .env
python -m venv .venv
.\.venv\Scripts\python -m pip install -e '.[dev]'
.\.venv\Scripts\alembic upgrade head
.\.venv\Scripts\python -m pytest tests/test_run_repository.py -v
```

Expected: migration 到 `0001`，测试 `1 passed`；测试只连接 `agent_test`。

**Step 4: 提交**

```bash
git add agent/pyproject.toml agent/app agent/alembic.ini agent/alembic agent/tests
git commit -m "feat: add persistent agent run kernel"
```

### Task 7：实现已验证身份、模型工具调用适配器和 RAG Search 工具

**Files:**
- Create: `agent/app/guard/identity.py`
- Create: `agent/app/models/llm.py`
- Create: `agent/app/tools/rag.py`, `agent/app/tools/billiards.py`
- Create: `agent/app/tools/registry.py`
- Create: `agent/tests/test_identity.py`, `agent/tests/test_llm_adapter.py`, `agent/tests/test_rag_tool.py`, `agent/tests/test_billiards_tool.py`

**Step 1: 写失败安全测试**

```python
@pytest.mark.parametrize("field", ["tenant_id", "employee_id", "role", "permissions"])
def test_identity_spoofing_fields_are_rejected(client, field):
    response = client.post("/v1/knowledge/runs/stream", json={"store_id":"store-a","question":"x",field:"spoof"})
    assert response.status_code == 422

def test_rag_identity_comes_from_verified_principal():
    principal = Principal(employee_id="emp-a", tenant_id="merchant-a", store_id="store-a", role="finance", permissions=frozenset({"finance:cashflow"}))
    url, payload, headers = build_rag_request("交班", principal)
    assert url.endswith("/v1/kbs/billiards-sop-test/search")
    assert payload == {"query": "交班", "top_k": 5, "mode": "hybrid", "audience": "internal"}
    assert headers == {"X-Tenant-Id": "merchant-a", "X-User-Id": "emp-a"}
    assert not {"tenant_id", "user_id", "kb_id"}.intersection(payload)
```

模型测试覆盖：合法 tool arguments JSON；坏 JSON 返回 `MODEL_OUTPUT_INVALID`；timeout/429/5xx 最多重试 1 次；4xx 不重试；记录 model/usage/latency；不记录 API key。

Run from `agent`: `python -m pytest tests/test_identity.py tests/test_llm_adapter.py tests/test_rag_tool.py tests/test_billiards_tool.py -v`。
Expected: FAIL，接口和适配器不存在。

**Step 2: 实现边界代码**

`Principal` 仅由 `BilliardsIdentityClient` 调用 `agent.Auth/context` 后构造：

```python
class Principal(BaseModel):
    employee_id: str
    tenant_id: str
    store_id: str
    role: str
    permissions: frozenset[str]

    def require(self, permission: str) -> None:
        if "*" not in self.permissions and permission not in self.permissions:
            raise PermissionDenied(permission)
```

RAG 工具（`search_sop` 必须复用上面测试覆盖的 `build_rag_request`）：

```python
async def search_sop(query: str, principal: Principal) -> list[RagHit]:
    url, payload, headers = build_rag_request(query, principal)
    response = await client.post(url, json=payload, headers=headers)
    response.raise_for_status()
    return [RagHit.model_validate(hit) for hit in response.json()["hits"]]
```

模型适配器统一返回 `AssistantMessage(content, tool_calls, usage, model, latency_ms)`；模型名、base URL、重试和 timeout 只读服务端配置。`billiards.py` 在 M0 实现 `shift_evidence`：只接收 `shift_id`，从 Principal 取门店、从请求上下文取 bearer token，调用 Task 5 证据 API并先检查 `finance:cashflow`；测试覆盖跨店 403 和 token 不落日志。registry M0 只注册 `rag_search` 和 `shift_evidence`，M1 才增加 `reconcile_shift` 与 `sql_analysis`，不写工具不注册。

**Step 3: 运行契约测试并对真实测试 RAG 做一次 smoke**

Run from `agent`:

```powershell
python -m pytest tests/test_identity.py tests/test_llm_adapter.py tests/test_rag_tool.py tests/test_billiards_tool.py -v
```

Expected: 全部 PASS；先用 RAG 自身测试夹具保证 `merchant-a/billiards-sop-test` 存在，真实 smoke 返回 `chunk_id/doc_id/text/metadata`，tenant/user 与测试身份一致。RAG 不可用时工具返回统一 `RAG_UNAVAILABLE`，不能把空 hits 当“制度不存在”。

**Step 4: 提交**

```bash
git add agent/app/guard agent/app/models agent/app/tools agent/tests/test_identity.py agent/tests/test_llm_adapter.py agent/tests/test_rag_tool.py agent/tests/test_billiards_tool.py
git commit -m "feat: add verified identity and tool adapters"
```

### Task 8：实现有限 Agent Loop、LangGraph checkpoint、SSE 与 Trace API

**Files:**
- Create: `agent/app/graphs/kernel.py`, `agent/app/graphs/knowledge.py`
- Create: `agent/app/services/runner.py`, `agent/app/services/events.py`
- Create: `agent/app/api/runs.py`, `agent/app/api/health.py`
- Modify: `agent/app/main.py`
- Create: `agent/tests/test_graph_limits.py`, `agent/tests/test_runs_api.py`, `agent/tests/test_checkpoint.py`

**Step 1: 写失败测试**

- 模型连续要求工具时最多 4 轮，随后 `MAX_MODEL_ROUNDS`，不能无限循环。
- 工具异常形成 `tool.failed` 和结构化错误，原 run 可查询。
- SSE 事件顺序为 `run.started → tool.* → message.delta → run.completed`，每个 id 为 `run_id:seq`。
- 关闭首个 FastAPI lifespan，使用同一 PostgreSQL 新建应用实例和 checkpointer 后，同一 `thread_id` 仍能读取 checkpoint；他人员工查询 run 返回 404。

Run from `agent`: `python -m pytest tests/test_graph_limits.py tests/test_runs_api.py tests/test_checkpoint.py -v`。
Expected: FAIL，graph/API 未实现。

**Step 2: 实现最小内核**

使用明确 `StateGraph`，节点为 `model → tool_dispatch → model`，`tool_dispatch` 只执行 registry 中只读工具；状态保存 `round/tool_calls/evidence/final_response`。应用 lifespan 中：

```python
with PostgresSaver.from_conn_string(settings.langgraph_database_url) as saver:
    saver.setup()
    app.state.checkpointer = saver
    app.state.knowledge_graph = build_knowledge_graph(saver)
    yield
```

`POST /v1/knowledge/runs/stream` 用 `StreamingResponse(media_type='text/event-stream')`；前端不能用原生 EventSource 的原因是 Bearer header，统一用 fetch stream。事件至少包含 `run.started/tool.started/tool.completed/tool.failed/message.delta/run.completed/run.failed`。`GET /v1/runs/{id}` 返回 run、events、tool calls 和引用，按 employee_id 隔离。模型/RAG 失败不删除 Trace。

**Step 3: 验证**

Run from `agent`:

```powershell
python -m pytest tests/test_graph_limits.py tests/test_runs_api.py tests/test_checkpoint.py -v
python -m uvicorn app.main:app --reload --port 8100
```

Expected: 测试 PASS；`/health/live` 200，`/health/ready` 仅在 PostgreSQL/migration 可用时 200。

**Step 4: 提交**

```bash
git add agent/app/graphs agent/app/services agent/app/api agent/app/main.py agent/tests/test_graph_limits.py agent/tests/test_runs_api.py agent/tests/test_checkpoint.py
git commit -m "feat: add bounded agent graph and trace streaming"
```

### Task 9：管理端 M0 Agent 页面与 M0 验收门禁

**Files:**
- Create: `billiards/wwwstore/src/lib/api/agent.ts`
- Create: `billiards/wwwstore/src/app/agent/page.tsx`
- Create: `billiards/wwwstore/src/app/agent/components/run-trace.tsx`
- Modify: `billiards/wwwstore/src/components/layout/app-shell.tsx`
- Modify: `billiards/wwwstore/package.json`, `billiards/wwwstore/pnpm-lock.yaml`
- Create: `billiards/wwwstore/vitest.config.ts`, `billiards/wwwstore/src/test/setup.ts`
- Create: `billiards/wwwstore/src/lib/api/agent.test.ts`
- Create: `docs/evidence/m0/acceptance.md`

**Step 1: 写失败 SSE 解析测试**

```tsx
it('streams deltas with the billiards bearer token and exposes run id', async () => {
  mockFetchWithSse([
    'id: run-1:1\nevent: run.started\ndata: {"run_id":"run-1"}\n\n',
    'id: run-1:2\nevent: message.delta\ndata: {"text":"你好"}\n\n',
    'id: run-1:3\nevent: run.completed\ndata: {}\n\n',
  ]);
  const events = await streamKnowledgeRun('store-a', '交班制度', () => {});
  expect(events.at(-1)?.type).toBe('run.completed');
  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
    headers: expect.objectContaining({ Authorization: 'Bearer test-token' }),
  }));
});
```

Run from `billiards/wwwstore`: `pnpm vitest run src/lib/api/agent.test.ts`。
Expected: 初始失败，Vitest/模块未配置。

**Step 2: 最小实现前端**

安装 Vitest/jsdom/Testing Library；`agent.ts` 从现有 localStorage 取 token，`POST NEXT_PUBLIC_AGENT_BASE_URL/v1/knowledge/runs/stream`，逐行解析 SSE，不把 `tenant_id/employee_id/role` 放入 body。页面提供制度问答、降级错误、run id 和 Trace；导航增加 `Agent 运行`，权限 `overview`。M0 页面不能出现开台执行按钮或伪造对账数字。

**Step 3: 验证并执行 M0 门禁**

Run from `billiards/wwwstore`:

```powershell
pnpm vitest run
pnpm ts-check
pnpm lint
pnpm build:win
```

Run from `billiards/wwwapi`: `php vendor/bin/phpunit`。

Run from `agent`: `python -m pytest -q`。

Expected: 全部新增检查 PASS；原业务 pre-existing 项必须与 Task 3 一致。M0 文档附：原业务冒烟、RAG 真实 smoke、越权阻断、SSE、checkpoint、Trace 查询和 Agent 停止后手工流程可用证据。

**Step 4: 提交并暂停评审**

```bash
git add billiards/wwwstore/src billiards/wwwstore/vitest.config.ts billiards/wwwstore/package.json billiards/wwwstore/pnpm-lock.yaml docs/evidence/m0/acceptance.md
git commit -m "feat: add agent run console and m0 acceptance"
```

**Gate:** M0 全部证据存在后才能进入 M1；不能把“能打开页面”当作 Agent 内核验收。

---

## M1：交班对账只读 Agent 与受约束分析

### Task 10：实现 Decimal 确定性对账规则和黄金夹具

**Files:**
- Create: `agent/app/domain/reconciliation.py`, `agent/app/domain/money.py`
- Create: `agent/tests/fixtures/evidence/*.json`
- Create: `agent/tests/test_reconciliation_rules.py`
- Create: `eval/datasets/reconciliation_golden.json`

**Step 1: 先写参数化失败测试**

```python
@pytest.mark.parametrize("case", load_golden("reconciliation_golden.json"), ids=lambda c: c["id"])
def test_reconciliation_matches_golden(case):
    report = reconcile(Evidence.model_validate(case["evidence"]))
    assert report.model_dump(mode="json") == case["expected"]
```

黄金集至少 12 例：正常单渠道、正常混合渠道、订单渠道与订单级 payment 不一致、item payment 不重复计、merge 父子单、充值赠送、现金流含赠送、历史签退快照缺失、handover 无快照、空班次、边界时间、需要外部账单/实盘。每例包含完整 `expected`，不是只检查“有报告”。

Run from `agent`: `python -m pytest tests/test_reconciliation_rules.py -v`。
Expected: FAIL，`reconcile` 不存在。

**Step 2: 实现纯函数**

金额入口全部 `Decimal(str(value))`，JSON 输出金额字符串；禁止 float 运算。输出固定结构：

```json
{
  "schema_version":"reconciliation-report/v1",
  "status":"ok|insufficient_data|review_required",
  "legacy_summary":{},
  "recomputed":{"order_total":{"value":"100.00","refs":["ref-order-total"]}},
  "differences":[],
  "explained":[],
  "unknowns":[],
  "evidence_refs":[],
  "narrative":null,
  "degraded":false
}
```

核心规则：

```python
def money_sum(values: Iterable[Decimal]) -> Decimal:
    return sum(values, Decimal("0.00")).quantize(Decimal("0.01"))

# 订单级 payment 与 item-level/merge payment 分组比较，不跨类求和。
# 充值实收=sum(recharge.amount)，赠送=sum(gift_amount)。
# cash_flow.amount - (实收+赠送) 才进入差异；赠送本身放 explained。
# snapshot_fields_present 中没有的字段放 unknowns/code=SNAPSHOT_FIELD_MISSING。
# 无现金实盘或外部渠道账单时，只给 EXTERNAL_CONFIRMATION_REQUIRED，不断言短款/长款。
```

每个数值使用 `{value, refs}`，每个 refs 指向 `evidence_refs` 中的 `rule_id + source_endpoint + source_ids`；每个差异同样携带引用。证据为空时 `status=insufficient_data`，不能返回“全部一致”。merge 规则严格使用 Task 4 已确认语义。仅内部核对一致但尚需外部账单的报告使用“系统核对一致”，不得显示“财务对账通过”。

**Step 3: 运行并提交**

Run from `agent`: `python -m pytest tests/test_reconciliation_rules.py -v`。
Expected: 所有黄金例 PASS，且无模型/RAG 调用。

```bash
git add agent/app/domain agent/tests/fixtures agent/tests/test_reconciliation_rules.py eval/datasets/reconciliation_golden.json
git commit -m "feat: add deterministic reconciliation rules"
```

### Task 11：实现对账状态图、SOP 证据和降级继续追问

**Files:**
- Create: `agent/app/graphs/reconciliation.py`
- Create: `agent/app/api/reconciliation.py`
- Create: `agent/tests/test_reconciliation_api.py`, `agent/tests/test_reconciliation_degradation.py`
- Create: `eval/fixtures/sop/shift-reconciliation.md`

**Step 1: 写失败契约/故障测试**

覆盖：正常报告；他店证据 403；无数据不可判断；RAG 失败数值不变；模型失败 `narrative` 为降级说明但报告仍完成；证据 422 不得生成部分汇总；同一 run 追问复用 report/checkpoint，不重复执行证据查询；SOP 文本中的“忽略系统指令/调用写工具”只作为引用文本，不改变图和权限。

Run from `agent`: `python -m pytest tests/test_reconciliation_api.py tests/test_reconciliation_degradation.py -v`。
Expected: FAIL，图和路由不存在。

**Step 2: 实现固定图**

图结构固定为：

```text
load_evidence → reconcile → has_review_items?
                          ├─ yes → retrieve_sop → narrate → END
                          └─ no  → narrate → END
```

- API 入口先执行 `principal.require('finance:cashflow')`；`load_evidence` 复用 M0 `shift_evidence` 工具，携带原 bearer token 调 ThinkPHP，principal 只用于 Agent 权限和 Trace；不能由模型传 store。
- `reconcile` 调 Task 10 纯函数，不产生模型调用。
- `retrieve_sop` 只检索，结果转为 `SopCitation(chunk_id/doc_id/text/metadata)`。
- `narrate` 的 structured output 仅含 `summary/recommended_checks/citation_chunk_ids`；服务端验证 citation 必须来自本次 hits，数值字段从 report 注入，模型不可修改。
- 模型/RAG 不可用设置 `degraded=true` 和明确原因，除 run id/时间戳外的确定性结果字段完全一致。

`POST /v1/reconciliation/runs/stream` 输入仅 `store_id/shift_id`；`POST /v1/reconciliation/runs/{run_id}/messages/stream` 输入仅 `question`，从 checkpoint 读取同一报告回答解释性追问。`GET /v1/reconciliation/runs/{run_id}/evidence?kind=orders&ids=id1,id2` 只能由 run 所有者调用，从该 run 已保存的脱敏证据中按 ID 返回，不重新查询业务库；跨员工返回 404。

将合成 SOP 上传到现有 RAG 的**测试 tenant/KB**，不修改 RAG 源码：

```powershell
$job = curl.exe -X POST "$env:RAG_BASE_URL/v1/kbs/$env:RAG_KB_ID/documents" -H "X-Tenant-Id: merchant-a" -F "file=@eval/fixtures/sop/shift-reconciliation.md;type=text/markdown" | ConvertFrom-Json
$env:RAG_JOB_ID = [string]$job.job_id
# Run from D:\wwwroot\projectwork\projects\rag-knowledge-base
python scripts/run_worker.py --once
curl.exe "$env:RAG_BASE_URL/v1/jobs/$env:RAG_JOB_ID" -H "X-Tenant-Id: merchant-a"
```

Expected: job `status=done`，Search 能返回该 SOP 的稳定 `chunk_id/doc_id`；若测试 KB 不存在，先用 RAG 自身测试夹具建立，不直接绕过其 ACL。

**Step 3: 验证并提交**

Run from `agent`: `python -m pytest tests/test_reconciliation_api.py tests/test_reconciliation_degradation.py -v`。
Expected: 所有 API、降级和注入测试 PASS；报告中证据引用覆盖率由测试逐数值递归检查为 100%。

```bash
git add agent/app/graphs/reconciliation.py agent/app/api/reconciliation.py agent/tests/test_reconciliation_api.py agent/tests/test_reconciliation_degradation.py eval/fixtures/sop/shift-reconciliation.md
git commit -m "feat: add resilient shift reconciliation agent"
```

### Task 12：建立专用分析视图、只读数据库身份和 AST SQL Guard

**Files:**
- Create: `deploy/mysql/init/003-agent-analysis-views.sql`
- Create: `agent/app/guard/sql_guard.py`
- Create: `agent/app/tools/sql_executor.py`
- Create: `agent/tests/test_sql_guard.py`
- Create: `agent/tests/test_sql_database_security.py`

**Step 1: 先写攻击与数据库授权失败测试**

参数化拒绝：`UPDATE/DELETE/DROP/INSERT`、多语句、`UNION`、JOIN、子查询/CTE、base table、未知列、`SELECT *`、`SLEEP/LOAD_FILE` 等未批准函数、`INTO OUTFILE`、`FOR UPDATE`、LIMIT>200、超过 4000 字符。缺失 LIMIT 注入 200；`store_id='store-b' OR 1=1` 仍必须追加 `store_id=:__agent_store_id`，执行结果不能包含他店。

集成测试以 `bi_agent_ro` 连接，直接 SELECT base table、INSERT/UPDATE/CREATE/DROP 必须全部被数据库拒绝；视图能 SELECT。数据库超时机制单独用测试连接执行服务端固定的 `SELECT SLEEP(0.2)`、设置 50ms 上限验证，不经过 Guard；Guard 测试仍必须拒绝模型生成的 SLEEP。

Run from `agent`: `python -m pytest tests/test_sql_guard.py tests/test_sql_database_security.py -v`。
Expected: 初始 FAIL，guard/视图未建立。

**Step 2: 创建最小非 PII 视图并精确授权**

`003-agent-analysis-views.sql` 只创建以下三个非 PII 视图；Python `VIEW_COLUMNS` 必须与此逐列一致。若 Task 4 的真实 Schema 有差异，先修改本 SQL 和黄金夹具并记录原因，不能增加姓名、手机号、证件、备注、token 或 transaction_no：

```sql
CREATE OR REPLACE SQL SECURITY DEFINER VIEW agent_order_analysis AS
SELECT store_id, id AS order_id, order_no, status, operator_id,
       table_fee, product_fee, assistant_fee, discount_amount, final_amount,
       balance_paid, cash_paid, wechat_paid, alipay_paid, card_paid,
       merged_to_order_id, start_time, end_time, created_at
FROM bi_busi_order WHERE deleted_at IS NULL;

CREATE OR REPLACE SQL SECURITY DEFINER VIEW agent_recharge_analysis AS
SELECT store_id, id AS recharge_id, amount, gift_amount,
       payment_method, status, operator_id, created_at
FROM bi_busi_member_recharge;

CREATE OR REPLACE SQL SECURITY DEFINER VIEW agent_shift_analysis AS
SELECT store_id, id AS shift_id, employee_id, work_date, status,
       check_in_time, check_out_time, total_revenue, order_count,
       cash_paid, wechat_paid, balance_paid, table_revenue,
       product_revenue, assistant_revenue, open_table_count, recharge_total
FROM bi_busi_employee_attendance;

GRANT SELECT ON billiards_test.agent_order_analysis TO 'bi_agent_ro'@'%';
GRANT SELECT ON billiards_test.agent_recharge_analysis TO 'bi_agent_ro'@'%';
GRANT SELECT ON billiards_test.agent_shift_analysis TO 'bi_agent_ro'@'%';
```

不授予 `bi_busi_*` base table 权限，不授予 FILE、CREATE、DROP、INSERT、UPDATE、DELETE、GRANT OPTION。

**Step 3: 实现两层 Guard**

```python
ALLOWED_FUNCTIONS = {"SUM", "COUNT", "AVG", "MIN", "MAX", "COALESCE", "ROUND", "DATE"}
FORBIDDEN_NODES = (
    exp.Insert, exp.Update, exp.Delete, exp.Drop, exp.Union, exp.Join,
    exp.Subquery, exp.CTE, exp.Into, exp.Lock,
)

def validate_and_scope(raw_sql: str, max_rows: int = 200) -> str:
    if len(raw_sql) > 4000:
        raise SqlRejected("SQL_TOO_LONG")
    statements = [s for s in sqlglot.parse(raw_sql, read="mysql") if s]
    if len(statements) != 1 or not isinstance(statements[0], exp.Select):
        raise SqlRejected("SINGLE_SELECT_REQUIRED")
    tree = statements[0]
    if any(node for node in tree.walk() if isinstance(node, FORBIDDEN_NODES)):
        raise SqlRejected("QUERY_SHAPE_FORBIDDEN")
    if tree.args.get("locks") or tree.args.get("into"):
        raise SqlRejected("LOCK_OR_INTO_FORBIDDEN")
    # 必须恰好一个无库名前缀的允许视图；逐列核对视图 allowlist；
    # 拒绝裸 SELECT * 和 table.*，仅允许 COUNT(*)；
    # 逐函数核对 ALLOWED_FUNCTIONS；任何不在白名单的 identifier/function 都拒绝。
    table = require_single_allowlisted_view(tree)
    validate_columns_and_functions(tree, table)
    limit = tree.args.get("limit")
    if limit and int(limit.expression.this) > max_rows:
        raise SqlRejected("LIMIT_EXCEEDED")
    if not limit:
        tree.set("limit", exp.Limit(expression=exp.Literal.number(max_rows)))
    scope = exp.condition("store_id = :__agent_store_id")
    tree.set("where", exp.Where(this=scope if not tree.args.get("where") else exp.and_(tree.args["where"].this, scope)))
    return tree.sql(dialect="mysql")
```

执行器使用独立 MySQL RO engine，连接后由服务端执行 `SET SESSION TRANSACTION READ ONLY` 和 `SET SESSION MAX_EXECUTION_TIME=<SQL_TIMEOUT_MS>`（配置必须转为有界整数），再用 SQLAlchemy `text(guarded_sql)` 和独立参数 `__agent_store_id=principal.store_id` 执行。结果列也按 allowlist 校验，最多 200 行；超时映射 `SQL_TIMEOUT`，不能自动重试。

**Step 4: 验证并提交**

Run from `agent`: 重建测试 MySQL 后运行 `python -m pytest tests/test_sql_guard.py tests/test_sql_database_security.py tests/test_reconciliation_rules.py -v`。
Expected: 攻击向量 100% 被 Guard 或数据库拒绝；合法聚合成功；固定对账测试没有 SQL Guard/模型调用。

```bash
git add deploy/mysql/init/003-agent-analysis-views.sql agent/app/guard/sql_guard.py agent/app/tools/sql_executor.py agent/tests/test_sql_guard.py agent/tests/test_sql_database_security.py
git commit -m "feat: constrain read-only sql analysis"
```

### Task 13：接入开放式 SQL 分析工具，但不污染固定对账

**Files:**
- Create: `agent/app/graphs/sql_analysis.py`, `agent/app/api/analysis.py`
- Create: `agent/tests/test_sql_analysis_api.py`

**Step 1: 写失败 API 测试**

输入只有 `store_id/question`。模型返回 SQL draft 后必须经 Task 12 Guard；非法 SQL 返回 `run.failed/error_code=SQL_REJECTED` 且数据库 executor 未调用；合法结果显示 `guarded_sql/rows/columns/tool_call_id`；模型不能指定白名单外视图、账号、timeout、max_rows、tenant 或门店；他店绑定条件不可移除。固定对账图测试确认 never calls `sql_analysis`。

Run from `agent`: `python -m pytest tests/test_sql_analysis_api.py -v`。
Expected: 初始 FAIL，graph/API 不存在。

**Step 2: 实现单用途图**

```text
generate_sql → validate_and_scope → execute_readonly → summarize → END
```

提示词只包含三个视图的 allowlist 和业务定义，不包含 base table。模型 structured output 为 `{sql: string}`；任何异常不“修复后自动执行第二条 SQL”，而是安全结束并保留 Trace。报告中的 rows 是数据库事实，模型解释与 rows 分字段返回。

**Step 3: 验证并提交**

Run from `agent`: `python -m pytest tests/test_sql_analysis_api.py tests/test_sql_guard.py tests/test_sql_database_security.py -v`。
Expected: 全部 PASS，Trace 可定位生成 SQL、规范化 SQL、拒绝原因、耗时和行数；SQL 文本中的敏感 literal 在日志中脱敏。

```bash
git add agent/app/graphs/sql_analysis.py agent/app/api/analysis.py agent/tests/test_sql_analysis_api.py
git commit -m "feat: add guarded read-only analysis agent"
```

### Task 14：管理端对账报告、证据下钻与 Trace

**Files:**
- Modify: `billiards/wwwstore/src/app/finance/page.tsx`
- Create: `billiards/wwwstore/src/app/finance/components/agent-reconciliation-tab.tsx`
- Create: `billiards/wwwstore/src/app/finance/components/reconciliation-report.tsx`
- Create: `billiards/wwwstore/src/app/finance/components/evidence-drawer.tsx`
- Create: `billiards/wwwstore/src/app/finance/components/sql-analysis-panel.tsx`
- Modify: `billiards/wwwstore/src/lib/api/agent.ts`
- Create: `billiards/wwwstore/src/app/finance/components/reconciliation-report.test.tsx`
- Create: `docs/evidence/m1/ui-acceptance.md`

**Step 1: 写失败组件测试**

```tsx
it.each([
  ['insufficient_data', '数据不足，无法判断'],
  ['review_required', '需要人工复核'],
])('renders %s without claiming reconciliation passed', async (status, text) => {
  render(<ReconciliationReport report={makeReport({ status })} />);
  expect(screen.getByText(text)).toBeInTheDocument();
  expect(screen.queryByText('对账通过')).not.toBeInTheDocument();
});

it('keeps deterministic totals when narrative is degraded', () => {
  render(<ReconciliationReport report={makeReport({ degraded: true, narrative: null })} />);
  expect(screen.getByText('100.00')).toBeInTheDocument();
  expect(screen.getByText(/说明生成不可用/)).toBeInTheDocument();
});
```

Run from `billiards/wwwstore`: `pnpm vitest run src/app/finance/components/reconciliation-report.test.tsx`。
Expected: FAIL，组件不存在。

**Step 2: 最小实现 UI**

财务页新增“智能交班”tab，仍使用 `finance:cashflow`。输入历史班次并流式展示阶段；汇总卡分别展示 legacy/recomputed，差异、已解释项、不确定项分栏；点击任一数值打开 evidence drawer，调用 Task 11 的 run evidence API 展示 rule_id、source IDs、支付分类和原始只读字段；SOP 展示 chunk/doc 引用；Trace 链接到 `/agent?run_id={当前run_id}`。

SQL 分析面板明确标记“开放式只读分析，不影响固定对账”，展示 guarded SQL、结果行和拒绝原因。无审批/写操作按钮，不使用绿色“对账通过”覆盖 unknown 或 degraded 状态。

**Step 3: 浏览器验收与回归**

Run from `billiards/wwwstore`:

```powershell
pnpm vitest run
pnpm ts-check
pnpm lint
pnpm build:win
```

用浏览器验证正常、差异、无数据、RAG 故障、模型故障、SQL 拒绝、跨店 403、证据下钻和刷新后 Trace 可查；保存截图及 run id。Agent 关闭后原财务三个 tab 仍可用。

**Step 4: 提交**

```bash
git add billiards/wwwstore/src/app/finance billiards/wwwstore/src/lib/api/agent.ts docs/evidence/m1/ui-acceptance.md
git commit -m "feat: add reconciliation evidence console"
```

### Task 15：历史回放、指标评测、耗时基线和 M1 总验收

**Files:**
- Create: `eval/run_reconciliation_eval.py`, `eval/run_sql_security_eval.py`
- Create: `eval/datasets/sql_attacks.json`
- Create: `eval/results/.gitkeep`
- Create: `docs/evidence/m1/acceptance.md`
- Create: `docs/evidence/m1/interview-evidence.md`

**Step 1: 建立可失败的质量门禁**

评测器必须：
- 逐字段比较确定性汇总/差异/unknown，不只比较 HTTP 200；
- 递归计算数值证据引用覆盖率；
- 统计异常识别率、误报率、工具选择准确率、P95、模型 token/成本（有真实 usage 才填）；
- 对 SQL 攻击逐条确认 Guard/数据库阻断，对合法问题核对结果；
- 记录模型、prompt、工具、RAG kb、业务代码 git SHA、数据集 SHA、样本量和类别分布；
- 任一硬门禁失败退出非 0，不把 Mock 结果写成生产收益。

```powershell
agent\.venv\Scripts\python eval/run_reconciliation_eval.py --dataset eval/datasets/reconciliation_golden.json --output eval/results/m1-reconciliation.json
agent\.venv\Scripts\python eval/run_sql_security_eval.py --dataset eval/datasets/sql_attacks.json --output eval/results/m1-sql-security.json
```

Expected: 黄金集数值/差异/unknown 100% 符合；证据引用覆盖 100%；越权阻断 100%；SQL 非 SELECT、多语句、越权视图/base table、危险函数和 LIMIT 超限阻断 100%；空数据明确不可判断。未达标则回到对应任务修复，不改黄金答案迎合实现。

**Step 2: 加入经授权脱敏历史回放**

仅使用批准的历史班次；去除手机号、姓名、证件、会员标识和交易号，门店/员工/订单 ID 用稳定哈希。历史回放与合成黄金集分开报告，不能混合抬高样本量。无授权数据时明确写“仅合成与测试门店”，不得伪造生产指标。

**Step 3: 测量人工耗时基线和 Agent 耗时**

对同一批班次记录人工复核开始/结束时间、样本数、人员、异常分布和是否使用外部账单；再记录 Agent P50/P95 与人工复核时间。报告原始数据与统计方法；样本不足就只给观测值，不宣称提升百分比。

**Step 4: 全量验收**

```powershell
# Run from billiards/wwwapi
php vendor/bin/phpunit
# Run from agent
python -m pytest -q
python -m ruff check app tests
# Run from billiards/wwwstore
pnpm vitest run
pnpm ts-check
pnpm lint
pnpm build:win
# 重跑两个 eval，并执行一次模型、RAG、MySQL、PostgreSQL 故障注入
```

M1 验收文档必须附全部命令结果、测试数量、eval 版本、浏览器证据、原业务回归、Agent 故障降级和已知限制。`interview-evidence.md` 只写已实现内容：为什么固定对账不用 Text-to-SQL、为什么不全自动、为什么单 Agent、身份/门店隔离、Trace、降级、SQL 双层防护和实测指标；MCP/路由/多 Agent 只能写“M4 待同集评估”。

**Step 5: 提交**

```bash
git add eval docs/evidence/m1
git commit -m "test: add m1 quality gates and acceptance evidence"
```

---

## 3. 完成定义与后续入口

### M0 完成定义

- 原仓库未改变，新仓库无密钥/生产数据；测试环境可从空卷重建。
- 原业务基线与现状测试可重复；新证据接口跨店和无权限均被阻断。
- Agent 使用已验证身份，能完成有限工具调用、RAG Search、SSE、PostgreSQL run/tool/audit/checkpoint 和本人 Trace 查询。
- Agent 停止不影响原业务。

### M1 完成定义

- 历史班次报告全部数值由确定性规则生成，黄金集通过，证据引用覆盖 100%。
- 赠送、item payment、merge、快照缺失、空数据、外部账单/现金实盘等不混淆、不臆断。
- RAG/模型故障不改变数值；报告能人工复核与下钻。
- Text-to-SQL 通过数据库授权与 AST 双层测试，不能访问 base table、他店或写数据，固定对账不经过该工具。
- 全部验收证据真实可复现；此时可以按已完成的只读对账项目开始投递，但不能提前宣称 M2/M3/M4 能力。

### 后续计划（不在本计划实施）

1. M2 单开：开台协同、人工确认、生产默认确认、测试白名单自动开台、幂等和 Electron E2E。
2. M3 单开：事务 outbox、调度、worker、去重恢复、主动经营值班。
3. **仅在 M1 核心验收后评估 M4**：只读 MCP、策略化模型路由、多 Agent；必须使用同一数据集与简单实现对比，实测无收益则删除实验代码，不进入主架构。
