# M0 交班、支付与充值现状语义

## 范围与证据边界

- 执行基线：`5334ca00f4e28b0b7fbf145d9864fac59fb28cda`。
- 被测旧代码仅为 `app/storeapi/logic/shift/ShiftLogic.php`；本任务没有修改 `ShiftLogic`、控制器或其他旧业务源码。
- Schema 依据为 `deploy/mysql/init/001-schema.sql`，并通过 `INFORMATION_SCHEMA.COLUMNS` 复核了隔离库中六张相关表的列约束。factory 显式提供全部无默认值 `NOT NULL` 字段。
- 数据库仅为 `127.0.0.1:13306/billiards_test`。所有主键、门店、操作员、会员和单号均为显式合成值；未查询或复制真实会员、员工、订单行。
- 每个测试由 `DatabaseTestCase` 开启事务并在 `tearDown()` 回滚。没有执行 DDL、`TRUNCATE`、清表或真实行清理。
- `recomputed_v1` 一节冻结的是后续重算必须遵守的口径；本任务没有实现证据 API 或 Task 5，也不把重算规则冒充为旧代码已有输出。

## RED / GREEN 原始结果摘要

所有命令均从 `billiards/wwwapi` 执行。

| 顺序 | 命令 | 退出码 | 真实结果 |
| --- | --- | ---: | --- |
| 依赖确认 | `php vendor/bin/phpunit --version` | 0 | `PHPUnit 9.6.39 by Sebastian Bergmann and contributors.` |
| 首轮 RED | `php vendor/bin/phpunit tests/Characterization/ShiftBehaviorTest.php` | 1 | 只存在 smoke test、没有 harness；`Cannot open file ".../wwwapi/bootstrap.php"`，测试未执行。 |
| smoke GREEN | 同上 | 0 | 最小 bootstrap、事务基类及班次 factory 后：`OK (1 test, 1 assertion)`。 |
| 订单组 RED | 同上 | 2 | `Tests: 3, Assertions: 1, Errors: 2.`；一个错误为进行中班次缺少 `isOnShift` 键，另一个为 `makeOrder()` 尚不存在。 |
| 订单组 GREEN | 同上 | 0 | 按真实缺失键行为修正断言并补订单 factory：`OK (3 tests, 14 assertions)`。 |
| 签退/充值组 RED | 同上 | 2 | `Tests: 5, Assertions: 14, Errors: 2.`；两个错误均为 `makeRecharge()` 尚不存在。 |
| 签退/充值组 GREEN | 同上 | 0 | `OK (5 tests, 28 assertions)`。 |
| 支付/合并/边界组 RED | 同上 | 2 | `Tests: 8, Assertions: 30, Errors: 2.`；分别为 `makeOrderItem()`、`makePayment()` 尚不存在。 |
| 七类行为 GREEN | 同上 | 0 | `OK (8 tests, 41 assertions)`。 |
| 最终套件验证 | `php vendor/bin/phpunit --testsuite Characterization` | 0 | `OK (8 tests, 41 assertions)`。 |
| 现金流补证 RED | `php vendor/bin/phpunit tests/Characterization/ShiftBehaviorTest.php` | 1 | 仅新增 cash_flow 查询/断言、factory 尚未生成现金流：`Tests: 8, Assertions: 40, Failures: 1.`；`ShiftBehaviorTest.php:160` 报 `Failed asserting that null is not null.`。 |
| 现金流补证 GREEN | `php vendor/bin/phpunit tests/Characterization/ShiftBehaviorTest.php` | 0 | 最小扩展充值 factory，显式填充 cash_flow 无默认值 `NOT NULL` 字段并写入 `amount=220`：`OK (8 tests, 43 assertions)`。 |
| 本轮最终套件验证 | `php vendor/bin/phpunit --testsuite Characterization` | 0 | `OK (8 tests, 43 assertions)`。 |

初次补 harness 后还出现过 `Class "Tests\Support\DatabaseTestCase" not found`，通过在测试文件显式加载支持基类修正。该次没有 PHPUnit 测试成功摘要，未被记作 GREEN。最终套件使用同一批合成 ID 再运行一次，仍为退出码 0、`OK (8 tests, 41 assertions)`，与事务回滚设计一致。

## 七类实测行为与测试映射

