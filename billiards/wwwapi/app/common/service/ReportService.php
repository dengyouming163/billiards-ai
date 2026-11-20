<?php

namespace app\common\service;

use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\OrderPayment;
use app\common\model\merchant\Table;
use app\common\model\merchant\MemberRecharge;
use app\common\model\merchant\EmployeeAttendance;
use app\common\model\merchant\CommissionConfig;
use app\common\model\merchant\CommissionRecord;
use app\common\model\merchant\OrderPauseLog;
use app\common\model\merchant\Employee;
use app\common\model\merchant\Assistant;

/**
 * 统一报表服务
 *
 * 为 wwwstoreapp 和 wwwstore 提供一致的数据报表能力。
 * 构造函数自动计算上期对比日期，每个方法返回键值对数组。
 *
 * 用法:
 *   $rpt = new ReportService('store_xxx', '2026-06-01', '2026-06-22');
 *   $data = $rpt->revenueSummary();
 */
class ReportService
{
    /** @var string 门店ID */
    private string $storeId;

    /** @var string 起始日期 Y-m-d */
    private string $startDate;

    /** @var string 结束日期 Y-m-d */
    private string $endDate;

    /** @var string 起始日期时间 Y-m-d 00:00:00 */
    private string $startDt;

    /** @var string 结束日期时间 Y-m-d 23:59:59 */
    private string $endDt;

    /** @var string 上期起始日期 Y-m-d */
    private string $prevStart;

    /** @var string 上期结束日期 Y-m-d */
    private string $prevEnd;

    /** @var string 上期起始日期时间 */
    private string $prevStartDt;

    /** @var string 上期结束日期时间 */
    private string $prevEndDt;

    /**
     * @param string $storeId   门店ID
     * @param string $startDate 起始日期 Y-m-d
     * @param string $endDate   结束日期 Y-m-d
     */
    public function __construct(string $storeId, string $startDate, string $endDate)
    {
        $this->storeId = $storeId;
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->startDt = $startDate . ' 00:00:00';
        $this->endDt = $endDate . ' 23:59:59';

        // 自动计算上期对比日期（等长时间段）
        $startTs = strtotime($startDate);
        $endTs = strtotime($endDate);
        $diff = max(0, $endTs - $startTs);
        $this->prevEnd = date('Y-m-d', $startTs - 86400);
        $this->prevStart = date('Y-m-d', $startTs - 86400 - $diff);
        $this->prevStartDt = $this->prevStart . ' 00:00:00';
        $this->prevEndDt = $this->prevEnd . ' 23:59:59';
    }

    /**
     * 当前统计期的已完成订单查询器
     * @return \think\db\Query
     */
    private function orderQuery()
    {
        return Order::where('store_id', $this->storeId)
            ->where('status', 'completed')
            ->where('start_time', '>=', $this->startDt)
            ->where('start_time', '<=', $this->endDt);
    }

    /**
     * 上期对比的已完成订单查询器
     * @return \think\db\Query
     */
    private function prevOrderQuery()
    {
        return Order::where('store_id', $this->storeId)
            ->where('status', 'completed')
            ->where('start_time', '>=', $this->prevStartDt)
            ->where('start_time', '<=', $this->prevEndDt);
    }

