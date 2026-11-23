# 球房数据报表需求规格书

**日期:** 2026-06-22 | **版本:** v1.0 | **角色:** 产品经理 + 球房运营专家

---

## 一、涉及的数据基础表

| 表名 | 用途 | 报表维度 |
|------|------|---------|
| `busi_order` | 订单主表 | 收入/时长/人数/支付/会员/台桌/助教/时段 |
| `busi_order_item` | 订单明细 | 商品销量/助教服务/台费明细 |
| `busi_order_payment` | 支付记录 | 支付方式/实收金额/交易流水 |
| `busi_order_refund` | 退款记录 | 退款金额/退款率 |
| `busi_cash_flow` | 现金流水 | 班次现金/收支流水 |
| `busi_commission_record` | 提成记录 | 助教提成/提成率/应付提成 |
| `busi_table` | 台桌 | 开台率/翻台率/使用时长/区域分布 |
| `busi_product` | 商品 | 销量/销售额/库存/成本/利润 |
| `busi_member` | 会员 | 会员数/新增/消费/余额/等级分布 |
| `busi_member_recharge` | 会员充值 | 充值金额/充值方式/赠送 |
| `busi_assistant` | 助教 | 服务时长/服务次数/收入/好评率 |
| `busi_employee_attendance` | 考勤 | 出勤率/迟到/请假 |
| `busi_charging_session` | 充电 | 充电次数/时长/收入/端口使用率 |
| `busi_coupon_verify` | 券核销 | 核销量/核销金额/平台来源 |
| `busi_inventory_record` | 库存变动 | 入库/出库/损耗 |

---

## 二、报表维度体系

### 2.1 时间维度

| 维度 | 说明 | 适用场景 |
|------|------|---------|
| 今日 | 当日 00:00 ~ 当前 | 实时监控 |
| 昨日 | 昨日全天 | 日环比 |
| 本周 | 周一 ~ 周日 | 周报 |
| 上周 | 上周一 ~ 周日 | 周环比 |
| 本月 | 1日 ~ 月末 | 月报 |
| 上月 | 上月1日 ~ 月末 | 月环比 |
| 本季 | 季度 | 季度复盘 |
| 本年 | 1月1日 ~ 当前 | 年度经营 |
| 自定义 | 任意起止日期 | 灵活查询 |

### 2.2 业务分类维度

| 维度 | 字段/来源 | 说明 |
|------|----------|------|
| 台费 | `order.type='table'` + `item.item_type='table'` | 按时/分时段/套餐 |
| 商品费 | `item.item_type='product'` | 商品销售收入 |
| 助教费 | `item.item_type='assistant'` | 助教服务收入 |
| 充电费 | `charging_session.total_fee` 或 `order.charging_fee` | 手机充电收入 |
| 套餐费 | `order.type='package'` 或 coupon verify | 验券套餐 |
| 会员充值 | `member_recharge.amount` | 预充值收入 |
| 折扣/优惠 | `order.discount_amount` | 会员折扣+促销 |
| 退款 | `order_refund.refund_amount` | 退款金额 |

### 2.3 支付方式维度

| 维度 | 来源 |
|------|------|
| 现金 | `order.cash_paid` |
| 微信 | `order.wechat_paid` |
| 支付宝 | `order.alipay_paid` |
| 会员卡 | `order.card_paid` |
| 余额 | `order.balance_paid` |
| 积分抵扣 | `order.points_deduct` |

### 2.4 其他分析维度

| 维度 | 说明 |
|------|------|
| 台桌/区域 | 按区域(Zone)和桌型统计 |
| 员工/操作员 | 按开台/结账操作员统计 |
| 助教 | 按助教个人统计 |
| 会员等级 | 按普通/银卡/金卡/钻石统计 |
| 时段 | 按小时/时段(早/中/晚/深夜)统计 |

---

## 三、报表指标需求

### 3.1 经营日报（老板/店长视角）

#### 收入指标

| 指标 | 计算方式 | 数据来源 |
|------|---------|---------|
| 总收入 | SUM(所有已结账订单 final_amount) | order |
| 台费收入 | SUM(order.table_fee) | order |
| 商品收入 | SUM(order.product_fee) | order |
| 助教收入 | SUM(order.assistant_fee) | order |
| 充电收入 | SUM(order.charging_fee) | order |
| 套餐收入 | SUM(验券金额) | coupon_verify |
| 实收现金 | SUM(order.cash_paid) | order |
| 实收微信 | SUM(order.wechat_paid) | order |
| 实收支付宝 | SUM(order.alipay_paid) | order |
| 实收会员卡 | SUM(order.card_paid) | order |
| 实收余额 | SUM(order.balance_paid) | order |
| 折扣总额 | SUM(order.discount_amount) | order |
| 退款总额 | SUM(refund.refund_amount) | order_refund |
| 净收入 | 总收入 - 退款 | 计算 |
| 环比增长率 | (本期-上期)/上期 | 计算 |

#### 运营指标

| 指标 | 计算方式 | 数据来源 |
|------|---------|---------|
| 总订单数 | COUNT(已结账订单) | order |
| 开台时长 | SUM(order.duration_minutes) | order |
| 平均订单金额 | 总收入/订单数 | 计算 |
| 客单价 | 总收入/消费人数 | 计算 |
| 开台率 | 使用中台数/总台数 | table |
| 翻台率 | 完成订单数/总台数 | order+table |
| 台桌利用率 | 实际使用时长/(台数×营业时长) | order+table |
| 平均服务时长 | AVG(order.duration_minutes) | order |
| 人均消费时长 | 总时长/总人数 | order |

#### 会员指标

