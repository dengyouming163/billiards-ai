<?php

declare(strict_types=1);

namespace app\storeapi\logic;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;

class StatisticsHelper extends BaseLogic
{
    /**
     * 统一日期范围计算
     * @return array{startDate:string,endDate:string,lastStart:string,lastEnd:string,daysInRange:int}
     */
    public static function calcDateRange(string $range): array
    {
        $today = date('Y-m-d');

        $dateMap = [
            'today' => [$today . ' 00:00:00', $today . ' 23:59:59'],
            'week'  => [date('Y-m-d', strtotime('-6 day')) . ' 00:00:00', $today . ' 23:59:59'],
            'month' => [date('Y-m-01') . ' 00:00:00', date('Y-m-t') . ' 23:59:59'],
            'year'  => [date('Y-01-01') . ' 00:00:00', $today . ' 23:59:59'],
        ];

        $daysMap = ['today' => 1, 'week' => 7, 'month' => (int)date('t'), 'year' => (int)date('z') + 1];

        $range0 = $dateMap[$range] ?? $dateMap['week'];

        $lastMap = [
            'today' => [date('Y-m-d', strtotime('-1 day')) . ' 00:00:00', date('Y-m-d', strtotime('-1 day')) . ' 23:59:59'],
            'week'  => [date('Y-m-d', strtotime('-13 day')) . ' 00:00:00', date('Y-m-d', strtotime('-7 day')) . ' 23:59:59'],
            'month' => [date('Y-m-01', strtotime('-1 month')) . ' 00:00:00', date('Y-m-t', strtotime('-1 month')) . ' 23:59:59'],
            'year'  => [date('Y-01-01', strtotime('-1 year')) . ' 00:00:00', date('Y-12-31', strtotime('-1 year')) . ' 23:59:59'],
        ];
        $last = $lastMap[$range] ?? $lastMap['week'];

        return [
            'startDate'   => $range0[0],
            'endDate'     => $range0[1],
            'lastStart'   => $last[0],
            'lastEnd'     => $last[1],
            'daysInRange' => $daysMap[$range] ?? 7,
        ];
    }

    /**
     * 统一营收趋势查询（消除 ReportLogic/DashboardLogic 两份重复）
     */
    public static function queryRevenueTrend(string $storeId, string $startDate, string $endDate): array
    {
        $result = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $startDate . ' 00:00:00')
            ->where('created_at', '<=', $endDate . ' 23:59:59')
            ->field([
                'DATE(`created_at`) as date',
                'SUM(`final_amount`) as revenue',
                'COUNT(`id`) as orders',
                'SUM(`duration_minutes`) as tableMinutes',
            ])
            ->group('date')
            ->order('date')
            ->select();

        return $result ? $result->toArray() : [];
    }

    /**
     * 利用率统一计算（动态天数）
     */
    public static function calcUtilization(float $totalHours, int $tableCount, int $daysInRange): float
    {
        if ($tableCount === 0 || $daysInRange === 0) {
            return 0.0;
        }
        return round(($totalHours / ($tableCount * 24 * $daysInRange)) * 100, 1);
    }

    /**
     * 环比增长率统一计算
     */
    public static function calcGrowthRate(float $current, float $previous): float
    {
        if ($previous <= 0) {
            return 0.0;
        }
        return round((($current - $previous) / $previous) * 100, 1);
    }
}
