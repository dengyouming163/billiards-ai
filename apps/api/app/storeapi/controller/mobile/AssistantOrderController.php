<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\AssistantOrderLogic;
use app\common\annotation\Permission;
use app\common\model\merchant\Assistant;
use app\common\service\JsonService;

class AssistantOrderController extends BaseStoreController
{
    private function getAssistantId(): string
    {
        return (string) (Assistant::where('employee_id', $this->employeeId)->value('id') ?? '');
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function pending()
    {
        $result = AssistantOrderLogic::getPendingOrders($this->getAssistantId(), $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function active()
    {
        $result = AssistantOrderLogic::getActiveOrder($this->getAssistantId());
        return JsonService::data($result);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function accept()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;

        $result = AssistantOrderLogic::acceptOrder($params);
        if ($result === false) {
            return JsonService::fail(AssistantOrderLogic::getError());
        }
        return JsonService::success('接单成功', []);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function start()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;

        $result = AssistantOrderLogic::startOrder($params);
        if ($result === false) {
            return JsonService::fail(AssistantOrderLogic::getError());
        }
        return JsonService::success('服务已开始', is_array($result) ? $result : []);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function reject()
    {
        $params = $this->request->post();

        $result = AssistantOrderLogic::rejectOrder($params);
        if ($result === false) {
            return JsonService::fail(AssistantOrderLogic::getError());
        }
        return JsonService::success('已拒绝', []);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function complete()
    {
        $params = $this->request->post();

        $result = AssistantOrderLogic::completeOrder($params);
        if ($result === false) {
            return JsonService::fail(AssistantOrderLogic::getError());
        }
        return JsonService::success('服务已结束', is_array($result) ? $result : []);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function history()
    {
        $page = $this->request->get('page_no', 1);
        $pageSize = $this->request->get('page_size', 20);

        $result = AssistantOrderLogic::getHistory($this->employeeId, $page, $pageSize);
        return JsonService::data($result);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function records()
    {
        $params = $this->request->get();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;

        $result = AssistantOrderLogic::getRecords($params);
        return JsonService::data($result);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function stats()
    {
        $params = $this->request->get();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;

        $result = AssistantOrderLogic::getStats($params);
        return JsonService::data($result);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function all()
    {
        $params = $this->request->get();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;

        $result = AssistantOrderLogic::getAllOrders($params);
        return JsonService::data($result);
    }

    #[Permission('mobile:orders', '接单中心', 'mobile', '订单', ['boss', 'manager', 'assistant'])]
    public function list()
    {
        $params = $this->request->get();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;

        $result = AssistantOrderLogic::getList($params);
        return JsonService::data($result);
    }
}
