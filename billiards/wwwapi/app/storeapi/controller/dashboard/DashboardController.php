<?php

namespace app\storeapi\controller\dashboard;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\dashboard\DashboardLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class DashboardController extends BaseStoreController
{
    #[Permission('overview', '数据概览', 'pc', '数据看板', ['boss', 'manager'])]
    public function stats()
    {
        $result = DashboardLogic::getStats($this->storeId);
        if ($result === false) {
            return JsonService::fail(DashboardLogic::getError());
        }
        if ($result === false) return JsonService::fail(DashboardLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('overview', '数据概览', 'pc', '数据看板', ['boss', 'manager'])]
    public function overview()
    {
        $result = DashboardLogic::getOverview($this->storeId);
        if ($result === false) {
            return JsonService::fail(DashboardLogic::getError());
        }
        if ($result === false) return JsonService::fail(DashboardLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('overview', '数据概览', 'pc', '数据看板', ['boss', 'manager'])]
    public function revenueTrend()
    {
        $params = $this->request->get();
        $result = DashboardLogic::getRevenueTrend($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(DashboardLogic::getError());
        }
        if ($result === false) return JsonService::fail(DashboardLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('overview', '数据概览', 'pc', '数据看板', ['boss', 'manager'])]
    public function revenueComposition()
    {
        $params = $this->request->get();
        $result = DashboardLogic::getRevenueComposition($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(DashboardLogic::getError());
        }
        if ($result === false) return JsonService::fail(DashboardLogic::getError());
        return JsonService::data($result);
    }
}