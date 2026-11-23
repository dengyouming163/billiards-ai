<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\MobileLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

#[Permission('mobile:report', '经营报表', 'mobile', '报表', ['boss', 'manager', 'finance'])]
class MobileController extends BaseStoreController
{
    #[Permission('mobile:dashboard', '手机端看板', 'mobile', '数据看板', ['boss', 'manager', 'finance'])]
    public function dashboardStats()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $dateType = $this->request->get('date_type', 'today');
        $startDate = $this->request->get('start_date', null);
        $endDate = $this->request->get('end_date', null);
        
        $result = MobileLogic::getDashboardStats($storeId, $dateType, $startDate, $endDate);
        if ($result === false) {
            return JsonService::fail(MobileLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('mobile:dashboard', '手机端看板', 'mobile', '数据看板', ['boss', 'manager', 'finance'])]
    public function quickStats()
    {
        $storeId = $this->storeId;
        $result = MobileLogic::getQuickStats($storeId);
        if ($result === false) {
            return JsonService::fail(MobileLogic::getError());
        }
        return JsonService::data($result);
    }
}
