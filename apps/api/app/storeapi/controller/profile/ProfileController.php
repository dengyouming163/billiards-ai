<?php

namespace app\storeapi\controller\profile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\profile\ProfileLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ProfileController extends BaseStoreController
{
    #[Permission('overview', '个人资料', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function detail()
    {
        $result = ProfileLogic::getDetail($this->userId);
        if ($result === false) {
            return JsonService::fail(ProfileLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('overview', '个人资料', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function update()
    {
        $params = $this->request->post();
        $result = ProfileLogic::updateProfile($this->userId, $params);
        if ($result === false) {
            return JsonService::fail(ProfileLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('overview', '个人资料', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function avatar()
    {
        $params = $this->request->post();
        $result = ProfileLogic::updateAvatar($this->userId, $params['avatar'] ?? '');
        if ($result === false) {
            return JsonService::fail(ProfileLogic::getError());
        }
        return JsonService::success('头像更新成功', $result);
    }
}
