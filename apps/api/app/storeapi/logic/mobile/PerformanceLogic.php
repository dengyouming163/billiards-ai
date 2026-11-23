<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Assistant;
use Exception;

class PerformanceLogic extends BaseLogic
{
    /** 通过员工ID获取助教ID */
    private static function getAssistantId($employeeId): string
    {
        $assistant = Assistant::where('employee_id', $employeeId)->find();
        return $assistant ? $assistant['id'] : '';
    }

    /** 基础查询：该助教的已完成助教子订单 */
    private static function itemQuery(string $assistantId, string $storeId)
    {
        return OrderItem::alias('oi')
            ->join('busi_order o', 'o.id = oi.order_id')
            ->where('o.store_id', $storeId)
            ->where('oi.assistant_id', $assistantId)
            ->where('oi.item_type', 'assistant')
            ->where('oi.status', 'completed')
            ->field('oi.*');
    }

    /**
     * 今日战绩
     */
    public static function getToday($employeeId, $storeId)
    {
        try {
            $aid = self::getAssistantId($employeeId);
            if (empty($aid)) return ['today_income' => 0, 'today_orders' => 0, 'today_duration' => 0, 'today_rating' => 5.0];

            $today = date('Y-m-d');
            // 全部取出，PHP 端过滤日期（避免 SQL NULL 兼容问题）
            $allItems = self::itemQuery($aid, $storeId)->select();
            $income = 0; $duration = 0; $count = 0;
            foreach ($allItems as $item) {
                $doneDate = substr($item['ended_at'] ?? $item['updated_at'] ?? '', 0, 10);
                if ($doneDate !== $today) continue;
                $income += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                $duration += (int)($item['actual_quantity'] ?? $item['quantity'] ?? 0);
                $count++;
            }

            return [
                'today_income'   => round($income, 2),
                'today_orders'   => $count,
                'today_duration' => $duration,
                'today_rating'   => 5.0,
            ];
        } catch (Exception $e) {
            return ['today_income' => 0, 'today_orders' => 0, 'today_duration' => 0, 'today_rating' => 5.0];
        }
    }

    /**
     * N 天趋势（PHP 端按日期分组，避免 COALESCE 兼容问题）
     */
    public static function getTrend($employeeId, $storeId, $days = 7)
    {
        try {
            $aid = self::getAssistantId($employeeId);
            if (empty($aid)) return ['list' => []];

            // 一次查出近 N 天所有已完成订单（按 ended_at 过滤）
            $startDate = date('Y-m-d', strtotime("-{$days} day"));
            $allItems = self::itemQuery($aid, $storeId)
                ->where('ended_at', '>=', $startDate . ' 00:00:00')
                ->select();

            // 按日期分组
            $byDate = [];
            foreach ($allItems as $item) {
                $dateKey = substr($item['ended_at'] ?? $item['updated_at'] ?? '', 0, 10);
                if (empty($dateKey)) continue;
                if (!isset($byDate[$dateKey])) $byDate[$dateKey] = ['income' => 0, 'orders' => 0];
                $byDate[$dateKey]['income'] += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                $byDate[$dateKey]['orders']++;
            }

            $list = [];
            for ($i = $days - 1; $i >= 0; $i--) {
                $date = date('Y-m-d', strtotime("-$i day"));
                $dayData = $byDate[$date] ?? ['income' => 0, 'orders' => 0];
                $list[] = ['date' => $date, 'income' => round($dayData['income'], 2), 'orders' => $dayData['orders']];
            }
            return ['list' => $list];
        } catch (Exception $e) {
            return ['list' => []];
        }
    }

    /**
     * 助教排行榜（本月）
     */
    public static function getRanking($employeeId, $storeId)
    {
        try {
            $aid = self::getAssistantId($employeeId);
            $monthStart = date('Y-m-01');

            $rankings = OrderItem::alias('oi')
                ->join('busi_order o', 'o.id = oi.order_id')
                ->where('o.store_id', $storeId)
                ->where('oi.item_type', 'assistant')
                ->where('oi.status', 'completed')
                ->whereRaw("COALESCE(oi.ended_at, o.end_time) >= '{$monthStart} 00:00:00'")
                ->whereNotNull('oi.assistant_id')
                ->where('oi.assistant_id', '<>', '')
                ->field('oi.assistant_id, SUM(oi.final_price) as total_income, COUNT(*) as total_orders')
                ->group('oi.assistant_id')
                ->order('total_income', 'desc')
                ->limit(20)
                ->select();

            $list = []; $myRank = 0; $myIncome = 0;
            foreach ($rankings as $i => $row) {
                $ast = Assistant::where('id', $row['assistant_id'])->find();
                $name = $ast ? $ast['name'] : ('助教#' . substr($row['assistant_id'], -4));
                $list[] = [
                    'rank'   => $i + 1,
                    'name'   => $name,
                    'income' => round((float)$row['total_income'], 2),
                    'orders' => (int)$row['total_orders'],
                ];
                if ($row['assistant_id'] === $aid) {
                    $myRank = $i + 1;
                    $myIncome = round((float)$row['total_income'], 2);
                }
            }

            return [
                'my_rank'   => $myRank ?: count($list) + 1,
                'my_income' => $myIncome,
                'list'      => $list,
            ];
        } catch (Exception $e) {
            return ['my_rank' => 0, 'my_income' => 0, 'list' => []];
        }
    }

