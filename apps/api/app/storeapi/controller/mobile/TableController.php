<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\table\TableLogic;
use app\common\logic\OrderLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class TableController extends BaseStoreController
{
    #[Permission('mobile:table', '台桌管理', 'mobile', '台桌管理', ['boss', 'manager', 'coach', 'cashier', 'assistant', 'waiter', 'employee'])]
    public function lists()
    {
        $params = [
            'zone_id'   => $this->request->get('zone_id', ''),
            'status'    => $this->request->get('status', ''),
            'keyword'   => $this->request->get('keyword', ''),
            'page_no'   => $this->request->get('page_no', 1),
            'page_size' => $this->request->get('page_size', 20),
        ];

        $result = TableLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('mobile:table', '台桌管理', 'mobile', '台桌管理', ['boss', 'manager', 'coach', 'cashier', 'assistant', 'waiter', 'employee'])]
    public function detail()
    {
        $tableId = $this->request->get('table_id', '');
        if (empty($tableId)) {
            return JsonService::fail('桌台ID不能为空');
        }

        $table = TableLogic::getDetail($tableId, $this->storeId);
        if (!$table) {
            return JsonService::fail('桌台不存在');
        }

        $currentOrder = OrderLogic::getTableCurrentOrder($tableId);
        $data = is_array($table) ? $table : $table->toArray();
        $data['current_order'] = $currentOrder;

        return JsonService::data($data);
    }

    #[Permission('mobile:table', '台桌管理', 'mobile', '台桌管理', ['boss', 'manager', 'coach', 'cashier', 'assistant', 'waiter', 'employee'])]
    public function stats()
    {
        $result = TableLogic::getStats($this->storeId);
        return JsonService::data($result);
    }
}
