<?php

namespace app\storeapi\controller\assistant;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\assistant\AssistantLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class AssistantController extends BaseStoreController
{
    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = AssistantLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getDetail()
    {
        $id = $this->request->get('id');
        $result = AssistantLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function create()
    {
        $params = $this->request->post();
        $result = AssistantLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function update()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        $result = AssistantLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function delete()
    {
        $id = $this->request->post('id');
        $result = AssistantLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getLevels()
    {
        $result = AssistantLogic::getLevels($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function createLevel()
    {
        $params = $this->request->post();
        $result = AssistantLogic::createLevel($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateLevel()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        $result = AssistantLogic::updateLevel($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteLevel()
    {
        $id = $this->request->post('id');
        $result = AssistantLogic::deleteLevel($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getSchedules()
    {
        $id = $this->request->get('id');
        // Get single schedule by ID
        if (!empty($id)) {
            $schedule = \app\common\model\merchant\EmployeeSchedule::where('id', $id)
                ->whereNull('deleted_at')->find();
            if (!$schedule) return JsonService::fail('排班不存在');
            $data = $schedule->toArray();
            $data['date'] = $data['work_date'] ?? '';
            $data['shift'] = $data['shift_type'] ?? '';
            // Look up assistant name via employee_id
            $assistant = \app\common\model\merchant\Assistant::where('employee_id', $schedule->employee_id)
                ->whereNull('deleted_at')->find();
            $data['employee_name'] = $assistant['name'] ?? '';
            $data['assistant_id'] = $assistant['id'] ?? '';
            $data['employee_id'] = $assistant['id'] ?? $schedule->employee_id; // Use assistant_id for mobile compatibility
            return JsonService::data([$data]);
        }

        $assistantId = $this->request->get('assistant_id');
        $startDate = $this->request->get('start_date');
        $endDate = $this->request->get('end_date');

        if (empty($assistantId) || empty($startDate) || empty($endDate)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::getSchedules($assistantId, $startDate, $endDate);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function setSchedule()
    {
        $params = $this->request->post();
        
        if (empty($params['assistant_id']) || empty($params['schedules'])) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::setSchedule($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('设置成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getShiftConfigs()
    {
        $result = AssistantLogic::getShiftConfigs($this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function createShiftConfig()
    {
        $params = $this->request->post();
        
        if (empty($params['name']) || empty($params['start_time']) || empty($params['end_time'])) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::createShiftConfig($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateShiftConfig()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::updateShiftConfig($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteShiftConfig()
    {
        $id = $this->request->post('id');
        
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::deleteShiftConfig($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function initShiftConfigs()
    {
        $result = AssistantLogic::initDefaultShiftConfigs($this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('初始化成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function initLevels()
    {
        $result = AssistantLogic::initLevels($this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('初始化成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getOrders()
    {
        $params = $this->request->get();
        $result = AssistantLogic::getOrders($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function createOrder()
    {
        $params = $this->request->post();
        
        if (empty($params['assistant_id']) || empty($params['total_amount'])) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::createOrder($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateOrderStatus()
    {
        $orderId = $this->request->post('order_id');
        $status = $this->request->post('status');
        
        if (empty($orderId) || empty($status)) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::updateOrderStatus($orderId, $status, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function submitReview()
    {
        $orderId = $this->request->post('order_id');
        $rating = $this->request->post('rating');
        $review = $this->request->post('review', '');
        
        if (empty($orderId) || empty($rating)) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::submitReview($orderId, (int)$rating, $review, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('评价成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getStats()
    {
        $result = AssistantLogic::getStats($this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateSchedule()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();
        
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        
        $result = AssistantLogic::updateSchedule($id, $params);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteSchedule()
    {
        $id = $this->request->post('id');

        if (empty($id)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::deleteSchedule($id);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getCommissionConfig()
    {
        $assistantId = $this->request->get('assistant_id');

        if (empty($assistantId)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::getCommissionConfig($assistantId, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getAllCommissionConfigs()
    {
        $result = AssistantLogic::getAllCommissionConfigs($this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function saveCommissionConfig()
    {
        $params = $this->request->post();

        if ((empty($params['assistant_id']) && empty($params['assistant_ids'])) || empty($params['commission_type'])) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::saveCommissionConfig($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteCommissionConfig()
    {
        $id = $this->request->post('id');

        if (empty($id)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::deleteCommissionConfig($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getCommissionRecords()
    {
        $params = $this->request->get();
        $result = AssistantLogic::getCommissionRecords($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function markCommissionPaid()
    {
        $ids = $this->request->post('ids');

        if (empty($ids) || !is_array($ids)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::markCommissionPaid($ids, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('操作成功');
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getCommissionStats()
    {
        $params = $this->request->get();
        $result = AssistantLogic::getCommissionStats($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function getServices()
    {
        $result = AssistantLogic::getServices($this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function createService()
    {
        $params = $this->request->post();

        if (empty($params['name']) || !isset($params['price'])) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::createService($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function updateService()
    {
        $id = $this->request->post('id');
        $params = $this->request->post();

        if (empty($id)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::updateService($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function deleteService()
    {
        $id = $this->request->post('id');

        if (empty($id)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::deleteService($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    /**
     * 一键结算历史提成
     * POST /assistant.Assistant/batchSettleCommission
     */
    public function batchSettleCommission()
    {
        $storeId = $this->request->post('store_id', $this->storeId);
        $startDate = $this->request->post('start_date', '');
        $endDate = $this->request->post('end_date', '');

        if (empty($storeId)) {
            return JsonService::fail('门店ID不能为空');
        }

        $query = \app\common\model\merchant\OrderItem::alias('oi')
            ->join('busi_order o', 'o.id = oi.order_id')
            ->where('o.store_id', $storeId)
            ->where('oi.item_type', 'assistant')
            ->whereNotNull('oi.assistant_id')
            ->where('oi.assistant_id', '<>', '')
            ->whereIn('oi.status', ['completed', 'serving'])
            ->where('oi.final_price', '>', 0);

        if (!empty($startDate)) $query->where('oi.created_at', '>=', $startDate . ' 00:00:00');
        if (!empty($endDate)) $query->where('oi.created_at', '<=', $endDate . ' 23:59:59');

        $items = $query->field('oi.*')->order('oi.created_at', 'asc')->select();

        $total = count($items);
        $processed = 0; $skipped = 0; $errors = 0;

        foreach ($items as $item) {
            $exists = \app\common\model\merchant\CommissionRecord::where('order_item_id', $item['id'])->find();
            if ($exists) { $skipped++; continue; }

            $config = \app\common\model\merchant\CommissionConfig::where('assistant_id', $item['assistant_id'])->where('status', 1)->find();
            if (!$config) { $skipped++; continue; }

            try {
                \app\storeapi\logic\assistant\AssistantLogic::calculateCommission(
                    $item['assistant_id'], $item['id'],
                    floatval($item['final_price'] ?? $item['total_price'] ?? 0), $storeId
                );
                $processed++;
            } catch (\Exception $e) { $errors++; }
        }

        return JsonService::success("成功结算 {$processed} 笔，跳过 {$skipped} 笔" . ($errors > 0 ? "，失败 {$errors} 笔" : ''), [
            'total' => $total, 'processed' => $processed, 'skipped' => $skipped, 'errors' => $errors
        ]);
    }

    /**
     * 月薪结算
     * POST /assistant.Assistant/settleCommission
     */
    #[Permission('assistant:list', '助教管理', 'pc', '员工管理', ['boss', 'manager', 'coach'])]
    public function settleCommission()
    {
        $assistantId = $this->request->post('assistant_id');
        $month = $this->request->post('month', date('Y-m'));

        if (empty($assistantId)) {
            return JsonService::fail('参数错误');
        }

        $result = AssistantLogic::settleMonthlyCommission($assistantId, $month, $this->storeId);
        if ($result === false) {
            return JsonService::fail(AssistantLogic::getError());
        }
        return JsonService::success('结算成功', $result);
    }
}