| 类别 | 合成场景与真实结果 | 对应测试 |
| --- | --- | --- |
| 1. 当前/历史班次 | 历史 `checked_out` 班次返回 `isOnShift=false`。当天 `checked_in` 班次会通过 `employeeId` 和班次起点被识别，但**成功分支没有 `isOnShift` 键**；不能断言其为 `true`。 | `testCurrentSummaryIgnoresHistoricalCheckedOutShift`、`testCurrentSummaryLoadsTodaysShiftButOmitsIsOnShiftFlag` |
| 2. 订单范围与开台 | 仅当前门店、当前操作员、窗口内且 `status=completed` 的订单进入收入和订单数。其他门店、操作员、状态、窗口前后订单均排除。`in_progress` 的 999 元合成订单不影响收入，只使 `openTableCount=1`。 | `testSummaryScopesCompletedOrdersAndCountsOpenTablesSeparately` |
| 3. 签退冻结缺失 | 80 元订单签退后冻结 `total_revenue=80`、`order_count=1`、`cash_paid=10`、`recharge_total=200`。原始 attendance 报告中 `alipay_paid`、`card_paid`、`recharge_count` 键缺失，并非数值 0。 | `testCheckOutLeavesUnsnapshottedPaymentAndRechargeFieldsMissing` |
| 4. 订单级与项目级支付 | 同一订单分别列出 `order_item_id=NULL` 和 `order_item_id=t4-payment-item` 两条 40 元 payment。全表直接 SUM 得 80，而旧订单行及 `ShiftLogic` 均为 40，证明两层 payment 不能不加区分地求全表 SUM。 | `testOrderAndItemPaymentsAreListedSeparatelyFromLegacyOrderTotals` |
| 5. 合并支付与父子订单 | 父订单聚合金额 100，子订单金额 40，只有父订单一条 100 元合并支付。旧汇总为 `totalRevenue=140`、`orderCount=2`、`cashPaid=100`：父行已聚合的 40 与子行再次相加，收入重复 40；支付没有重复。 | `testLegacySummaryCountsMergedParentAndChildIncludingAggregatedAmount` |
| 6. 实收、赠送与入账 | `member_recharge.amount=200`、`gift_amount=20`，余额从 100 到 320；同一充值另建立并读取 `bi_busi_cash_flow`，其 `amount=220`。`MemberLogic.php:268-283`、`:371-386` 也分别按 `$amount + $giftAmount`、`$totalAdd` 写该字段，因此 **cash_flow 的 220 是包含赠送的内部流水字段值**。外部实际收款证据为 `member_recharge.amount=200`，赠送为 20，总权益/入账为 220；旧 `rechargeTotal=200`、`rechargeCount=1` 仍只汇总充值 `amount`。既不能由 `cash_flow.amount=220` 推断外部实收 220，也不能否定该字段值确为 220。 | `testRechargeSeparatesReceivedAmountGiftAndTotalCredit` |
| 7. 时间边界 | `end_time=check_in_time` 的 30 元订单和等于调用时当前秒的 40 元订单都被计入，未来订单排除，结果为 70 元、2 单；对应实现的 `>= check_in_time` 与 `<= checkOutTime`。 | `testSummaryIncludesOrdersAtStartAndCurrentEndBoundaries` |

## `legacy_summary` 冻结规则

### 输入

- `employeeId`、`storeId`。
- 当天、同门店、同员工且 `status=checked_in` 的最新一条 attendance。
- 有班次时结束时间为调用时的 `date('Y-m-d H:i:s')`；订单与充值窗口均为闭区间 `[check_in_time, checkOutTime]`。

### 输出与计算

1. 无进行中班次：返回 `isOnShift=false`，收入、订单数、充值数等字段直接为 0，班次起点和员工信息为空。
2. 有进行中班次：返回 `employeeId`、`shiftStartTime`、工时及下列汇总，但**不返回 `isOnShift`**。
3. 订单候选条件：`store_id`、`operator_id` 精确匹配，`status=completed`，`end_time >= check_in_time` 且 `end_time <= checkOutTime`。
4. 对候选订单物理行直接求和：`final_amount`、`table_fee`、`product_fee`、`assistant_fee`、五种订单支付列（wechat/alipay/cash/card/balance）；`orderCount=COUNT(*)`。
5. `openTableCount` 只按门店、操作员和 `status=in_progress` 计数，不带班次时间窗口，也不使用金额。
6. 充值按门店、操作员和 `created_at` 闭区间过滤，`rechargeTotal=SUM(amount)`、`rechargeCount=COUNT(*)`；不加 `gift_amount`，也没有按 `status` 过滤。
7. `ShiftLogic` 不读取 `busi_order_payment`。订单支付列与 payment 流水是不同证据源，不能宣称二者天然一致。
8. `checkOut` 复用相同订单时间条件冻结 attendance，但只保存 total/orderCount/cash/wechat/balance/table/product/assistant/openTable/rechargeTotal。它不冻结 alipay、card、rechargeCount；模型和表中也没有对应 attendance 字段。

