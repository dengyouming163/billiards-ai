<?php

namespace app\storeapi\controller\report;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\ReportLogic;
use app\storeapi\logic\dashboard\DashboardLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;
use app\common\service\ReportService;

class ReportController extends BaseStoreController
{
    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function overview()
    {
        $params = $this->request->get();
        $result = ReportLogic::getOverview($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function revenueTrend()
    {
        $params = $this->request->get();
        $result = ReportLogic::getRevenueTrend($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function tableUsage()
    {
        $params = $this->request->get();
        $result = ReportLogic::getTableUsage($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function memberStats()
    {
        $result = ReportLogic::getMemberStats($this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function memberRank()
    {
        $params = $this->request->get();
        $result = ReportLogic::getMemberRank($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function assistantRank()
    {
        $params = $this->request->get();
        $result = ReportLogic::getAssistantRank($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function timeAnalysis()
    {
        $params = $this->request->get();
        $result = ReportLogic::getTimeAnalysis($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ReportLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('report:list', '经营报表', 'pc', '报表', ['boss', 'manager'])]
    public function revenueComposition()
    {
        $params = $this->request->get();
        $result = DashboardLogic::getRevenueComposition($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(DashboardLogic::getError());
        }
        return JsonService::data($result);
    }

    /**
     * 收入总览（含环比）
     * GET /report.Report/revenueSummary?store_id=&start_date=&end_date=
     */
    public function revenueSummary()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->revenueSummary());
    }

    /**
     * 运营指标
     * GET /report.Report/operationOverview?store_id=&start_date=&end_date=
     */
    public function operationOverview()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->operationOverview());
    }

    /**
     * 热销商品排行
     * GET /report.Report/productRank?store_id=&start_date=&end_date=&limit=10
     */
    public function productRank()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $limit = (int)$this->request->get('limit', 10);
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->productRank($limit));
    }

    /**
     * 渠道收入明细（钻取）
     * GET /report.Report/revenueByChannelDetail?channel=&start_date=&end_date=
     */
    public function revenueByChannelDetail()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $channel = $this->request->get('channel', 'cash');
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->revenueByChannelDetail($channel));
    }

    /**
     * 收入按支付渠道分布
     * GET /report.Report/revenueByChannel?store_id=&start_date=&end_date=
     */
    public function revenueByChannel()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->revenueByChannel());
    }

    /**
     * 收入按消费类型分布（桌台/商品/助教）
     * GET /report.Report/revenueByItemType?store_id=&start_date=&end_date=
     */
    public function revenueByItemType()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->revenueByItemType());
    }

    /**
     * 充值报表
     * GET /report.Report/rechargeReport?store_id=&start_date=&end_date=
     */
    public function rechargeReport()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->rechargeReport());
    }

    /**
     * 收入项目明细（钻取）
     * GET /report.Report/revenueByItemTypeDetail?item_type=&start_date=&end_date=
     */
    public function revenueByItemTypeDetail()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $itemType = $this->request->get('item_type', 'table');
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->revenueByItemTypeDetail($itemType));
    }

    /**
     * 充值明细（钻取）
     * GET /report.Report/rechargeReportDetail?channel=&start_date=&end_date=
     */
    public function rechargeReportDetail()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $start = $this->request->get('start_date', date('Y-m-d'));
        $end = $this->request->get('end_date', date('Y-m-d'));
        $channel = $this->request->get('channel', 'cash');
        $rpt = new \app\common\service\ReportService($storeId, $start, $end);
        return \app\common\service\JsonService::data($rpt->rechargeReportDetail($channel));
    }

    /**
     * 考勤报表
     * GET /report.Report/attendanceReport?store_id=&month=2026-06&employee_type=all
     */
    public function attendanceReport()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $month = $this->request->get('month', date('Y-m'));
        $employeeType = $this->request->get('employee_type', 'all');
        $rpt = new \app\common\service\ReportService($storeId, '', '');
        return \app\common\service\JsonService::data($rpt->attendanceReport($month, $employeeType));
    }

    /**
     * 助教薪资报表
     * GET /report.Report/assistantSalary?store_id=&month=2026-06
     */
    public function assistantSalary()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $month = $this->request->get('month', date('Y-m'));
        $rpt = new \app\common\service\ReportService($storeId, '', '');
        return \app\common\service\JsonService::data($rpt->assistantSalary($month));
    }

    #[Permission('mobile:report', '充值报表', 'mobile', '报表', ['boss', 'manager', 'admin', 'owner'])]
    public function employeeRecharge()
    {
        $storeId = $this->storeId;
        $startDate = $this->request->get('start_date', date('Y-m-01'));
        $endDate = $this->request->get('end_date', date('Y-m-d'));

        $result = \app\common\service\ReportService::employeeRecharge($storeId, $startDate, $endDate);
        return JsonService::success('获取成功', $result);
    }

    #[Permission('mobile:report', '商品销售报表', 'mobile', '报表', ['boss', 'manager', 'admin', 'owner'])]
    public function assistantProductSales()
    {
        $storeId = $this->storeId;
        $startDate = $this->request->get('start_date', date('Y-m-01'));
        $endDate = $this->request->get('end_date', date('Y-m-d'));

        $result = \app\common\service\ReportService::assistantProductSales($storeId, $startDate, $endDate);
        return JsonService::success('获取成功', $result);
    }
}
