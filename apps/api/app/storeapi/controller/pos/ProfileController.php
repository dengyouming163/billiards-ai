<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\pos\PosAuthLogic;

class ProfileController extends BasePosController
{
    public function stores()
    {
        $employeeInfo = $this->employeeInfo;
        
        $result = PosAuthLogic::getStores($employeeInfo);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('获取成功', $result['data']);
    }

    public function info()
    {
        $employeeInfo = $this->request->employeeInfo;
        
        if (empty($employeeInfo) || empty($employeeInfo['id'])) {
            return $this->fail('员工信息获取失败，请重新登录', [], 2002);
        }
        
        $result = PosAuthLogic::info($employeeInfo);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('获取成功', $result);
    }

    public function refresh()
    {
        $params = $this->request->post();
        $result = PosAuthLogic::refresh($params);
        
        if ($result === false) {
            return $this->fail(PosAuthLogic::getError());
        }
        
        return $this->success('刷新成功', $result);
    }

    public function password()
    {
        $params = $this->request->put();
        $result = PosAuthLogic::changePassword($params, $this->employeeInfo);
        
        if ($result === false) {
            return $this->fail(PosAuthLogic::getError());
        }
        
        return $this->success('修改成功');
    }
}