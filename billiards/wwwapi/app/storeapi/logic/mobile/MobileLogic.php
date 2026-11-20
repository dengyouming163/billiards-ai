<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\EmployeeAttendance;
use app\common\model\merchant\EmployeeSchedule;
use app\common\model\merchant\AssistantOrder;
use app\common\model\merchant\Notification;
use app\common\model\merchant\Table;
use app\common\model\merchant\Employee;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\OrderItem;
use think\facade\Db;

class MobileLogic extends BaseLogic
{
    public static function getDashboardStats($storeId, $dateType = 'today', $startDate = null, $endDate = null)
    {
        $dateRange = self::parseDateRange($dateType, $startDate, $endDate);
        
        $revenue = self::getRevenueStats($storeId, $dateRange);
        $kpi = self::getKPIStats($storeId, $dateRange);
        $trend = self::getTrendData($storeId, $dateRange);
        $hotProducts = self::getHotProducts($storeId, $dateRange);
        $staffStats = self::getStaffStats($storeId, $dateRange);
        $pendingTasks = self::getPendingTasks($storeId);

        return [
            'date_range' => [
                'date_type' => $dateType,
                'start_date' => substr($dateRange['start'], 0, 10),
                'end_date' => substr($dateRange['end'], 0, 10),
                'label' => $dateRange['label']
            ],
            'revenue' => $revenue,
            'kpi' => $kpi,
            'trend' => $trend,
            'hot_products' => $hotProducts,
            'staff_stats' => $staffStats,
            'pending_tasks' => $pendingTasks
        ];
    }

    private static function parseDateRange($dateType, $startDate = null, $endDate = null)
    {
        $now = date('Y-m-d H:i:s');
        $today = date('Y-m-d');
        
        switch ($dateType) {
            case 'today':
                return [
                    'start' => $today . ' 00:00:00',
                    'end' => $today . ' 23:59:59',
                    'label' => '今日',
                    'last_period_start' => date('Y-m-d', strtotime('-1 day')) . ' 00:00:00',
                    'last_period_end' => date('Y-m-d', strtotime('-1 day')) . ' 23:59:59'
                ];
            case 'yesterday':
                $yesterday = date('Y-m-d', strtotime('-1 day'));
                return [
                    'start' => $yesterday . ' 00:00:00',
                    'end' => $yesterday . ' 23:59:59',
                    'label' => '昨日',
                    'last_period_start' => date('Y-m-d', strtotime('-2 day')) . ' 00:00:00',
                    'last_period_end' => date('Y-m-d', strtotime('-2 day')) . ' 23:59:59'
                ];
            case 'week':
                $weekStart = date('Y-m-d', strtotime('monday this week'));
                return [
                    'start' => $weekStart . ' 00:00:00',
                    'end' => $now,
                    'label' => '本周',
                    'last_period_start' => date('Y-m-d', strtotime('monday last week')) . ' 00:00:00',
                    'last_period_end' => date('Y-m-d', strtotime('sunday last week')) . ' 23:59:59'
                ];
            case 'last_week':
                $lastWeekStart = date('Y-m-d', strtotime('monday last week'));
                $lastWeekEnd = date('Y-m-d', strtotime('sunday last week'));
                return [
                    'start' => $lastWeekStart . ' 00:00:00',
                    'end' => $lastWeekEnd . ' 23:59:59',
                    'label' => '上周',
                    'last_period_start' => date('Y-m-d', strtotime('monday -2 week')) . ' 00:00:00',
                    'last_period_end' => date('Y-m-d', strtotime('sunday -2 week')) . ' 23:59:59'
                ];
            case 'month':
                $monthStart = date('Y-m-01');
                return [
                    'start' => $monthStart . ' 00:00:00',
                    'end' => $now,
                    'label' => '本月',
                    'last_period_start' => date('Y-m-01', strtotime('-1 month')) . ' 00:00:00',
                    'last_period_end' => date('Y-m-t', strtotime('-1 month')) . ' 23:59:59'
                ];
            case 'last_month':
                $lastMonthStart = date('Y-m-01', strtotime('-1 month'));
                $lastMonthEnd = date('Y-m-t', strtotime('-1 month'));
                return [
                    'start' => $lastMonthStart . ' 00:00:00',
                    'end' => $lastMonthEnd . ' 23:59:59',
                    'label' => '上月',
                    'last_period_start' => date('Y-m-01', strtotime('-2 month')) . ' 00:00:00',
                    'last_period_end' => date('Y-m-t', strtotime('-2 month')) . ' 23:59:59'
                ];
            case 'custom':
            default:
                return [
                    'start' => $startDate . ' 00:00:00',
                    'end' => $endDate . ' 23:59:59',
                    'label' => $startDate . ' ~ ' . $endDate,
                    'last_period_start' => null,
                    'last_period_end' => null
                ];
        }
    }

