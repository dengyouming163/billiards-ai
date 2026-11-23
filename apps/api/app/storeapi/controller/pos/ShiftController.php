<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\shift\ShiftLogic;

class ShiftController extends BasePosController
{
    public function checkIn()
    {
        $params = $this->request->post();
        $result = ShiftLogic::checkIn($params, $this->getEmployeeId(), $this->getStoreId());
        
        if ($result === false) {
            return $this->fail(ShiftLogic::getError());
        }
        
        return $this->success('签到成功', $result ?: []);
    }

    public function checkOut()
    {
        $params = $this->request->post();
        $result = ShiftLogic::checkOut($this->getEmployeeId(), $this->getStoreId(), $params);
        
        if ($result === false) {
            return $this->fail(ShiftLogic::getError());
        }
        
        return $this->success('签退成功', $result ?: []);
    }

    public function current()
    {
        $result = ShiftLogic::getCurrent($this->getEmployeeId(), $this->getStoreId());
        return $this->data($result);
    }

    public function records()
    {
        $params = $this->request->get();
        $page = (int)($params['page'] ?? 1);
        $pageSize = (int)($params['page_size'] ?? 20);
        $paginator = ShiftLogic::getRecords($this->getEmployeeId(), $this->getStoreId(), $params);
        return $this->success('获取成功', [
            'lists' => $paginator->items(),
            'count' => $paginator->total(),
            'page_no' => $paginator->currentPage(),
            'page_size' => $paginator->listRows(),
        ]);
    }

    public function configs()
    {
        $result = ShiftLogic::getShiftConfigs($this->getStoreId());
        return $this->success('获取成功', $result ?: []);
    }

    public function summary()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $employeeId = $this->getEmployeeId();
        if (empty($employeeId)) {
            return $this->fail('员工ID不能为空');
        }

        $result = ShiftLogic::shiftSummary($employeeId, $storeId);
        if ($result === false) {
            return $this->fail(ShiftLogic::getError());
        }

        return $this->success('获取成功', $result);
    }

    public function employees()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $result = ShiftLogic::getEmployees($storeId);
        return $this->success('获取成功', $result ?: []);
    }

    public function startWork()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $employeeId = $this->request->post('employee_id');
        $password = $this->request->post('password');
        if (empty($employeeId) || empty($password)) {
            return $this->fail('员工ID和密码不能为空');
        }
        $result = ShiftLogic::startWork($employeeId, $password, $storeId);
        if ($result === false) {
            return $this->fail(ShiftLogic::getError());
        }
        return $this->success('上班成功', $result);
    }

    public function handover()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        $employeeId = $this->getEmployeeId();
        if (empty($employeeId)) {
            return $this->fail('员工ID不能为空');
        }
        $params = $this->request->post();
        $result = ShiftLogic::handover($employeeId, $storeId, $params);
        if ($result === false) {
            return $this->fail(ShiftLogic::getError());
        }
        return $this->success('交接成功', $result);
    }
}
