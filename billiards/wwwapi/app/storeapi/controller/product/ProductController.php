<?php

namespace app\storeapi\controller\product;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\product\ProductLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ProductController extends BaseStoreController
{
    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = ProductLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function all()
    {
        $params = $this->request->get();
        $result = ProductLogic::getAll($params, $this->storeId);
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
        $result = ProductLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        $result = ProductLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductLogic::getError());
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
        $result = ProductLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductLogic::getError());
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
        $result = ProductLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $id = $this->request->post('id', '');
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = ProductLogic::toggle($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ProductLogic::getError());
        }
        return JsonService::success('操作成功', $result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function categories()
    {
        $result = ProductLogic::getCategories($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:product', '商品管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function stats()
    {
        $result = ProductLogic::getStats($this->storeId);
        return JsonService::data($result);
    }
}
