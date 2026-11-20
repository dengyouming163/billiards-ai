<?php

declare(strict_types=1);

namespace app\storeapi\logic\coupon;

use app\common\logic\BaseLogic;
use app\common\model\merchant\CouponVerify as CouponVerifyModel;

class CouponReportLogic extends BaseLogic
{
    public static function summary(string $storeId, array $params): array
    {
        $startDate = $params['start_date'] ?? date('Y-m-01');
        $endDate = $params['end_date'] ?? date('Y-m-d');
        $platform = $params['platform'] ?? '';

        $query = CouponVerifyModel::where('store_id', $storeId)
            ->where('status', 'verified')
            ->where('verified_at', '>=', $startDate . ' 00:00:00')
            ->where('verified_at', '<=', $endDate . ' 23:59:59');

        if (!empty($platform)) {
            $query->where('platform', $platform);
        }

        $records = $query->select()->toArray();

        // 按平台汇总
        $platformSummary = [];
        $totalCount = 0;
        $totalAmount = 0;
        foreach ($records as $r) {
            $p = $r['platform'];
            if (!isset($platformSummary[$p])) {
                $platformSummary[$p] = ['platform' => $p, 'count' => 0, 'amount' => 0];
            }
            $platformSummary[$p]['count']++;
            $platformSummary[$p]['amount'] += floatval($r['verify_price']);
            $totalCount++;
            $totalAmount += floatval($r['verify_price']);
        }

        // 按套餐汇总
        $packageSummary = [];
        foreach ($records as $r) {
            $key = $r['package_name'] ?: '未知套餐';
            if (!isset($packageSummary[$key])) {
                $packageSummary[$key] = ['package_name' => $key, 'platform' => $r['platform'], 'count' => 0, 'amount' => 0];
            }
            $packageSummary[$key]['count']++;
            $packageSummary[$key]['amount'] += floatval($r['verify_price']);
        }

        return [
            'success' => true,
            'message' => 'ok',
            'data' => [
                'total_count' => $totalCount,
                'total_amount' => round($totalAmount, 2),
                'platform_summary' => array_values($platformSummary),
                'package_summary' => array_values($packageSummary),
                'date_range' => ['start' => $startDate, 'end' => $endDate],
            ],
        ];
    }

    public static function daily(string $storeId, array $params): array
    {
        $startDate = $params['start_date'] ?? date('Y-m-01');
        $endDate = $params['end_date'] ?? date('Y-m-d');

        $records = CouponVerifyModel::where('store_id', $storeId)
            ->where('status', 'verified')
            ->where('verified_at', '>=', $startDate . ' 00:00:00')
            ->where('verified_at', '<=', $endDate . ' 23:59:59')
            ->order('verified_at', 'asc')
            ->select()
            ->toArray();

        $dailyData = [];
        foreach ($records as $r) {
            $day = substr($r['verified_at'], 0, 10);
            if (!isset($dailyData[$day])) {
                $dailyData[$day] = ['date' => $day, 'count' => 0, 'amount' => 0];
            }
            $dailyData[$day]['count']++;
            $dailyData[$day]['amount'] += floatval($r['verify_price']);
        }

        return ['success' => true, 'message' => 'ok', 'data' => array_values($dailyData)];
    }
}
