<?php

namespace app\storeapi\controller\order;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\order\OrderLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class OrderController extends BaseStoreController
{
    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = OrderLogic::getList($params, $this->storeId);
        if ($result === false) return JsonService::fail(OrderLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function detail(string $id)
    {
        $result = OrderLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        if ($result === false) return JsonService::fail(OrderLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function table()
    {
        $params = $this->request->post();
        $result = OrderLogic::createTableOrder($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('开台成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function extend(string $id)
    {
        $params = $this->request->post();
        $result = OrderLogic::extend($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('加时成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function pause(string $id)
    {
        $result = OrderLogic::pause($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('暂停成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function resume(string $id)
    {
        $result = OrderLogic::resume($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('恢复成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function checkout(string $id)
    {
        $params = $this->request->post();
        $result = OrderLogic::checkout($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('结账成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function cancel(string $id)
    {
        $params = $this->request->post();
        $result = OrderLogic::cancel($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('取消成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function product()
    {
        $params = $this->request->post();
        $result = OrderLogic::createProductOrder($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function assistant()
    {
        $params = $this->request->post();
        $result = OrderLogic::createAssistantOrder($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function merge()
    {
        $params = $this->request->post();
        $result = OrderLogic::merge($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('合并成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function refund(string $id)
    {
        $params = $this->request->post();
        $result = OrderLogic::refund($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('退款成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function inProgress()
    {
        $result = OrderLogic::getInProgress($this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        if ($result === false) return JsonService::fail(OrderLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function remark(string $id)
    {
        $params = $this->request->post();
        $result = OrderLogic::addRemark($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('添加成功', $result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function tableOrders()
    {
        $tableId = $this->request->get('table_id', '');
        $result = OrderLogic::getOrdersByTable($tableId, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        if ($result === false) return JsonService::fail(OrderLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function export()
    {
        $params = $this->request->get();
        $result = OrderLogic::export($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return $result;
    }

    #[Permission('order:list', '订单操作', 'pc', '订单管理', ['boss', 'manager', 'cashier'])]
    public function batchCheckout()
    {
        $params = $this->request->post();
        $result = OrderLogic::batchCheckout($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(OrderLogic::getError());
        }
        return JsonService::success('结账成功', $result['data']);
    }
}