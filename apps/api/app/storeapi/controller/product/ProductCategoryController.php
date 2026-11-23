<?php

namespace app\storeapi\controller\product;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\product\ProductCategoryLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ProductCategoryController extends BaseStoreController
{
    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $result = ProductCategoryLogic::getList($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
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
            return JsonService::fail('参数错误');
        }
        $result = ProductCategoryLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductCategoryLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        $result = ProductCategoryLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductCategoryLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function update()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/update\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->put();
        if (empty($params)) {
            return JsonService::fail('缺少更新数据');
        }
        $result = ProductCategoryLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductCategoryLogic::getError());
        }
        if (empty($result)) {
            return JsonService::fail('更新失败');
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function delete()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/delete\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = ProductCategoryLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductCategoryLogic::getError());
        }
        return JsonService::success('删除成功');
    }
}