    /**
     * 本月统计
     */
    public static function getMonthly($employeeId, $storeId)
    {
        try {
            $aid = self::getAssistantId($employeeId);
            if (empty($aid)) return ['total_orders' => 0, 'total_income' => 0, 'total_duration' => 0, 'avg_rating' => 5.0, 'rating_count' => 0];

            $monthStart = date('Y-m-01');
            $monthEnd = date('Y-m-t 23:59:59');
            $items = self::itemQuery($aid, $storeId)
                ->whereRaw("COALESCE(oi.ended_at, o.end_time) >= '{$monthStart}'")
                ->whereRaw("COALESCE(oi.ended_at, o.end_time) <= '{$monthEnd}'")
                ->select();

            $totalOrders = count($items);
            $totalIncome = 0; $totalDuration = 0;
            foreach ($items as $item) {
                $totalIncome += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                $totalDuration += (int)($item['actual_quantity'] ?? $item['quantity'] ?? 0);
            }

            return [
                'total_orders'   => $totalOrders,
                'total_income'   => round($totalIncome, 2),
                'total_duration' => $totalDuration,
                'avg_rating'     => 5.0,
                'rating_count'   => 0,
            ];
        } catch (Exception $e) {
            return ['total_orders' => 0, 'total_income' => 0, 'total_duration' => 0, 'avg_rating' => 5.0, 'rating_count' => 0];
        }
    }

    /**
     * 服务时长报表 — 按日期范围返回逐单时长明细
     */
    public static function getDurationReport($employeeId, $storeId, $startDate, $endDate)
    {
        try {
            $aid = self::getAssistantId($employeeId);
            if (empty($aid)) return [];

            $items = self::itemQuery($aid, $storeId)
                ->where('oi.ended_at', '>=', $startDate . ' 00:00:00')
                ->where('oi.ended_at', '<=', $endDate . ' 23:59:59')
                ->field('oi.*, o.table_name')
                ->order('oi.ended_at', 'desc')
                ->select();

            $weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            $result = [];
            foreach ($items as $item) {
                $endTime = $item['ended_at'] ?? $item['updated_at'] ?? '';
                $ts = strtotime($endTime);
                $result[] = [
                    'date'             => substr($endTime, 0, 10),
                    'weekday'          => '周' . ($weekdays[date('w', $ts)] ?? ''),
                    'table_name'       => $item['table_name'] ?? '',
                    'duration_minutes' => intval($item['actual_quantity'] ?? $item['quantity'] ?? 0),
                ];
            }
            return $result;
        } catch (Exception $e) {
            return [];
        }
    }

    /**
     * 每日汇总 — 按天聚合订单数和总时长，支持日期区间（最多30天）
     */
    public static function getDailySummary($employeeId, $storeId, $startDate, $endDate)
    {
        try {
            $aid = self::getAssistantId($employeeId);
            if (empty($aid)) return [];

            // 最多30天
            $diff = (strtotime($endDate) - strtotime($startDate)) / 86400;
            if ($diff > 30) {
                $endDate = date('Y-m-d', strtotime($startDate) + 30 * 86400);
            }

            $items = self::itemQuery($aid, $storeId)
                ->whereNotNull('oi.ended_at')
                ->where('oi.ended_at', '<>', '')
                ->where('oi.ended_at', '>=', $startDate . ' 00:00:00')
                ->where('oi.ended_at', '<=', $endDate . ' 23:59:59')
                ->field('oi.ended_at, oi.actual_quantity, oi.quantity')
                ->order('oi.ended_at', 'desc')
                ->select();

            // 按天聚合
            $byDate = [];
            foreach ($items as $item) {
                $dateKey = substr($item['ended_at'] ?? '', 0, 10);
                if (empty($dateKey) || $dateKey === '0000-00-00') continue;
                if (!isset($byDate[$dateKey])) {
                    $byDate[$dateKey] = ['order_count' => 0, 'total_duration' => 0];
                }
                $byDate[$dateKey]['order_count']++;
                $byDate[$dateKey]['total_duration'] += intval($item['actual_quantity'] ?? $item['quantity'] ?? 0);
            }

            // 转为列表并排序
            $dates = array_keys($byDate);
            rsort($dates);

            $weekdays = ['日', '一', '二', '三', '四', '五', '六'];
            $result = [];
            foreach ($dates as $date) {
                $ts = strtotime($date);
                $result[] = [
                    'date'           => $date,
                    'weekday'        => '周' . ($weekdays[date('w', $ts)] ?? ''),
                    'order_count'    => $byDate[$date]['order_count'],
                    'total_duration' => $byDate[$date]['total_duration'],
                ];
            }
            return $result;
        } catch (Exception $e) {
            return [];
        }
    }
}
