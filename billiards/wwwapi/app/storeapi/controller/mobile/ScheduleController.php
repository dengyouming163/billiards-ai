<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\ScheduleLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ScheduleController extends BaseStoreController
{
    #[Permission('mobile:schedule', '排班查询', 'mobile', '考勤', ['employee', 'assistant', 'boss', 'manager'])]
    public function mySchedule()
    {
        $week = $this->request->get('week', 0);

        $result = ScheduleLogic::getMySchedule($this->employeeId, $week);
        return JsonService::data($result);
    }

    #[Permission('mobile:schedule', '排班查询', 'mobile', '考勤', ['employee', 'assistant', 'boss', 'manager'])]
    public function employeeSchedule()
    {
        $employeeId = $this->request->get('employee_id', $this->employeeId);
        $week = $this->request->get('week', 0);
        $role = $this->request->get('role', 'waiter');

        $result = ScheduleLogic::getEmployeeSchedule($employeeId, $week, $role);
        return JsonService::data($result);
    }

    #[Permission('mobile:schedule', '排班查询', 'mobile', '考勤', ['employee', 'assistant', 'boss', 'manager'])]
    public function adjust()
    {
        $params = $this->request->post();

        $result = ScheduleLogic::adjustSchedule($params, $this->employeeId, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ScheduleLogic::getError());
        }
        return JsonService::success('调整成功', $result);
    }
}
