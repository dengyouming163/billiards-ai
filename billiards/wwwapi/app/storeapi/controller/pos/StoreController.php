<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\store\StoreLogic;

class StoreController extends BasePosController
{
    public function lists()
    {
        $params = $this->request->get();
        $employeeId = $this->getEmployeeId();
        $result = StoreLogic::getList($params, $employeeId);

        return $this->data($result);
    }

    public function detail(string $id)
    {
        $result = StoreLogic::getDetail($id);
        
        if ($result === false) {
            return $this->fail(StoreLogic::getError());
        }
        
        return $this->data($result);
    }

    public function switch()
    {
        $params = $this->request->post();
        $result = StoreLogic::switchStore($params, $this->employeeInfo);
        
        if ($result === false) {
            return $this->fail(StoreLogic::getError());
        }
        
        return $this->success('切换成功', $result);
    }

    public function current()
    {
        if (empty($this->storeId)) {
            return $this->fail('当前未选择门店');
        }
        
        $result = StoreLogic::getDetail($this->storeId);
        
        if ($result === false) {
            return $this->fail(StoreLogic::getError());
        }
        
        return $this->success('获取成功', $result);
    }
}
