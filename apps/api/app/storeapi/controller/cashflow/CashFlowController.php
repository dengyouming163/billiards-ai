<?php

namespace app\storeapi\controller\cashflow;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\CashFlowLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class CashFlowController extends BaseStoreController
{
    #[Permission('finance:cashflow', '现金流', 'pc', '财务管理', ['boss', 'manager', 'finance'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = CashFlowLogic::getList($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(CashFlowLogic::getError());
        }
        if ($result === false) return JsonService::fail(CashFlowLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('finance:cashflow', '现金流', 'pc', '财务管理', ['boss', 'manager', 'finance'])]
    public function stats()
    {
        $params = $this->request->get();
        $result = CashFlowLogic::getStats($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(CashFlowLogic::getError());
        }
        if ($result === false) return JsonService::fail(CashFlowLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('finance:cashflow', '现金流', 'pc', '财务管理', ['boss', 'manager', 'finance'])]
    public function export()
    {
        $params = $this->request->get();
        $result = CashFlowLogic::export($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(CashFlowLogic::getError());
        }
        return $result;
    }
}