    /**
     * 收入总览（含环比增长）
     *
     * 统计当前期内所有已完成订单的收入按业务类型分解，
     * 并对比上期计算增长率。
     *
     * @return array{table_revenue, assistant_revenue, product_revenue, charging_revenue, package_revenue, total_revenue, order_count, last_period_revenue, revenue_change}
     */
    public function revenueSummary(): array
    {
        $orders = $this->orderQuery()
            ->field('table_fee, assistant_fee, product_fee, charging_fee, final_amount')
            ->select();

        $tableRevenue = 0.0;
        $assistantRevenue = 0.0;
        $productRevenue = 0.0;
        $chargingRevenue = 0.0;
        $totalRevenue = 0.0;

        foreach ($orders as $o) {
            $tableRevenue += (float)($o['table_fee'] ?? 0);
            $assistantRevenue += (float)($o['assistant_fee'] ?? 0);
            $productRevenue += (float)($o['product_fee'] ?? 0);
            $chargingRevenue += (float)($o['charging_fee'] ?? 0);
            $totalRevenue += (float)($o['final_amount'] ?? 0);
        }

        $orderCount = count($orders);

        // 上期对比
        $prevOrders = $this->prevOrderQuery()->field('final_amount')->select();
        $lastRevenue = 0.0;
        foreach ($prevOrders as $o) {
            $lastRevenue += (float)($o['final_amount'] ?? 0);
        }
        $revenueChange = $lastRevenue > 0
            ? round(($totalRevenue - $lastRevenue) / $lastRevenue * 100, 2)
            : 0;

        return [
            'table_revenue'     => round($tableRevenue, 2),
            'assistant_revenue' => round($assistantRevenue, 2),
            'product_revenue'   => round($productRevenue, 2),
            'charging_revenue'  => round($chargingRevenue, 2),
            'package_revenue'   => 0.0,
            'total_revenue'     => round($totalRevenue, 2),
            'order_count'       => $orderCount,
            'last_period_revenue' => round($lastRevenue, 2),
            'revenue_change'    => $revenueChange,
        ];
    }

