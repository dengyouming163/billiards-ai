# M0 原业务基线与合成冒烟证据

## 结论

**状态：Task 3 已执行完成，但原业务基线不是全绿。**

- PHP 与两个前端依赖均取得明确的成功安装结果；最终修正后 PHPUnit 9.6.39 可执行，PHPUnit 高危公告不再被忽略。
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

以下 Composer 命令均在 `billiards/wwwapi` 执行。`COMPOSER_PHAR` 表示本机 `C:\ProgramData\ComposerSetup\bin\composer.phar`，复现命令为 `php -d extension=gd -d extension=sodium -d extension=zip COMPOSER_PHAR <args>`。下表及紧随其后的安全边界是**初次搭建的历史记录**，其中 9.6.19 和有效 ignore 不代表现行状态；最终修正见“PHPUnit 高危公告复核与最终修正”。

| 命令 / 阶段 | 实际退出码 | 结果 |
| --- | ---: | --- |
| `composer install` | 2 | 原样保留环境错误：缺 `ext-gd`、`ext-sodium`。 |
| `php -d extension=gd -d extension=sodium COMPOSER_PHAR install` | 2 | 继续发现缺 `ext-zip`。 |
| 加齐三个 `-d extension=...` 后 `install` | 0 | 96 installs、0 updates、0 removals，autoload 与 ThinkPHP discovery/publish 成功。未使用 `--ignore-platform-req`。 |
| `php -d extension=gd -d extension=sodium -d extension=zip COMPOSER_PHAR require --dev phpunit/phpunit:^9.6 --with-all-dependencies` | 2 | 安全公告阻断所有可用 9.6 版本；既有忽略值误写为 `"[PKSA-z3gr-8qht-p93v]"`，方括号使规则不能匹配。Composer 自动回滚本次未成功的 manifest/lock 改动。 |
| 将既有忽略 ID 修正为 `"PKSA-z3gr-8qht-p93v"` 后重试同一 `require` | 0 | `phpunit/phpunit` 从锁中的 9.6.0 升级到 9.6.19。 |
| 同一扩展环境下 `COMPOSER_PHAR validate` | 0 | 配置有效；仍有原有 autoload/psr-0 与 qiniu 精确版本警告。 |
| `vendor\bin\phpunit --version` | 0 | `PHPUnit 9.6.19 by Sebastian Bergmann and contributors.` |

历史安全边界（初次安装时）：成功的 `require` 同时报告 `Found 1 ignored security vulnerability advisory affecting 1 package.` 和 `Found 89 security vulnerability advisories affecting 12 packages.`。当时的结果只证明依赖可安装，**不代表安全审计通过**。当时修正忽略规则只是为了让既定 PHPUnit 安装命令能够执行，并未声称相关公告已修复；该临时状态已被下述最终修正取代。

### PHPUnit 高危公告复核与最终修正（2026-11-21）

#### 独立核实

- 当前 lock 初次为 `phpunit/phpunit 9.6.19`，`composer.json` 当时含 `config.audit.ignore = ["PKSA-z3gr-8qht-p93v"]`。
- 在原阿里云镜像执行 `COMPOSER_PHAR show phpunit/phpunit --all`，退出码 0，可用列表最高只到 9.6.30；这仅说明镜像滞后，不能据此否定修复版存在（日志 `28-phpunit-metadata-before-review-fix.log`）。
- 在没有项目 `composer.json` 的仓库外目录执行 `COMPOSER_PHAR show phpunit/phpunit 9.6.33 --all --no-cache --no-ansi`，Composer 明确输出 `No composer.json found ... showing available packages from packagist.org`，退出码 0。官方元数据返回版本 9.6.33、source reference `fea06253ecc0a32faf787bd31b261f56f351d049`，并要求 `php >=7.3`，因此兼容本项目 PHP 8.2.9（日志 `32-phpunit-9.6.33-official-metadata.log`）。
- 修正前执行 `COMPOSER_PHAR audit --locked --format=json --no-ansi`，退出码 3。JSON 将目标公告列在 `ignored-advisories.phpunit/phpunit`，确认：
  - `advisoryId`: `PKSA-z3gr-8qht-p93v`
  - `cve`: `CVE-2026-24765`
  - `link`: `https://github.com/sebastianbergmann/phpunit/security/advisories/GHSA-vvj3-c3rp-c85p`
  - `affectedVersions`: `>=0,<8.5.52|>=9.0.0,<9.6.33|>=10.0.0,<10.5.62|>=11.0.0,<11.5.50|>=12.0.0,<12.5.8`
  - `severity`: `high`

因此审查意见属实：初次 9.6.19 落在受影响范围内，而有效 ignore 的确隐藏了该高危公告。

#### 最小修正与源选择

- 保持 `require-dev.phpunit/phpunit` 为 `^9.6`，完全删除本任务激活的 `config.audit.ignore` 配置块，没有添加其他公告忽略。
- 使用官方 Packagist 执行 `COMPOSER_PHAR update phpunit/phpunit --with-all-dependencies --no-ansi`，退出码 0；未使用 `--ignore-platform-req`、`--no-security-blocking` 或任何新 ignore。Composer 实际选择当前兼容修复版 **9.6.39**，并更新 8 个锁包（日志 `33-composer-update-phpunit-fixed.log`）。
- 除 PHPUnit 9.6.19 → 9.6.39 外，更新为：`myclabs/deep-copy` 1.13.3 → 1.14.0、`nikic/php-parser` 5.7.0 → 5.9.0、`phar-io/manifest` 2.0.3 → 2.0.4、`sebastian/comparator` 4.0.8 → 4.0.10、`sebastian/exporter` 4.0.8 → 4.0.9、`sebastian/recursion-context` 4.0.5 → 4.0.7，以及 `sebastian/resource-operations` 3.0.4 的同版本元数据刷新。
- 恢复原阿里云镜像后，`validate` 曾因 content-hash 变化退出码 2；`COMPOSER_PHAR update --lock --no-install --no-ansi` 也以退出码 2 失败，明确报告镜像缺少 lock 所需的 9.6.39 和配套新版本（日志 `34-composer-validate-after-phpunit-fix.log`、`36-composer-refresh-lock-final-source.log`）。因此最终将唯一 Composer 仓库 URL 改为 `https://repo.packagist.org`，保证 lock 可解析、可重复安装。这是本次安全修正所需的可靠源变更，不是业务功能修改。

#### 最终命令结果

| 命令 | 最终退出码 | 实际结果 |
| --- | ---: | --- |
| `COMPOSER_PHAR validate --no-ansi` | 0 | manifest 与 lock 一致；只剩原有 autoload/psr-0 和 qiniu 精确版本警告，无 lock 错误（日志 `37-composer-validate-final.log`）。 |
| `vendor\bin\phpunit --version` | 0 | `PHPUnit 9.6.39 by Sebastian Bergmann and contributors.`（日志 `39-phpunit-version-final.log`）。 |
| `COMPOSER_PHAR audit --locked --no-ansi` | 1 | `Found 65 security vulnerability advisories affecting 12 packages.`；共 65 个 Package 行，完整输出中无 `phpunit/phpunit`、`PKSA-z3gr-8qht-p93v`、`CVE-2026-24765` 或 `GHSA-vvj3-c3rp-c85p`（日志 `38-composer-audit-locked-final.log`）。 |

最终安全边界：PHPUnit 目标公告已因升级到 9.6.39 而从 locked audit 消失，且不再存在有效 ignore；其余 65 项既有公告未在本任务处理，audit 仍为非零，**不能宣称安全审计全绿**。

### 前端

两个前端均执行 `pnpm install --frozen-lockfile`。

| 项目 | 明确最终结果 | 搭建过程与处理 |
| --- | --- | --- |
| wwwstore | 复核命令退出码 0，`Done in 2.9s` | 初次后台长任务没有可靠最终退出码；重试输出 `Done in 8m 55s`，随后再次以同一 frozen-lockfile 命令取得上述明确退出码 0。只以明确复核结果作为通过依据。 |
| wwwpos | 临时允许 `unrs-resolver` 构建后退出码 0，`Done in 657ms using pnpm v12.8.1` | 完整解包后的首次结果为退出码 1：`ERR_PNPM_IGNORED_BUILDS`，`Ignored build scripts: unrs-resolver@1.12.2`。pnpm 12 不再读取 `package.json` 的 `pnpm.onlyBuiltDependencies`；临时把已有 `pnpm-workspace.yaml` 中该项设为 `true`，成功后恢复原占位字符串。 |

恢复白名单占位值后，第一次 `wwwpos pnpm ts-check` 又在依赖核验阶段以退出码 1 报同一 `ERR_PNPM_IGNORED_BUILDS`，尚未进入 TypeScript。为执行后续原命令，再次临时允许该项，四项命令完成后立即恢复；最终 Git diff 中无 `pnpm-workspace.yaml` 改动。

## 原业务检查、测试与构建

以下均为原 `package.json` 脚本，在各自项目目录执行。七项命令的完整原始输出见本文“Step 2 七项命令完整输出”章节，同时保留仓库外编号日志供核验；下表退出码来自命令包装器实际返回，而非根据日志文本推断。

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

## Step 2 七项命令完整输出

以下代码块按对应原始日志完整合并，仅统一换行并移除日志文件的 UTF-8 BOM；未删减、重排或修复任何 warning/error。每份日志以 `LOG_BEGIN` / `LOG_END` 标记界定，代码块内文本可通过这些标记与原日志逐字对照。wwwpos 的 ts-check 同时保留首轮依赖核验失败和最终实际执行 tsc 的重试，前者不冒充 TypeScript 结果。

### 1. wwwstore：`pnpm ts-check`（退出码 2）

来源日志：`20-wwwstore-ts-check.log`。

<!-- LOG_BEGIN:20-wwwstore-ts-check.log -->
```text

> projects@0.1.0 ts-check D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore
> tsc -p tsconfig.json

src/app/coupon-reports/page.tsx(242,18): error TS18047: 'summary' is possibly 'null'.
src/app/coupon-reports/page.tsx(252,24): error TS18047: 'summary' is possibly 'null'.
src/app/coupon-reports/page.tsx(252,62): error TS18047: 'summary' is possibly 'null'.
src/app/finance/components/finance-income-tab.tsx(95,5): error TS2304: Cannot find name 'setActivePreset'.
src/app/reports/page.tsx(189,19): error TS2345: Argument of type '{ totalRevenue: number; totalOrders: number; totalHours: number; avgUtilization: number; avgOrderAmount: number; totalProductSales: number; growthRate: number; }' is not assignable to parameter of type 'SetStateAction<{ totalRevenue: number; totalOrders: number; totalHours: number; avgUtilization: number; avgOrderAmount: number; totalProductSales: number; growthRate: number; occupancyRate: number; ... 5 more ...; outworkDurationMinutes: number; } | null>'.
  Type '{ totalRevenue: number; totalOrders: number; totalHours: number; avgUtilization: number; avgOrderAmount: number; totalProductSales: number; growthRate: number; }' is missing the following properties from type '{ totalRevenue: number; totalOrders: number; totalHours: number; avgUtilization: number; avgOrderAmount: number; totalProductSales: number; growthRate: number; occupancyRate: number; turnoverRate: number; ... 4 more ...; outworkDurationMinutes: number; }': occupancyRate, turnoverRate, avgCustomerSpend, productSalesCount, and 3 more.
src/app/reports/page.tsx(256,45): error TS2339: Property 'product_sales_count' does not exist on type 'OperationOverview'.
src/app/reports/page.tsx(257,48): error TS2551: Property 'table_duration_minutes' does not exist on type 'OperationOverview'. Did you mean 'total_duration_minutes'?
src/app/reports/page.tsx(258,52): error TS2551: Property 'assistant_duration_minutes' does not exist on type 'OperationOverview'. Did you mean 'total_duration_minutes'?
src/app/reports/page.tsx(259,50): error TS2551: Property 'outwork_duration_minutes' does not exist on type 'OperationOverview'. Did you mean 'total_duration_minutes'?
src/app/reports/page.tsx(355,12): error TS2741: Property 'formatDuration' is missing in type '{ totalRevenue: number; totalOrders: number; totalTableHours: number; occupancyRate: number; turnoverRate: number; avgCustomerSpend: number; avgOrderAmount: number; productSalesCount: any; ... 6 more ...; formatCurrency: (value: number) => string; }' but required in type 'ReportStatCardsProps'.
src/app/reports/page.tsx(440,17): error TS2322: Type 'RevenueByItemType[]' is not assignable to type 'ItemTypeData[]'.
  Type 'RevenueByItemType' is missing the following properties from type 'ItemTypeData': type, orders
src/app/reports/page.tsx(447,17): error TS2322: Type 'RechargeReportItem[]' is not assignable to type 'RechargeDataPoint[]'.
  Type 'RechargeReportItem' is missing the following properties from type 'RechargeDataPoint': date, total
src/app/settings/settings-discount-tab.tsx(124,26): error TS2345: Argument of type '{ discount_name: string; discount_type: "rate" | "amount"; discount_value: number; rounding_mode: "none" | "yuan" | "jiao" | "half_yuan"; status: number; sort_order: number; id?: string | undefined; }' is not assignable to parameter of type 'Partial<DiscountConfig> & { discount_name: string; type: string; value: number; }'.
  Type '{ discount_name: string; discount_type: "rate" | "amount"; discount_value: number; rounding_mode: "none" | "yuan" | "jiao" | "half_yuan"; status: number; sort_order: number; id?: string | undefined; }' is missing the following properties from type '{ discount_name: string; type: string; value: number; }': type, value
 ELIFECYCLE  Command failed with exit code 2.
```
<!-- LOG_END:20-wwwstore-ts-check.log -->

### 2. wwwstore：`pnpm lint`（退出码 1）

来源日志：`21-wwwstore-lint.log`。

