<?php

namespace app\storeapi\controller\package;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\package\PackageLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class PackageController extends BaseStoreController
{
    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = PackageLogic::getList($params, $this->storeId);
        if ($result === false) return JsonService::fail(PackageLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function all()
    {
        $params = $this->request->get();
        $result = PackageLogic::getAll($params, $this->storeId);
        if ($result === false) return JsonService::fail(PackageLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
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
        $result = PackageLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PackageLogic::getError());
        }
        if ($result === false) return JsonService::fail(PackageLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        $result = PackageLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PackageLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
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
        $result = PackageLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PackageLogic::getError());
        }
        if (empty($result)) {
            return JsonService::fail('更新失败');
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
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
        $result = PackageLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PackageLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $id = $this->request->post('id', '');
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = PackageLogic::toggle($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PackageLogic::getError());
        }
        return JsonService::success('操作成功', $result);
    }

    #[Permission('settings:product', '套餐管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function types()
    {
        $result = PackageLogic::getPackageTypes($this->storeId);
        if ($result === false) return JsonService::fail(PackageLogic::getError());
        return JsonService::data($result);
    }
}
