# M0 原业务基线与合成冒烟证据

## 结论

**状态：Task 3 已执行完成，但原业务基线不是全绿。**

- PHP 与两个前端依赖均取得明确的成功安装结果；PHPUnit 9.6.19 可执行。
- 两轮完整合成业务冒烟均通过：共 14 个 HTTP 请求，全部为 HTTP 200 且应用响应 `code=1`，最终 harness 退出码为 0。
- `wwwpos build:win` 通过；`wwwstore` 的 `ts-check`、`lint`、`build:win` 和 `wwwpos` 的 `ts-check`、`lint`、`test` 失败。这些失败均保留为 **pre-existing / 未修复**，本次没有修改对应业务源码来消除错误。
- Agent 服务从未启动；最终 Compose 复查仍只有 MySQL 和 PostgreSQL 两个健康容器。
- 本文不包含真实业务行、访问 token、密码、真实姓名、手机号、ZIP 或完整 SQL。冒烟只使用 `m0synth3` 前缀的合成对象。

## 范围与环境

| 项目 | 实际值 |
| --- | --- |
| 起始 base / 执行时 HEAD | `231ddf09f46c8772093ac1519ac4c5d05f7b4344` |
| 分支 | `feature/m0-m1` |
| 工作树 | `D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1` |
| PHP | 8.2.9 |
| Composer | 2.9.7 |
| Node | 22.11.0 |
| wwwstore 包管理器 | pnpm 9（由 `packageManager: pnpm@9.0.0` 选择） |
| wwwpos 包管理器 | pnpm 12.8.1 |
| 隔离 MySQL | `127.0.0.1:13306`，`billiards_test` |
| 最终 HTTP 入口 | ThinkPHP `think run`，`127.0.0.1:18081` |

原仓库 `D:\wwwroot\wwwbilliards-dky` 仅作为只读来源，本次所有写入均在工作树或仓库外临时目录。未开始 Task 4，未创建 PHP PHPUnit 测试 harness，未实现证据 API 或 Agent 功能。

仓库外临时目录为 `D:\tmp\billiards-m0-task3-20261121`。其中保留本次原始命令日志、合成数据准备脚本和临时 HTTP/PDO 冒烟 harness；它们不是交付源码，未纳入 Git。复现时仍须使用本地隔离环境配置，不得把其中的本地凭据复制到文档或 Git。

## 依赖安装与验证

### PHP / Composer

以下 Composer 命令均在 `billiards/wwwapi` 执行。`COMPOSER_PHAR` 表示本机 `C:\ProgramData\ComposerSetup\bin\composer.phar`，复现命令为 `php -d extension=gd -d extension=sodium -d extension=zip COMPOSER_PHAR <args>`。

| 命令 / 阶段 | 实际退出码 | 结果 |
| --- | ---: | --- |
| `composer install` | 2 | 原样保留环境错误：缺 `ext-gd`、`ext-sodium`。 |
| `php -d extension=gd -d extension=sodium COMPOSER_PHAR install` | 2 | 继续发现缺 `ext-zip`。 |
| 加齐三个 `-d extension=...` 后 `install` | 0 | 96 installs、0 updates、0 removals，autoload 与 ThinkPHP discovery/publish 成功。未使用 `--ignore-platform-req`。 |
| `php -d extension=gd -d extension=sodium -d extension=zip COMPOSER_PHAR require --dev phpunit/phpunit:^9.6 --with-all-dependencies` | 2 | 安全公告阻断所有可用 9.6 版本；既有忽略值误写为 `"[PKSA-z3gr-8qht-p93v]"`，方括号使规则不能匹配。Composer 自动回滚本次未成功的 manifest/lock 改动。 |
| 将既有忽略 ID 修正为 `"PKSA-z3gr-8qht-p93v"` 后重试同一 `require` | 0 | `phpunit/phpunit` 从锁中的 9.6.0 升级到 9.6.19。 |
| 同一扩展环境下 `COMPOSER_PHAR validate` | 0 | 配置有效；仍有原有 autoload/psr-0 与 qiniu 精确版本警告。 |
| `vendor\bin\phpunit --version` | 0 | `PHPUnit 9.6.19 by Sebastian Bergmann and contributors.` |

安全边界：成功的 `require` 同时报告 `Found 1 ignored security vulnerability advisory affecting 1 package.` 和 `Found 89 security vulnerability advisories affecting 12 packages.`。因此本结果只证明依赖可安装，**不代表安全审计通过**。修正忽略规则是为了让既定 PHPUnit 安装命令能够执行，并未声称相关公告已修复。

