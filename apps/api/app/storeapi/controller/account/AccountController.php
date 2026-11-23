<?php

namespace app\storeapi\controller\account;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\account\AccountLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class AccountController extends BaseStoreController
{
    #[Permission('overview', '账号管理', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function password()
    {
        $params = $this->request->post();
        $result = AccountLogic::changePassword($this->userId, $params);
        if ($result === false) {
            return JsonService::fail(AccountLogic::getError());
        }
        return JsonService::success('密码修改成功');
    }

    #[Permission('overview', '账号管理', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function security()
    {
        $result = AccountLogic::getSecuritySettings($this->userId);
        return JsonService::data($result);
    }

    #[Permission('overview', '账号管理', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function saveSecurity()
    {
        $params = $this->request->post();
        $result = AccountLogic::saveSecuritySettings($this->userId, $params);
        if ($result === false) {
            return JsonService::fail(AccountLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }
}
