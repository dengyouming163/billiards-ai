<?php

declare (strict_types=1);

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\product\ProductLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ProductController extends BaseStoreController
{
    #[Permission('mobile:table:order', '台桌点单', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function list()
    {
        $params = $this->request->get();
        $result = ProductLogic::getAll($params, $this->storeId);
        return JsonService::success('success', $result);
    }
}