### 前端

两个前端均执行 `pnpm install --frozen-lockfile`。

| 项目 | 明确最终结果 | 搭建过程与处理 |
| --- | --- | --- |
| wwwstore | 复核命令退出码 0，`Done in 2.9s` | 初次后台长任务没有可靠最终退出码；重试输出 `Done in 8m 55s`，随后再次以同一 frozen-lockfile 命令取得上述明确退出码 0。只以明确复核结果作为通过依据。 |
| wwwpos | 临时允许 `unrs-resolver` 构建后退出码 0，`Done in 657ms using pnpm v12.8.1` | 完整解包后的首次结果为退出码 1：`ERR_PNPM_IGNORED_BUILDS`，`Ignored build scripts: unrs-resolver@1.12.2`。pnpm 12 不再读取 `package.json` 的 `pnpm.onlyBuiltDependencies`；临时把已有 `pnpm-workspace.yaml` 中该项设为 `true`，成功后恢复原占位字符串。 |

恢复白名单占位值后，第一次 `wwwpos pnpm ts-check` 又在依赖核验阶段以退出码 1 报同一 `ERR_PNPM_IGNORED_BUILDS`，尚未进入 TypeScript。为执行后续原命令，再次临时允许该项，四项命令完成后立即恢复；最终 Git diff 中无 `pnpm-workspace.yaml` 改动。

## 原业务检查、测试与构建

以下均为原 `package.json` 脚本，在各自项目目录执行。完整原始输出保存在仓库外临时目录的编号日志中；下表退出码来自命令包装器实际返回，而非根据日志文本推断。

| 项目 | 命令 | 退出码 | 分类与实际结果 |
| --- | --- | ---: | --- |
| wwwstore | `pnpm ts-check` | 2 | **pre-existing**：13 个 TypeScript 错误。 |
| wwwstore | `pnpm lint` | 1 | **pre-existing**：403 problems（205 errors、198 warnings）。 |
| wwwstore | `pnpm build:win` | 1 | **pre-existing**：Turbopack 17 个模块解析错误，未进入后续 tsup。 |
| wwwpos | `pnpm ts-check` | 2 | **pre-existing**：临时允许必要依赖构建后实际执行 tsc，20 个 TypeScript 错误。 |
| wwwpos | `pnpm lint` | 1 | **pre-existing**：297 problems（120 errors、177 warnings）。 |
| wwwpos | `pnpm test` | 1 | **pre-existing**：Vitest 配置加载阶段 `ERR_REQUIRE_ESM`，测试未开始执行。 |
| wwwpos | `pnpm build:win` | 0 | Next.js 编译、13 个静态页面生成及 tsup `dist\server.js` 构建成功；Next 明确输出 `Skipping validation of types`。 |

### wwwstore TypeScript 失败明细

- `src/app/coupon-reports/page.tsx`：242、252 行共 3 个 `TS18047`，`'summary' is possibly 'null'`。
- `src/app/finance/components/finance-income-tab.tsx:95`：`TS2304`，`Cannot find name 'setActivePreset'`。
- `src/app/reports/page.tsx`：
  - 189：`TS2345`，统计对象缺少 `occupancyRate`、`turnoverRate`、`avgCustomerSpend`、`productSalesCount` 等目标字段。
  - 256：`TS2339`，`product_sales_count` 不存在于 `OperationOverview`。
  - 257、258、259：`TS2551`，`table_duration_minutes`、`assistant_duration_minutes`、`outwork_duration_minutes` 不存在。
  - 355：`TS2741`，缺少必需的 `formatDuration`。
  - 440：`TS2322`，`RevenueByItemType[]` 不能赋给 `ItemTypeData[]`。
  - 447：`TS2322`，`RechargeReportItem[]` 不能赋给 `RechargeDataPoint[]`。
- `src/app/settings/settings-discount-tab.tsx:124`：`TS2345`，折扣对象缺少目标类型要求的 `type`、`value`。

### wwwpos TypeScript 失败明细

