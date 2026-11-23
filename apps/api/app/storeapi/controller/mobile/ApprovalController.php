<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\ApprovalLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ApprovalController extends BaseStoreController
{
    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function lists()
    {
        $status = $this->request->get('status', '');
        $page = $this->request->get('page_no', 1);
        $pageSize = $this->request->get('page_size', 20);

        $result = ApprovalLogic::getLists($this->storeId, $status, $page, $pageSize);
        return JsonService::data($result);
    }

    public function list()
    {
        $params = $this->request->get();
        $status = $params['status'] ?? '';
        $page = (int)($params['page'] ?? 1);
        $pageSize = (int)($params['page_size'] ?? 20);

        $result = ApprovalLogic::getMyList($this->employeeId, $status, $page, $pageSize);
        return JsonService::success('success', $result);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function pending()
    {
        $params = $this->request->get();
        $page = (int)($params['page'] ?? 1);
        $pageSize = (int)($params['page_size'] ?? 20);

        $result = ApprovalLogic::getPendingList($this->employeeId, $page, $pageSize);
        return JsonService::success('success', $result);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function detail()
    {
        $id = $this->request->get('id', '');
        $result = ApprovalLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ApprovalLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function count()
    {
        $result = ApprovalLogic::getCount($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function create()
    {
        $params = $this->request->post();

        if (empty($params['type'])) {
            return JsonService::fail('请选择申请类型');
        }

        if (empty($params['reason'])) {
            return JsonService::fail('请填写申请理由');
        }

        $result = ApprovalLogic::create($params, $this->employeeId, $this->storeId);

        if ($result === false) {
            return JsonService::fail(ApprovalLogic::getError());
        }

        return JsonService::success('申请提交成功', $result);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function approve()
    {
        $params = $this->request->post();

        if (empty($params['id'])) {
            return JsonService::fail('参数错误');
        }

        $remark = $params['remark'] ?? '';

        $result = ApprovalLogic::approve($params['id'], $this->employeeId, $this->employeeName, $remark);

        if ($result === false) {
            return JsonService::fail(ApprovalLogic::getError());
        }

        return JsonService::success('审批通过', []);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function reject()
    {
        $params = $this->request->post();

        if (empty($params['id'])) {
            return JsonService::fail('参数错误');
        }

        $remark = $params['remark'] ?? '';

        $result = ApprovalLogic::reject($params['id'], $this->employeeId, $this->employeeName, $remark);

        if ($result === false) {
            return JsonService::fail(ApprovalLogic::getError());
        }

        return JsonService::success('审批已拒绝', []);
    }

    #[Permission('mobile:settings', '设置', 'mobile', '设置', ['boss', 'manager'])]
    public function configList()
    {
        $result = ApprovalLogic::getConfigList($this->storeId);
        return JsonService::success('success', ['list' => $result]);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function configSave()
    {
        $params = $this->request->post();

        if (empty($params['type'])) {
            return JsonService::fail('请选择审批类型');
        }

        if (empty($params['type_name'])) {
            return JsonService::fail('请填写类型名称');
        }

        if (empty($params['approver_ids'])) {
            return JsonService::fail('请选择至少一个审批人');
        }

        $result = ApprovalLogic::saveConfig($params, $this->storeId);

        if ($result === false) {
            return JsonService::fail(ApprovalLogic::getError());
        }

        return JsonService::success('配置保存成功', true);
    }

    #[Permission('mobile:approval', '审批管理', 'mobile', '审批', ['boss', 'manager', 'employee', 'coach', 'assistant', 'cashier'])]
    public function approvers()
    {
        $result = ApprovalLogic::getApprovers($this->storeId);
        return JsonService::success('success', ['list' => $result]);
    }
}