## `recomputed_v1` 重算约束

1. 必须独立于旧返回数组重算，保留相同门店、操作员、完成状态和闭区间边界，使差异可解释。
2. 订单费用与支付证据分组输出：订单列重算一组，成功 payment 证据另列一组；不得把不同来源静默混合后称为唯一实收。
3. 订单列重算先保留父订单及其聚合金额。对已确认聚合进当前父订单的子行，不得再把父、子金额同时相加；同一合成场景的订单列收入应为 100，而不是 legacy 的 140。
4. 合并支付只在父订单级证据中出现一次。项目级支付仍单独列出，不因为需要“对平”而强行并入或丢弃。
5. 重算遇到下述“缺失”或“unknown”时必须保留状态和原因，不能用 0 填充来制造平衡。
6. 重算只读相关数据；本任务未对其性能、收益或生产正确率作任何结论。

## payment 分类规则

| 证据 | 分类/处理 |
| --- | --- |
| 订单列 `cash_paid`、`wechat_paid`、`alipay_paid`、`card_paid`、`balance_paid` | 分别对应 cash、wechat、alipay、card、balance；这是 legacy 直接求和的五个分类。 |
| `busi_order_payment.order_item_id IS NULL` | 订单级支付，单独列出并用于订单级支付证据汇总。 |
| `busi_order_payment.order_item_id IS NOT NULL` | 项目级/预付支付，保留项目关联并单独汇总；不得与订单级记录无差别相加。 |
| `payment_method=cash/wechat/alipay/card/balance` | 按同名支付类别处理。 |
| `payment_method=member_balance` 或 `channel=member_balance` 且与方法不冲突 | 归为 balance；旧结账代码的订单级写法是 `method=balance`、`channel=member_balance`，项目代码也存在 `member_balance`。 |
| `payment_method=points` | 积分抵扣证据，不等同现金收款，不得塞入 cash。 |
| 未识别方法、方法与渠道冲突 | 标为 `unknown` 并保留原值，不默认成 cash 或 0。 |
| 状态与时间 | 旧代码实际写入 `paid`，Schema 注释还列出 `success`；成功白名单必须显式识别二者，`pending/failed` 不计入。重算支付时间使用 `paid_at` 的闭区间；成功记录缺少 `paid_at` 时时间为 `unknown`，不能靠 `created_at` 暗中替换。 |

## merge 处理与待确认事项

- 旧 `MergeLogic` 会把子订单费用固化到子行，同时把费用聚合到目标父订单；父子订单最终都可能是 `completed`。因此 `ShiftLogic` 的物理行 SUM 会重复计算已聚合子金额，这是已实测现状，不是推定。
- `recomputed_v1` 只有在父行确属当前范围且聚合关系明确时，才可排除对应子行的重复金额并保留父行一次。
- **需要业务负责人确认，Task 5 在合并重算前必须暂停确认**：当父子订单的操作员、门店或 `end_time` 落在不同班次时，父行中的聚合子金额应归属“最终结账操作员/父订单班次”，还是拆回“原子订单操作员/子订单班次”？确认前不得自行选择归属；这种结果必须标为 `unknown`，而不是给出确定金额。
- 同班次合成证据只能证明 legacy 的重复金额，不足以回答上述跨班次归属问题。

## missing、0 与 unknown

| 状态 | 冻结规则 | 本次例子 |
| --- | --- | --- |
| `missing` | 字段在旧报告/快照中从未产生，保留“缺失”或空值及原因，不能改写成 0。 | `checkOut` 的 `alipay_paid`、`card_paid`、`recharge_count`。 |
| `0` | 已按明确规则查询且确无匹配记录，或来源数值确实为 0；这是确定的零。 | 当前班次没有匹配完成订单时，旧汇总对应总额为 0。 |
| `unknown` | 有数据但分类、时间或归属无法可靠判定；保留未知及原因，禁止默认为 0 或强行对平。 | 未识别支付方式、成功支付无 `paid_at`、跨班次合并归属未确认。 |

特别注意：无班次时 `shiftSummary` 的占位返回会把 alipay/card/rechargeCount 设为 0；这与 `checkOut` attendance 快照中的字段缺失是两种不同状态，不得混写。