<!-- LOG_BEGIN:21-wwwstore-lint.log -->
```text

> projects@0.1.0 lint D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore
> eslint


D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\account\page.tsx
   4:37  warning  'Save' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
  22:6   warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                react-hooks/exhaustive-deps
  38:5   error    Error: Cannot access variable before it is declared

`loadSecurity` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\account\page.tsx:38:5
  36 |
  37 |   useEffect(() => {
> 38 |     loadSecurity();
     |     ^^^^^^^^^^^^ `loadSecurity` accessed before it is declared
  39 |   }, []);
  40 |
  41 |   const loadSecurity = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\account\page.tsx:41:3
  39 |   }, []);
  40 |
> 41 |   const loadSecurity = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 42 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 43 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 50 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 51 |   };
     | ^^^^^ `loadSecurity` is declared here
  52 |
  53 |   const handleChangePassword = async () => {
  54 |     if (!passwordForm.oldPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {  react-hooks/immutability
  74:21  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\assistants\components\assistants-levels-tab.tsx
   39:11  warning  'currentStore' is assigned a value but never used                                                              @typescript-eslint/no-unused-vars
   69:6   warning  React Hook useEffect has a missing dependency: 'loadLevels'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
   78:33  error    Unexpected any. Specify a different type                                                                       @typescript-eslint/no-explicit-any
  197:43  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                                                react/no-unescaped-entities
  197:48  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                                                react/no-unescaped-entities
  197:50  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                                                react/no-unescaped-entities
  197:58  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                                                react/no-unescaped-entities

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\assistants\components\assistants-salary-tab.tsx
   66:17  error    Unexpected any. Specify a different type                                                                     @typescript-eslint/no-explicit-any
   78:6   warning  React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  139:17  error    Unexpected any. Specify a different type                                                                     @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\assistants\page.tsx
     7:26   warning  'formatDuration' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           @typescript-eslint/no-unused-vars
     9:29   warning  'CardHeader' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-unused-vars
     9:41   warning  'CardTitle' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-unused-vars
    39:3    warning  'Trophy' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   @typescript-eslint/no-unused-vars
    52:3    warning  'createAssistantLevel' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
    53:3    warning  'updateAssistantLevel' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
    54:3    warning  'deleteAssistantLevel' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
    55:3    warning  'initLevels' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-unused-vars
    76:6    warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/exhaustive-deps
   101:19   warning  'setLoading' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-unused-vars
   126:5    error    Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\assistants\page.tsx:126:5
  124 |
  125 |   useEffect(() => {
> 126 |     loadData();
      |     ^^^^^^^^ `loadData` accessed before it is declared
  127 |   }, []);
  128 |
  129 |   const loadData = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\assistants\page.tsx:129:3
  127 |   }, []);
  128 |
> 129 |   const loadData = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 130 |     
      | ^^^^
> 131 |     try {
      …
      | ^^^^
> 144 |     }
      | ^^^^
> 145 |   };
      | ^^^^^ `loadData` is declared here
  146 |
  147 |   const levelConfig: Record<AssistantLevel, { label: string; color: string; gradient: string }> = {
  148 |     junior: { label: "初级", color: "text-green-600 bg-green-50", gradient: "from-green-500 to-emerald-500" },  react-hooks/immutability
   173:9    warning  'ranking' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
   222:74   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   222:114  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   539:25   warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              @next/next/no-img-element
   545:189  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   545:244  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   551:125  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   551:188  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   688:31   warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              @next/next/no-img-element
   690:185  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   690:240  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   698:99   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   698:162  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   913:19   warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              @next/next/no-img-element
  1042:21   warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              @next/next/no-img-element
  1135:44   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  1135:103  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  1148:44   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\coupon-reports\page.tsx
   23:57  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any
   24:61  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any
   27:27  error    Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\coupon-reports\page.tsx:27:27
  25 |
  26 |   useEffect(() => {
> 27 |     if (currentStore?.id) loadData();
     |                           ^^^^^^^^ `loadData` accessed before it is declared
  28 |   }, [currentStore, dateRange]);
  29 |
  30 |   const getDateRange = () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\coupon-reports\page.tsx:45:3
  43 |   };
  44 |
> 45 |   const loadData = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 46 |     if (!currentStore) return;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 47 |     setLoading(true);
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 64 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 65 |   };
     | ^^^^^ `loadData` is declared here
  66 |
  67 |   if (loading) {
  68 |     return (  react-hooks/immutability
   28:6   warning  React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps
   56:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any
  145:69  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any
  157:64  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any
  179:66  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any
  242:51  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\EmployeeManagement.tsx
    9:25  warning  'Store' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-unused-vars
   48:3   warning  'UserCog' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    @typescript-eslint/no-unused-vars
   49:3   warning  'Calendar' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   @typescript-eslint/no-unused-vars
   83:5   error    Error: Cannot access variable before it is declared

`loadEmployees` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\EmployeeManagement.tsx:83:5
  81 |
  82 |   useEffect(() => {
> 83 |     loadEmployees();
     |     ^^^^^^^^^^^^^ `loadEmployees` accessed before it is declared
  84 |     loadRoles();
  85 |   }, [currentStore?.id]);
  86 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\EmployeeManagement.tsx:87:3
   85 |   }, [currentStore?.id]);
   86 |
>  87 |   const loadEmployees = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  88 |     setLoading(true);
      | ^^^^^^^^^^^^^^^^^^^^^
>  89 |     try {
      …
      | ^^^^^^^^^^^^^^^^^^^^^
>  96 |     }
      | ^^^^^^^^^^^^^^^^^^^^^
>  97 |   };
      | ^^^^^ `loadEmployees` is declared here
   98 |
   99 |   const loadRoles = async () => {
  100 |     try {                                                                                                                                                                                                           react-hooks/immutability
   84:5   error    Error: Cannot access variable before it is declared

`loadRoles` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\EmployeeManagement.tsx:84:5
  82 |   useEffect(() => {
  83 |     loadEmployees();
> 84 |     loadRoles();
     |     ^^^^^^^^^ `loadRoles` accessed before it is declared
  85 |   }, [currentStore?.id]);
  86 |
  87 |   const loadEmployees = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\EmployeeManagement.tsx:99:3
   97 |   };
   98 |
>  99 |   const loadRoles = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 100 |     try {
      | ^^^^^^^^^
> 101 |       const data = await fetchRoles();
      | ^^^^^^^^^
> 102 |       setRoles(data);
      | ^^^^^^^^^
> 103 |     } catch (error) {
      | ^^^^^^^^^
> 104 |       console.error('Failed to load roles:', error);
      | ^^^^^^^^^
> 105 |     }
      | ^^^^^^^^^
> 106 |   };
      | ^^^^^ `loadRoles` is declared here
  107 |
  108 |   const getRoleLabel = (employee: Employee) => {
  109 |     if (employee.role_name) return employee.role_name;  react-hooks/immutability
  131:9   warning  'stats' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-unused-vars
  237:21  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-explicit-any
  240:40  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-explicit-any
  607:10  warning  'StatCard' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\RoleManagement.tsx
   26:3   warning  'X' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
   76:5   error    Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\RoleManagement.tsx:76:5
  74 |
  75 |   useEffect(() => {
> 76 |     loadData();
     |     ^^^^^^^^ `loadData` accessed before it is declared
  77 |   }, []);
  78 |
  79 |   const loadData = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\RoleManagement.tsx:79:3
  77 |   }, []);
  78 |
> 79 |   const loadData = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 80 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 81 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 94 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 95 |   };
     | ^^^^^ `loadData` is declared here
  96 |
  97 |   const filteredRoles = roles.filter((role) => role.name.toLowerCase().includes(searchQuery.toLowerCase()));
  98 |  react-hooks/immutability
  200:42  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  223:18  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  239:26  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  267:30  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  269:18  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  464:35  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  486:33  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  530:39  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  549:47  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  652:77  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  664:77  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\StoreManagement.tsx
  50:10  warning  'Switch' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           @typescript-eslint/no-unused-vars
  75:5   error    Error: Cannot access variable before it is declared

`loadStores` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\StoreManagement.tsx:75:5
  73 |
  74 |   useEffect(() => {
> 75 |     loadStores();
     |     ^^^^^^^^^^ `loadStores` accessed before it is declared
  76 |   }, []);
  77 |
  78 |   const loadStores = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\components\StoreManagement.tsx:78:3
  76 |   }, []);
  77 |
> 78 |   const loadStores = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 79 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 80 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 87 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 88 |   };
     | ^^^^^ `loadStores` is declared here
  89 |
  90 |   const filteredStores = stores.filter((store) => {
  91 |     const matchesSearch = store.name.toLowerCase().includes(searchQuery.toLowerCase()) || store.address.toLowerCase().includes(searchQuery.toLowerCase()) || store.phone.includes(searchQuery);  react-hooks/immutability

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\employees\page.tsx
  22:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\finance\components\finance-income-tab.tsx
    8:10  warning  'Button' is defined but never used                                                                              @typescript-eslint/no-unused-vars
    9:60  warning  'DialogDescription' is defined but never used                                                                   @typescript-eslint/no-unused-vars
   51:21  warning  'setExporting' is assigned a value but never used                                                               @typescript-eslint/no-unused-vars
   55:65  error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any
   94:9   warning  'handlePresetChange' is assigned a value but never used                                                         @typescript-eslint/no-unused-vars
   98:39  warning  React Hook useEffect has a missing dependency: 'loadSummary'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  104:45  error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any
  269:53  error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any
  288:51  error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\finance\components\finance-recharge-tab.tsx
  36:21  warning  'setExporting' is assigned a value but never used                                                               @typescript-eslint/no-unused-vars
  69:39  warning  React Hook useEffect has a missing dependency: 'loadSummary'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  70:48  warning  React Hook useEffect has a missing dependency: 'loadDetail'. Either include it or remove the dependency array   react-hooks/exhaustive-deps
  80:9   warning  'totalAmount' is assigned a value but never used                                                                @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\finance\components\finance-revenue-tab.tsx
  37:21  warning  'setExporting' is assigned a value but never used                                                               @typescript-eslint/no-unused-vars
  72:39  warning  React Hook useEffect has a missing dependency: 'loadSummary'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  73:50  warning  React Hook useEffect has a missing dependency: 'loadDetail'. Either include it or remove the dependency array   react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\finance\page.tsx
  23:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\member-bind\page.tsx
   3:20  warning  'useEffect' is defined but never used     @typescript-eslint/no-unused-vars
  13:40  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-levels-tab.tsx
    6:10  warning  'formatCurrency' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           @typescript-eslint/no-unused-vars
   67:5   error    Error: Cannot access variable before it is declared

`loadMemberLevels` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-levels-tab.tsx:67:5
  65 |
  66 |   useEffect(() => {
> 67 |     loadMemberLevels();
     |     ^^^^^^^^^^^^^^^^ `loadMemberLevels` accessed before it is declared
  68 |     loadStatistics();
  69 |   }, [currentStore]);
  70 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-levels-tab.tsx:71:3
  69 |   }, [currentStore]);
  70 |
> 71 |   const loadMemberLevels = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 72 |     try {
     | ^^^^^^^^^
> 73 |       const result = await fetchMemberLevels();
     | ^^^^^^^^^
> 74 |       setMemberTiers(result);
     | ^^^^^^^^^
> 75 |     } catch (error) {
     | ^^^^^^^^^
> 76 |       console.error('Failed to load member levels:', error);
     | ^^^^^^^^^
> 77 |       warning('加载会员等级数据失败，请稍后重试');
     | ^^^^^^^^^
> 78 |     }
     | ^^^^^^^^^
> 79 |   };
     | ^^^^^ `loadMemberLevels` is declared here
  80 |
  81 |   const loadStatistics = async () => {
  82 |     try {                   react-hooks/immutability
   68:5   error    Error: Cannot access variable before it is declared

`loadStatistics` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-levels-tab.tsx:68:5
  66 |   useEffect(() => {
  67 |     loadMemberLevels();
> 68 |     loadStatistics();
     |     ^^^^^^^^^^^^^^ `loadStatistics` accessed before it is declared
  69 |   }, [currentStore]);
  70 |
  71 |   const loadMemberLevels = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-levels-tab.tsx:81:3
  79 |   };
  80 |
> 81 |   const loadStatistics = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 82 |     try {
     | ^^^^^^^^^
> 83 |       const result = await fetchStatistics();
     | ^^^^^^^^^
> 84 |       setStatistics(result);
     | ^^^^^^^^^
> 85 |     } catch (error) {
     | ^^^^^^^^^
> 86 |       console.error('Failed to load statistics:', error);
     | ^^^^^^^^^
> 87 |       warning('加载统计数据失败，请稍后重试');
     | ^^^^^^^^^
> 88 |     }
     | ^^^^^^^^^
> 89 |   };
     | ^^^^^ `loadStatistics` is declared here
  90 |
  91 |   const openAddTierDialog = () => {
  92 |     setEditingTier(null);  react-hooks/immutability
   69:6   warning  React Hook useEffect has missing dependencies: 'loadMemberLevels' and 'loadStatistics'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           react-hooks/exhaustive-deps
  147:26  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  148:31  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  149:29  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  150:28  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  151:33  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  152:34  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  153:33  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  154:33  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  155:30  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx
   13:3   warning  'Card' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-unused-vars
   14:3   warning  'CardContent' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
   15:3   warning  'CardHeader' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           @typescript-eslint/no-unused-vars
   16:3   warning  'CardTitle' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars
   94:43  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-explicit-any
   97:7   error    Error: Cannot access variable before it is declared

`loadMembers` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx:97:7
   95 |       setAddMemberOpen(false);
   96 |       setAddMemberForm({ name: "", phone: "", level: "normal" });
>  97 |       loadMembers();
      |       ^^^^^^^^^^^ `loadMembers` accessed before it is declared
   98 |     } catch { alert("添加失败"); }
   99 |   };
  100 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx:191:3
  189 |   }, [currentStore, page, searchQuery, levelFilter, statusFilter]);
  190 |
> 191 |   const loadMembers = async (currentPage: number = page) => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 192 |     setLoading(true);
      | ^^^^^^^^^^^^^^^^^^^^^
> 193 |     try {
      …
      | ^^^^^^^^^^^^^^^^^^^^^
> 211 |     }
      | ^^^^^^^^^^^^^^^^^^^^^
> 212 |   };
      | ^^^^^ `loadMembers` is declared here
  213 |
  214 |   const loadStatistics = async () => {
  215 |     try {                                                                                                                          react-hooks/immutability
  183:5   error    Error: Cannot access variable before it is declared

`loadStatistics` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx:183:5
  181 |
  182 |   useEffect(() => {
> 183 |     loadStatistics();
      |     ^^^^^^^^^^^^^^ `loadStatistics` accessed before it is declared
  184 |     loadMemberLevels();
  185 |   }, [currentStore]);
  186 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx:214:3
  212 |   };
  213 |
> 214 |   const loadStatistics = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 215 |     try {
      | ^^^^^^^^^
> 216 |       const result = await fetchStatistics();
      | ^^^^^^^^^
> 217 |       setStatistics(result);
      | ^^^^^^^^^
> 218 |     } catch (error) {
      | ^^^^^^^^^
> 219 |       console.error('Failed to load statistics:', error);
      | ^^^^^^^^^
> 220 |       warning('加载统计数据失败，请稍后重试');
      | ^^^^^^^^^
> 221 |     }
      | ^^^^^^^^^
> 222 |   };
      | ^^^^^ `loadStatistics` is declared here
  223 |
  224 |   const loadMemberLevels = async () => {
  225 |     try {                                                          react-hooks/immutability
  184:5   error    Error: Cannot access variable before it is declared

`loadMemberLevels` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx:184:5
  182 |   useEffect(() => {
  183 |     loadStatistics();
> 184 |     loadMemberLevels();
      |     ^^^^^^^^^^^^^^^^ `loadMemberLevels` accessed before it is declared
  185 |   }, [currentStore]);
  186 |
  187 |   useEffect(() => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\components\members-management-tab.tsx:224:3
  222 |   };
  223 |
> 224 |   const loadMemberLevels = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 225 |     try {
      | ^^^^^^^^^
> 226 |       const result = await fetchMemberLevels();
      | ^^^^^^^^^
> 227 |       setMemberTiers(result);
      | ^^^^^^^^^
> 228 |     } catch (error) {
      | ^^^^^^^^^
> 229 |       console.error('Failed to load member levels:', error);
      | ^^^^^^^^^
> 230 |       warning('加载会员等级数据失败，请稍后重试');
      | ^^^^^^^^^
> 231 |     }
      | ^^^^^^^^^
> 232 |   };
      | ^^^^^ `loadMemberLevels` is declared here
  233 |
  234 |   const loadMemberDetail = async (memberId: string) => {
  235 |     try {  react-hooks/immutability
  185:6   warning  React Hook useEffect has missing dependencies: 'loadMemberLevels' and 'loadStatistics'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps
  189:6   warning  React Hook useEffect has a missing dependency: 'loadMembers'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\members\page.tsx
  22:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\BatchCheckoutModal.tsx
   8:22  warning  'RadioGroupItem' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
  39:7   error    Error: Cannot access variable before it is declared

`loadOrders` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\BatchCheckoutModal.tsx:39:7
  37 |   useEffect(() => {
  38 |     if (isOpen && tableId) {
> 39 |       loadOrders();
     |       ^^^^^^^^^^ `loadOrders` accessed before it is declared
  40 |     }
  41 |   }, [isOpen, tableId]);
  42 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\BatchCheckoutModal.tsx:43:3
  41 |   }, [isOpen, tableId]);
  42 |
> 43 |   const loadOrders = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |     try {
     | ^^^^^^^^^
> 45 |       const data = await getOrdersByTable(tableId);
     | ^^^^^^^^^
> 46 |       setOrders(data);
     | ^^^^^^^^^
> 47 |       const newTotal = data.reduce((sum, order) => sum + order.final_amount, 0);
     | ^^^^^^^^^
> 48 |       setAmount(newTotal.toString());
     | ^^^^^^^^^
> 49 |     } catch (error) {
     | ^^^^^^^^^
> 50 |       toast({ title: '加载订单失败', variant: 'error' });
     | ^^^^^^^^^
> 51 |     }
     | ^^^^^^^^^
> 52 |   };
     | ^^^^^ `loadOrders` is declared here
  53 |
  54 |   const handleSubmit = async () => {
  55 |     if (orders.length === 0) {  react-hooks/immutability
  41:6   warning  React Hook useEffect has a missing dependency: 'loadOrders'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     react-hooks/exhaustive-deps
  49:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-unused-vars
  77:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\CheckoutModal.tsx
  32:9   warning  'defaultAmount' is assigned a value but never used  @typescript-eslint/no-unused-vars
  94:14  warning  'error' is defined but never used                   @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\TableOrderModal.tsx
  31:7   error    Error: Cannot access variable before it is declared

`loadTables` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\TableOrderModal.tsx:31:7
  29 |   useEffect(() => {
  30 |     if (isOpen) {
> 31 |       loadTables();
     |       ^^^^^^^^^^ `loadTables` accessed before it is declared
  32 |     }
  33 |   }, [isOpen]);
  34 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\TableOrderModal.tsx:35:3
  33 |   }, [isOpen]);
  34 |
> 35 |   const loadTables = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 36 |     setTablesLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 37 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 45 |   };
     | ^^^^^ `loadTables` is declared here
  46 |
  47 |   const handleSubmit = async () => {
  48 |     if (!tableId) {  react-hooks/immutability
  33:6   warning  React Hook useEffect has a missing dependency: 'loadTables'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/exhaustive-deps
  40:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
  66:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\TableStatusPanel.tsx
  25:5   error    Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\TableStatusPanel.tsx:25:5
  23 |
  24 |   useEffect(() => {
> 25 |     loadData();
     |     ^^^^^^^^ `loadData` accessed before it is declared
  26 |   }, []);
  27 |
  28 |   const loadData = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\components\TableStatusPanel.tsx:28:3
  26 |   }, []);
  27 |
> 28 |   const loadData = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 29 |     setIsLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^^^
> 30 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^
> 50 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^
> 51 |   };
     | ^^^^^ `loadData` is declared here
  52 |
  53 |   const handlePause = async (orderId: string) => {
  54 |     try {  react-hooks/immutability
  26:6   warning  React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               react-hooks/exhaustive-deps
  41:18  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
  46:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
  58:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
  68:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\page.tsx
   71:3    warning  'CreditCard' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
  241:6    warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     react-hooks/exhaustive-deps
  244:11   warning  'currentStore' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-unused-vars
  268:5    error    Error: Cannot access variable before it is declared

`loadOrders` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\page.tsx:268:5
  266 |
  267 |   useEffect(() => {
> 268 |     loadOrders();
      |     ^^^^^^^^^^ `loadOrders` accessed before it is declared
  269 |   }, [page, typeFilter, statusFilter, dateFilter, searchQuery, refreshKey]);
  270 |
  271 |   useEffect(() => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\page.tsx:310:3
  308 |   };
  309 |
> 310 |   const loadOrders = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 311 |     try {
      | ^^^^^^^^^
> 312 |       const params: Record<string, string | number> = {
      …
      | ^^^^^^^^^
> 327 |     }
      | ^^^^^^^^^
> 328 |   };
      | ^^^^^ `loadOrders` is declared here
  329 |
  330 |   const handleRefresh = () => {
  331 |     setRefreshKey(k => k + 1);                                                                                                                                                                                                                                                                                                                    react-hooks/immutability
  269:6    warning  React Hook useEffect has a missing dependency: 'loadOrders'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps
  273:25   error    Error: Cannot access variable before it is declared

`getDateRange` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\page.tsx:273:25
  271 |   useEffect(() => {
  272 |     if (exportDialogOpen) {
> 273 |       const dateRange = getDateRange(dateFilter);
      |                         ^^^^^^^^^^^^ `getDateRange` accessed before it is declared
  274 |       setExportForm({
  275 |         type: typeFilter,
  276 |         status: statusFilter,

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\orders\page.tsx:283:3
  281 |   }, [exportDialogOpen]);
  282 |
> 283 |   const getDateRange = (filter: string): { start_date?: string; end_date?: string; date_range?: string } => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 284 |     const now = new Date();
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 285 |     const formatDate = (d: Date) => d.toISOString().split('T')[0];
      …
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 307 |     }
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 308 |   };
      | ^^^^^ `getDateRange` is declared here
  309 |
  310 |   const loadOrders = async () => {
  311 |     try {  react-hooks/immutability
  281:6    warning  React Hook useEffect has missing dependencies: 'dateFilter', 'statusFilter', and 'typeFilter'. Either include them or remove the dependency array. You can also replace multiple useState variables with useReducer if 'setExportForm' needs the current value of 'typeFilter'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                react-hooks/exhaustive-deps
  742:48   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-explicit-any
  746:69   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-explicit-any
  947:64   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-explicit-any
  951:149  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\packages\packages-panel.tsx
    9:29  warning  'CardHeader' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
    9:41  warning  'CardTitle' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           @typescript-eslint/no-unused-vars
   31:3   warning  'Plus' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-unused-vars
   35:3   warning  'Star' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-unused-vars
   39:3   warning  'Calendar' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars
   47:10  warning  'products' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   @typescript-eslint/no-unused-vars
   47:44  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-explicit-any
   74:13  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-explicit-any
   95:9   error    Error: Cannot access variable before it is declared

`openDialog` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\packages\packages-panel.tsx:95:9
  93 |       const detail = (event as CustomEvent).detail;
  94 |       if (detail === "packages") {
> 95 |         openDialog();
     |         ^^^^^^^^^^ `openDialog` accessed before it is declared
  96 |       }
  97 |     };
  98 |     

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\packages\packages-panel.tsx:207:3
  205 |   };
  206 |
> 207 |   const openDialog = (pkg?: Package) => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 208 |     if (pkg) {
      | ^^^^^^^^^^^^^^
> 209 |       setEditingPackage(pkg);
      …
      | ^^^^^^^^^^^^^^
> 223 |     setDialogOpen(true);
      | ^^^^^^^^^^^^^^
> 224 |   };
      | ^^^^^ `openDialog` is declared here
  225 |
  226 |   const openDeleteConfirm = (id: string) => {
  227 |     setPackageToDelete(id);  react-hooks/immutability
  103:6   warning  React Hook useEffect has a missing dependency: 'openDialog'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   react-hooks/exhaustive-deps
  182:9   warning  'handleToggleStatus' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\page.tsx
   10:3   warning  'tableTypeLabels' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
   25:3   warning  'TrendingDown' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-unused-vars
   34:3   warning  'Plus' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
   40:3   warning  'Package2' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-unused-vars
   54:10  warning  'currentTime' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
   65:5   error    Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\page.tsx:65:5
  63 |
  64 |   useEffect(() => {
> 65 |     loadData();
     |     ^^^^^^^^ `loadData` accessed before it is declared
  66 |   }, [currentStore, trendRange]);
  67 |
  68 |   const loadData = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\page.tsx:68:3
  66 |   }, [currentStore, trendRange]);
  67 |
> 68 |   const loadData = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 69 |     if (!currentStore) return;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 70 |     
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 80 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 81 |   };
     | ^^^^^ `loadData` is declared here
  82 |
  83 |   const revenueChange = stats?.revenue_change ?? 0;
  84 |   const isPositive = revenueChange >= 0;  react-hooks/immutability
   66:6   warning  React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps
  330:52  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\products\components\products-categories-tab.tsx
  76:6  warning  React Hook useCallback has a missing dependency: 'warning'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\products\components\products-inventory-tab.tsx
  28:10  warning  'loading' is assigned a value but never used                                                                  @typescript-eslint/no-unused-vars
  78:6   warning  React Hook useCallback has a missing dependency: 'warning'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\products\components\products-management-tab.tsx
   23:3   warning  'Package' is defined but never used                                                                           @typescript-eslint/no-unused-vars
   58:11  warning  'success' is assigned a value but never used                                                                  @typescript-eslint/no-unused-vars
  171:6   warning  React Hook useCallback has a missing dependency: 'warning'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  335:11  error    'quantity' is never reassigned. Use 'const' instead                                                           prefer-const

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\products\inventory-record-panel.tsx
  110:48  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  110:78  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\products\page.tsx
  23:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\products\product-table.tsx
  106:29  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\profile\page.tsx
   21:6   warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps
   32:5   error    Error: Cannot access variable before it is declared

`loadProfile` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\profile\page.tsx:32:5
  30 |
  31 |   useEffect(() => {
> 32 |     loadProfile();
     |     ^^^^^^^^^^^ `loadProfile` accessed before it is declared
  33 |   }, []);
  34 |
  35 |   const loadProfile = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\profile\page.tsx:35:3
  33 |   }, []);
  34 |
> 35 |   const loadProfile = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 36 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 37 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 49 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 50 |   };
     | ^^^^^ `loadProfile` is declared here
  51 |
  52 |   const handleSave = async () => {
  53 |     if (!form.name.trim()) {  react-hooks/immutability
  129:19  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\reports\page.tsx
   32:3  warning  'fetchMemberStats' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
   85:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/exhaustive-deps
  117:5  error    Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\reports\page.tsx:117:5
  115 |
  116 |   useEffect(() => {
> 117 |     loadData();
      |     ^^^^^^^^ `loadData` accessed before it is declared
  118 |   }, [dateRange, state.currentStore]);
  119 |
  120 |   const getRange = () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\reports\page.tsx:147:3
  145 |   }, [currentStore?.id, dateRange]);
  146 |
> 147 |   const loadData = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 148 |     setLoading(true);
      | ^^^^^^^^^^^^^^^^^^^^^
> 149 |     setError(null);
      …
      | ^^^^^^^^^^^^^^^^^^^^^
> 230 |     }
      | ^^^^^^^^^^^^^^^^^^^^^
> 231 |   };
      | ^^^^^ `loadData` is declared here
  232 |
  233 |   const stats = useMemo(() => {
  234 |     const defaults = {  react-hooks/immutability
  118:6  warning  React Hook useEffect has a missing dependency: 'loadData'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps
  145:6  warning  React Hook useEffect has a missing dependency: 'getRange'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\reports\report-recharge-panel.tsx
  44:36  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  44:68  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  62:64  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\reports\report-stat-cards.tsx
  46:30  warning  'totalTableHours' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\page.tsx
  20:3   warning  'savePaymentSettings' is defined but never used                                                            @typescript-eslint/no-unused-vars
  22:3   warning  'saveNotificationSettings' is defined but never used                                                       @typescript-eslint/no-unused-vars
  24:3   warning  'saveSecuritySettings' is defined but never used                                                           @typescript-eslint/no-unused-vars
  26:3   warning  'saveDisplaySettings' is defined but never used                                                            @typescript-eslint/no-unused-vars
  65:6   warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  71:10  warning  'notificationSettings' is assigned a value but never used                                                  @typescript-eslint/no-unused-vars
  77:10  warning  'securitySettings' is assigned a value but never used                                                      @typescript-eslint/no-unused-vars
  83:10  warning  'displaySettings' is assigned a value but never used                                                       @typescript-eslint/no-unused-vars
  88:10  warning  'paymentSettings' is assigned a value but never used                                                       @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-activity-tab.tsx
  25:16  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-coupon-tab.tsx
  39:5   error    Error: Cannot access variable before it is declared

`loadConfigs` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-coupon-tab.tsx:39:5
  37 |   useEffect(() => {
  38 |     if (!visible || !currentStore) return;
> 39 |     loadConfigs();
     |     ^^^^^^^^^^^ `loadConfigs` accessed before it is declared
  40 |   }, [visible, currentStore]);
  41 |
  42 |   const loadConfigs = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-coupon-tab.tsx:42:3
  40 |   }, [visible, currentStore]);
  41 |
> 42 |   const loadConfigs = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 43 |     if (!currentStore) return;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |     setLoading(true);
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 64 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 65 |   };
     | ^^^^^ `loadConfigs` is declared here
  66 |
  67 |   const handleSave = async (platform: string) => {
  68 |     if (!currentStore) return;  react-hooks/immutability
  40:6   warning  React Hook useEffect has a missing dependency: 'loadConfigs'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          react-hooks/exhaustive-deps
  60:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  85:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  98:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-discount-tab.tsx
   76:5   error    Error: Cannot access variable before it is declared

`loadDiscounts` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-discount-tab.tsx:76:5
  74 |   useEffect(() => {
  75 |     if (!visible || !currentStore) return;
> 76 |     loadDiscounts();
     |     ^^^^^^^^^^^^^ `loadDiscounts` accessed before it is declared
  77 |   }, [visible, currentStore]);
  78 |
  79 |   const loadDiscounts = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-discount-tab.tsx:79:3
  77 |   }, [visible, currentStore]);
  78 |
> 79 |   const loadDiscounts = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 80 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 81 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 88 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 89 |   };
     | ^^^^^ `loadDiscounts` is declared here
  90 |
  91 |   const openAddDialog = () => {
  92 |     setEditingDiscount(null);  react-hooks/immutability
   77:6   warning  React Hook useEffect has a missing dependency: 'loadDiscounts'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps
   84:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  136:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  149:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  316:86  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-store-tab.tsx
   41:60  warning  'success' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
   77:52  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. The inferred dependencies did not match the manually specified dependencies, which could cause the value to change more or less frequently than expected. The inferred dependency was `currentStore`, but the source dependencies were [currentStore?.id, warning, dispatch]. Inferred less specific property than source.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-store-tab.tsx:77:52
  75 |   }, [currentStore?.charging_rate]);
  76 |
> 77 |   const handleOpenTableConfirmChange = useCallback(async (value: boolean) => {
     |                                                    ^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 78 |     if (!currentStore?.id) return;
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 79 |     setOpenTableConfirm(value);
     …
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 86 |     }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 87 |   }, [currentStore?.id, warning, dispatch]);
     | ^^^^ Could not preserve existing manual memoization
  88 |
  89 |   const handleConfirmTimeoutChange = useCallback(async (minutes: number) => {
  90 |     if (!currentStore?.id) return;  react-hooks/preserve-manual-memoization
  100:6   warning  React Hook useCallback has a missing dependency: 'currentStore?.open_table_confirm_timeout'. Either include it or remove the dependency array. If 'setConfirmTimeout' needs the current value of 'currentStore.open_table_confirm_timeout', you can also switch to useReducer instead of useState and read 'currentStore.open_table_confirm_timeout' in the reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps
  113:6   warning  React Hook useCallback has a missing dependency: 'currentStore?.product_order_timeout'. Either include it or remove the dependency array. If 'setProductTimeout' needs the current value of 'currentStore.product_order_timeout', you can also switch to useReducer instead of useState and read 'currentStore.product_order_timeout' in the reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/exhaustive-deps
  126:6   warning  React Hook useCallback has a missing dependency: 'currentStore?.assistant_booking_timeout'. Either include it or remove the dependency array. If 'setAssistantTimeout' needs the current value of 'currentStore.assistant_booking_timeout', you can also switch to useReducer instead of useState and read 'currentStore.assistant_booking_timeout' in the reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps
  139:6   warning  React Hook useCallback has a missing dependency: 'currentStore?.charging_rate'. Either include it or remove the dependency array. If 'setChargingRate' needs the current value of 'currentStore.charging_rate', you can also switch to useReducer instead of useState and read 'currentStore.charging_rate' in the reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\settings-wechat-tab.tsx
  36:10  warning  'loading' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\wechat-pay\apply-form.tsx
   85:30   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  109:36   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  111:51   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  111:74   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  114:22   warning  Compilation Skipped: Use of incompatible library

This API returns functions which cannot be memoized without leading to stale UI. To prevent this, by default React Compiler will skip memoizing this component/hook. However, you may see issues if values from this API are passed to other components/hooks that are memoized.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\wechat-pay\apply-form.tsx:114:22
  112 |     if (firstMsg?.message) toast.error(firstMsg.message);
  113 |   };
> 114 |   const formValues = watch();
      |                      ^^^^^ React Hook Form's `useForm()` API returns a `watch()` function which cannot be memoized safely.
  115 |
  116 |   // 自动保存草稿
  117 |   useEffect(() => {  react-hooks/incompatible-library
  127:28   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  127:40   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  143:32   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  157:53   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  166:33   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  168:21   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  205:17   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  275:67   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  314:71   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  381:69   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  471:49   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  501:49   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any
  535:156  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\wechat-pay\bank-selector.tsx
  42:19  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  57:28  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  66:25  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  78:27  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\settings\wechat-pay\status-views.tsx
  38:17   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  51:17   error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  84:105  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\announcements-tab.tsx
  28:5   error  Error: Cannot access variable before it is declared

`loadAnnouncements` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\announcements-tab.tsx:28:5
  26 |
  27 |   useEffect(() => {
> 28 |     loadAnnouncements();
     |     ^^^^^^^^^^^^^^^^^ `loadAnnouncements` accessed before it is declared
  29 |   }, []);
  30 |
  31 |   const loadAnnouncements = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\announcements-tab.tsx:31:3
  29 |   }, []);
  30 |
> 31 |   const loadAnnouncements = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 33 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 40 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 41 |   };
     | ^^^^^ `loadAnnouncements` is declared here
  42 |
  43 |   if (loading) {
  44 |     return (  react-hooks/immutability
  34:18  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-list-view.tsx
  28:5   error  Error: Cannot access variable before it is declared

`loadArticles` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-list-view.tsx:28:5
  26 |
  27 |   useEffect(() => {
> 28 |     loadArticles();
     |     ^^^^^^^^^^^^ `loadArticles` accessed before it is declared
  29 |   }, []);
  30 |
  31 |   const loadArticles = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-list-view.tsx:31:3
  29 |   }, []);
  30 |
> 31 |   const loadArticles = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 32 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 33 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 40 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 41 |   };
     | ^^^^^ `loadArticles` is declared here
  42 |
  43 |   const categories = Array.from(
  44 |     new Map(  react-hooks/immutability
  34:18  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-read-view.tsx
  52:7   error    Error: Cannot access variable before it is declared

`loadDetail` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-read-view.tsx:52:7
  50 |     } else {
  51 |       setLoading(true);
> 52 |       loadDetail();
     |       ^^^^^^^^^^ `loadDetail` accessed before it is declared
  53 |     }
  54 |   }, [article.id]);
  55 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-read-view.tsx:56:3
  54 |   }, [article.id]);
  55 |
> 56 |   const loadDetail = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 57 |     try {
     | ^^^^^^^^^
> 58 |       const res: any = await get("/support.Support/articleDetail", {
     …
     | ^^^^^^^^^
> 67 |     }
     | ^^^^^^^^^
> 68 |   };
     | ^^^^^ `loadDetail` is declared here
  69 |
  70 |   const toc: TOCItem[] = useMemo(() => {
  71 |     const headingRegex = /^(#{1,3})\s+(.+)$/gm;  react-hooks/immutability
  54:6   warning  React Hook useEffect has missing dependencies: 'article.content' and 'loadDetail'. Either include them or remove the dependency array. If 'setContent' needs the current value of 'article.content', you can also switch to useReducer instead of useState and read 'article.content' in the reducer                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 react-hooks/exhaustive-deps
  58:18  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-tab.tsx
  22:5   error  Error: Cannot access variable before it is declared

`loadAllArticles` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-tab.tsx:22:5
  20 |
  21 |   useEffect(() => {
> 22 |     loadAllArticles();
     |     ^^^^^^^^^^^^^^^ `loadAllArticles` accessed before it is declared
  23 |   }, []);
  24 |
  25 |   const loadAllArticles = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\articles-tab.tsx:25:3
  23 |   }, []);
  24 |
> 25 |   const loadAllArticles = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 26 |     try {
     | ^^^^^^^^^
> 27 |       const res: any = await get("/support.Support/articles");
     | ^^^^^^^^^
> 28 |       setAllArticles(res?.list || []);
     | ^^^^^^^^^
> 29 |     } catch {
     | ^^^^^^^^^
> 30 |       setAllArticles([]);
     | ^^^^^^^^^
> 31 |     }
     | ^^^^^^^^^
> 32 |   };
     | ^^^^^ `loadAllArticles` is declared here
  33 |
  34 |   const handleSelectArticle = (article: HelpItem) => {
  35 |     setSelectedArticle(article);  react-hooks/immutability
  27:18  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\page.tsx
  28:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\ticket-form.tsx
  50:17  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\support\tickets-tab.tsx
  77:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  94:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-management-tab.tsx
   29:3    warning  'X' is defined but never used                                                                               @typescript-eslint/no-unused-vars
  193:6    warning  React Hook useEffect has a missing dependency: 'warning'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  279:23   error    Unexpected any. Specify a different type                                                                    @typescript-eslint/no-explicit-any
  537:44   error    Unexpected any. Specify a different type                                                                    @typescript-eslint/no-explicit-any
  537:119  error    Unexpected any. Specify a different type                                                                    @typescript-eslint/no-explicit-any
  627:44   error    Unexpected any. Specify a different type                                                                    @typescript-eslint/no-explicit-any
  627:119  error    Unexpected any. Specify a different type                                                                    @typescript-eslint/no-explicit-any
  670:62   error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                                             react/no-unescaped-entities
  670:67   error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`                                             react/no-unescaped-entities
  693:25   warning  'isActive' is assigned a value but never used                                                               @typescript-eslint/no-unused-vars
  701:36   error    Unexpected any. Specify a different type                                                                    @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-periods-tab.tsx
   34:10  warning  'get' is defined but never used                                                                                     @typescript-eslint/no-unused-vars
   34:15  warning  'post' is defined but never used                                                                                    @typescript-eslint/no-unused-vars
   52:61  warning  'success' is defined but never used                                                                                 @typescript-eslint/no-unused-vars
   52:70  warning  'warning' is defined but never used                                                                                 @typescript-eslint/no-unused-vars
   89:6   warning  React Hook useEffect has a missing dependency: 'loadTimePeriods'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  145:19  error    Unexpected any. Specify a different type                                                                            @typescript-eslint/no-explicit-any
  157:14  warning  'err' is defined but never used                                                                                     @typescript-eslint/no-unused-vars
  169:14  warning  'err' is defined but never used                                                                                     @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-pricing-coupon-tab.tsx
   21:59  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   29:18  error    Error: Cannot access variable before it is declared

