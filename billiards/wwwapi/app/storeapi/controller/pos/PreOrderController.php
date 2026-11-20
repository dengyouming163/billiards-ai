<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\common\logic\OrderLogic;

class PreOrderController extends BasePosController
{
    public function lists()
    {
        $params = $this->request->get();
        $orderId = $params['order_id'] ?? '';
        
        if (empty($orderId)) {
            $result = OrderLogic::getPendingPreOrders($this->storeId);
        } else {
            $result = OrderLogic::getPreOrders($orderId, $this->storeId);
        }
        
        return $this->data($result);
    }

    public function byTable()
    {
        $tableId = $this->request->get('table_id', '');
        
        if (empty($tableId)) {
            return $this->fail('台桌ID不能为空');
        }
        
        $result = OrderLogic::getPreOrdersByTable($tableId, $this->storeId);
        
        return $this->data($result);
    }

    public function confirm()
    {
        $data = $this->request->post();
        
        if (empty($data['preorder_group_id'])) {
            return $this->fail('预订单组ID不能为空');
        }
        
        $employeeId = $data['employee_id'] ?? $this->employeeId;
        $result = OrderLogic::confirmPreOrder($data['preorder_group_id'], $employeeId, $this->storeId);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('预订单已确认', $result);
    }

    public function reject()
    {
        $data = $this->request->post();
        
        if (empty($data['preorder_group_id'])) {
            return $this->fail('预订单组ID不能为空');
        }
        
        $reason = $data['reason'] ?? '';
        $result = OrderLogic::rejectPreOrder($data['preorder_group_id'], $reason);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('预订单已拒绝', $result);
    }

    public function getByOrder()
    {
        $orderId = $this->request->get('order_id', '');
        
        if (empty($orderId)) {
            return $this->fail('订单ID不能为空');
        }
        
        $groups = OrderLogic::getPreOrders($orderId, $this->storeId);
        
        return $this->success('获取成功', ['groups' => $groups]);
    }
}
