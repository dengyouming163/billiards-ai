<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\common\model\merchant\Order;
use app\common\model\merchant\OrderPayment;
use app\common\model\merchant\Table;
use app\storeapi\logic\ReportLogic;
use app\storeapi\logic\StatisticsHelper;

class StatisticsController extends BasePosController
{
    public function overview()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }

        $dateRange = $this->request->get('dateRange', 'today');
        $validRanges = ['today', 'yesterday', 'week', 'month'];
        if (!in_array($dateRange, $validRanges)) {
            return $this->fail('无效的日期范围参数');
        }

        $dr = StatisticsHelper::calcDateRange($dateRange);
        $startTime = $dr['startDate'];
        $endTime = $dr['endDate'];
        $daysInRange = $dr['daysInRange'];
        $lastStartTime = $dr['lastStart'];
        $lastEndTime = $dr['lastEnd'];

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

        $tableRevenue = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('type', 'table')
            ->where('created_at', '>=', $startTime)
            ->where('created_at', '<=', $endTime)
            ->sum('final_amount') ?? 0;

        $productRevenue = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('type', 'product')
            ->where('created_at', '>=', $startTime)
            ->where('created_at', '<=', $endTime)
            ->sum('final_amount') ?? 0;

        $assistantRevenue = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('type', 'assistant')
            ->where('created_at', '>=', $startTime)
            ->where('created_at', '<=', $endTime)
            ->sum('final_amount') ?? 0;

        $tableCount = Table::where('store_id', $storeId)->where('status', 1)->count();
        $activeTables = Table::where('store_id', $storeId)->where('status', 2)->count();

        $avgUtilization = StatisticsHelper::calcUtilization($totalHours, $tableCount, $daysInRange);
        $avgOrderAmount = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        $lastRevenue = Order::where('store_id', $storeId)
            ->where('status', 'completed')
            ->where('created_at', '>=', $lastStartTime)
            ->where('created_at', '<=', $lastEndTime)
            ->sum('final_amount') ?? 0;
        $growthRate = StatisticsHelper::calcGrowthRate($totalRevenue, $lastRevenue);

        return $this->success('获取成功', [
            'totalRevenue'     => (float)$totalRevenue,
            'totalOrders'      => (int)$totalOrders,
            'totalHours'       => round($totalHours, 1),
            'tableRevenue'     => (float)$tableRevenue,
            'productRevenue'   => (float)$productRevenue,
            'assistantRevenue' => (float)$assistantRevenue,
            'activeTables'     => (int)$activeTables,
            'avgUtilization'   => round($avgUtilization, 1),
            'avgOrderAmount'   => round($avgOrderAmount, 2),
            'growthRate'       => round($growthRate, 1),
        ]);
    }

    public function tableUsage()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $params = $this->request->get();
        $result = ReportLogic::getTableUsage($params, $storeId);
        if ($result === false) {
            return $this->fail(ReportLogic::getError());
        }
        return $this->success('获取成功', $result);
    }

    public function productRank()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $params = $this->request->get();
        $result = ReportLogic::getProductRank($params, $storeId);
        if ($result === false) {
            return $this->fail(ReportLogic::getError());
        }
        return $this->success('获取成功', $result);
    }

    public function assistantRank()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $params = $this->request->get();
        $result = ReportLogic::getAssistantRank($params, $storeId);
        if ($result === false) {
            return $this->fail(ReportLogic::getError());
        }
        return $this->success('获取成功', $result);
    }

    public function channelRevenue()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }

        $dateRange = $this->request->get('dateRange', 'today');
        $validRanges = ['today', 'yesterday', 'week', 'month'];
        if (!in_array($dateRange, $validRanges)) {
            return $this->fail('无效的日期范围参数');
        }

        $dr = StatisticsHelper::calcDateRange($dateRange);
        $startTime = $dr['startDate'];
        $endTime = $dr['endDate'];

        $result = OrderPayment::alias('p')
            ->join('busi_order o', 'p.order_id = o.id')
            ->where('o.store_id', $storeId)
            ->where('o.status', 'completed')
            ->where('o.created_at', '>=', $startTime)
            ->where('o.created_at', '<=', $endTime)
            ->group('p.channel')
            ->field('p.channel, SUM(p.amount) as revenue, COUNT(DISTINCT p.order_id) as order_count')
            ->select()
            ->toArray();

        return $this->success('获取成功', $result);
    }
}