    private static function getRevenueStats($storeId, $dateRange)
    {
        $result = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $dateRange['start'])
            ->where('created_at', '<=', $dateRange['end'])
            ->field([
                'type',
                'SUM(`final_amount`) as amount',
                'COUNT(`id`) as count'
            ])
            ->group('type')
            ->select()
            ->toArray();

        $revenue = [
            'table_revenue' => 0,
            'assistant_revenue' => 0,
            'product_revenue' => 0,
            'package_revenue' => 0,
            'total_revenue' => 0,
            'order_count' => 0,
            'last_period_revenue' => 0,
            'revenue_change' => 0
        ];

        foreach ($result as $item) {
            switch ($item['type']) {
                case 'table':
                    $revenue['table_revenue'] = round($item['amount'], 2);
                    break;
                case 'assistant':
                    $revenue['assistant_revenue'] = round($item['amount'], 2);
                    break;
                case 'product':
                    $revenue['product_revenue'] = round($item['amount'], 2);
                    break;
                case 'package':
                    $revenue['package_revenue'] = round($item['amount'], 2);
                    break;
            }
            $revenue['order_count'] += $item['count'];
        }

        $revenue['total_revenue'] = round(
            $revenue['table_revenue'] + $revenue['assistant_revenue'] + 
            $revenue['product_revenue'] + $revenue['package_revenue'], 2
        );

        if ($dateRange['last_period_start']) {
            $lastPeriodRevenue = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $dateRange['last_period_start'])
                ->where('created_at', '<=', $dateRange['last_period_end'])
                ->sum('final_amount');
            
            $revenue['last_period_revenue'] = round($lastPeriodRevenue, 2);
            
