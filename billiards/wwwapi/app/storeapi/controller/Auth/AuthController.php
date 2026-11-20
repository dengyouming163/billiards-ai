<?php

namespace app\storeapi\controller\Auth;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\auth\AuthLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class AuthController extends BaseStoreController
{
    public function login()
    {
        $params = $this->request->post();
        $result = AuthLogic::login($params);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('登录成功', $result);
    }

    #[Permission('overview', '退出登录', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function logout()
    {
        $token = $this->request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }
        AuthLogic::logout($token);
        return JsonService::success('退出成功');
    }

    #[Permission('overview', '个人信息', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function info()
    {
        $result = AuthLogic::info($this->employeeInfo);
        return JsonService::data($result);
    }

    public function refresh()
    {
        $params = $this->request->post();
        $result = AuthLogic::refresh($params);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('刷新成功', $result);
    }

    #[Permission('overview', '修改密码', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function password()
    {
        $params = $this->request->put();
        $result = AuthLogic::changePassword($params, $this->employeeInfo);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('修改成功');
    }

    public function sendSmsCode()
    {
        $params = $this->request->post();
        $result = AuthLogic::sendSmsCode($params);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('发送成功', $result);
    }

    public function smsLogin()
    {
        $params = $this->request->post();
        $result = AuthLogic::smsLogin($params);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('登录成功', $result);
    }

    public function resetPassword()
    {
        $params = $this->request->post();
        $result = AuthLogic::resetPasswordBySms($params);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('重置成功');
    }

    public function switchStore()
    {
        $params = $this->request->post();
        $result = AuthLogic::switchStore($params, $this->employeeInfo);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('切换成功', $result);
    }

    /**
     * 获取当前员工可切换的角色列表
     * GET /auth.Auth/roles
     */
    public function roles()
    {
        $result = AuthLogic::getRoles($this->employeeInfo);
        return JsonService::data($result);
    }

    /**
     * 切换当前员工角色
     * POST /auth.Auth/switchRole
     */
    public function switchRole()
    {
        $params = $this->request->post();
        $result = AuthLogic::switchRole($params, $this->employeeInfo);
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('切换成功', $result);
    }

    public array $notNeedLogin = ['login', 'refresh', 'sendSmsCode', 'smsLogin', 'resetPassword'];
}