`loadPackages` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-pricing-coupon-tab.tsx:29:18
  27 |
  28 |   useEffect(() => {
> 29 |     if (storeId) loadPackages();
     |                  ^^^^^^^^^^^^ `loadPackages` accessed before it is declared
  30 |   }, [storeId]);
  31 |
  32 |   // Listen for external open-add-dialog event from page header

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-pricing-coupon-tab.tsx:43:3
  41 |   }, []);
  42 |
> 43 |   const loadPackages = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 44 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 45 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 57 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 58 |   };
     | ^^^^^ `loadPackages` is declared here
  59 |
  60 |   const handleSave = async () => {
  61 |     if (!form.name || !form.duration_hours) {  react-hooks/immutability
   30:6   warning  React Hook useEffect has a missing dependency: 'loadPackages'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/exhaustive-deps
   46:30  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   51:29  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   52:57  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
   84:43  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  215:50  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-pricing-rules-tab.tsx
   10:3   warning  'Calculator' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
   19:3   warning  'AlertCircle' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-unused-vars
   27:3   warning  'LayoutTemplate' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              @typescript-eslint/no-unused-vars
  145:7   warning  'memberLevelLabels' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
  253:6   warning  React Hook useEffect has a missing dependency: 'loadTimePeriods'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      react-hooks/exhaustive-deps
  256:34  warning  '_event' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-unused-vars
  257:7   error    Error: Cannot access variable before it is declared

`openAddDialog` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-pricing-rules-tab.tsx:257:7
  255 |   useEffect(() => {
  256 |     const handleOpenAddDialog = (_event: Event) => {
> 257 |       openAddDialog();
      |       ^^^^^^^^^^^^^ `openAddDialog` accessed before it is declared
  258 |     };
  259 |     
  260 |     window.addEventListener('openAddPricingRule', handleOpenAddDialog);

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-pricing-rules-tab.tsx:286:3
  284 |   };
  285 |
> 286 |   const openAddDialog = () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 287 |     setEditingRule(null);
      | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 288 |     setFormData({ ...defaultFormData });
      | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 289 |     setDialogOpen(true);
      | ^^^^^^^^^^^^^^^^^^^^^^^^^
> 290 |   };
      | ^^^^^ `openAddDialog` is declared here
  291 |
  292 |   const openEditDialog = (rule: PricingRule) => {
  293 |     setEditingRule(rule);  react-hooks/immutability
  359:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
  369:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
  393:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-table-types-tab.tsx
  43:64  warning  'success' is defined but never used                                                                                @typescript-eslint/no-unused-vars
  71:6   warning  React Hook useEffect has a missing dependency: 'loadTableTypes'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\components\tables-zones-tab.tsx
  45:59  warning  'success' is defined but never used                                                                           @typescript-eslint/no-unused-vars
  74:6   warning  React Hook useEffect has a missing dependency: 'loadZones'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\app\tables\page.tsx
  31:6  warning  React Hook useEffect has a missing dependency: 'router'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\CustomToast.tsx
  147:11  warning  'ToastContextType' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\CommissionConfigPanel.tsx
   27:28   warning  'ApiCommissionConfig' is defined but never used      @typescript-eslint/no-unused-vars
   50:10   warning  'loading' is assigned a value but never used         @typescript-eslint/no-unused-vars
   96:42   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  100:42   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  101:43   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  102:44   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  103:41   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  186:17   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  201:9    warning  'getStatusBadge' is assigned a value but never used  @typescript-eslint/no-unused-vars
  289:188  error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  333:73   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  342:35   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  343:41   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  343:87   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  344:38   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  349:35   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  444:57   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  454:30   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  476:33   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  515:33   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  523:48   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  525:109  error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  534:48   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  536:110  error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  548:33   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  571:42   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  573:88   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  591:42   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any
  593:94   error    Unexpected any. Specify a different type             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ReviewManager.tsx
    3:20  warning  'useEffect' is defined but never used                            @typescript-eslint/no-unused-vars
   19:3   warning  'Calendar' is defined but never used                             @typescript-eslint/no-unused-vars
  214:35  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`  react/no-unescaped-entities
  214:50  error    `"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`  react/no-unescaped-entities

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx
    3:31  warning  'useCallback' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              @typescript-eslint/no-unused-vars
   58:43  warning  'onClose' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
   88:5   error    Error: Cannot access variable before it is declared

`loadAssistants` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx:88:5
  86 |
  87 |   useEffect(() => {
> 88 |     loadAssistants();
     |     ^^^^^^^^^^^^^^ `loadAssistants` accessed before it is declared
  89 |     loadShiftConfigs();
  90 |   }, []);
  91 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx:98:3
   96 |   }, [selectedAssistants, currentWeekStart]);
   97 |
>  98 |   const loadAssistants = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
>  99 |     try {
      | ^^^^^^^^^
> 100 |       const res = await fetchAssistants();
      …
      | ^^^^^^^^^
> 107 |     }
      | ^^^^^^^^^
> 108 |   };
      | ^^^^^ `loadAssistants` is declared here
  109 |
  110 |   const loadShiftConfigs = async () => {
  111 |     try {                                                                                                                                                                                                                                                                                                                                                                                             react-hooks/immutability
   89:5   error    Error: Cannot access variable before it is declared

`loadShiftConfigs` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx:89:5
  87 |   useEffect(() => {
  88 |     loadAssistants();
> 89 |     loadShiftConfigs();
     |     ^^^^^^^^^^^^^^^^ `loadShiftConfigs` accessed before it is declared
  90 |   }, []);
  91 |
  92 |   useEffect(() => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx:110:3
  108 |   };
  109 |
> 110 |   const loadShiftConfigs = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 111 |     try {
      | ^^^^^^^^^
> 112 |       const res = await fetchShiftConfigs();
      | ^^^^^^^^^
> 113 |       const validConfigs = (res || []).filter((config) => config && config.code && config.code.trim());
      | ^^^^^^^^^
> 114 |       setShiftConfigs(validConfigs);
      | ^^^^^^^^^
> 115 |     } catch (error) {
      | ^^^^^^^^^
> 116 |       console.error("加载班次配置失败:", error);
      | ^^^^^^^^^
> 117 |       setShiftConfigs([]);
      | ^^^^^^^^^
> 118 |     }
      | ^^^^^^^^^
> 119 |   };
      | ^^^^^ `loadShiftConfigs` is declared here
  120 |
  121 |   const loadSchedules = async () => {
  122 |     const primaryId = selectedAssistants[0];  react-hooks/immutability
   90:6   warning  React Hook useEffect has a missing dependency: 'loadAssistants'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    react-hooks/exhaustive-deps
   94:7   error    Error: Cannot access variable before it is declared

`loadSchedules` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx:94:7
  92 |   useEffect(() => {
  93 |     if (selectedAssistants.length > 0) {
> 94 |       loadSchedules();
     |       ^^^^^^^^^^^^^ `loadSchedules` accessed before it is declared
  95 |     }
  96 |   }, [selectedAssistants, currentWeekStart]);
  97 |

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ScheduleManager.tsx:121:3
  119 |   };
  120 |
> 121 |   const loadSchedules = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 122 |     const primaryId = selectedAssistants[0];
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 123 |     if (!primaryId) return;
      …
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 135 |     }
      | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 136 |   };
      | ^^^^^ `loadSchedules` is declared here
  137 |
  138 |   const handlePrevWeek = () => {
  139 |     const start = new Date(currentWeekStart);                                                                                                                                                                                                                    react-hooks/immutability
   96:6   warning  React Hook useEffect has a missing dependency: 'loadSchedules'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     react-hooks/exhaustive-deps
  189:28  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  224:21  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  269:27  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any
  380:21  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ServiceManager.tsx
  47:5  error  Error: Cannot access variable before it is declared

`loadServices` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ServiceManager.tsx:47:5
  45 |
  46 |   useEffect(() => {
> 47 |     loadServices();
     |     ^^^^^^^^^^^^ `loadServices` accessed before it is declared
  48 |   }, []);
  49 |
  50 |   const loadServices = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ServiceManager.tsx:50:3
  48 |   }, []);
  49 |
