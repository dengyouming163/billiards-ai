<?php
namespace app\adminapi\controller\dashboard;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\dashboard\DashboardLogic;
use app\common\service\JsonService;

class DashboardController extends BaseAdminController
{
    public function overview()
    {
        $result = DashboardLogic::overview();
        return JsonService::data($result);
    }

    public function trends()
    {
        $params = $this->request->get();
        $result = DashboardLogic::trends($params);
        return JsonService::data($result);
    }

    public function healthRanking()
    {
        $result = DashboardLogic::healthRanking();
        return JsonService::data($result);
    }

    public function recentActivities()
    {
        $result = DashboardLogic::recentActivities();
        return JsonService::data($result);
    }

    public array $notNeedLogin = ['overview', 'trends', 'healthRanking', 'recentActivities'];
}