| 指标 | 计算方式 | 数据来源 |
|------|---------|---------|
| 会员消费总额 | SUM(会员订单金额) | order WHERE member_id IS NOT NULL |
| 会员消费占比 | 会员消费/总收入 | 计算 |
| 新增会员数 | COUNT(区间内注册会员) | member |
| 充值总额 | SUM(recharge.amount) | member_recharge |
| 充值笔数 | COUNT(充值记录) | member_recharge |

#### 商品指标

| 指标 | 计算方式 | 数据来源 |
|------|---------|---------|
| 商品销售总额 | SUM(item.final_price) WHERE item_type='product' | order_item |
| 商品销售数量 | SUM(item.quantity) | order_item |
| 商品毛利率 | (售价-成本)/售价 | product+order_item |
| 热销TOP10 | 按销售额降序 | order_item |

#### 人员指标

| 指标 | 计算方式 | 数据来源 |
|------|---------|---------|
| 助教服务次数 | COUNT(助教订单) | order 或 assistant_order |
| 助教服务时长 | SUM(服务时长) | order 或 order_item |
| 助教提成总额 | SUM(commission_amount) | commission_record |
| 员工出勤人数 | COUNT(今日打卡) | attendance |
| 出勤率 | 出勤/总员工 | attendance+employee |

### 3.2 财务日/月报表（财务视角）

| 指标 | 说明 |
|------|------|
| 营业总收入 | 所有订单的实收总金额(含所有支付方式) |
| 现金收入 | 现金支付合计 |
| 移动支付收入 | 微信+支付宝合计 |
| 会员预充值收入 | 会员充值总额(非消费) |
| 应收账款(会员消费) | 会员余额扣款合计 |
| 优惠/折扣金额 | 会员折扣+活动折扣 |
| 退款金额 | 退款合计 |
| 净营业额 | 营业总收入 - 退款 |
| 助教提成应付 | commission_record SUM(pending+paid) |
| 实际现金流 | 现金收入 + 移动支付 - 退款 |
| 班次现金 | 当班收银员经手现金(从cash_flow) |

### 3.3 趋势分析

| 指标 | 粒度 | 说明 |
|------|------|------|
| 收入趋势 | 按日 | 连续N天的日收入变化 |
| 订单趋势 | 按日 | 连续N天的日订单数变化 |
| 开台率趋势 | 按时 | 1天24小时各时段开台率 |
| 客流趋势 | 按日/时 | 人数变化 |
| 会员消费趋势 | 按日/周 | 会员消费变化 |
| 商品销量趋势 | 按日 | 单品销量变化 |

### 3.4 排行榜

| 榜单 | 排序依据 | TOP N |
|------|---------|-------|
| 热销商品 | 销售额 | 10 |
| 热门台桌 | 使用次数/使用时长 | 10 |
| 热门区域 | 订单数 | 全部 |
| 金牌助教 | 服务收入/次数/好评 | 10 |
| 消费会员 | 累计消费金额 | 10 |
| 充值会员 | 累计充值金额 | 10 |

---

## 四、ReportService 对象设计

```php
class ReportService
{
    private string $storeId;
    private string $startDate;  // Y-m-d
    private string $endDate;    // Y-m-d
    private string $prevStart;  // 上期对比起始
    private string $prevEnd;    // 上期对比结束

    // 构造函数：自动计算上期日期
    public function __construct(string $storeId, string $start, string $end)

    // === 收入报表 ===
    public function revenueSummary(): array       // 收入总览(含环比)
    public function revenueByType(): array        // 按业务类型(台费/商品/助教/充电)
    public function revenueByPayment(): array     // 按支付方式(现金/微信/支付宝/卡/余额)
    public function revenueTrend(int $days): array // N天日趋势
    public function revenueByHour(): array         // 按时段(0-23时)

    // === 运营报表 ===
    public function operationOverview(): array     // 订单/时长/客单价/开台率/翻台率
    public function tableUtilization(): array      // 台桌使用率(按区域)
    public function tableUsageRank(int $limit): array // 台桌使用排行

    // === 商品报表 ===
    public function productRank(int $limit): array  // 热销榜
    public function productProfit(): array          // 商品毛利

    // === 会员报表 ===
    public function memberOverview(): array         // 会员总览(消费/充值/新增)
    public function memberRank(int $limit): array   // 消费排行

    // === 人员报表 ===
    public function assistantOverview(): array      // 助教总览
    public function assistantRank(int $limit): array // 助教排行
    public function attendanceOverview(): array     // 考勤总览

    // === 快捷查询 ===
    public function quickStats(): array             // 今日快照
    public function dashboard(): array              // 完整仪表盘(全部汇总)
}
```

---

## 五、API 设计

| 端点 | 方法 | 说明 |
|------|------|------|
| `GET /report.Report/revenueSummary` | ReportService | 收入总览 |
| `GET /report.Report/revenueByPayment` | ReportService | 支付方式分布 |
| `GET /report.Report/revenueTrend` | ReportService | 收入趋势 |
| `GET /report.Report/operationOverview` | ReportService | 运营指标 |
| `GET /report.Report/productRank` | ReportService | 热销商品 |
| `GET /report.Report/memberOverview` | ReportService | 会员总览 |
| `GET /report.Report/assistantOverview` | ReportService | 助教总览 |
| `GET /report.Report/dashboard` | ReportService | 完整仪表盘 |

所有端点接受 `{store_id, start_date, end_date}` 参数，统一由 `ReportService` 处理。

---

## 六、分阶段实施

| 阶段 | 内容 | 数据表 |
|------|------|--------|
| P0 | 收入总览 + 运营指标 + 商品排行 | order, order_item, table |
| P1 | 支付方式 + 会员总览 + 助教排行 | order, member, assistant |
| P2 | 趋势图 + 时段分析 + 毛利 | order, order_item, product |
| P3 | 排行榜 + 考勤 + 充电 | 各表 |
