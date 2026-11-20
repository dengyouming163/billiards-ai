<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\product\ProductCategoryLogic;

class ProductCategoryController extends BasePosController
{
    public function lists()
    {
        $result = ProductCategoryLogic::getList($this->storeId);
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
        
        $result = ProductCategoryLogic::getDetail($id, $this->storeId);
        
        if ($result === false) {
            return $this->fail(ProductCategoryLogic::getError());
        }
        
        return $this->data($result);
    }
}
