<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\PerformanceLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class PerformanceController extends BaseStoreController
{
    #[Permission('mobile:performance', '我的业绩', 'mobile', '业绩', ['boss', 'manager', 'assistant', 'coach'])]
    public function index()
    {
        $result = PerformanceLogic::getToday($this->employeeId, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('mobile:performance', '我的业绩', 'mobile', '业绩', ['boss', 'manager', 'assistant', 'coach'])]
    public function trend()
    {
        $days = $this->request->get('days', 7);
        $result = PerformanceLogic::getTrend($this->employeeId, $this->storeId, $days);
        return JsonService::data($result);
    }

    #[Permission('mobile:performance', '我的业绩', 'mobile', '业绩', ['boss', 'manager', 'assistant', 'coach'])]
    public function ranking()
    {
        $result = PerformanceLogic::getRanking($this->employeeId, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('mobile:performance', '我的业绩', 'mobile', '业绩', ['boss', 'manager', 'assistant', 'coach'])]
    public function durationReport()
    {
        $startDate = $this->request->get('start_date', '');
        $endDate   = $this->request->get('end_date', '');
        if (empty($startDate) || empty($endDate)) {
            return JsonService::fail('请选择日期范围');
        }
        $result = PerformanceLogic::getDurationReport($this->employeeId, $this->storeId, $startDate, $endDate);
        return JsonService::data($result);
    }

    #[Permission('mobile:performance', '我的业绩', 'mobile', '业绩', ['boss', 'manager', 'assistant', 'coach'])]
    public function dailySummary()
    {
        $startDate = $this->request->get('start_date', '');
        $endDate   = $this->request->get('end_date', '');
        if (empty($startDate) || empty($endDate)) {
            return JsonService::fail('请选择日期范围');
        }
        $result = PerformanceLogic::getDailySummary($this->employeeId, $this->storeId, $startDate, $endDate);
        return JsonService::data($result);
    }

    #[Permission('mobile:performance', '我的业绩', 'mobile', '业绩', ['boss', 'manager', 'assistant', 'coach'])]
    public function monthly()
    {
        $result = PerformanceLogic::getMonthly($this->employeeId, $this->storeId);
        return JsonService::data($result);
    }
}
