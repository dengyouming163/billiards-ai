<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\pos\PosAuthLogic;

class AuthController extends BasePosController
{
    public array $notNeedLogin = [
        'login',
        'logout',
        'sendSmsCode',
        'smsLogin',
        'resetPassword'
    ];

    public function login()
    {
        $params = $this->request->post();
        $result = PosAuthLogic::login($params);
        
        if ($result === false) {
            return $this->fail(PosAuthLogic::getError());
        }
        
        return $this->success('登录成功', $result);
    }

    public function logout()
    {
        $token = $this->request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }
        
        if (empty($token)) {
            $token = $this->request->post('token', '');
        }
        
        if ($token) {
            PosAuthLogic::logout($token);
        }
        
        return $this->success('退出成功');
    }

    public function info()
    {
        $result = PosAuthLogic::info($this->employeeInfo);
        return $this->data($result);
    }

    public function sendSmsCode()
    {
        $params = $this->request->post();
        $result = PosAuthLogic::sendSmsCode($params);
        
        if ($result === false) {
            return $this->fail(PosAuthLogic::getError());
        }
        
        return $this->success('发送成功', $result);
    }

    public function smsLogin()
    {
        $params = $this->request->post();
        $result = PosAuthLogic::smsLogin($params);
        
        if ($result === false) {
            return $this->fail(PosAuthLogic::getError());
        }
        
        return $this->success('登录成功', $result);
    }

    public function resetPassword()
    {
        $params = $this->request->post();
        $result = PosAuthLogic::resetPasswordBySms($params);
        
        if ($result === false) {
            return $this->fail(PosAuthLogic::getError());
        }
        
        return $this->success('重置成功');
    }
}
