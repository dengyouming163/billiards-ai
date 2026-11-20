<?php
namespace app\adminapi\controller\auth;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\auth\AuthLogic;
use app\common\service\JsonService;

class AuthController extends BaseAdminController
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

    public function logout()
    {
        $result = AuthLogic::logout();
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::success('退出成功');
    }

    public function info()
    {
        $result = AuthLogic::info();
        if ($result === false) {
            return JsonService::fail(AuthLogic::getError());
        }
        return JsonService::data($result);
    }

    public array $notNeedLogin = ['login'];
    public array $notNeedAuth = ['login', 'logout', 'info'];
}