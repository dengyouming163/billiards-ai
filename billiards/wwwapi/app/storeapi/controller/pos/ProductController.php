<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\product\ProductLogic;

class ProductController extends BasePosController
{
    public function lists()
    {
        $params = $this->request->get();
        if (!isset($params['status'])) {
            $params['status'] = 1;
        }
        $result = ProductLogic::getList($params, $this->storeId);
        return $this->data($result);
    }

    public function all()
    {
        $params = $this->request->get();
        $params['status'] = 1;
        $result = ProductLogic::getAll($params, $this->storeId);
        return $this->data($result);
    }

    public function detail()
    {
        $id = $this->request->param('id', '');
        
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/detail\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $result = ProductLogic::getDetail($id, $this->storeId);
        
        if ($result === false) {
            return $this->fail(ProductLogic::getError());
        }
        
        return $this->data($result);
    }

    public function categories()
    {
        $result = ProductLogic::getCategories($this->storeId);
        return $this->data($result);
    }

    public function stats()
    {
        $result = ProductLogic::getStats($this->storeId);
        return $this->data($result);
    }
}
