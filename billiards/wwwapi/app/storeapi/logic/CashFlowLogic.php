<?php

declare (strict_types=1);

namespace app\storeapi\logic;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderPayment;
use app\common\model\merchant\OrderRefund;
use think\facade\Log;

class CashFlowLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        try {
            $query = Order::alias('o')
                ->join(OrderPayment::getTable() . ' op', 'o.id = op.order_id', 'left')
                ->where('o.store_id', $storeId)
                ->where('o.status', 'completed')
                ->whereNull('o.deleted_at');

            if (!empty($params['startDate'])) {
                $query->where('o.created_at', '>=', $params['startDate'] . ' 00:00:00');
            }
            if (!empty($params['endDate'])) {
                $query->where('o.created_at', '<=', $params['endDate'] . ' 23:59:59');
            }
            if (!empty($params['keyword'])) {
                $keyword = $params['keyword'];
                $query->where(function ($q) use ($keyword) {
                    $q->where('o.order_no', 'like', "%{$keyword}%")
                      ->whereOr('o.member_name', 'like', "%{$keyword}%");
                });
            }

            $page = $params['page'] ?? 1;
            $pageSize = $params['page_size'] ?? 20;

            $list = $query->field([
                'o.id',
                'o.order_no as orderNumber',
                'o.type',
                'o.final_amount as amount',
                'op.payment_method',
                'o.created_at',
            ])->order('o.created_at', 'desc')
                ->paginate([
                    'page' => $page,
                    'list_rows' => $pageSize,
                ]);

            $items = [];
            foreach ($list->items() as $item) {
                $items[] = [
                    'id' => $item['id'],
                    'type' => 'income',
                    'category' => self::getOrderCategory($item['type']),
                    'amount' => $item['amount'],
                    'payment_method' => $item['payment_method'] ?? 'wechat',
                    'paymentMethod' => $item['payment_method'] ?? 'wechat',
                    'operator_name' => '系统',
                    'operatorName' => '系统',
                    'created_at' => $item['created_at'],
                    'createdAt' => $item['created_at'],
                    'order_number' => $item['orderNumber'],
                    'orderNumber' => $item['orderNumber'],
                    'remark' => '',
                ];
            }

            $refundItems = [];
            $refundQuery = OrderRefund::alias('r')
                ->join(Order::getTable() . ' o', 'r.order_id = o.id', 'left')
                ->where('o.store_id', $storeId)
                ->where('r.status', 'refunded');

            if (!empty($params['startDate'])) {
                $refundQuery->where('r.created_at', '>=', $params['startDate'] . ' 00:00:00');
            }
            if (!empty($params['endDate'])) {
                $refundQuery->where('r.created_at', '<=', $params['endDate'] . ' 23:59:59');
            }
            if (!empty($params['keyword'])) {
                $refundQuery->where(function ($q) use ($keyword) {
                    $q->where('o.order_no', 'like', "%{$keyword}%");
                });
            }

            $refunds = $refundQuery->field([
                'r.id',
                'o.order_no as orderNumber',
                'r.refund_amount as amount',
                'r.refund_method as paymentMethod',
                'r.created_at',
            ])->order('r.created_at', 'desc')->limit(100)->select()->toArray();

            foreach ($refunds as $refund) {
                $refundItems[] = [
                    'id' => $refund['id'],
                    'type' => 'expense',
                    'category' => '退款支出',
                    'amount' => (float)$refund['amount'],
                    'payment_method' => $refund['paymentMethod'] ?? '',
                    'paymentMethod' => $refund['paymentMethod'] ?? '',
                    'operator_name' => '系统',
                    'operatorName' => '系统',
                    'created_at' => $refund['created_at'],
                    'createdAt' => $refund['created_at'],
                    'order_number' => $refund['orderNumber'] ?? '',
                    'orderNumber' => $refund['orderNumber'] ?? '',
                    'remark' => '订单退款',
                ];
            }

            $allItems = array_merge($items, $refundItems);
            usort($allItems, function ($a, $b) {
                return strcmp($b['createdAt'], $a['createdAt']);
            });