            if ($lastPeriodRevenue > 0) {
                $revenue['revenue_change'] = round(
                    ($revenue['total_revenue'] - $lastPeriodRevenue) / $lastPeriodRevenue * 100, 2
                );
            }
        }

        return $revenue;
    }

    private static function getKPIStats($storeId, $dateRange)
    {
        $occupiedTables = Table::where('store_id', $storeId)
            ->where('status', 'occupied')
            ->count();

        $totalTables = Table::where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->count();

        $completedOrders = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $dateRange['start'])
            ->where('created_at', '<=', $dateRange['end'])
            ->count();

        $totalRevenue = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $dateRange['start'])
            ->where('created_at', '<=', $dateRange['end'])
            ->sum('final_amount');

        $occupancyRate = $totalTables > 0 ? round($occupiedTables / $totalTables * 100, 1) : 0;
        $turnoverRate = $totalTables > 0 ? round($completedOrders / $totalTables, 1) : 0;
        $avgCustomerSpend = $completedOrders > 0 ? round($totalRevenue / $completedOrders, 2) : 0;

        $tableUtilization = 0;
        if ($totalTables > 0) {
            $totalHours = 0;
            $usedHours = 0;
            $orders = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $dateRange['start'])
                ->where('created_at', '<=', $dateRange['end'])
                ->field(['start_time', 'end_time'])
                ->select()
                ->toArray();
            
            foreach ($orders as $order) {
                if ($order['start_time'] && $order['end_time']) {
                    $start = strtotime($order['start_time']);
                    $end = strtotime($order['end_time']);
                    if ($start && $end) {
                        $usedHours += ($end - $start) / 3600;
                    }
                }
            }
            
            $duration = (strtotime($dateRange['end']) - strtotime($dateRange['start'])) / 3600;
            if ($duration > 0) {
                $tableUtilization = round($usedHours / ($totalTables * $duration) * 100, 1);
            }
        }

        return [
            'occupancy_rate' => $occupancyRate,
            'turnover_rate' => $turnoverRate,
            'avg_customer_spend' => $avgCustomerSpend,
            'table_utilization' => $tableUtilization
        ];
    }

    private static function getTrendData($storeId, $dateRange)
    {
        $result = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('start_time', '>=', $dateRange['start'])
            ->where('start_time', '<=', $dateRange['end'])
            ->field([
                'DATE(`start_time`) as date',
                'SUM(`final_amount`) as revenue',
                'COUNT(`id`) as orders'
            ])
            ->group('date')
            ->order('date')
            ->select()
            ->toArray();

        $trend = [];
        foreach ($result as $item) {
            $trend[] = [
                'date' => substr($item['date'], 5),
                'date_value' => $item['date'],
                'revenue' => round($item['revenue'], 2),
                'orders' => $item['orders']
            ];
        }

        return $trend;
    }

    private static function getHotProducts($storeId, $dateRange)
    {
        $orderIds = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $dateRange['start'])
            ->where('created_at', '<=', $dateRange['end'])
            ->column('id');

        if (empty($orderIds)) {
            return [];
        }

        $result = OrderItem::whereIn('order_id', $orderIds)
            ->field([
                'item_name',
                'SUM(`quantity`) as quantity',
                'SUM(`final_price`) as revenue'
            ])
            ->group('item_name')
            ->order('revenue', 'desc')
            ->limit(4)
            ->select()
            ->toArray();

        $hotProducts = [];
        foreach ($result as $index => $item) {
            $hotProducts[] = [
                'rank' => $index + 1,
                'name' => $item['item_name'],
                'revenue' => round($item['revenue'], 2),
                'quantity' => $item['quantity']
            ];
        }

        return $hotProducts;
    }

    private static function getStaffStats($storeId, $dateRange)
    {
        $totalEmployees = Employee::where('store_id', $storeId)
            ->where('status', 1)
            ->count();

        $today = date('Y-m-d');
        $checkedInCount = EmployeeAttendance::where('store_id', $storeId)
            ->where('work_date', $today)
            ->count();

        $checkinRate = $totalEmployees > 0 ? round($checkedInCount / $totalEmployees * 100, 1) : 0;

        $totalAssistants = Assistant::where('store_id', $storeId)
            ->where('status', 1)
            ->count();

        $workingAssistants = 0;
        $assistants = Assistant::where('store_id', $storeId)
            ->where('status', 1)
            ->select()
            ->toArray();

        foreach ($assistants as $assistant) {
            if ($assistant['employee_id']) {
                $hasAttendance = EmployeeAttendance::where('store_id', $storeId)
                    ->where('employee_id', $assistant['employee_id'])
                    ->where('work_date', $today)
                    ->find();
                if ($hasAttendance) {
                    $workingAssistants++;
                }
            }
        }

        return [
            'total_employees' => $totalEmployees,
            'checked_in_count' => $checkedInCount,
            'checkin_rate' => $checkinRate,
            'total_assistants' => $totalAssistants,
            'working_assistants' => $workingAssistants
        ];
    }

    private static function getPendingTasks($storeId)
    {
        $approvals = Db::table('bi_busi_approval')
            ->where('store_id', $storeId)
            ->where('status', 'pending')
            ->count();

        $orders = AssistantOrder::where('store_id', $storeId)
            ->where('status', 'pending')
            ->count();

        $notifications = Notification::where('store_id', $storeId)
            ->where('is_read', 0)
            ->count();

        return [
            'approvals' => $approvals,
            'orders' => $orders,
            'notifications' => $notifications
        ];
    }

    public static function getQuickStats($storeId)
    {
        $today = date('Y-m-d');

        return [
            'today_revenue' => Order::where('store_id', $storeId)
                ->where('created_at', '>=', $today . ' 00:00:00')
                ->where('created_at', '<=', $today . ' 23:59:59')
                ->where('status', 'completed')
                ->sum('final_amount'),
            'today_orders' => Order::where('store_id', $storeId)
                ->where('created_at', '>=', $today . ' 00:00:00')
                ->where('created_at', '<=', $today . ' 23:59:59')
                ->where('status', 'completed')
                ->count(),
        ];
    }
}