<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\table\TableLogic;

class TableController extends BasePosController
{
    public function lists()
    {
        $params = $this->request->get();
        $storeId = $this->getStoreId();
        
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        
        $result = TableLogic::getList($params, $storeId);
        return $this->data($result);
    }

    public function detail(string $id)
    {
        $storeId = $this->getStoreId();
        
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        
        $result = TableLogic::getDetail($id, $storeId);
        
        if ($result === false) {
            return $this->fail(TableLogic::getError());
        }
        
        return $this->success('获取成功', $result);
    }

    public function stats()
    {
        $storeId = $this->getStoreId();
        
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        
        $params = $this->request->get();
        $result = TableLogic::getStats($storeId, $params);
        
        return $this->success('获取成功', $result);
    }

    public function update(string $id)
    {
        $params = $this->request->put();
        $storeId = $this->getStoreId();
        
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }
        
        $result = TableLogic::update($id, $params, $storeId);
        
        if ($result === false) {
            return $this->fail(TableLogic::getError());
        }
        
        return $this->success('更新成功', $result);
    }
}
