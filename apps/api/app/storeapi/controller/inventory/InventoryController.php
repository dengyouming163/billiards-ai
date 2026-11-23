<?php

namespace app\storeapi\controller\inventory;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\inventory\InventoryLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class InventoryController extends BaseStoreController
{
    #[Permission('settings:product', '库存管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function inbound()
    {
        $params = $this->request->post();
        $result = InventoryLogic::inbound($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(InventoryLogic::getError());
        }
        return JsonService::success('入库成功', $result);
    }

    #[Permission('settings:product', '库存管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function outbound()
    {
        $params = $this->request->post();
        $result = InventoryLogic::outbound($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(InventoryLogic::getError());
        }
        return JsonService::success('出库成功', $result);
    }

    #[Permission('settings:product', '库存管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function records()
    {
        $params = $this->request->get();
        $result = InventoryLogic::getRecords($params, $this->storeId);
        if ($result === false) return JsonService::fail(InventoryLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:product', '库存管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function product()
    {
        $productId = $this->request->param('product_id', '');
        if (empty($productId)) {
            return JsonService::fail('商品ID不能为空');
        }
        $result = InventoryLogic::getProductInventory($productId, $this->storeId);
        if ($result === false) {
            return JsonService::fail(InventoryLogic::getError());
        }
        if ($result === false) return JsonService::fail(InventoryLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:product', '库存管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function adjust()
    {
        $params = $this->request->post();
        $result = InventoryLogic::adjustStock($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(InventoryLogic::getError());
        }
        return JsonService::success('调整成功', $result);
    }

    #[Permission('settings:product', '库存管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function stats()
    {
        $result = InventoryLogic::getInventoryStats($this->storeId);
        if ($result === false) return JsonService::fail(InventoryLogic::getError());
        return JsonService::data($result);
    }
}
