<?php

namespace app\storeapi\controller\employee;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\employee\EmployeeLogic;
use app\storeapi\logic\role\PermissionLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class EmployeeController extends BaseStoreController
{
    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function lists()
    {
        $this->checkPermission('employee:list');
        $params = $this->request->get();
        $result = EmployeeLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function detail(string $id)
    {
        $this->checkPermission('employee:list');
        $result = EmployeeLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(EmployeeLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function create()
    {
        $this->checkPermission('employee:list');
        $params = $this->request->post();
        $result = EmployeeLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(EmployeeLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function update(string $id)
    {
        $this->checkPermission('employee:list');
        $params = $this->request->put();
        $result = EmployeeLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(EmployeeLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function delete(string $id)
    {
        $this->checkPermission('employee:list');
        $result = EmployeeLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(EmployeeLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function resetPassword()
    {
        $this->checkPermission('employee:list');
        $id = $this->request->param('id', '');
        if (empty($id)) {
            return JsonService::fail('参数错误：缺少员工ID');
        }
        $result = EmployeeLogic::resetPassword($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(EmployeeLogic::getError());
        }
        return JsonService::success('重置成功', $result);
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function stores()
    {
        $result = EmployeeLogic::getEmployeeStores($this->employeeId);
        return JsonService::success('', $result);
    }

    #[Permission('employee:list', '员工管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function permissions()
    {
        $codes = PermissionLogic::getEmployeePermissions($this->employeeId, $this->storeId);
        return JsonService::success('', $codes);
    }

    #[Permission('employee:schedule', '排班管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function schedules()
    {
        $params = $this->request->get();
        $result = EmployeeLogic::getSchedules($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('employee:schedule', '排班管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function createSchedule()
    {
        $params = $this->request->post();
        $result = EmployeeLogic::createSchedule($params, $this->storeId);
        return JsonService::success('创建成功', $result);
    }

    #[Permission('employee:schedule', '排班管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function updateSchedule(string $id)
    {
        $this->checkPermission('employee:schedule');
        $params = $this->request->post();
        $result = EmployeeLogic::updateSchedule($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(EmployeeLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('employee:schedule', '排班管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function batchSchedules()
    {
        $params = $this->request->post();
        $result = EmployeeLogic::batchCreateSchedules($params, $this->storeId);
        return JsonService::success('批量创建成功', $result);
    }

    #[Permission('employee:schedule', '排班管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function deleteSchedule(string $id)
    {
        $result = EmployeeLogic::deleteSchedule($id);
        return JsonService::success('删除成功');
    }

    #[Permission('employee:attendance', '考勤记录', 'pc', '员工管理', ['boss', 'manager'])]
    public function checkIn()
    {
        $params = $this->request->post();
        $result = EmployeeLogic::checkIn($params);
        return JsonService::success('签到成功', $result);
    }

    #[Permission('employee:attendance', '考勤记录', 'pc', '员工管理', ['boss', 'manager'])]
    public function checkOut()
    {
        $params = $this->request->post();
        $result = EmployeeLogic::checkOut($params);
        return JsonService::success('签退成功', $result);
    }

    #[Permission('employee:attendance', '考勤记录', 'pc', '员工管理', ['boss', 'manager'])]
    public function attendances(string $id)
    {
        $params = $this->request->get();
        $result = EmployeeLogic::getAttendances($id, $params);
        return JsonService::data($result);
    }

    #[Permission('employee:attendance', '考勤记录', 'pc', '员工管理', ['boss', 'manager'])]
    public function attendanceStats()
    {
        $params = $this->request->get();
        $result = EmployeeLogic::getAttendanceStats($params);
        return JsonService::data($result);
    }
}