- `__tests__/offline-billing.test.ts` 共 12 个：`applyDiscount` 未导出；多处 camelCase 测试输入与 `BillingCache` 的 `start_time`、`base_rate`、`prepaid_hours` 不匹配；另有 `startTime`、`baseRate`、`prepaidHours` 属性错误。
- `src/components/AssistantOvertimeModal.tsx:43`：`TS2322`，`{}` 不能赋给 `ReactNode`。
- `src/components/HistoryOrdersModal.tsx:144`：2 个 `TS2339`，`chargingFee`、`charging_fee` 不存在于 `OrderListItem`。
- `src/components/MemberModal.tsx`：226 行 `ReceiptData` 不接受 `lines`；326 行 `ModalShellProps` 不接受 `width`。
- `src/components/TableDrawer.tsx:740`：`TS2322`，`unknown` 不能赋给 `ReactNode`。
- `src/context/AppContext.tsx:1328`：`TS2322`，`Promise<Order | null>` 不能赋给 `Promise<Order>`。
- `src/hooks/useNotification.ts:7`：`TS2739`，通知文案映射缺少 `payment_success`、`checkout_completed`、`table_status_change`。

### lint、测试与 wwwstore 构建保留错误

- 两个 lint 命令均实际扫描并汇总到上述错误/警告总数；错误包括未使用变量、显式 `any`、React Hooks 依赖/声明顺序、未转义实体及现有 memoization 问题。本次未批量修复，也未把 warning 当作成功。
- `wwwpos pnpm test` 的原始错误为：`Error [ERR_REQUIRE_ESM]: require() of ES Module ...\vite\dist\node\index.js from ...\vitest\dist\config.cjs not supported.` 因此不能宣称任何 Vitest 用例通过。
- `wwwstore pnpm build:win` 首条错误为 `Build error occurred` / `Error: Turbopack build failed with 17 errors:`。17 处 `Module not found` 涉及 `@radix-ui/react-checkbox`、`react-dialog`、`react-dropdown-menu`、`react-popover`、`react-presence`、`react-primitive`、`react-roving-focus`、`react-select`、`react-switch`。首条完整模块错误为 `Module not found: Can't resolve '@radix-ui/react-checkbox'`。未通过补装或改源码来改写这项原基线结果。

原始日志索引：`20-wwwstore-ts-check.log`、`21-wwwstore-lint.log`、`22-wwwstore-build-win.log`、`23-wwwpos-ts-check.log`、`24-wwwpos-ts-check-retry.log`、`25-wwwpos-lint.log`、`26-wwwpos-test.log`、`27-wwwpos-build-win.log`。

## 合成业务数据

### 数据边界

- 门店：`m0synth3_store`。
- 员工：`m0synth3_r1a`、`m0synth3_r1b`、`m0synth3_r2a`、`m0synth3_r2b`；两轮使用独立员工对，避免同日考勤唯一键造成伪失败。
- 会员：`m0synth3_member`。
- 零金额订单：`m0synth3_order`，订单号 `M0SYNTH3-ORDER`。
- 所有名称均为测试标识，不对应真实个人。查询和计数均限定上述合成主键或合成门店，不输出业务行。

准备前，合成门店、员工、员工门店关联、会员、订单、考勤、会话均为 0。准备后：门店 1、员工 4、员工门店关联 4、会员 1、订单 1、考勤 0、会话 0。早期失败尝试产生的合成考勤/会话已在最终轮前仅按合成门店范围重置为 0；固定门店、员工、会员和订单保留。

## 两轮完整冒烟

最终轮使用 ThinkPHP 官方 `think run` 入口和 120 秒 HTTP 传输超时，harness 只输出白名单摘要与合成范围聚合计数。每轮顺序如下；交接后额外查询当前班次以验证接班人生效。

| 顺序 | 请求 | R1 结果 | R2 结果 |
| ---: | --- | --- | --- |
| 1 | `POST /storeapi/pos.Auth/login` | HTTP 200，`code=1`；r1a 登录，收到 token（未记录值） | HTTP 200，`code=1`；r2a 登录，收到 token（未记录值） |
| 2 | `GET /storeapi/pos.Shift/current` | HTTP 200，`code=1`；签到前 `is_on_shift=false` | HTTP 200，`code=1`；签到前 `is_on_shift=false` |
| 3 | `POST /storeapi/pos.Shift/checkIn`，`type=full` | HTTP 200，`code=1`；状态 `checked_in` | HTTP 200，`code=1`；状态 `checked_in` |
| 4 | `GET /storeapi/pos.Order/lists?store_id=m0synth3_store&keyword=M0SYNTH3-ORDER&page=1&pageSize=20` | HTTP 200，`code=1`；合成订单计数 1 | HTTP 200，`code=1`；合成订单计数 1 |
| 5 | `POST /storeapi/pos.Shift/checkOut` | HTTP 200，`code=1`；状态 `checked_out`，班次订单统计 0 | HTTP 200，`code=1`；状态 `checked_out`，班次订单统计 0 |
| 6 | `POST /storeapi/pos.Shift/handover` | HTTP 200，`code=1`；交接给 r1b，收到新 token（未记录值） | HTTP 200，`code=1`；交接给 r2b，收到新 token（未记录值） |
| 7 | 接班人 token 调 `GET /storeapi/pos.Shift/current` | HTTP 200，`code=1`；r1b `is_on_shift=true`、`checked_in` | HTTP 200，`code=1`；r2b `is_on_shift=true`、`checked_in` |

