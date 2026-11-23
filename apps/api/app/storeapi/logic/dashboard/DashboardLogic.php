<?php

declare (strict_types=1);

namespace app\storeapi\logic\dashboard;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\Table;
use app\common\model\merchant\Member;
use app\storeapi\logic\StatisticsHelper;
use think\facade\Log;

class DashboardLogic extends BaseLogic
{
    private const CATEGORY_NAMES = [
        'table' => '台桌收入',
        'product' => '商品收入',
        'assistant' => '助教收入',
        'package' => '套餐收入',
    ];

    private const CATEGORY_COLORS = [
        'table' => '#10B981',
        'product' => '#3B82F6',
        'assistant' => '#F59E0B',
        'package' => '#8B5CF6',
    ];
    public static function getStats(string $storeId)
    {
        try {
            $today = date('Y-m-d');
            $todayStart = $today . ' 00:00:00';
            $todayEnd = $today . ' 23:59:59';
            
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $yesterdayStart = $yesterday . ' 00:00:00';
            $yesterdayEnd = $yesterday . ' 23:59:59';

            $todayRevenue = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $todayStart)
                ->where('created_at', '<=', $todayEnd)
                ->sum('final_amount') ?? 0;

            $yesterdayRevenue = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $yesterdayStart)
                ->where('created_at', '<=', $yesterdayEnd)
                ->sum('final_amount') ?? 0;

            $revenueChange = $yesterdayRevenue > 0 
                ? (($todayRevenue - $yesterdayRevenue) / $yesterdayRevenue * 100) 
                : 0;

            $tablesInUse = Table::where('store_id', $storeId)
                ->where('status', 'occupied')
                ->count();

            $totalTables = Table::where('store_id', $storeId)
                ->where('status', '<>', 'deleted')
                ->count();

            $totalMembers = Member::where('store_id', $storeId)
                ->where('status', 1)
                ->count();

            $activeOrders = Order::where('store_id', $storeId)
                ->where('status', 'processing')
                ->count();

            return [
                'today_revenue' => $todayRevenue,
                'todayRevenue' => $todayRevenue,
                'yesterday_revenue' => $yesterdayRevenue,
                'yesterdayRevenue' => $yesterdayRevenue,
                'revenue_change' => round($revenueChange, 1),
                'revenueChange' => round($revenueChange, 1),
                'tables_in_use' => $tablesInUse,
                'tablesInUse' => $tablesInUse,
                'total_tables' => $totalTables,
                'totalTables' => $totalTables,
                'total_members' => $totalMembers,
                'totalMembers' => $totalMembers,
                'active_orders' => $activeOrders,
                'activeOrders' => $activeOrders,
            ];
        } catch (\Exception $e) {
            Log::error('DashboardLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取仪表盘数据失败，请稍后重试');
        }
    }

    public static function getOverview(string $storeId)
    {
        try {
            $stats = self::getStats($storeId);
            if ($stats === false) {
                return false;
            }

            $revenueTrend = self::getRevenueTrend($storeId, []);
            if ($revenueTrend === false) {
                return false;
            }

            $revenueComposition = self::getRevenueComposition($storeId, []);
            if ($revenueComposition === false) {
                return false;
            }

            return [
                ...$stats,
                'revenueTrend' => $revenueTrend,
                'revenueComposition' => $revenueComposition,
            ];
        } catch (\Exception $e) {
            Log::error('DashboardLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取仪表盘数据失败，请稍后重试');
        }
    }

    public static function getRevenueTrend(string $storeId, array $params)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-6 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');

            $result = StatisticsHelper::queryRevenueTrend($storeId, $startDate, $endDate);

            $weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            $trend = [];

            foreach ($result as $item) {
                $dayOfWeek = date('w', strtotime($item['date']));
                $dayName = $dayOfWeek == 0 ? '周日' : $weekDays[$dayOfWeek - 1];

                $trend[] = [
                    'date' => $dayName,
                    'dateValue' => $item['date'],
                    'revenue' => $item['revenue'] ?? 0,
                    'orders' => $item['orders'] ?? 0,
                ];
            }

            return $trend;
        } catch (\Exception $e) {
            Log::error('DashboardLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取仪表盘数据失败，请稍后重试');
        }
    }

    public static function getRevenueComposition(string $storeId, array $params)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-6 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');

            $result = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $startDate . ' 00:00:00')
                ->where('created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'type',
                    'SUM(`final_amount`) as amount',
                ])
                ->group('type')
                ->select()
                ->toArray();

            $totalAmount = array_sum(array_column($result, 'amount'));

            $categoryNames = self::CATEGORY_NAMES;
            $colors = self::CATEGORY_COLORS;

            $composition = [];
            foreach ($result as $item) {
                $percentage = $totalAmount > 0 ? ($item['amount'] / $totalAmount * 100) : 0;
                $composition[] = [
                    'name' => $categoryNames[$item['type']] ?? '其他收入',
                    'value' => round($percentage, 1),
                    'amount' => $item['amount'],
                    'color' => $colors[$item['type']] ?? '#6B7280',
                ];
            }

            usort($composition, function ($a, $b) {
                return $b['value'] - $a['value'];
            });

            return $composition;
        } catch (\Exception $e) {
            Log::error('DashboardLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取仪表盘数据失败，请稍后重试');
        }
    }
}