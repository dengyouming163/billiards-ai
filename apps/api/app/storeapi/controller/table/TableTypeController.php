<?php

namespace app\storeapi\controller\table;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\table\TableTypeLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class TableTypeController extends BaseStoreController
{
    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = TableTypeLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function all()
    {
        $params = $this->request->get();
        $result = TableTypeLogic::getAll($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function detail(string $id)
    {
        $result = TableTypeLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableTypeLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        if (empty($params['name']) || mb_strlen($params['name']) > 20) {
            return JsonService::fail('台型名称不能为空且不超过20个字符');
        }
        $result = TableTypeLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableTypeLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function update(string $id)
    {
        $params = $this->request->post();
        if (isset($params['name']) && mb_strlen($params['name']) > 20) {
            return JsonService::fail('台型名称不超过20个字符');
        }
        $result = TableTypeLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableTypeLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function delete(string $id)
    {
        $result = TableTypeLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableTypeLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $id = $this->request->post('id', '');
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = TableTypeLogic::toggle($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableTypeLogic::getError());
        }
        return JsonService::success('操作成功', $result);
    }
}