> 50 |   const loadServices = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 51 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 52 |     setError(null);
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 62 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 63 |   };
     | ^^^^^ `loadServices` is declared here
  64 |
  65 |   const handleOpenDialog = (service?: AssistantService) => {
  66 |     if (service) {  react-hooks/immutability

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ShiftConfigPanel.tsx
  48:5  error  Error: Cannot access variable before it is declared

`loadShiftConfigs` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ShiftConfigPanel.tsx:48:5
  46 |
  47 |   useEffect(() => {
> 48 |     loadShiftConfigs();
     |     ^^^^^^^^^^^^^^^^ `loadShiftConfigs` accessed before it is declared
  49 |   }, []);
  50 |
  51 |   const loadShiftConfigs = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\assistant\ShiftConfigPanel.tsx:51:3
  49 |   }, []);
  50 |
> 51 |   const loadShiftConfigs = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 52 |     try {
     | ^^^^^^^^^
> 53 |       const res = await fetchShiftConfigs();
     | ^^^^^^^^^
> 54 |       const validConfigs = (res || []).filter((config) => config && config.code && config.code.trim());
     | ^^^^^^^^^
> 55 |       setShiftConfigs(validConfigs);
     | ^^^^^^^^^
> 56 |     } catch (error) {
     | ^^^^^^^^^
> 57 |       console.error("加载班次配置失败:", error);
     | ^^^^^^^^^
> 58 |       setShiftConfigs([]);
     | ^^^^^^^^^
> 59 |     }
     | ^^^^^^^^^