最终 harness 输出 `{"result":"passed","failed_rounds":0}`，命令实际退出码 0。R1 和 R2 均完整通过，没有把早期失败尝试计入通过轮次。

最终合成范围聚合计数：

| 门店 | 员工 | 员工门店关联 | 会员 | 订单 | 考勤 | 考勤状态 | 会话 |
| ---: | ---: | ---: | ---: | ---: | ---: | --- | ---: |
| 1 | 4 | 4 | 1 | 1 | 4 | 2 个 `checked_in`、2 个 `checked_out` | 4 |

### 早期搭建失败与最终通过的区分

1. 首次两轮登录均为 HTTP 302，响应转向 `/install/install.php`，harness 判定两轮失败。根因是原入口在缺少 `config/install.lock` 时进入安装页；临时创建该文件后继续验证，最终冒烟结束后已删除。
2. 后续使用 30 秒传输超时的尝试出现 `Operation timed out after 30009 milliseconds with 0 bytes received` 等错误；另一次在 R1 交接和 R2 签退处超时。部分已到达服务端的请求写入了合成会话/考勤，因此最终轮前做了上述限定范围重置。
3. 数据库日志显示相关 SQL 本身为毫秒级，但当时仍有包管理活动；**资源争用不是已证实根因**。最终改用官方 `think run`、120 秒超时并减少并发后，才取得上表两轮完整通过结果。

最终原始冒烟日志为 `15-business-smoke-final-attempt.log`，最终聚合计数为 `16-synthetic-final-counts.log`，ThinkPHP 入口日志为 `14-php-think-server-final.log`。临时 PHP 服务已停止。

## Agent 停止条件

两轮冒烟及最终复查期间均未启动 Agent 服务。最终执行：

```powershell
docker ps -a --filter "label=com.docker.compose.project=billiards-agent-m0m1" --format "{{.Names}}|{{.Image}}|{{.Status}}"
```

实际仅返回：

```text
billiards-agent-m0m1-mysql-1|mysql:8.0|Up 2 hours (healthy)
billiards-agent-m0m1-postgres-1|postgres:16|Up 2 hours (healthy)
```

没有 Agent 容器，满足“Agent 停止时重复完整流程”的条件。

## 可重复命令与交付边界

在已准备的隔离工作树中，核心复现命令为：

```powershell
# billiards/wwwstore
pnpm install --frozen-lockfile
pnpm ts-check
pnpm lint
pnpm build:win

# billiards/wwwpos；pnpm 12 需先在本机临时允许 unrs-resolver 构建，结束后恢复
pnpm install --frozen-lockfile
pnpm ts-check
pnpm lint
pnpm test
pnpm build:win

# 最终冒烟入口与 harness（仓库外）
# 先启动隔离 ThinkPHP 服务于 127.0.0.1:18081，再设置：
$env:SMOKE_BASE_URL = 'http://127.0.0.1:18081'
php D:\tmp\billiards-m0-task3-20261121\smoke.php
```

冒烟 harness 的通过判定同时要求 HTTP 200、应用 `code=1`、步骤语义和合成范围数据计数，不能只凭进程退出或单个登录成功判断。两轮若需重新执行，应先按同一合成标识核对/清理旧合成考勤和会话，避免把已有状态误判为当轮结果。

本次只允许以下三个文件进入提交：

- `billiards/wwwapi/composer.json`
- `billiards/wwwapi/composer.lock`
- `docs/evidence/m0/business-baseline.md`

`.env`、依赖目录、构建产物、临时 `install.lock`、数据库数据、token、脚本和原始命令日志均不提交。`wwwpos/next-env.d.ts` 被构建自动改写后已恢复原内容，临时 pnpm 白名单也已恢复。