    /**
     * 运营指标
     *
     * 订单量、时长、客单价、开台率、翻台率、台桌利用率
     *
     * @return array{order_count, total_duration_minutes, avg_order_amount, avg_customer_spend, avg_duration_minutes, total_customers, total_tables, occupied_tables, occupancy_rate, turnover_rate, table_utilization}
     */
    public function operationOverview(): array
    {
        $orders = $this->orderQuery()
            ->field('final_amount, duration_minutes, customer_count, table_id')
            ->select();

        $orderCount = count($orders);
        $totalDuration = 0;
        $totalRevenue = 0.0;
        $totalCustomers = 0;
        $usedTables = [];

        foreach ($orders as $o) {
            $totalDuration += (int)($o['duration_minutes'] ?? 0);
            $totalRevenue += (float)($o['final_amount'] ?? 0);
            $totalCustomers += (int)($o['customer_count'] ?? 0);
            if (!empty($o['table_id'])) {
                $usedTables[$o['table_id']] = true;
            }
        }

        $avgOrderAmount = $orderCount > 0 ? round($totalRevenue / $orderCount, 2) : 0;
        $avgDuration = $orderCount > 0 ? round($totalDuration / $orderCount) : 0;
        $avgCustomerSpend = $totalCustomers > 0 ? round($totalRevenue / $totalCustomers, 2) : 0;

        // 台桌统计
        $totalTables = Table::where('store_id', $this->storeId)
            ->where('status', '<>', 'maintenance')
            ->count();
        $occupiedTables = Table::where('store_id', $this->storeId)
            ->where('status', 'occupied')
            ->count();
        $occupancyRate = $totalTables > 0 ? round($occupiedTables / $totalTables * 100, 1) : 0;
        $uniqueTables = count($usedTables);
        $turnoverRate = $totalTables > 0 ? round($uniqueTables / $totalTables, 2) : 0;

        // 台桌利用率：实际使用时长 / (台数 × 区间小时数 × 60)
        $hoursInRange = max(1, (strtotime($this->endDt) - strtotime($this->startDt)) / 3600);
        $totalAvailableMinutes = $totalTables * $hoursInRange * 60;
        $tableUtilization = $totalAvailableMinutes > 0
            ? round($totalDuration / $totalAvailableMinutes * 100, 1)
            : 0;

        // 商品销售笔数
        $productSalesCount = OrderItem::alias('oi')
            ->join('busi_order o', 'oi.order_id = o.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->where('oi.item_type', 'product')
            ->whereNotIn('oi.status', ['cancelled', 'rejected', 'preorder_pending'])
            ->count();

        // 台费时长（分钟）— 使用已计算的 totalDuration
        $tableDurationMinutes = intval($totalDuration);

        // 助教时长（分钟）
        $assistantItems = OrderItem::alias('oi')
            ->join('busi_order o', 'oi.order_id = o.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->where('oi.item_type', 'assistant')
            ->whereNotIn('oi.status', ['cancelled', 'rejected'])
            ->field('oi.started_at, oi.ended_at, oi.delivered_at, oi.gift_hours, oi.billing_mode, oi.quantity')
            ->select();
        $assistantDurationMinutes = 0;
        foreach ($assistantItems as $ai) {
            if (empty($ai['started_at'])) continue; // 跳过无开始时间的记录
            if ($ai['billing_mode'] === 'flat_rate') {
                $assistantDurationMinutes += floatval($ai['quantity']) * 60;
            } else {
                $start = strtotime($ai['started_at']);
                $end = strtotime($ai['ended_at'] ?? $ai['delivered_at'] ?? date('Y-m-d H:i:s'));
                $assistantDurationMinutes += max(0, intval(($end - $start) / 60));
                $assistantDurationMinutes += floatval($ai['gift_hours']) * 60;
            }
        }
        $assistantDurationMinutes = intval($assistantDurationMinutes);

        // 外勤时长（小时）
        $outworkMinutes = EmployeeAttendance::where('store_id', $this->storeId)
            ->where('type', 'outwork')
            ->where('work_date', '>=', $this->startDt)
            ->where('work_date', '<=', $this->endDt)
            ->sum('work_hours');
        $outworkDurationMinutes = intval(floatval($outworkMinutes) * 60);

        return [
            'order_count'           => $orderCount,
            'total_duration_minutes' => $totalDuration,
            'avg_order_amount'     => $avgOrderAmount,
            'avg_customer_spend'   => $avgCustomerSpend,
            'avg_duration_minutes'  => $avgDuration,
            'total_customers'      => $totalCustomers,
            'total_tables'         => $totalTables,
            'occupied_tables'      => $occupiedTables,
            'occupancy_rate'       => $occupancyRate,
            'turnover_rate'        => $turnoverRate,
            'table_utilization'    => $tableUtilization,
            'product_sales_count'  => $productSalesCount,
            'table_duration_minutes'   => $tableDurationMinutes,
            'assistant_duration_minutes' => $assistantDurationMinutes,
            'outwork_duration_minutes'   => $outworkDurationMinutes,
            'meituan_duration_minutes' => 0,
            'douyin_duration_minutes'  => 0,
        ];
    }

    /**
     * 热销商品排行
     *
     * 统计当前期内所有已完成订单中的商品销售，
     * 按销售额降序返回 TOP N。
     *
     * @param int $limit 返回数量，默认10
     * @return array[] 每项包含 {rank, name, revenue, quantity}
     */
    public function productRank(int $limit = 10): array
    {
        $items = OrderItem::alias('oi')
            ->join('busi_order o', 'o.id = oi.order_id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->where('oi.item_type', 'product')
            ->whereNotIn('oi.status', ['cancelled', 'rejected', 'preorder_pending'])
            ->field('oi.item_name, SUM(oi.quantity) as total_qty, SUM(oi.final_price) as total_amount')
            ->group('oi.item_name')
            ->order('total_amount', 'desc')
            ->limit($limit)
            ->select();

        $result = [];
        $rank = 1;
        foreach ($items as $item) {
            $result[] = [
                'rank'     => $rank++,
                'name'     => $item['item_name'],
                'revenue'  => round((float)($item['total_amount'] ?? 0), 2),
                'quantity' => (int)($item['total_qty'] ?? 0),
            ];
        }
        return $result;
    }

    /**
     * 收入按支付渠道分布
     *
     * 统计当前期内所有已完成订单的支付金额按支付渠道分解。
     *
     * @return array[] 每项包含 {channel, revenue, order_count}
     */
    public function revenueByChannel(): array
    {
        // 统一从 order_payment 按 channel 聚合（含多支付、套餐券）
        return OrderPayment::alias('p')
            ->join('busi_order o', 'p.order_id = o.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->where('p.status', 'paid')
            ->group('p.channel')
            ->field('p.channel, SUM(p.amount) as revenue, COUNT(DISTINCT p.order_id) as order_count')
            ->select()
            ->toArray();
    }

    /**
     * 渠道收入明细（点击卡片钻取）
     * @param string $channel 渠道代码: cash/wechat/member_balance/coupon_meituan/...
     * @return array[]
     */
    public function revenueByChannelDetail(string $channel): array
    {
        return OrderPayment::alias('p')
            ->join('busi_order o', 'p.order_id = o.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->where('p.channel', $channel)
            ->where('p.status', 'paid')
            ->field('p.id, p.order_id, o.order_no, p.amount, p.paid_at, p.description')
            ->order('p.paid_at', 'desc')
            ->select()
            ->toArray();
    }

    /**
     * 收入按消费类型分布（桌台/商品/助教）
     *
     * @return array[] 每项包含 {item_type, revenue}
     */
    public function revenueByItemType(): array
    {
        return OrderItem::alias('oi')
            ->join('busi_order o', 'oi.order_id = o.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->whereNotIn('oi.status', ['cancelled', 'rejected', 'preorder_pending'])
            ->group('oi.item_type')
            ->field('oi.item_type, SUM(oi.final_price) as revenue, COUNT(DISTINCT oi.order_id) as order_count')
            ->select()
            ->toArray();
    }

    /**
     * 充值报表
     *
     * 统计当前期内会员充值按支付方式分解。
     *
     * @return array[] 每项包含 {channel, amount, count}
     */
    public function rechargeReport(): array
    {
        return MemberRecharge::where('store_id', $this->storeId)
            ->where('created_at', '>=', $this->startDt)
            ->where('created_at', '<=', $this->endDt)
            ->group('payment_method')
            ->field('payment_method as channel, SUM(amount) as amount, COUNT(*) as count')
            ->select()
            ->toArray();
    }

    /**
     * 收入项目明细（钻取）
     */
    public function revenueByItemTypeDetail(string $itemType): array
    {
        return OrderItem::alias('oi')
            ->join('busi_order o', 'oi.order_id = o.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'completed')
            ->where('o.start_time', '>=', $this->startDt)
            ->where('o.start_time', '<=', $this->endDt)
            ->where('oi.item_type', $itemType)
            ->whereNotIn('oi.status', ['cancelled', 'rejected', 'preorder_pending'])
            ->field('oi.id, oi.order_id, o.order_no, oi.item_name as name, oi.final_price as amount, oi.quantity, oi.created_at as paid_at')
            ->order('oi.created_at', 'desc')
            ->select()
            ->toArray();
    }

    /**
     * 充值明细（钻取）
     */
    public function rechargeReportDetail(string $channel): array
    {
        return MemberRecharge::where('store_id', $this->storeId)
            ->where('created_at', '>=', $this->startDt)
            ->where('created_at', '<=', $this->endDt)
            ->where('payment_method', $channel)
            ->field('id, member_id, order_no, payment_method as channel, amount, created_at as paid_at, remark as description')
            ->order('created_at', 'desc')
            ->select()
            ->toArray();
    }

    /**
     * 考勤报表
     *
     * 统计指定月份员工签到天数，可按员工类型筛选。
     *
     * @param string $month       月份 Y-m 格式，默认当前月
     * @param string $employeeType 员工类型筛选，默认 'all'
     * @return array[] 每项包含 {employee_id, employee_name, employee_type, sign_in_days, has_photos}
     */
    public function attendanceReport(string $month, string $employeeType = 'all'): array
    {
        $start = "{$month}-01";
        $end = date('Y-m-t', strtotime($start));

        $query = EmployeeAttendance::alias('a')
            ->join('busi_employee e', 'a.employee_id = e.id')
            ->where('a.store_id', $this->storeId)
            ->where('a.work_date', '>=', $start)
            ->where('a.work_date', '<=', $end);

        if ($employeeType !== 'all') {
            $query->where('a.employee_type', $employeeType);
        }

        return $query->group('a.employee_id, e.name, a.employee_type')
            ->field([
                'a.employee_id',
                'e.name as employee_name',
                'a.employee_type',
                'COUNT(DISTINCT CASE WHEN a.type=\'sign_in\' THEN a.work_date END) as sign_in_days',
                'MAX(a.has_photos) as has_photos',
            ])
            ->select()
            ->toArray();
    }

    /**
     * 助教薪资报表
     *
     * 统计指定月份每位助教的桌台时长、提成和应发薪资。
     * 根据提成模式（无底薪/有保底/底薪制）分别计算。
     *
     * @param string $month 月份 Y-m 格式，默认当前月
     * @return array[] 每项包含 {assistant_id, commission_mode, table_duration_hours, commission_total, base_or_guarantee, salary_total}
     */
    public function assistantSalary(string $month): array
    {
        $start = "{$month}-01";
        $end = date('Y-m-t', strtotime($start));
        $results = [];

        $configs = CommissionConfig::where('store_id', $this->storeId)
            ->where('status', 1)
            ->select();

        foreach ($configs as $config) {
            $assistantId = $config['assistant_id'];

            // === 上桌时长 = 服务时长(OrderItem) - 暂停时长(OrderPauseLog) ===

            // 1. 服务总时长：所有 assistant 类型 OrderItem 的计时
            $items = OrderItem::where('assistant_id', $assistantId)
                ->where('item_type', 'assistant')
                ->where('started_at', '>=', $start . ' 00:00:00')
                ->where('started_at', '<=', $end . ' 23:59:59')
                ->whereNotNull('started_at')
                ->select()
                ->toArray();
            $serviceSeconds = 0;
            foreach ($items as $item) {
                $endTime = $item['ended_at'] ?: date('Y-m-d H:i:s');
                $serviceSeconds += max(0, strtotime($endTime) - strtotime($item['started_at']));
            }

            // 2. 暂停总时长：该助教关联订单的 assistant 类型暂停
            $pauseSeconds = OrderPauseLog::alias('pl')
                ->join('busi_order_item oi', 'oi.order_id = pl.order_id AND oi.item_type = "assistant"')
                ->where('pl.pause_type', 'assistant')
                ->where('oi.assistant_id', $assistantId)
                ->where('pl.created_at', '>=', $start . ' 00:00:00')
                ->where('pl.created_at', '<=', $end . ' 23:59:59')
                ->sum('pl.duration_seconds');

            // 3. 实际上桌时长 = 服务时长 - 暂停时长
            $tableSeconds = max(0, ($serviceSeconds ?: 0) - ($pauseSeconds ?: 0));

            // 统计提成金额
            $commissionTotal = CommissionRecord::where('assistant_id', $assistantId)
                ->where('created_at', '>=', $start . ' 00:00:00')
                ->where('created_at', '<=', $end . ' 23:59:59')
                ->sum('commission_amount');

            $tableHours = ($tableSeconds ?: 0) / 3600;
            $mode = $config['commission_mode'];

            // 获取助教姓名
            $assistant = Assistant::where('id', $config['assistant_id'])->find();
            $assistantName = $assistant ? ($assistant['name'] ?? $assistant['nickname'] ?? '') : '';

            // 提成模式中文标签
            $modeLabels = [
                'no_guarantee' => '无保底',
                'with_guarantee' => '保底提成',
                'base_salary' => '固定底薪',
            ];
            $modeLabel = $modeLabels[$mode] ?? $mode;

            // 保底触发判断
            $guaranteeTriggered = false;
            $notes = '';
            if ($mode === 'with_guarantee') {
                $guaranteeHours = (float)($config['guarantee_hours'] ?: 0);
                if ($tableHours < $guaranteeHours) {
                    $guaranteeTriggered = true;
                    $notes = "上桌" . round($tableHours, 2) . "h < 保底{$guaranteeHours}h，触发保底";
                }
            }

            $salary = match ($mode) {
                'no_guarantee' => (float)$commissionTotal,
                'with_guarantee' => ($tableHours >= ($config['guarantee_hours'] ?: 0))
                    ? (float)$commissionTotal
                    : (float)($config['guarantee_amount'] ?: 0),
                'base_salary' => (float)($config['base_salary'] ?: 0) + (float)$commissionTotal,
                default => (float)$commissionTotal,
            };

            // 外勤时长
            $outworkSeconds = EmployeeAttendance::where('employee_id', $config['assistant_id'])
                ->where('type', 'outwork')
                ->where('work_date', '>=', $start)
                ->where('work_date', '<=', $end)
                ->sum('work_hours');
            $outworkHours = ($outworkSeconds ?: 0);

            // 赠送时长（客户加钟）
            $giftHours = OrderItem::where('assistant_id', $assistantId)
                ->where('item_type', 'assistant')
                ->where('started_at', '>=', $start . ' 00:00:00')
                ->where('started_at', '<=', $end . ' 23:59:59')
                ->sum('gift_hours');
            $giftHours = round(floatval($giftHours), 2);

            $results[] = [
                'assistant_id'           => $config['assistant_id'],
                'assistant_name'         => $assistantName,
                'commission_mode'        => $mode,
                'commission_mode_label'  => $modeLabel,
                'table_hours'            => round($tableHours, 2),
                'overtime_hours'         => $giftHours,
                'outwork_hours'          => round((float)$outworkHours, 2),
                'commission_total'       => round((float)$commissionTotal, 2),
                'base_or_guarantee'      => $mode === 'base_salary'
                    ? (float)($config['base_salary'] ?: 0)
                    : (float)($config['guarantee_amount'] ?: 0),
                'salary_total'           => round($salary, 2),
                'guarantee_triggered'    => $guaranteeTriggered,
                'notes'                  => $notes,
                'status'                 => 'pending',
            ];
        }

        return $results;
    }

    /**
     * Employee recharge report — aggregate busi_member_recharge by date
     */
    public static function employeeRecharge(string $storeId, string $startDate, string $endDate): array
    {
        $list = \app\common\model\merchant\MemberRecharge::where('store_id', $storeId)
            ->whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->field("DATE(created_at) as recharge_date, SUM(amount) as total_amount, COUNT(*) as recharge_count, COUNT(DISTINCT operator_id) as operator_count")
            ->group('recharge_date')
            ->order('recharge_date', 'desc')
            ->select()
            ->toArray();

        $totalAmount = 0;
        $totalCount = 0;

        foreach ($list as &$item) {
            $totalAmount += $item['total_amount'];
            $totalCount += $item['recharge_count'];
        }

        return [
            'summary' => [
                'total_amount' => round($totalAmount, 2),
                'total_count' => $totalCount,
            ],
            'list' => $list,
        ];
    }

    /**
     * Assistant product sales report — equal-split products among assistants on same order
     */
    public static function assistantProductSales(string $storeId, string $startDate, string $endDate): array
    {
        // Step 1: Get all orders with assistant items in date range
        $orderAssistants = OrderItem::alias('oi')
            ->join('bi_busi_order o', 'oi.order_id = o.id')
            ->where('oi.item_type', 'assistant')
            ->where('oi.status', 'not in', ['cancelled', 'rejected'])
            ->where('o.store_id', $storeId)
            ->whereBetween('o.created_at', [$startDate, $endDate . ' 23:59:59'])
            ->field('oi.order_id, oi.assistant_id')
            ->select()
            ->toArray();

        // Build order -> assistant mapping
        $orderAssistMap = [];
        foreach ($orderAssistants as $row) {
            $orderAssistMap[$row['order_id']][] = $row['assistant_id'];
        }

        if (empty($orderAssistMap)) {
            return ['summary' => ['total_amount' => 0, 'assistant_count' => 0], 'list' => []];
        }

        $orderIds = array_keys($orderAssistMap);
        $allAssistIds = array_unique(array_merge(...array_values($orderAssistMap)));

        // Get assistant -> name -> employee mapping
        $assistants = Assistant::whereIn('id', $allAssistIds)
            ->field('id, name, employee_id')
            ->select()
            ->toArray();
        $assistEmployeeMap = [];
        $assistantNames = [];
        foreach ($assistants as $a) {
            $assistantNames[$a['id']] = $a['name'];
            $assistEmployeeMap[$a['id']] = $a['employee_id'];
        }

        $employeeIds = array_values($assistEmployeeMap);
        $employees = Employee::whereIn('id', $employeeIds)
            ->field('id, name, role')
            ->select()
            ->toArray();
        $employeeMap = [];
        foreach ($employees as $e) {
            $employeeMap[$e['id']] = ['name' => $e['name'], 'role' => $e['role']];
        }

        // Step 2: Get product items for these orders
        $products = OrderItem::whereIn('order_id', $orderIds)
            ->where('item_type', 'product')
            ->field('order_id, item_name, unit_price, quantity, final_price')
            ->select()
            ->toArray();

        // Step 3: Equal split — each product amount divided by N assistants on that order
        $assistantSales = [];
        foreach ($products as $p) {
            $orderId = $p['order_id'];
            $assistIds = $orderAssistMap[$orderId] ?? [];
            $n = count($assistIds);
            if ($n === 0) continue;

            $splitAmount = round($p['final_price'] / $n, 2);

            foreach ($assistIds as $aid) {
                if (!isset($assistantSales[$aid])) {
                    $assistantSales[$aid] = ['total' => 0, 'products' => []];
                }
                $assistantSales[$aid]['total'] += $splitAmount;

                $key = $p['item_name'] . '|' . $p['unit_price'];
                if (!isset($assistantSales[$aid]['products'][$key])) {
                    $assistantSales[$aid]['products'][$key] = [
                        'product_name' => $p['item_name'],
                        'quantity' => 0,
                        'unit_price' => round($p['unit_price'], 2),
                        'total' => 0,
                        'split_amount' => 0,
                        'split_count' => $n,
                    ];
                }
                $assistantSales[$aid]['products'][$key]['quantity'] += $p['quantity'];
                $assistantSales[$aid]['products'][$key]['total'] += round($p['final_price'], 2);
                $assistantSales[$aid]['products'][$key]['split_amount'] += $splitAmount;
            }
        }

        // Build response list
        $list = [];
        $grandTotal = 0;
        foreach ($assistantSales as $aid => $data) {
            $empId = $assistEmployeeMap[$aid] ?? '';
            $emp = $employeeMap[$empId] ?? ['name' => $assistantNames[$aid] ?? '未知', 'role' => 'assistant'];

            $totalAmount = round($data['total'], 2);
            $grandTotal += $totalAmount;
            $products = array_values($data['products']);
            $productCount = array_sum(array_column($products, 'quantity'));

            foreach ($products as &$prod) {
                $prod['total'] = round($prod['total'], 2);
                $prod['split_amount'] = round($prod['split_amount'], 2);
                if ($prod['split_count'] > 1) {
                    $prod['split_label'] = '分摊 1/' . $prod['split_count'];
                } else {
                    $prod['split_label'] = '';
                }
            }

            $list[] = [
                'assistant_id' => $aid,
                'employee_name' => $emp['name'],
                'role' => $emp['role'],
                'total_amount' => $totalAmount,
                'product_count' => $productCount,
                'products' => $products,
            ];
        }

        // Sort by total_amount descending
        usort($list, function ($a, $b) {
            return $b['total_amount'] - $a['total_amount'];
        });

        return [
            'summary' => [
                'total_amount' => round($grandTotal, 2),
                'assistant_count' => count($list),
            ],
            'list' => $list,
        ];
    }
}
