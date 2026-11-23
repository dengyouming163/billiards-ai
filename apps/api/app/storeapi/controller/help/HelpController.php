<?php

namespace app\storeapi\controller\help;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\help\HelpLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class HelpController extends BaseStoreController
{
    #[Permission('overview', '帮助中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = HelpLogic::getLists($params);
        return JsonService::data($result);
    }

    #[Permission('overview', '帮助中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function categories()
    {
        $result = HelpLogic::getCategories();
        return JsonService::data($result);
    }
}