> 60 |   };
     | ^^^^^ `loadShiftConfigs` is declared here
  61 |
  62 |   const handleOpenConfigDialog = (config?: ShiftConfig) => {
  63 |     if (config) {  react-hooks/immutability

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\app-shell.tsx
  13:3   warning  'Receipt' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
  18:3   warning  'Package' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
  23:3   warning  'ChevronLeft' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   @typescript-eslint/no-unused-vars
  24:3   warning  'ChevronRight' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
  68:18  warning  'toggleSidebar' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
  70:11  warning  'sidebarCollapsed' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
  91:7   error    Error: Cannot access variable before it is declared

`loadUnreadCount` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\app-shell.tsx:91:7
  89 |   useEffect(() => {
  90 |     if (currentStore) {
> 91 |       loadUnreadCount();
     |       ^^^^^^^^^^^^^^^ `loadUnreadCount` accessed before it is declared
  92 |       const interval = setInterval(loadUnreadCount, 30000);
  93 |       return () => clearInterval(interval);
  94 |     }

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\app-shell.tsx:128:3
  126 |   }, [currentStore]);
  127 |
> 128 |   const loadUnreadCount = async () => {
      |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 129 |     try {
      | ^^^^^^^^^
> 130 |       const result = await fetchUnreadCount();
      | ^^^^^^^^^
> 131 |       setUnreadCount(result.count);
      | ^^^^^^^^^
> 132 |     } catch (error) {
      | ^^^^^^^^^
> 133 |       console.error('Failed to load unread count:', error);
      | ^^^^^^^^^
> 134 |     }
      | ^^^^^^^^^
> 135 |   };
      | ^^^^^ `loadUnreadCount` is declared here
  136 |
  137 |   const handleUnreadChange = (count: number) => {
  138 |     setUnreadCount(count);  react-hooks/immutability

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\header.tsx
   5:10  warning  'Search' is defined but never used                     @typescript-eslint/no-unused-vars
   5:18  warning  'ChevronDown' is defined but never used                @typescript-eslint/no-unused-vars
   5:31  warning  'LogOut' is defined but never used                     @typescript-eslint/no-unused-vars
   5:39  warning  'User' is defined but never used                       @typescript-eslint/no-unused-vars
   5:45  warning  'Settings' is defined but never used                   @typescript-eslint/no-unused-vars
   6:10  warning  'Button' is defined but never used                     @typescript-eslint/no-unused-vars
   8:3   warning  'DropdownMenu' is defined but never used               @typescript-eslint/no-unused-vars
   9:3   warning  'DropdownMenuContent' is defined but never used        @typescript-eslint/no-unused-vars
  10:3   warning  'DropdownMenuItem' is defined but never used           @typescript-eslint/no-unused-vars
  11:3   warning  'DropdownMenuLabel' is defined but never used          @typescript-eslint/no-unused-vars
  12:3   warning  'DropdownMenuSeparator' is defined but never used      @typescript-eslint/no-unused-vars
  13:3   warning  'DropdownMenuTrigger' is defined but never used        @typescript-eslint/no-unused-vars
  15:10  warning  'Input' is defined but never used                      @typescript-eslint/no-unused-vars
  16:10  warning  'Badge' is defined but never used                      @typescript-eslint/no-unused-vars
  17:10  warning  'cn' is defined but never used                         @typescript-eslint/no-unused-vars
  21:11  warning  'currentStore' is assigned a value but never used      @typescript-eslint/no-unused-vars
  21:25  warning  'stores' is assigned a value but never used            @typescript-eslint/no-unused-vars
  21:33  warning  'user' is assigned a value but never used              @typescript-eslint/no-unused-vars
  22:10  warning  'searchFocused' is assigned a value but never used     @typescript-eslint/no-unused-vars
  22:25  warning  'setSearchFocused' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\help-dialog.tsx
  33:21  error  Error: Cannot access variable before it is declared

`loadData` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\help-dialog.tsx:33:21
  31 |   const router = useRouter();
  32 |
> 33 |   useEffect(() => { loadData(); }, []);
     |                     ^^^^^^^^ `loadData` accessed before it is declared
  34 |
  35 |   const loadData = async () => {
  36 |     try {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\help-dialog.tsx:35:3
  33 |   useEffect(() => { loadData(); }, []);
  34 |
> 35 |   const loadData = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 36 |     try {
     | ^^^^^^^^^
> 37 |       const res: any = await get('/support.Support/articles');
     …
     | ^^^^^^^^^
> 46 |     finally { setLoading(false); }
     | ^^^^^^^^^
> 47 |   };
     | ^^^^^ `loadData` is declared here
  48 |
  49 |   const filteredHelps = helps.filter(h => {
  50 |     const matchCat = !selectedCategory || h.category === selectedCategory;  react-hooks/immutability
  37:18  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-explicit-any
  66:18  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-explicit-any
  81:17  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\notification-panel.tsx
   5:10  warning  'Button' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
  27:5   error    Error: Cannot access variable before it is declared

`loadNotifications` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\notification-panel.tsx:27:5
  25 |
  26 |   useEffect(() => {
> 27 |     loadNotifications();
     |     ^^^^^^^^^^^^^^^^^ `loadNotifications` accessed before it is declared
  28 |   }, []);
  29 |
  30 |   const loadNotifications = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\notification-panel.tsx:30:3
  28 |   }, []);
  29 |
> 30 |   const loadNotifications = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 31 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 32 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 42 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 43 |   };
     | ^^^^^ `loadNotifications` is declared here
  44 |
  45 |   const handleMarkRead = async (id: string) => {
  46 |     try {  react-hooks/immutability
  28:6   warning  React Hook useEffect has a missing dependency: 'loadNotifications'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\layout\page-header.tsx
  4:10  warning  'Button' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\ui\command.tsx
  37:3  warning  'showCloseButton' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\components\ui\image-upload.tsx
   4:10  warning  'Button' is defined but never used                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
   5:30  warning  'ImageIcon' is defined but never used                                                                                                                                                                                                                                                    @typescript-eslint/no-unused-vars
  95:11  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\hooks\use-app.tsx
    3:10  warning  'useState' is defined but never used      @typescript-eslint/no-unused-vars
  111:70  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\hooks\use-toast.ts
  18:5  error  'listeners' is never reassigned. Use 'const' instead  prefer-const

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\api\header.ts
  85:24  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\api\members.ts
  79:11  warning  'ConsumeResult' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\api\products.ts
   41:45  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  186:53  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  244:30  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\api\reports.ts
   6:15  warning  'post' is defined but never used          @typescript-eslint/no-unused-vars
  71:83  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\api\settings.ts
  3:10  warning  'API_ENDPOINTS' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\api\time-period.ts
  5:21  warning  'put' is defined but never used  @typescript-eslint/no-unused-vars
  5:26  warning  'del' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\auth-context.tsx
   47:5   error    Error: Cannot access variable before it is declared

`initAuth` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\auth-context.tsx:47:5
  45 |
  46 |   useEffect(() => {
> 47 |     initAuth();
     |     ^^^^^^^^ `initAuth` accessed before it is declared
  48 |   }, []);
  49 |
  50 |   const loadPermissions = async (storeId: string) => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\auth-context.tsx:64:3
  62 |   };
  63 |
> 64 |   const initAuth = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 65 |     try {
     | ^^^^^^^^^
> 66 |       const storedUser = localStorage.getItem(STORAGE_KEY);
     …
     | ^^^^^^^^^
> 87 |     setLoading(false);
     | ^^^^^^^^^
> 88 |   };
     | ^^^^^ `initAuth` is declared here
  89 |
  90 |   const validateTokenWithRetry = async (token: string, retryCount: number = 0): Promise<boolean> => {
  91 |     try {  react-hooks/immutability
   48:6   warning  React Hook useEffect has a missing dependency: 'initAuth'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  react-hooks/exhaustive-deps
  124:14  warning  'error' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\data.ts
  10:7  warning  'generateId' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\hooks\use-api-data.ts
   44:6   error    Error: Expected the dependency list for useCallback to be an array literal

Expected the dependency list for useCallback to be an array literal.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\src\lib\hooks\use-api-data.ts:44:6
  42 |     }
  43 |   // eslint-disable-next-line react-hooks/exhaustive-deps
> 44 |   }, deps);
     |      ^^^^ Expected the dependency list for useCallback to be an array literal
  45 |
  46 |   useEffect(() => {
  47 |     fetchData();  react-hooks/use-memo
  122:10  warning  'error' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-unused-vars

✖ 403 problems (205 errors, 198 warnings)
  2 errors and 0 warnings potentially fixable with the `--fix` option.

 ELIFECYCLE  Command failed with exit code 1.
```
<!-- LOG_END:21-wwwstore-lint.log -->

### 3. wwwstore：`pnpm build:win`（退出码 1）

来源日志：`22-wwwstore-build-win.log`。

<!-- LOG_BEGIN:22-wwwstore-build-win.log -->
```text

> projects@0.1.0 build:win D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore
> next build && tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --no-minify

⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

▲ Next.js 16.1.1 (Turbopack)

pnpm : ⚠ The "middleware" file convention is deprecated. Please use "proxy" instead. Learn more: https://nextjs.org/doc
s/messages/middleware-to-proxy
所在位置 行:15 字符: 1730
+ ...  $env:PAGER = 'more'; $env:TERM = 'dumb'; pnpm build:win 2>&1 | Tee-O ...
+                                               ~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: (⚠ The "middlewa...leware-to-proxy:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
  Creating an optimized production build ...
  Using external babel configuration from D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwstore\.babelrc

> Build error occurred
Error: Turbopack build failed with 17 errors:
./src/components/ui/checkbox.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-checkbox'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mCheckboxPrimitive[39m [36mfrom[39m
 [32m'@radix-ui/react-checkbox'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mCheck[39m } [36mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m
 [90m 7 |[39m [36mconst[39m [33mCheckbox[39m [33m=[39m [33mReact[39m[33m.[39mforwardRef[33m<[39m[33mReac
t[39m[33m.[39m[33mComponentRef[39m[33m<[39m[36mtypeof[39m [33mCheckboxPrimitive[39m[33m.[39m[33mRoot[39m
[33m>[39m[33m,[39m [33mReact[39m[33m.[39m[33mComponentPropsWithoutRef[39m[33m<[39m[36mtypeof[39m [33mChe
ckboxPrimitive[39m[33m.[39m[33mRoot[39m[33m>>[39m(({[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/checkbox.tsx [Client Component Browser]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/checkbox.tsx [Client Component SSR]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/checkbox.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-checkbox'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mCheckboxPrimitive[39m [36mfrom[39m
 [32m'@radix-ui/react-checkbox'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mCheck[39m } [36mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m
 [90m 7 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/checkbox.tsx [Client Component Browser]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/checkbox.tsx [Client Component SSR]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/dialog.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-dialog'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mDialogPrimitive[39m [36mfrom[39m 
[32m'@radix-ui/react-dialog'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mX[39m } [36mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m
 [90m 7 |[39m [36mconst[39m [33mDialog[39m [33m=[39m [33mDialogPrimitive[39m[33m.[39m[33mRoot[39m[33m;[
39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/dialog.tsx [Client Component Browser]
    ./src/app/orders/page.tsx [Client Component Browser]
    ./src/app/orders/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/dialog.tsx [Client Component SSR]
    ./src/app/orders/page.tsx [Client Component SSR]
    ./src/app/orders/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/dialog.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-dialog'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mDialogPrimitive[39m [36mfrom[39m 
[32m'@radix-ui/react-dialog'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mX[39m } [36mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m
 [90m 7 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/dialog.tsx [Client Component Browser]
    ./src/app/orders/page.tsx [Client Component Browser]
    ./src/app/orders/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/dialog.tsx [Client Component SSR]
    ./src/app/orders/page.tsx [Client Component SSR]
    ./src/app/orders/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/dropdown-menu.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-dropdown-menu'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mDropdownMenuPrimitive[39m [36mfrom
[39m [32m'@radix-ui/react-dropdown-menu'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[2
2m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[
22m[39m
 [90m 5 |[39m [36mimport[39m { [33mCheck[39m[33m,[39m [33mChevronRight[39m[33m,[39m [33mCircle[39m } [36
mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m
 [90m 7 |[39m [36mconst[39m [33mDropdownMenu[39m [33m=[39m [33mDropdownMenuPrimitive[39m[33m.[39m[33mRoot
[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/dropdown-menu.tsx [Client Component Browser]
    ./src/app/tables/components/tables-management-tab.tsx [Client Component Browser]
    ./src/app/tables/page.tsx [Client Component Browser]
    ./src/app/tables/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/dropdown-menu.tsx [Client Component SSR]
    ./src/app/tables/components/tables-management-tab.tsx [Client Component SSR]
    ./src/app/tables/page.tsx [Client Component SSR]
    ./src/app/tables/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/dropdown-menu.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-dropdown-menu'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mDropdownMenuPrimitive[39m [36mfrom
[39m [32m'@radix-ui/react-dropdown-menu'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[2
2m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mCheck[39m[33m,[39m [33mChevronRight[39m[33m,[39m [33mCircle[39m } [36
mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m
 [90m 7 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/dropdown-menu.tsx [Client Component Browser]
    ./src/app/tables/components/tables-management-tab.tsx [Client Component Browser]
    ./src/app/tables/page.tsx [Client Component Browser]
    ./src/app/tables/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/dropdown-menu.tsx [Client Component SSR]
    ./src/app/tables/components/tables-management-tab.tsx [Client Component SSR]
    ./src/app/tables/page.tsx [Client Component SSR]
    ./src/app/tables/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/popover.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-popover'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m"react"[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mPopoverPrimitive[39m [36mfrom[39m 
[32m"@radix-ui/react-popover"[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { cn } [36mfrom[39m [32m"@/lib/utils"[39m[33m;[39m
 [90m 6 |[39m [36mfunction[39m [33mPopover[39m({
 [90m 7 |[39m   [33m...[39mprops[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/popover.tsx [Client Component Browser]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/popover.tsx [Client Component SSR]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/popover.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-popover'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m"react"[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mPopoverPrimitive[39m [36mfrom[39m 
[32m"@radix-ui/react-popover"[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m
 [90m 5 |[39m
 [90m 6 |[39m [36mimport[39m { cn } [36mfrom[39m [32m"@/lib/utils"[39m
 [90m 7 |[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/popover.tsx [Client Component Browser]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/popover.tsx [Client Component SSR]
    ./src/components/assistant/CommissionConfigPanel.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_3izs
skszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs:8:1
Module not found: Can't resolve '@radix-ui/react-presence'
[0m [90m  6 |[39m [36mimport[39m { createContextScope } [36mfrom[39m [32m"@radix-ui/react-context"[39m[33m;[
39m
 [90m  7 |[39m [36mimport[39m { createRovingFocusGroupScope } [36mfrom[39m [32m"@radix-ui/react-roving-focus"[3
9m[33m;[39m
[31m[1m>[22m[39m[90m  8 |[39m [36mimport[39m { [33mPresence[39m } [36mfrom[39m [32m"@radix-ui/react-presen
ce"[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m  9 |[39m [36mimport[39m { [33mPrimitive[39m } [36mfrom[39m [32m"@radix-ui/react-primitive"[39m[33m;[3
9m
 [90m 10 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mRovingFocusGroup[39m [36mfrom[39m [32m"@radix-ui/re
act-roving-focus"[39m[33m;[39m
 [90m 11 |[39m [36mimport[39m { useDirection } [36mfrom[39m [32m"@radix-ui/react-direction"[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component Browser]
    ./src/components/ui/tabs.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component SSR]
    ./src/components/ui/tabs.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/@radix-ui+react-label@2.1.11_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2._3zra
7xzfedboz5y3nch2arqgsi/node_modules/@radix-ui/react-label/dist/index.mjs:5:1
Module not found: Can't resolve '@radix-ui/react-primitive'
[0m [90m 3 |[39m [90m// src/label.tsx[39m
 [90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m"react"[39m[33m;[39m
[31m[1m>[22m[39m[90m 5 |[39m [36mimport[39m { [33mPrimitive[39m } [36mfrom[39m [32m"@radix-ui/react-primit
ive"[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m
 [90m 6 |[39m [36mimport[39m { jsx } [36mfrom[39m [32m"react/jsx-runtime"[39m[33m;[39m
 [90m 7 |[39m [36mvar[39m [33mNAME[39m [33m=[39m [32m"Label"[39m[33m;[39m
 [90m 8 |[39m [36mvar[39m [33mLabel[39m [33m=[39m [33mReact[39m[33m.[39mforwardRef((props[33m,[39m forwar
dedRef) [33m=>[39m {[0m



Import traces:
  Client Component Browser:
    ./node_modules/.pnpm/@radix-ui+react-label@2.1.11_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2._
3zra7xzfedboz5y3nch2arqgsi/node_modules/@radix-ui/react-label/dist/index.mjs [Client Component Browser]
    ./src/components/ui/label.tsx [Client Component Browser]
    ./src/app/tables/components/tables-pricing-rules-tab.tsx [Client Component Browser]
    ./src/app/tables/page.tsx [Client Component Browser]
    ./src/app/tables/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/@radix-ui+react-label@2.1.11_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2._
3zra7xzfedboz5y3nch2arqgsi/node_modules/@radix-ui/react-label/dist/index.mjs [Client Component SSR]
    ./src/components/ui/label.tsx [Client Component SSR]
    ./src/app/tables/components/tables-pricing-rules-tab.tsx [Client Component SSR]
    ./src/app/tables/page.tsx [Client Component SSR]
    ./src/app/tables/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_3izs
skszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs:9:1
Module not found: Can't resolve '@radix-ui/react-primitive'
[0m [90m  7 |[39m [36mimport[39m { createRovingFocusGroupScope } [36mfrom[39m [32m"@radix-ui/react-roving-focus
"[39m[33m;[39m
 [90m  8 |[39m [36mimport[39m { [33mPresence[39m } [36mfrom[39m [32m"@radix-ui/react-presence"[39m[33m;[39m
[31m[1m>[22m[39m[90m  9 |[39m [36mimport[39m { [33mPrimitive[39m } [36mfrom[39m [32m"@radix-ui/react-primi
tive"[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m
 [90m 10 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mRovingFocusGroup[39m [36mfrom[39m [32m"@radix-ui/re
act-roving-focus"[39m[33m;[39m
 [90m 11 |[39m [36mimport[39m { useDirection } [36mfrom[39m [32m"@radix-ui/react-direction"[39m[33m;[39m
 [90m 12 |[39m [36mimport[39m { useControllableState } [36mfrom[39m [32m"@radix-ui/react-use-controllable-state"
[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component Browser]
    ./src/components/ui/tabs.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component SSR]
    ./src/components/ui/tabs.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_3izs
skszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs:7:1
Module not found: Can't resolve '@radix-ui/react-roving-focus'
[0m [90m  5 |[39m [36mimport[39m { composeEventHandlers } [36mfrom[39m [32m"@radix-ui/primitive"[39m[33m;[39
m
 [90m  6 |[39m [36mimport[39m { createContextScope } [36mfrom[39m [32m"@radix-ui/react-context"[39m[33m;[39m
[31m[1m>[22m[39m[90m  7 |[39m [36mimport[39m { createRovingFocusGroupScope } [36mfrom[39m [32m"@radix-ui/rea
ct-roving-focus"[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[2
2m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[
22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^
[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m  8 |[39m [36mimport[39m { [33mPresence[39m } [36mfrom[39m [32m"@radix-ui/react-presence"[39m[33m;[39m
 [90m  9 |[39m [36mimport[39m { [33mPrimitive[39m } [36mfrom[39m [32m"@radix-ui/react-primitive"[39m[33m;[3
9m
 [90m 10 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mRovingFocusGroup[39m [36mfrom[39m [32m"@radix-ui/re
act-roving-focus"[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component Browser]
    ./src/components/ui/tabs.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component SSR]
    ./src/components/ui/tabs.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_3izs
skszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs:10:1
Module not found: Can't resolve '@radix-ui/react-roving-focus'
[0m [90m  8 |[39m [36mimport[39m { [33mPresence[39m } [36mfrom[39m [32m"@radix-ui/react-presence"[39m[33m;
[39m
 [90m  9 |[39m [36mimport[39m { [33mPrimitive[39m } [36mfrom[39m [32m"@radix-ui/react-primitive"[39m[33m;[3
9m
[31m[1m>[22m[39m[90m 10 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mRovingFocusGroup[39m [36mfrom[39m
 [32m"@radix-ui/react-roving-focus"[39m[33m;[39m
 [90m    |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22
m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[2
2m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[
22m[39m
 [90m 11 |[39m [36mimport[39m { useDirection } [36mfrom[39m [32m"@radix-ui/react-direction"[39m[33m;[39m
 [90m 12 |[39m [36mimport[39m { useControllableState } [36mfrom[39m [32m"@radix-ui/react-use-controllable-state"
[39m[33m;[39m
 [90m 13 |[39m [36mimport[39m { useId } [36mfrom[39m [32m"@radix-ui/react-id"[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component Browser]
    ./src/components/ui/tabs.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Client Component Browser]
    ./src/app/reports/page.tsx [Server Component]

  Client Component SSR:
    ./node_modules/.pnpm/@radix-ui+react-tabs@1.1.17_@types+react-dom@19.2.3_@types+react@19.2.17__@types+react@19.2.1_
3izsskszefog5bdkf65rlqlji4/node_modules/@radix-ui/react-tabs/dist/index.mjs [Client Component SSR]
    ./src/components/ui/tabs.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Client Component SSR]
    ./src/app/reports/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/select.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-select'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mSelectPrimitive[39m [36mfrom[39m 
[32m'@radix-ui/react-select'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mCheck[39m[33m,[39m [33mChevronDown[39m[33m,[39m [33mChevronUp[39m } [
36mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m
 [90m 7 |[39m [36mconst[39m [33mSelect[39m [33m=[39m [33mSelectPrimitive[39m[33m.[39m[33mRoot[39m[33m;[
39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/select.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/select.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/select.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-select'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m'react'[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mSelectPrimitive[39m [36mfrom[39m 
[32m'@radix-ui/react-select'[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { [33mCheck[39m[33m,[39m [33mChevronDown[39m[33m,[39m [33mChevronUp[39m } [
36mfrom[39m [32m'lucide-react'[39m[33m;[39m
 [90m 6 |[39m
 [90m 7 |[39m [36mimport[39m { cn } [36mfrom[39m [32m'@/lib/utils'[39m[33m;[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/select.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Client Component Browser]
    ./src/app/assistants/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/select.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Client Component SSR]
    ./src/app/assistants/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/switch.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-switch'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m"react"[39m[33m;[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mSwitchPrimitive[39m [36mfrom[39m 
[32m"@radix-ui/react-switch"[39m[33m;[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m [36mimport[39m { cn } [36mfrom[39m [32m"@/lib/utils"[39m[33m;[39m
 [90m 6 |[39m [36mfunction[39m [33mSwitch[39m({
 [90m 7 |[39m   className[33m,[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/switch.tsx [Client Component Browser]
    ./src/app/account/page.tsx [Client Component Browser]
    ./src/app/account/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/switch.tsx [Client Component SSR]
    ./src/app/account/page.tsx [Client Component SSR]
    ./src/app/account/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


./src/components/ui/switch.tsx:4:1
Module not found: Can't resolve '@radix-ui/react-switch'
[0m [90m 2 |[39m
 [90m 3 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mReact[39m [36mfrom[39m [32m"react"[39m
[31m[1m>[22m[39m[90m 4 |[39m [36mimport[39m [33m*[39m [36mas[39m [33mSwitchPrimitive[39m [36mfrom[39m 
[32m"@radix-ui/react-switch"[39m
 [90m   |[39m [31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[3
1m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[
31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39
m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[3
9m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[
39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m
[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m[31m[1m^[22m[39m
 [90m 5 |[39m
 [90m 6 |[39m [36mimport[39m { cn } [36mfrom[39m [32m"@/lib/utils"[39m
 [90m 7 |[39m[0m



Import traces:
  Client Component Browser:
    ./src/components/ui/switch.tsx [Client Component Browser]
    ./src/app/account/page.tsx [Client Component Browser]
    ./src/app/account/page.tsx [Server Component]

  Client Component SSR:
    ./src/components/ui/switch.tsx [Client Component SSR]
    ./src/app/account/page.tsx [Client Component SSR]
    ./src/app/account/page.tsx [Server Component]

https://nextjs.org/docs/messages/module-not-found


    at <unknown> (./src/components/ui/checkbox.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/checkbox.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/dialog.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/dialog.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/dropdown-menu.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/dropdown-menu.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/popover.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/popover.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/select.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/select.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/switch.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
    at <unknown> (./src/components/ui/switch.tsx:4:1)
    at <unknown> (https://nextjs.org/docs/messages/module-not-found)
 ELIFECYCLE  Command failed with exit code 1.
```
<!-- LOG_END:22-wwwstore-build-win.log -->

### 4. wwwpos：`pnpm ts-check`

#### 4.1 首轮：依赖核验失败（退出码 1，未执行 tsc）

来源日志：`23-wwwpos-ts-check.log`。该轮支撑搭建过程记录，不作为最终 TypeScript 错误数依据。

<!-- LOG_BEGIN:23-wwwpos-ts-check.log -->
```text
pnpm : [WARN] The "pnpm" field in package.json is no longer read by pnpm. The following keys were ignored: "pnpm.onlyBu
iltDependencies". See https://pnpm.io/settings for the new home of each setting.
所在位置 行:15 字符: 1730
+ ... ; $env:PAGER = 'more'; $env:TERM = 'dumb'; pnpm ts-check 2>&1 | Tee-O ...
+                                                ~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ([WARN] The "pnp...f each setting.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
✓ Lockfile passes supply-chain policies (verified 48m ago)
Lockfile is up to date, resolution step is skipped
Already up to date
.../esbuild@0.27.7/node_modules/esbuild postinstall$ node install.js
.../esbuild@0.28.0/node_modules/esbuild postinstall$ node install.js
.../sharp@0.34.5/node_modules/sharp install$ node install/check.js || npm run build
.../sharp@0.34.5/node_modules/sharp install: Done
.../esbuild@0.27.7/node_modules/esbuild postinstall: Done
.../esbuild@0.28.0/node_modules/esbuild postinstall: Done
Error: ERR_PNPM_IGNORED_BUILDS

  × installing dependencies
  ╰─▶ Ignored build scripts: unrs-resolver@1.12.2
  help: Run "pnpm approve-builds" to pick which dependencies should be allowed
        to run scripts.

```
<!-- LOG_END:23-wwwpos-ts-check.log -->

#### 4.2 最终重试：实际执行 tsc（退出码 2）

来源日志：`24-wwwpos-ts-check-retry.log`。该轮临时允许必要依赖构建后进入 `tsc -p tsconfig.json`，是结果表中 20 个 TypeScript 错误的完整依据。

<!-- LOG_BEGIN:24-wwwpos-ts-check-retry.log -->
```text
pnpm : [WARN] The "pnpm" field in package.json is no longer read by pnpm. The following keys were ignored: "pnpm.onlyBu
iltDependencies". See https://pnpm.io/settings for the new home of each setting.
所在位置 行:15 字符: 1730
+ ... ; $env:PAGER = 'more'; $env:TERM = 'dumb'; pnpm ts-check 2>&1 | Tee-O ...
+                                                ~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ([WARN] The "pnp...f each setting.:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
✓ Lockfile passes supply-chain policies (verified 49m ago)
Lockfile is up to date, resolution step is skipped
Already up to date
.../node_modules/unrs-resolver postinstall$ node postinstall.js
.../esbuild@0.27.7/node_modules/esbuild postinstall$ node install.js
.../sharp@0.34.5/node_modules/sharp install$ node install/check.js || npm run build
.../esbuild@0.28.0/node_modules/esbuild postinstall$ node install.js
.../sharp@0.34.5/node_modules/sharp install: Done
.../esbuild@0.27.7/node_modules/esbuild postinstall: Done
.../node_modules/unrs-resolver postinstall: Done
.../esbuild@0.28.0/node_modules/esbuild postinstall: Done
Done in 430ms using pnpm v12.8.1
$ tsc -p tsconfig.json
__tests__/offline-billing.test.ts(8,3): error TS2459: Module '"@/utils/offline-billing"' declares 'applyDiscount' locally, but it is not exported.
__tests__/offline-billing.test.ts(41,30): error TS2345: Argument of type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(46,30): error TS2345: Argument of type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(52,30): error TS2345: Argument of type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(57,30): error TS2345: Argument of type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(63,30): error TS2345: Argument of type '{ prepaidHours: number; tableId: string; startTime: string; baseRate: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ prepaidHours: number; tableId: string; startTime: string; baseRate: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(70,30): error TS2345: Argument of type '{ prepaidHours: number; tableId: string; startTime: string; baseRate: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ prepaidHours: number; tableId: string; startTime: string; baseRate: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(77,33): error TS2345: Argument of type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(83,33): error TS2345: Argument of type '{ memberLevel: string; tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is not assignable to parameter of type 'BillingCache'.
  Type '{ memberLevel: string; tableId: string; startTime: string; baseRate: number; prepaidHours: number; periods: PricingPeriod[]; }' is missing the following properties from type 'BillingCache': start_time, base_rate, prepaid_hours
__tests__/offline-billing.test.ts(91,7): error TS2561: Object literal may only specify known properties, but 'startTime' does not exist in type 'BillingCache'. Did you mean to write 'start_time'?
__tests__/offline-billing.test.ts(98,18): error TS2551: Property 'baseRate' does not exist on type 'BillingCache'. Did you mean 'base_rate'?
__tests__/offline-billing.test.ts(99,18): error TS2551: Property 'prepaidHours' does not exist on type 'BillingCache'. Did you mean 'prepaid_hours'?
src/components/AssistantOvertimeModal.tsx(43,16): error TS2322: Type '{}' is not assignable to type 'ReactNode'.
src/components/HistoryOrdersModal.tsx(144,24): error TS2339: Property 'chargingFee' does not exist on type 'OrderListItem'.
src/components/HistoryOrdersModal.tsx(144,45): error TS2339: Property 'charging_fee' does not exist on type 'OrderListItem'.
src/components/MemberModal.tsx(226,22): error TS2353: Object literal may only specify known properties, and 'lines' does not exist in type 'ReceiptData'.
src/components/MemberModal.tsx(326,84): error TS2322: Type '{ children: Element; onClose: () => void; title: string; icon: Element; width: string; }' is not assignable to type 'IntrinsicAttributes & ModalShellProps'.
  Property 'width' does not exist on type 'IntrinsicAttributes & ModalShellProps'.
src/components/TableDrawer.tsx(740,31): error TS2322: Type 'unknown' is not assignable to type 'ReactNode'.
src/context/AppContext.tsx(1328,5): error TS2322: Type '(tableId: string, playerCount: number) => Promise<Order | null>' is not assignable to type '(tableId: string, playerCount: number) => Promise<Order>'.
  Type 'Promise<Order | null>' is not assignable to type 'Promise<Order>'.
    Type 'Order | null' is not assignable to type 'Order'.
      Type 'null' is not assignable to type 'Order'.
src/hooks/useNotification.ts(7,7): error TS2739: Type '{ service_call: string; table_open: string; new_order: string; assistant_apply: string; table_timeout: string; checkout_remind: string; low_stock: string; system_notice: string; table_open_confirm_request: string; table_open_confirmed: string; table_open_rejected: string; }' is missing the following properties from type 'Record<NotificationType, string>': payment_success, checkout_completed, table_status_change
[ELIFECYCLE] Command failed with exit code 2.
```
<!-- LOG_END:24-wwwpos-ts-check-retry.log -->

### 5. wwwpos：`pnpm lint`（退出码 1）

来源日志：`25-wwwpos-lint.log`。

<!-- LOG_BEGIN:25-wwwpos-lint.log -->
```text
pnpm : $ eslint
所在位置 行:15 字符: 1730
+ ...  '0'; $env:PAGER = 'more'; $env:TERM = 'dumb'; pnpm lint 2>&1 | Tee-O ...
+                                                    ~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ($ eslint:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\api\members\route.ts
   73:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars
  160:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\api\orders\route.ts
  64:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\api\payments\route.ts
   80:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars
  122:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\api\shifts\route.ts
  99:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\api\sync\route.ts
  58:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\api\tables\route.ts
   2:15  warning  'Table' is defined but never used  @typescript-eslint/no-unused-vars
  95:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\app\page.tsx
   21:8  warning  'PromotionBanner' is defined but never used                                                                                               @typescript-eslint/no-unused-vars
   41:6  warning  React Hook useEffect has missing dependencies: 'startShift' and 'state.currentShift'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
  111:9  warning  'handleTableSelect' is assigned a value but never used                                                                                    @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\AssistantModal.tsx
    3:20  warning  'useEffect' is defined but never used                                                                                                                                                                                                                                                    @typescript-eslint/no-unused-vars
   12:3   warning  'Clock' is defined but never used                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
   98:11  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
  177:21  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\CheckoutModal.tsx
   3:31  warning  'useCallback' is defined but never used  @typescript-eslint/no-unused-vars
   6:45  warning  'Order' is defined but never used        @typescript-eslint/no-unused-vars
  11:3   warning  'User' is defined but never used         @typescript-eslint/no-unused-vars
  12:3   warning  'Ticket' is defined but never used       @typescript-eslint/no-unused-vars
  14:3   warning  'Minus' is defined but never used        @typescript-eslint/no-unused-vars
  15:3   warning  'Plus' is defined but never used         @typescript-eslint/no-unused-vars
  16:3   warning  'Sparkles' is defined but never used     @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\HistoryOrdersModal.tsx
   7:3  warning  'Filter' is defined but never used      @typescript-eslint/no-unused-vars
   8:3  warning  'Calendar' is defined but never used    @typescript-eslint/no-unused-vars
  11:3  warning  'Phone' is defined but never used       @typescript-eslint/no-unused-vars
  12:3  warning  'CreditCard' is defined but never used  @typescript-eslint/no-unused-vars
  15:3  warning  'Eye' is defined but never used         @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\MemberModal.tsx
   5:10  warning  'Button' is defined but never used      @typescript-eslint/no-unused-vars
  12:3   warning  'CreditCard' is defined but never used  @typescript-eslint/no-unused-vars
  13:3   warning  'Gift' is defined but never used        @typescript-eslint/no-unused-vars
  14:3   warning  'Star' is defined but never used        @typescript-eslint/no-unused-vars
  15:3   warning  'Check' is defined but never used       @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\OpenTableModal.tsx
    3:20  warning  'useEffect' is defined but never used                                                                                                                                                                                                                                                    @typescript-eslint/no-unused-vars
    6:22  warning  'PricingPackage' is defined but never used                                                                                                                                                                                                                                               @typescript-eslint/no-unused-vars
   12:3   warning  'Sparkles' is defined but never used                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
  276:25  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\PackageModal.tsx
  16:74  warning  'tableId' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\ProductOrderModal.tsx
    3:53  warning  'useContext' is defined but never used                                                                      @typescript-eslint/no-unused-vars
   14:3   warning  'AlertCircle' is defined but never used                                                                     @typescript-eslint/no-unused-vars
   41:21  warning  'assistants' is assigned a value but never used                                                             @typescript-eslint/no-unused-vars
  198:3   warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/preserve-manual-memoization')

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\PromotionBanner.tsx
  3:20  warning  'X' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\QuickOrderModal.tsx
    6:3   warning  'X' is defined but never used                      @typescript-eslint/no-unused-vars
   13:3   warning  'CreditCard' is defined but never used             @typescript-eslint/no-unused-vars
   16:24  warning  'OrderItem' is defined but never used              @typescript-eslint/no-unused-vars
   38:10  warning  'showCheckout' is assigned a value but never used  @typescript-eslint/no-unused-vars
  166:26  warning  'method' is defined but never used                 @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\QuickPanel.tsx
  29:7  warning  'THEME' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\ReservationModal.tsx
  55:9  warning  'sourceLabels' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\ShiftModal.tsx
   3:20  warning  'useEffect' is defined but never used                  @typescript-eslint/no-unused-vars
  26:41  warning  'assistants' is assigned a value but never used        @typescript-eslint/no-unused-vars
  32:10  warning  'remark' is assigned a value but never used            @typescript-eslint/no-unused-vars
  32:18  warning  'setRemark' is assigned a value but never used         @typescript-eslint/no-unused-vars
  67:9   warning  'handleStartShift' is assigned a value but never used  @typescript-eslint/no-unused-vars
  78:9   warning  'handleEndShift' is assigned a value but never used    @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\StatusBar.tsx
   8:3   warning  'AlertTriangle' is defined but never used             @typescript-eslint/no-unused-vars
  12:18  warning  'syncOfflineData' is assigned a value but never used  @typescript-eslint/no-unused-vars
  60:18  warning  'syncOfflineData' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\TableBoard.tsx
  48:10  warning  'formatDuration' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\TableDrawer.tsx
  46:10  warning  'formatDateTime' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\TechnicianModal.tsx
   4:26  warning  'Clock' is defined but never used                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
   4:33  warning  'DollarSign' is defined but never used                                                                                                                                                                                                                                                   @typescript-eslint/no-unused-vars
  98:29  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\components\TransferMergeModal.tsx
    6:31  warning  'Order' is defined but never used                                                                     @typescript-eslint/no-unused-vars
   12:3   warning  'Clock' is defined but never used                                                                     @typescript-eslint/no-unused-vars
   24:7   warning  'STATUS_CONFIG' is assigned a value but never used                                                    @typescript-eslint/no-unused-vars
   42:10  warning  'step' is assigned a value but never used                                                             @typescript-eslint/no-unused-vars
   42:16  warning  'setStep' is assigned a value but never used                                                          @typescript-eslint/no-unused-vars
   77:9   warning  'mergePreview' is assigned a value but never used                                                     @typescript-eslint/no-unused-vars
  114:6   warning  React Hook useMemo has a missing dependency: 'now'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  138:6   warning  React Hook useMemo has a missing dependency: 'now'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\services\api-service.ts
   10:3   warning  'Zone' is defined but never used              @typescript-eslint/no-unused-vars
   15:3   warning  'MemberLevel' is defined but never used       @typescript-eslint/no-unused-vars
   19:3   warning  'Technician' is defined but never used        @typescript-eslint/no-unused-vars
   20:3   warning  'Package' is defined but never used           @typescript-eslint/no-unused-vars
   24:3   warning  'BillingMode' is defined but never used       @typescript-eslint/no-unused-vars
   26:3   warning  'Session' is defined but never used           @typescript-eslint/no-unused-vars
   27:3   warning  'OfflineOperation' is defined but never used  @typescript-eslint/no-unused-vars
  323:16  warning  'tableId' is defined but never used           @typescript-eslint/no-unused-vars
  323:25  warning  '_allTables' is defined but never used        @typescript-eslint/no-unused-vars
  323:37  warning  '_allTimeSlots' is defined but never used     @typescript-eslint/no-unused-vars
  329:43  warning  '_allTables' is defined but never used        @typescript-eslint/no-unused-vars
  329:55  warning  '_allTimeSlots' is defined but never used     @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\services\local-service.ts
  11:3  warning  'Zone' is defined but never used                        @typescript-eslint/no-unused-vars
  18:3  warning  'OrderItem' is defined but never used                   @typescript-eslint/no-unused-vars
  66:5  error    'products' is never reassigned. Use 'const' instead     prefer-const
  67:5  error    'categories' is never reassigned. Use 'const' instead   prefer-const
  71:5  error    'technicians' is never reassigned. Use 'const' instead  prefer-const
  72:5  error    'packageList' is never reassigned. Use 'const' instead  prefer-const
  73:5  error    'promotions' is never reassigned. Use 'const' instead   prefer-const
  75:5  error    'timeSlots' is never reassigned. Use 'const' instead    prefer-const
  77:5  warning  'billingMode' is assigned a value but never used        @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.original_backup\src\services\types.ts
  18:3  warning  'OrderItem' is defined but never used          @typescript-eslint/no-unused-vars
  29:3  warning  'ConsumptionRecord' is defined but never used  @typescript-eslint/no-unused-vars
  30:3  warning  'CheckoutRecord' is defined but never used     @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\__tests__\billing.test.ts
  69:11  warning  'now' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\electron\main.ts
  87:34  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  99:49  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\api\members\route.ts
   76:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars
  163:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\api\orders\route.ts
  64:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\api\payments\route.ts
   80:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars
  122:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\api\shifts\route.ts
  101:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\api\sync\route.ts
  58:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\api\tables\route.ts
   2:15  warning  'Table' is defined but never used  @typescript-eslint/no-unused-vars
  95:12  warning  'error' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\page.tsx
   37:11  warning  'state' is assigned a value but never used              @typescript-eslint/no-unused-vars
   37:43  warning  'startShift' is assigned a value but never used         @typescript-eslint/no-unused-vars
   68:19  error    Unexpected any. Specify a different type                @typescript-eslint/no-explicit-any
  140:9   warning  'handleTableSelect' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\select-store\page.tsx
  17:5   error  Error: Cannot access variable before it is declared

`loadStores` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\select-store\page.tsx:17:5
  15 |
  16 |   useEffect(() => {
> 17 |     loadStores();
     |     ^^^^^^^^^^ `loadStores` accessed before it is declared
  18 |   }, []);
  19 |
  20 |   const loadStores = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\app\select-store\page.tsx:20:3
  18 |   }, []);
  19 |
> 20 |   const loadStores = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 21 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 22 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 29 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 30 |   };
     | ^^^^^ `loadStores` is declared here
  31 |
  32 |   const [switching, setSwitching] = useState(false);
  33 |  react-hooks/immutability
  38:17  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\AssistantModal.tsx
   31:10  warning  'billingMode' is assigned a value but never used                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
   89:19  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  105:19  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  161:40  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  163:17  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
  243:55  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  245:25  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\AssistantOvertimeModal.tsx
  14:9  warning  'orderId' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\AssistantReminderModal.tsx
   5:52  warning  'Clock' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-unused-vars
  19:45  error    Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\AssistantReminderModal.tsx:19:45
  17 |   const [acceptingId, setAcceptingId] = useState<string | null>(null);
  18 |   const [confirmBooking, setConfirmBooking] = useState<BookingItem | null>(null);
> 19 |   const [now, setNow] = useState(Math.floor(Date.now() / 1000));
     |                                             ^^^^^^^^^^ Cannot call impure function
  20 |
  21 |   const loadData = useCallback(async () => {
  22 |     setLoading(true);  react-hooks/purity

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\BuyoutPaymentModal.tsx
   35:35  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   35:66  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
   95:85  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  104:17  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CheckoutModal.tsx
    8:51   warning  'ChevronRight' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars
   15:18   warning  'findMember' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
   16:31   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   18:9    warning  'storeId' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
   18:29   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   23:10   warning  'change' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         @typescript-eslint/no-unused-vars
   34:52   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   43:33   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   43:39   error    Error: Cannot access variable before it is declared

`setBillLockedAt` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CheckoutModal.tsx:43:39
  41 |     let m = true; setBillLoading(true);
  42 |     orderApi.getCurrentOrder(table.id).then(r => {
> 43 |       if (m) { setBillData(r as any); setBillLockedAt((r as any)?.billLockedAt || (r as any)?.bill_locked_at || ''); setCountdown(60); }
     |                                       ^^^^^^^^^^^^^^^ `setBillLockedAt` accessed before it is declared
  44 |     }).catch(() => {}).finally(() => { if (m) setBillLoading(false); });
  45 |     return () => { m = false; };
  46 |   }, [table]);

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CheckoutModal.tsx:49:24
  47 |
  48 |   // 60秒倒计时 — 超时自动重载账单
> 49 |   const [billLockedAt, setBillLockedAt] = useState('');
     |                        ^^^^^^^^^^^^^^^ `setBillLockedAt` is declared here
  50 |   const [countdown, setCountdown] = useState(60);
  51 |   useEffect(() => {
  52 |     if (!billLockedAt || countdown <= 0) return;                                                                                                                    react-hooks/immutability
   43:61   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   43:89   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   43:118  error    Error: Cannot access variable before it is declared

`setCountdown` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CheckoutModal.tsx:43:118
  41 |     let m = true; setBillLoading(true);
  42 |     orderApi.getCurrentOrder(table.id).then(r => {
> 43 |       if (m) { setBillData(r as any); setBillLockedAt((r as any)?.billLockedAt || (r as any)?.bill_locked_at || ''); setCountdown(60); }
     |                                                                                                                      ^^^^^^^^^^^^ `setCountdown` accessed before it is declared
  44 |     }).catch(() => {}).finally(() => { if (m) setBillLoading(false); });
  45 |     return () => { m = false; };
  46 |   }, [table]);

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CheckoutModal.tsx:50:21
  48 |   // 60秒倒计时 — 超时自动重载账单
  49 |   const [billLockedAt, setBillLockedAt] = useState('');
> 50 |   const [countdown, setCountdown] = useState(60);
     |                     ^^^^^^^^^^^^ `setCountdown` is declared here
  51 |   useEffect(() => {
  52 |     if (!billLockedAt || countdown <= 0) return;
  53 |     const t = setInterval(() => setCountdown(c => {  react-hooks/immutability
   54:85   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   54:113  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   79:9    warning  'startTime' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-unused-vars
   80:39   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   80:65   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   81:29   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
   83:9    warning  'totalAmount' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    @typescript-eslint/no-unused-vars
   92:33   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  148:57   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  153:117  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  161:17   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  211:12   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  216:14   warning  'e' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
  216:17   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  224:42   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  251:9    warning  'handleAddGift' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
  265:51   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  367:35   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  370:39   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  370:177  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  489:48   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any
  489:80   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CouponVerifyModal.tsx
   23:44  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   26:50  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   42:5   error    Error: Cannot access variable before it is declared

`loadPackages` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CouponVerifyModal.tsx:42:5
  40 |
  41 |   useEffect(() => {
> 42 |     loadPackages();
     |     ^^^^^^^^^^^^ `loadPackages` accessed before it is declared
  43 |   }, []);
  44 |
  45 |   const loadPackages = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\CouponVerifyModal.tsx:45:3
  43 |   }, []);
  44 |
> 45 |   const loadPackages = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 46 |     setLoading(true);
     | ^^^^^^^^^^^^^^^^^^^^^
> 47 |     try {
     …
     | ^^^^^^^^^^^^^^^^^^^^^
> 55 |     }
     | ^^^^^^^^^^^^^^^^^^^^^
> 56 |   };
     | ^^^^^ `loadPackages` is declared here
  57 |
  58 |   const goToPay = () => {
  59 |     if (!selectedPkg || !selectedTableId) return;  react-hooks/immutability
   49:58  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   49:88  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   93:33  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   98:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  280:25  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\HeaderBar.tsx
   7:3   warning  'Clock' is defined but never used               @typescript-eslint/no-unused-vars
  26:24  warning  'panelOpen' is assigned a value but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\HistoryOrdersModal.tsx
    5:3    warning  'X' is defined but never used                                                                                   @typescript-eslint/no-unused-vars
    5:14   warning  'Clock' is defined but never used                                                                               @typescript-eslint/no-unused-vars
    7:13   warning  'DollarSign' is defined but never used                                                                          @typescript-eslint/no-unused-vars
  101:10   warning  'getPaymentLabel' is defined but never used                                                                     @typescript-eslint/no-unused-vars
  136:43   error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any
  215:40   warning  React Hook useEffect has a missing dependency: 'fetchOrders'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  221:9    warning  'todayStr' is assigned a value but never used                                                                   @typescript-eslint/no-unused-vars
  373:58   error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any
  373:128  error    Unexpected any. Specify a different type                                                                        @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\MemberModal.tsx
   33:22  warning  'setGiftPoints' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
   34:10  warning  'paymentMethod' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     @typescript-eslint/no-unused-vars
   34:25  warning  'setPaymentMethod' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  @typescript-eslint/no-unused-vars
   40:10  warning  'wechatResult' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-unused-vars
   41:50  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-explicit-any
   50:36  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-explicit-any
   53:65  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-explicit-any
   67:5   error    Error: Cannot access variable before it is declared

`loadRecentMembers` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\MemberModal.tsx:67:5
  65 |     if (activeTab !== 'records') return;
  66 |     loadRechargeRecords(1);
> 67 |     loadRecentMembers();
     |     ^^^^^^^^^^^^^^^^^ `loadRecentMembers` accessed before it is declared
  68 |   }, [activeTab]);
  69 |
  70 |   useEffect(() => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\MemberModal.tsx:86:3
  84 |   }, [table]);
  85 |
> 86 |   const loadRecentMembers = useCallback(async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 87 |     try { const result = await memberApi.lists({ page: 1, page_size: 6 }); setRecentMembers((result as unknown as MemberResult[]) || []); } catch { /* ignore */ }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 88 |   }, []);
     | ^^^^^^^^^^ `loadRecentMembers` is declared here
  89 |   useEffect(() => { loadRecentMembers(); }, [loadRecentMembers]);
  90 |
  91 |   const clearErrors = () => { setErrorMsg(''); setFieldErrors({}); };  react-hooks/immutability
   68:6   warning  React Hook useEffect has missing dependencies: 'loadRecentMembers' and 'loadRechargeRecords'. Either include them or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       react-hooks/exhaustive-deps
   86:41  error    Compilation Skipped: Existing memoization could not be preserved

React Compiler has skipped optimizing this component because the existing manual memoization could not be preserved. This value was memoized in source but not in compilation output.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\MemberModal.tsx:86:41
  84 |   }, [table]);
  85 |
> 86 |   const loadRecentMembers = useCallback(async () => {
     |                                         ^^^^^^^^^^^^^
> 87 |     try { const result = await memberApi.lists({ page: 1, page_size: 6 }); setRecentMembers((result as unknown as MemberResult[]) || []); } catch { /* ignore */ }
     | ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 88 |   }, []);
     | ^^^^ Could not preserve existing memoization
  89 |   useEffect(() => { loadRecentMembers(); }, [loadRecentMembers]);
  90 |
  91 |   const clearErrors = () => { setErrorMsg(''); setFieldErrors({}); };                                                                                                                                                                                                                                                                                                                              react-hooks/preserve-manual-memoization
  840:44  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\NotificationOverlay.tsx
  43:41  warning  '_n' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\NotificationPanel.tsx
    3:44  warning  'useMemo' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      @typescript-eslint/no-unused-vars
   47:17  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  134:36  error    Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\NotificationPanel.tsx:134:36
  132 |                 if (n.type === 'table_open_confirm_request') {
  133 |                   const expiresAt = (n.data?.expires_at as number) || 0
> 134 |                   if (expiresAt && Date.now() / 1000 > expiresAt) return null
      |                                    ^^^^^^^^^^ Cannot call impure function
  135 |                 }
  136 |                 return (
  137 |                 n.type === 'table_open_confirm_request' ? (  react-hooks/purity

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\OpenTableRequestsModal.tsx
  26:45  error  Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\OpenTableRequestsModal.tsx:26:45
  24 |   const [loading, setLoading] = useState(false)
  25 |   const [processingToken, setProcessingToken] = useState<string | null>(null)
> 26 |   const [now, setNow] = useState(Math.floor(Date.now() / 1000))
     |                                             ^^^^^^^^^^ Cannot call impure function
  27 |
  28 |   // 每 5 秒轮询待处理请求
  29 |   const fetchRequests = useCallback(async () => {  react-hooks/purity
  67:17  error  Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\OrderReminderModal.tsx
  17:10  warning  'loading' is assigned a value but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       @typescript-eslint/no-unused-vars
  20:45  error    Error: Cannot call impure function during render

`Date.now` is an impure function. Calling an impure function can produce unstable results that update unpredictably when the component happens to re-render. (https://react.dev/reference/rules/components-and-hooks-must-be-pure#components-and-hooks-must-be-idempotent).

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\OrderReminderModal.tsx:20:45
  18 |   const [deliveringId, setDeliveringId] = useState<string | null>(null);
  19 |   const [confirmItem, setConfirmItem] = useState<{ item: OrderItem; group: TableGroup } | null>(null);
> 20 |   const [now, setNow] = useState(Math.floor(Date.now() / 1000));
     |                                             ^^^^^^^^^^ Cannot call impure function
  21 |
  22 |   const loadData = useCallback(async () => {
  23 |     setLoading(true);  react-hooks/purity

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\PackageModal.tsx
  16:74  warning  'tableId' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\ProductOrderModal.tsx
   43:18  warning  'dispatch' is assigned a value but never used                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars
   44:21  warning  'assistants' is assigned a value but never used                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
  165:3   warning  Unused eslint-disable directive (no problems were reported from 'react-hooks/preserve-manual-memoization')
  256:6   warning  React Hook useCallback has a missing dependency: 'itemRemarks'. Either include it or remove the dependency array                                                                                                                                                                         react-hooks/exhaustive-deps
  331:25  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\PromotionBanner.tsx
  14:3  error  React Hook "useEffect" is called conditionally. React Hooks must be called in the exact same order in every component render  react-hooks/rules-of-hooks

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\QuickOrderModal.tsx
   26:110  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   26:142  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   43:9    warning  'cartCount' is assigned a value but never used                                                                                                                                                                                                                                           @typescript-eslint/no-unused-vars
   47:254  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   56:351  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   61:568  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   66:9    warning  'change' is assigned a value but never used                                                                                                                                                                                                                                              @typescript-eslint/no-unused-vars
   88:11   warning  'cashChange' is assigned a value but never used                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
   98:126  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element
  127:26   warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\QuickPanel.tsx
    5:3    warning  'Users' is defined but never used             @typescript-eslint/no-unused-vars
   38:20   error    Component definition is missing display name  react/display-name
   41:3    warning  'gradient' is defined but never used          @typescript-eslint/no-unused-vars
   69:3    warning  'onTechnician' is defined but never used      @typescript-eslint/no-unused-vars
   82:52   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
   87:24   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
  209:93   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
  210:147  error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
  213:85   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
  217:85   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
  221:85   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any
  225:85   error    Unexpected any. Specify a different type      @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\ShiftModal.tsx
  36:38  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  55:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  65:17  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  81:18  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  94:17  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\TableBoard.tsx
    8:64  warning  'formatDuration' is defined but never used                                                                           @typescript-eslint/no-unused-vars
   83:61  error    Unexpected any. Specify a different type                                                                             @typescript-eslint/no-explicit-any
   88:6   warning  React Hook useEffect has a missing dependency: 'table.hourlyRate'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  238:61  error    Unexpected any. Specify a different type                                                                             @typescript-eslint/no-explicit-any
  242:6   warning  React Hook useEffect has a missing dependency: 'table.hourlyRate'. Either include it or remove the dependency array  react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\TableDrawer.tsx
   11:3   warning  'X' is defined but never used                                                                                                                                   @typescript-eslint/no-unused-vars
   13:3   warning  'Users' is defined but never used                                                                                                                               @typescript-eslint/no-unused-vars
   28:10  warning  'formatDuration' is defined but never used                                                                                                                      @typescript-eslint/no-unused-vars
   41:10  warning  'formatTime' is defined but never used                                                                                                                          @typescript-eslint/no-unused-vars
  205:6   warning  React Hook useEffect has missing dependencies: 'billData?.assistantPausedAt' and 'billData?.tablePausedAt'. Either include them or remove the dependency array  react-hooks/exhaustive-deps
  287:17  error    Unexpected any. Specify a different type                                                                                                                        @typescript-eslint/no-explicit-any
  314:9   warning  'handlePauseAssistant' is assigned a value but never used                                                                                                       @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\TechnicianModal.tsx
    4:26  warning  'Clock' is defined but never used                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
   48:36  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  105:29  warning  Using `<img>` could result in slower LCP and higher bandwidth. Consider using `<Image />` from `next/image` or a custom image loader to automatically optimize images. This may incur additional usage or cost from your provider. See: https://nextjs.org/docs/messages/no-img-element  @next/next/no-img-element

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\components\TransferMergeModal.tsx
  8:22  warning  'Session' is defined but never used  @typescript-eslint/no-unused-vars
  8:31  warning  'Order' is defined but never used    @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\context\AppContext.tsx
    39:24   warning  'cacheBillingData' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             @typescript-eslint/no-unused-vars
    39:64   warning  'removeBillingData' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars
    39:88   warning  'PricingPeriod' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                @typescript-eslint/no-unused-vars
    40:34   warning  'getCachedProducts' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            @typescript-eslint/no-unused-vars
    40:53   warning  'getCachedAssistants' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          @typescript-eslint/no-unused-vars
   559:3    error    Error: Cannot access refs during render

React refs are values that are not needed for rendering. Refs should only be accessed outside of render, such as in event handlers or effects. Accessing a ref value (the `current` property) during render can cause your component not to update as expected (https://react.dev/reference/react/useRef).

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\context\AppContext.tsx:559:3
  557 |   const [state, dispatch] = useReducer(appReducer, initialState);
  558 |   const stateRef = useRef(state);
> 559 |   stateRef.current = state;
      |   ^^^^^^^^^^^^^^^^ Cannot update ref during render
  560 |   const [service] = useState<AppService>(appService);
  561 |
  562 |   // ============================================================  react-hooks/refs
   614:103  error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   615:95   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   619:22   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   623:22   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   627:16   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   751:26   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   751:55   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   753:31   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   754:31   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   755:33   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
   810:5    warning  React Hook useCallback has an unnecessary dependency: 'service'. Either exclude it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps
   834:5    warning  React Hook useCallback has an unnecessary dependency: 'service'. Either exclude it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps
   854:5    warning  React Hook useCallback has an unnecessary dependency: 'service'. Either exclude it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        react-hooks/exhaustive-deps
  1100:27   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  1101:27   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  1106:27   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any
  1107:27   error    Unexpected any. Specify a different type                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\hooks\useNotification.ts
  30:81  warning  React Hook useCallback has a missing dependency: 'service'. Either include it or remove the dependency array  react-hooks/exhaustive-deps
  34:6   warning  React Hook useEffect has a missing dependency: 'service'. Either include it or remove the dependency array    react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\lib\api\pos.ts
    5:10  warning  'Zone' is defined but never used          @typescript-eslint/no-unused-vars
    6:25  warning  'Payment' is defined but never used       @typescript-eslint/no-unused-vars
    6:34  warning  'Coupon' is defined but never used        @typescript-eslint/no-unused-vars
  215:9   error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  222:54  error    Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\lib\auth-context.tsx
   4:10  warning  'api' is defined but never used                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        @typescript-eslint/no-unused-vars
  53:5   error    Error: Cannot access variable before it is declared

`initAuth` is accessed before it is declared, which prevents the earlier access from updating when this value changes over time.

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\lib\auth-context.tsx:53:5
  51 |
  52 |   useEffect(() => {
> 53 |     initAuth();
     |     ^^^^^^^^ `initAuth` accessed before it is declared
  54 |   }, []);
  55 |
  56 |   const initAuth = async () => {

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\lib\auth-context.tsx:56:3
  54 |   }, []);
  55 |
> 56 |   const initAuth = async () => {
     |   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
> 57 |     try {
     | ^^^^^^^^^
> 58 |       const storedUser = localStorage.getItem(STORAGE_KEY);
     …
     | ^^^^^^^^^
> 69 |     setLoading(false);
     | ^^^^^^^^^
> 70 |   };
     | ^^^^^ `initAuth` is declared here
  71 |
  72 |   const clearAuth = () => {
  73 |     setUser(null);  react-hooks/immutability
  54:6   warning  React Hook useEffect has a missing dependency: 'initAuth'. Either include it or remove the dependency array                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            react-hooks/exhaustive-deps

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\services\api-service.ts
  8:11  warning  'Order' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\services\notification-service.ts
  201:61  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  212:21  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  257:28  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  390:43  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  391:45  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\services\types.ts
  3:25  warning  'Payment' is defined but never used  @typescript-eslint/no-unused-vars

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\utils\offline-queue.ts
  33:33  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  34:34  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\src\utils\printer.ts
  42:36  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  51:29  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  65:42  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any
  65:92  error  Unexpected any. Specify a different type  @typescript-eslint/no-explicit-any

✖ 297 problems (120 errors, 177 warnings)
  6 errors and 2 warnings potentially fixable with the `--fix` option.

[ELIFECYCLE] Command failed with exit code 1.
```
<!-- LOG_END:25-wwwpos-lint.log -->

### 6. wwwpos：`pnpm test`（退出码 1）

来源日志：`26-wwwpos-test.log`。

<!-- LOG_BEGIN:26-wwwpos-test.log -->
```text
pnpm : $ vitest run
所在位置 行:15 字符: 1730
+ ...  '0'; $env:PAGER = 'more'; $env:TERM = 'dumb'; pnpm test 2>&1 | Tee-O ...
+                                                    ~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ($ vitest run:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
[31mfailed to load config from D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\vitest.c
onfig.ts[39m

[31m⎯⎯⎯⎯⎯⎯⎯[39m[1m[41m Startup Error [49m[22m[31m⎯⎯⎯⎯⎯⎯⎯⎯[39m
Error [ERR_REQUIRE_ESM]: require() of ES Module D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards
\wwwpos\node_modules\.pnpm\vite@7.3.6_@types+node@20.1_0494192f828380bd06c998a5c4603b78\node_modules\vite\dist\node\ind
ex.js from D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\node_modules\.pnpm\vitest@3.2
.7_@types+debug@4_3e38593c3a90d94aedc94aaf2c5ef7da\node_modules\vitest\dist\config.cjs not supported.
Instead change the require of index.js in D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpo
s\node_modules\.pnpm\vitest@3.2.7_@types+debug@4_3e38593c3a90d94aedc94aaf2c5ef7da\node_modules\vitest\dist\config.cjs t
o a dynamic import() which is available in all CommonJS modules.
    at _require.extensions.<computed> [as .js] (file:///D:/wwwroot/projectwork/projects/billiards-ai/.worktrees/m0-m1/b
illiards/wwwpos/node_modules/.pnpm/vite@7.3.6_@types+node@20.1_0494192f828380bd06c998a5c4603b78/node_modules/vite/dist/
node/chunks/config.js:36007:9)
    at TracingChannel.traceSync (node:diagnostics_channel:315:14)
    at Object.<anonymous> (D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\node_modules\
.pnpm\vitest@3.2.7_@types+debug@4_3e38593c3a90d94aedc94aaf2c5ef7da\node_modules\vitest\dist\config.cjs:5:12) {
  code: 'ERR_REQUIRE_ESM'
}



[ELIFECYCLE] Test failed. See above for more details.
```
<!-- LOG_END:26-wwwpos-test.log -->

### 7. wwwpos：`pnpm build:win`（退出码 0）

来源日志：`27-wwwpos-build-win.log`。

<!-- LOG_BEGIN:27-wwwpos-build-win.log -->
```text
pnpm : $ next build && tsup src/server.ts --format cjs --platform node --target node20 --outDir dist --no-splitting --n
o-minify
所在位置 行:15 字符: 1730
+ ...  $env:PAGER = 'more'; $env:TERM = 'dumb'; pnpm build:win 2>&1 | Tee-O ...
+                                               ~~~~~~~~~~~~~~~~~~~
    + CategoryInfo          : NotSpecified: ($ next build &&...ing --no-minify:String) [], RemoteException
    + FullyQualifiedErrorId : NativeCommandError
 
⚠ No build cache found. Please configure build caching for faster rebuilds. Read more: https://nextjs.org/docs/messages/no-cache
Attention: Next.js now collects completely anonymous telemetry regarding usage.
This information is used to shape Next.js' roadmap and prioritize features.
You can learn more, including how to opt-out if you'd not like to participate in this anonymous program, by visiting the following URL:
https://nextjs.org/telemetry

▲ Next.js 16.1.1 (Turbopack)

  Creating an optimized production build ...
  Using external babel configuration from D:\wwwroot\projectwork\projects\billiards-ai\.worktrees\m0-m1\billiards\wwwpos\.babelrc
✓ Compiled successfully in 14.1s
  Skipping validation of types
  Collecting page data using 11 workers ...
  Generating static pages using 11 workers (0/13) ...
  Generating static pages using 11 workers (3/13) 
  Generating static pages using 11 workers (6/13) 
  Generating static pages using 11 workers (9/13) 
✓ Generating static pages using 11 workers (13/13) in 624.2ms
  Finalizing page optimization ...

Route (app)
┌ ○ /
├ ○ /_not-found
├ ƒ /api/members
├ ƒ /api/orders
├ ƒ /api/payments
├ ƒ /api/shifts
├ ƒ /api/sync
├ ƒ /api/tables
├ ○ /login
├ ○ /robots.txt
└ ○ /select-store


ƒ Proxy (Middleware)

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand

[34mCLI[39m Building entry: src/server.ts
[34mCLI[39m Using tsconfig: tsconfig.json
[34mCLI[39m tsup v8.5.1
[34mCLI[39m Target: node20
[34mCJS[39m Build start
[32mCJS[39m [1mdist\server.js [22m[32m2.29 KB[39m
[32mCJS[39m ⚡️ Build success in 192ms
```
<!-- LOG_END:27-wwwpos-build-win.log -->

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