            return [
                'list' => $allItems,
                'total' => $list->total() + count($refundItems),
                'page' => $list->currentPage(),
                'page_size' => $list->listRows(),
            ];
        } catch (\Exception $e) {
            Log::error('CashFlow getList失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取资金流水失败，请稍后重试');
        }
    }

    public static function getStats(array $params, string $storeId)
    {
        try {
            $today = date('Y-m-d');
            $todayStart = $today . ' 00:00:00';
            $todayEnd = $today . ' 23:59:59';

            $monthStart = date('Y-m-01 00:00:00');
            $monthEnd = date('Y-m-t 23:59:59');

            $yesterday = date('Y-m-d', strtotime('-1 day'));
            $yesterdayStart = $yesterday . ' 00:00:00';
            $yesterdayEnd = $yesterday . ' 23:59:59';

            $todayIncome = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $todayStart)
                ->where('created_at', '<=', $todayEnd)
                ->sum('final_amount') ?? 0;

            $todayExpense = OrderRefund::alias('r')
                ->join(Order::getTable() . ' o', 'r.order_id = o.id')
                ->where('o.store_id', $storeId)
                ->where('r.status', 'refunded')
                ->where('r.created_at', '>=', $todayStart)
                ->where('r.created_at', '<=', $todayEnd)
                ->sum('r.refund_amount') ?? 0;

            $todayOrders = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $todayStart)
                ->where('created_at', '<=', $todayEnd)
                ->count();

            $monthIncome = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $monthStart)
                ->where('created_at', '<=', $monthEnd)
                ->sum('final_amount') ?? 0;

            $monthExpense = OrderRefund::alias('r')
                ->join(Order::getTable() . ' o', 'r.order_id = o.id')
                ->where('o.store_id', $storeId)
                ->where('r.status', 'refunded')
                ->where('r.created_at', '>=', $monthStart)
                ->where('r.created_at', '<=', $monthEnd)
                ->sum('r.refund_amount') ?? 0;

            $yesterdayIncome = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $yesterdayStart)
                ->where('created_at', '<=', $yesterdayEnd)
                ->sum('final_amount') ?? 0;

            $paymentStats = OrderPayment::alias('op')
                ->join(Order::getTable() . ' o', 'op.order_id = o.id')
                ->where('o.store_id', $storeId)
                ->where('o.status', 'completed')
                ->where('o.created_at', '>=', $todayStart)
                ->where('o.created_at', '<=', $todayEnd)
                ->field('op.payment_method, SUM(op.amount) as total_amount, COUNT(*) as total_count')
                ->group('op.payment_method')
                ->select()
                ->toArray();

            $paymentResult = [
                'wechat' => ['amount' => 0, 'count' => 0],
                'cash' => ['amount' => 0, 'count' => 0],
            ];

            foreach ($paymentStats as $stat) {
                $method = $stat['payment_method'] ?? 'wechat';
                if (isset($paymentResult[$method])) {
                    $paymentResult[$method]['amount'] = (float)($stat['total_amount'] ?? 0);
                    $paymentResult[$method]['count'] = (int)($stat['total_count'] ?? 0);
                }
            }

            $sevenDaysAgo = date('Y-m-d', strtotime('-6 day'));
            $dailyRevenues = Order::where('store_id', $storeId)
                ->where('status', 'completed')
                ->where('created_at', '>=', $sevenDaysAgo . ' 00:00:00')
                ->where('created_at', '<=', date('Y-m-d') . ' 23:59:59')
                ->field("DATE(created_at) as order_date, SUM(final_amount) as total_income")
                ->group("DATE(created_at)")
                ->select()
                ->toArray();

            $dailyMap = [];
            foreach ($dailyRevenues as $row) {
                $dailyMap[$row['order_date']] = (float)$row['total_income'];
            }

            $dailyRefunds = OrderRefund::alias('r')
                ->join(Order::getTable() . ' o', 'r.order_id = o.id')
                ->where('o.store_id', $storeId)
                ->where('r.status', 'refunded')
                ->where('r.created_at', '>=', $sevenDaysAgo . ' 00:00:00')
                ->where('r.created_at', '<=', date('Y-m-d') . ' 23:59:59')
                ->field("DATE(r.created_at) as refund_date, SUM(r.refund_amount) as total_refund")
                ->group("DATE(r.created_at)")
                ->select()
                ->toArray();

            $dailyRefundMap = [];
            foreach ($dailyRefunds as $row) {
                $dailyRefundMap[$row['refund_date']] = (float)$row['total_refund'];
            }

            $revenueTrend = [];
            $weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            for ($i = 6; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i day"));
                $dayOfWeek = date('w', strtotime($date));
                $dayName = $dayOfWeek == 0 ? '周日' : $weekDays[$dayOfWeek - 1];

                $revenueTrend[] = [
                    'date' => $dayName,
                    'income' => $dailyMap[$date] ?? 0,
                    'expense' => $dailyRefundMap[$date] ?? 0,
                ];
            }

            $statsResult = [
                'today_income' => $todayIncome,
                'todayIncome' => $todayIncome,
                'today_expense' => $todayExpense,
                'todayExpense' => $todayExpense,
                'today_net' => $todayIncome - $todayExpense,
                'todayNet' => $todayIncome - $todayExpense,
                'today_orders' => $todayOrders,
                'todayOrders' => $todayOrders,
                'month_income' => $monthIncome,
                'monthIncome' => $monthIncome,
                'month_expense' => $monthExpense,
                'monthExpense' => $monthExpense,
                'month_net' => $monthIncome - $monthExpense,
                'monthNet' => $monthIncome - $monthExpense,
                'yesterday_income' => $yesterdayIncome,
                'yesterdayIncome' => $yesterdayIncome,
                'payment_stats' => $paymentResult,
                'paymentStats' => $paymentResult,
                'revenue_trend' => $revenueTrend,
                'revenueTrend' => $revenueTrend,
            ];

            return $statsResult;
        } catch (\Exception $e) {
            Log::error('CashFlow getStats失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取财务统计失败，请稍后重试');
        }
    }

    public static function export(array $params, string $storeId)
    {
        try {
            $startDate = $params['startDate'] ?? date('Y-m-d', strtotime('-7 day'));
            $endDate = $params['endDate'] ?? date('Y-m-d');

            $list = Order::alias('o')
                ->join(OrderPayment::getTable() . ' op', 'o.id = op.order_id', 'left')
                ->where('o.store_id', $storeId)
                ->where('o.status', 'completed')
                ->where('o.created_at', '>=', $startDate . ' 00:00:00')
                ->where('o.created_at', '<=', $endDate . ' 23:59:59')
                ->field([
                    'o.order_no',
                    'o.type',
                    'o.final_amount',
                    'op.payment_method',
                    'o.created_at',
                ])->order('o.created_at', 'desc')
                ->select();

            $header = ['订单号', '类型', '金额', '支付方式', '创建时间'];
            $data = [];
            foreach ($list as $item) {
                $data[] = [
                    $item['order_no'],
                    self::getOrderCategory($item['type']),
                    $item['final_amount'],
                    self::getPaymentName($item['payment_method'] ?? ''),
                    $item['created_at'],
                ];
            }

            $filename = '资金流水_' . $startDate . '_' . $endDate . '.csv';

            ob_start();
            $fp = fopen('php://output', 'w');
            fprintf($fp, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($fp, $header);
            foreach ($data as $row) {
                fputcsv($fp, $row);
            }
            fclose($fp);
            $csvContent = ob_get_clean();

            return response($csvContent, 200, [
                'Content-Type' => 'text/csv; charset=utf-8',
                'Content-Disposition' => 'attachment; filename=' . $filename,
            ]);
        } catch (\Exception $e) {
            Log::error('CashFlow export失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('导出资金流水失败，请稍后重试');
        }
    }

    private static function getOrderCategory($type)
    {
        $categories = [
            'table' => '台桌收入',
            'product' => '商品收入',
            'assistant' => '助教收入',
            'package' => '套餐收入',
        ];
        if (!isset($categories[$type])) {
            Log::warning('CashFlow: 未知订单类型 "' . $type . '"');
        }
        return $categories[$type] ?? '其他收入';
    }

    private static function getPaymentName($method)
    {
        $methods = [
            'wechat' => '微信支付',
            'alipay' => '支付宝',
            'cash' => '现金',
            'member' => '会员卡',
        ];
        return $methods[$method] ?? '其他';
    }
}