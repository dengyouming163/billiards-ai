<?php

declare (strict_types=1);

namespace app\storeapi\controller;

use app\storeapi\logic\assistant\AssistantLogic;
use app\common\annotation\Permission;
use app\common\controller\StoreApiBase;

class AssistantController extends StoreApiBase
{
    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function lists()
    {
        $params = $this->request->get();
        $storeId = $this->getStoreId();
        
        $result = AssistantLogic::getList($params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getDetail()
    {
        $id = $this->request->get('id');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::getDetail($id, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function create()
    {
        $params = $this->request->post();
        
        if (empty($params['name']) || empty($params['phone']) || empty($params['level_id'])) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::create($params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function update()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::update($id, $params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function delete()
    {
        $id = $this->request->post('id');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::delete($id, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success([]);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getLevels()
    {
        $storeId = $this->getStoreId();
        $result = AssistantLogic::getLevels($storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function createLevel()
    {
        $params = $this->request->post();
        
        if (empty($params['name'])) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::createLevel($params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateLevel()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::updateLevel($id, $params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteLevel()
    {
        $id = $this->request->post('id');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::deleteLevel($id, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success([]);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getSchedules()
    {
        $assistantId = $this->request->get('assistant_id');
        $startDate = $this->request->get('start_date');
        $endDate = $this->request->get('end_date');
        
        if (empty($assistantId) || empty($startDate) || empty($endDate)) {
            return $this->fail('参数错误');
        }
        
        $result = AssistantLogic::getSchedules($assistantId, $startDate, $endDate);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function setSchedule()
    {
        $params = $this->request->post();
        
        if (empty($params['assistant_id']) || empty($params['schedules'])) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::setSchedule($params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success([]);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getShiftConfigs()
    {
        $storeId = $this->getStoreId();
        $result = AssistantLogic::getShiftConfigs($storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getOrders()
    {
        $params = $this->request->get();
        $storeId = $this->getStoreId();
        
        $result = AssistantLogic::getOrders($params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateSchedule()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $result = AssistantLogic::updateSchedule($id, $params);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteSchedule()
    {
        $id = $this->request->post('id');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $result = AssistantLogic::deleteSchedule($id);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success([]);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function createOrder()
    {
        $params = $this->request->post();
        
        if (empty($params['assistant_id']) || empty($params['total_amount'])) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::createOrder($params, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateOrderStatus()
    {
        $orderId = $this->request->post('order_id');
        $status = $this->request->post('status');
        
        if (empty($orderId) || empty($status)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::updateOrderStatus($orderId, $status, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function submitReview()
    {
        $orderId = $this->request->post('order_id');
        $rating = $this->request->post('rating');
        $review = $this->request->post('review', '');
        
        if (empty($orderId) || empty($rating)) {
            return $this->fail('参数错误');
        }
        
        $storeId = $this->getStoreId();
        $result = AssistantLogic::submitReview($orderId, (int)$rating, $review, $storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success([]);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getStats()
    {
        $storeId = $this->getStoreId();
        $result = AssistantLogic::getStats($storeId);
        
        if ($result === false) {
            return $this->fail(AssistantLogic::getError());
        }
        
        return $this->success($result);
    }
}
