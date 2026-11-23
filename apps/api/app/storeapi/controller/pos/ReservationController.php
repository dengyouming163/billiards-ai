<?php

namespace app\storeapi\controller\pos;

use app\storeapi\logic\order\ReservationLogic;

class ReservationController extends BasePosController
{
    public function lists()
    {
        $storeId = $this->getStoreId();
        $params = $this->request->get();
        $result = ReservationLogic::getLists($storeId, $params);
        return $this->success('获取成功', $result);
    }

    public function create()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();
        $operatorId = $this->getEmployeeId() ?? '';
        $result = ReservationLogic::create($data, $storeId, $operatorId);
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        return $this->success('预约成功', $result);
    }

    public function cancel()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();
        $result = ReservationLogic::cancel($data['id'] ?? '', $storeId);
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        return $this->success('已取消', $result);
    }

    public function checkIn()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();
        $result = ReservationLogic::checkIn($data['id'] ?? '', $storeId);
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        return $this->success('已到店', $result);
    }

    public function confirm()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();
        $result = ReservationLogic::confirm($data['id'] ?? '', $storeId);
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        return $this->success('已确认', $result);
    }
}
