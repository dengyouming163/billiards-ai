<?php

namespace app\storeapi\controller\approval;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\ApprovalLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ApprovalConfigController extends BaseStoreController
{
    #[Permission('employee:approval', '审批管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function list()
    {
        $storeId = $this->storeId;
        $data = ApprovalLogic::getConfigList($storeId);
        return JsonService::data($data);
    }

    #[Permission('employee:approval', '审批管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function save()
    {
        $params = $this->request->post();
        $storeId = $this->storeId;

        $result = ApprovalLogic::saveConfig($params, $storeId);
        if ($result === false) {
            return JsonService::fail(ApprovalLogic::getError() ?: '保存失败');
        }
        return JsonService::success('保存成功');
    }

    #[Permission('employee:approval', '审批管理', 'pc', '员工管理', ['boss', 'manager'])]
    public function employees()
    {
        $storeId = $this->storeId;
        $data = ApprovalLogic::getApprovers($storeId);
        return JsonService::data($data);
    }
}
