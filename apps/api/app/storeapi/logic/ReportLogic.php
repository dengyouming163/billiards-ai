<?php

declare (strict_types=1);

namespace app\storeapi\logic;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use app\common\model\merchant\Product;
use app\common\model\merchant\Member;
use app\common\model\merchant\MemberRecharge;
use app\common\model\merchant\Assistant;
use app\storeapi\logic\StatisticsHelper;
use think\facade\Log;

class ReportLogic extends BaseLogic
{
    public static function getOverview(array $params, string $storeId)
    {
        try {
            $dateRange = $params['dateRange'] ?? 'week';
            $dr = StatisticsHelper::calcDateRange($dateRange);

            $startTime = $dr['startDate'];
            $endTime = $dr['endDate'];
            $lastStartTime = $dr['lastStart'];
            $lastEndTime = $dr['lastEnd'];
            $daysInRange = $dr['daysInRange'];

            $totalRevenue = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $startTime)
                ->where('created_at', '<=', $endTime)
                ->sum('final_amount') ?? 0;

            $totalOrders = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $startTime)
                ->where('created_at', '<=', $endTime)
                ->count();

            $totalMinutes = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $startTime)
                ->where('created_at', '<=', $endTime)
                ->sum('duration_minutes') ?? 0;
            $totalHours = $totalMinutes / 60;

            $totalProductSales = Order::where('store_id', $storeId)
                ->where('type', 'product')
                ->where('status', 'completed')
                ->where('created_at', '>=', $startTime)
                ->where('created_at', '<=', $endTime)
                ->sum('final_amount') ?? 0;

            $tableCount = Table::where('store_id', $storeId)
                ->where('status', 1)
                ->count();
            
            $avgUtilization = StatisticsHelper::calcUtilization($totalHours, $tableCount, $daysInRange);

            $avgOrderAmount = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

            $lastRevenue = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $lastStartTime)
                ->where('created_at', '<=', $lastEndTime)
                ->sum('final_amount') ?? 0;

            $growthRate = StatisticsHelper::calcGrowthRate($totalRevenue, $lastRevenue);

            return [
                'total_revenue' => $totalRevenue,
                'totalRevenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'totalOrders' => $totalOrders,
                'total_hours' => round($totalHours, 1),
                'totalHours' => round($totalHours, 1),
                'avg_utilization' => round($avgUtilization, 1),
                'avgUtilization' => round($avgUtilization, 1),
                'avg_order_amount' => round($avgOrderAmount, 2),
                'avgOrderAmount' => round($avgOrderAmount, 2),
                'total_product_sales' => $totalProductSales,
                'totalProductSales' => $totalProductSales,
                'growth_rate' => round($growthRate, 1),
                'growthRate' => round($growthRate, 1),
        ];
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getRevenueTrend(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-6 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');

            $result = StatisticsHelper::queryRevenueTrend($storeId, $startDate, $endDate);

            $weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            $trend = [];
            
            $dailyProductSales = Order::where('store_id', $storeId)
                ->where('type', 'product')
                ->where('status', 'completed')
                ->where('created_at', '>=', $startDate . ' 00:00:00')
                ->where('created_at', '<=', $endDate . ' 23:59:59')
                ->field("DATE(created_at) as sale_date, SUM(final_amount) as total_sales")
                ->group("DATE(created_at)")
                ->select()
                ->toArray();

            $productSalesMap = [];
            foreach ($dailyProductSales as $ps) {
                $productSalesMap[$ps['sale_date']] = (float)$ps['total_sales'];
            }

            foreach ($result as $item) {
                $dayOfWeek = date('w', strtotime($item['date']));
                $dayName = $dayOfWeek == 0 ? '周日' : $weekDays[$dayOfWeek - 1];
                
                $productSales = $productSalesMap[$item['date']] ?? 0;

                $trend[] = [
                    'date' => $dayName,
                    'dateValue' => $item['date'],
                    'revenue' => $item['revenue'],
                    'orders' => $item['orders'],
                    'tableHours' => round(($item['tableMinutes'] ?? 0) / 60, 1),
                    'productSales' => $productSales,
                ];
            }

            return $trend;
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getTableUsage(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-6 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');

            $tableOrders = Order::where('store_id', $storeId)
                ->where('type', 'table')
                ->where('status', 'completed')
                ->where('created_at', '>=', $startDate . ' 00:00:00')
                ->where('created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'table_id',
                    'SUM(final_amount) as revenue',
                    'SUM(duration_minutes) as minutes',
                    'COUNT(id) as orderCount',
                ])
                ->group('table_id')
                ->select();

            $tables = Table::where('store_id', $storeId)
                ->column('number', 'id');

            $result = [];
            foreach ($tableOrders as $item) {
                $tableNumber = $tables[$item['table_id']] ?? '未知台桌';
                $hours = ($item['minutes'] ?? 0) / 60;
                $start = \DateTime::createFromFormat('Y-m-d', $startDate);
                $end = \DateTime::createFromFormat('Y-m-d', $endDate);
                $days = max(1, (int)$start->diff($end)->days + 1);
                $utilization = ($hours / ($days * 24)) * 100;
                
                $result[] = [
                    'tableId' => $item['table_id'],
                    'tableNumber' => $tableNumber,
                    'utilization' => round($utilization, 0),
                    'hours' => round($hours, 1),
                    'revenue' => $item['revenue'],
                    'orderCount' => $item['orderCount'],
                ];
            }

            usort($result, function ($a, $b) {
                return $b['utilization'] - $a['utilization'];
            });

            return $result;
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getProductRank(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-6 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');
            $limit = (int)($params['limit'] ?? 10);

            $result = OrderItem::alias('oi')
                ->join(Product::getTable() . ' p', 'oi.product_id = p.id')
                ->join(Order::getTable() . ' o', 'oi.order_id = o.id')
                ->where('o.store_id', $storeId)
                ->where('o.status', 'completed')
                ->where('o.created_at', '>=', $startDate . ' 00:00:00')
                ->where('o.created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'p.id as productId',
                    'p.name as productName',
                    'SUM(oi.quantity) as salesCount',
                    'SUM(oi.unit_price * oi.quantity) as salesAmount',
                ])
                ->group('p.id')
                ->order('salesAmount', 'desc')
                ->limit($limit)
                ->select();

            $lastDr = StatisticsHelper::calcDateRange($params['dateRange'] ?? 'week');
            $previousSales = OrderItem::alias('oi')
                ->join(Order::getTable() . ' o', 'oi.order_id = o.id')
                ->where('o.store_id', $storeId)
                ->where('o.status', 'completed')
                ->where('o.created_at', '>=', $lastDr['lastStart'])
                ->where('o.created_at', '<=', $lastDr['lastEnd'])
                ->field('oi.product_id, SUM(oi.quantity) as prev_count')
                ->group('oi.product_id')
                ->select()
                ->toArray();

            $prevMap = [];
            foreach ($previousSales as $ps) {
                $prevMap[$ps['product_id']] = (int)$ps['prev_count'];
            }

            foreach ($result as &$item) {
                $prev = $prevMap[$item['productId']] ?? 0;
                $curr = (int)$item['salesCount'];
                if ($prev > 0) {
                    $change = round(($curr - $prev) / $prev * 100, 1);
                    $item['trend'] = ($change >= 0 ? '+' : '') . $change . '%';
                } elseif ($curr > 0) {
                    $item['trend'] = 'NEW';
                } else {
                    $item['trend'] = '-';
                }
            }

            return $result->toArray();
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getMemberStats(string $storeId)
    {
        try {
            $totalMembers = Member::where('store_id', $storeId)
                ->where('status', 1)
                ->count();

            $newMembers = Member::where('store_id', $storeId)
                ->where('status', 1)
                ->whereMonth('created_at', date('m'))
                ->whereYear('created_at', date('Y'))
                ->count();

            $totalRecharge = MemberRecharge::where('store_id', $storeId)
                ->sum('amount') ?? 0;

            $totalConsume = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->whereNotNull('member_id')
                ->sum('final_amount') ?? 0;

            return [
                'totalMembers' => $totalMembers,
                'newMembers' => $newMembers,
                'totalRecharge' => $totalRecharge,
                'totalConsume' => $totalConsume,
            ];
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getMemberRank(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-30 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');
            $limit = (int)($params['limit'] ?? 10);

            $result = Order::alias('o')
                ->join(Member::getTable() . ' m', 'o.member_id = m.id')
                ->where('o.store_id', $storeId)
                ->where('o.status', 'completed')
                ->where('o.created_at', '>=', $startDate . ' 00:00:00')
                ->where('o.created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'm.id as memberId',
                    'm.name',
                    'm.level_id as level',
                    'SUM(o.final_amount) as consume',
                    'COUNT(o.id) as orders',
                    'MAX(o.created_at) as lastVisit',
                ])
                ->group('m.id')
                ->order('consume', 'desc')
                ->limit($limit)
                ->select();

            foreach ($result as &$item) {
                $item['lastVisit'] = date('Y-m-d', strtotime($item['lastVisit']));
            }

            return $result->toArray();
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getAssistantRank(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-30 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');
            $limit = (int)($params['limit'] ?? 10);

            $result = Order::alias('o')
                ->join(Assistant::getTable() . ' a', 'o.assistant_id = a.id')
                ->where('o.store_id', $storeId)
                ->where('o.type', 'assistant')
                ->where('o.status', 'completed')
                ->where('o.created_at', '>=', $startDate . ' 00:00:00')
                ->where('o.created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'a.id as assistantId',
                    'a.name',
                    'a.level_id as level',
                    'SUM(o.duration_minutes) as minutes',
                    'SUM(o.final_amount) as revenue',
                    'COUNT(o.id) as orders',
                ])
                ->group('a.id')
                ->order('revenue', 'desc')
                ->limit($limit)
                ->select();

            $resultArr = $result->toArray();
            $assistantIds = array_column($resultArr, 'assistantId');
            $ratings = [];
            if (!empty($assistantIds)) {
                try {
                    $ratingData = \think\facade\Db::name('busi_coach_record')
                        ->whereIn('coach_id', $assistantIds)
                        ->where('created_at', '>=', $startDate . ' 00:00:00')
                        ->where('created_at', '<=', $endDate . ' 23:59:59')
                        ->where('rating', '>', 0)
                        ->field('coach_id, AVG(rating) as avg_rating')
                        ->group('coach_id')
                        ->select()
                        ->toArray();
                    foreach ($ratingData as $r) {
                        $ratings[$r['coach_id']] = round((float)$r['avg_rating'], 1);
                    }
                } catch (\Exception $e) {
                    Log::warning('ReportLogic: 无法查询助教评分表: ' . $e->getMessage());
                }
            }

            foreach ($result as &$item) {
                $item['rating'] = $ratings[$item['assistantId']] ?? null;
                $item['hours'] = round(($item['minutes'] ?? 0) / 60, 1);
            }

            return $result->toArray();
        } catch (\Exception $e) {
            Log::error('ReportLogic: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取报表数据失败，请稍后重试');
        }
    }

    public static function getTimeAnalysis(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-6 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');

            $result = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $startDate . ' 00:00:00')
                ->where('created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'HOUR(created_at) as hour',
                    'SUM(final_amount) as revenue',
                    'COUNT(id) as orders',
                ])
                ->group('HOUR(created_at)')
                ->order('hour')
                ->select()
                ->toArray();

            $timeLabels = [
                0 => '00:00-01:00', 1 => '01:00-02:00', 2 => '02:00-03:00', 3 => '03:00-04:00',
                4 => '04:00-05:00', 5 => '05:00-06:00', 6 => '06:00-07:00', 7 => '07:00-08:00',
                8 => '08:00-09:00', 9 => '09:00-10:00', 10 => '10:00-11:00', 11 => '11:00-12:00',
                12 => '12:00-13:00', 13 => '13:00-14:00', 14 => '14:00-15:00', 15 => '15:00-16:00',
                16 => '16:00-17:00', 17 => '17:00-18:00', 18 => '18:00-19:00', 19 => '19:00-20:00',
                20 => '20:00-21:00', 21 => '21:00-22:00', 22 => '22:00-23:00', 23 => '23:00-24:00',
            ];

            $analysis = [];
            foreach ($result as $row) {
                $hour = (int)$row['hour'];
                $analysis[] = [
                    'time' => $timeLabels[$hour] ?? ($hour . ':00-' . ($hour + 1) . ':00'),
                    'label' => $hour . ':00',
                    'revenue' => (float)$row['revenue'],
                    'orders' => (int)$row['orders'],
                ];
            }

            return $analysis;
        } catch (\Exception $e) {
            Log::error('ReportLogic::getTimeAnalysis: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取时段分析失败，请稍后重试');
        }
    }
}