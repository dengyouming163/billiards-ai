<?php

namespace app\storeapi\controller\role;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\role\RoleLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class RoleController extends BaseStoreController
{
    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = RoleLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function detail(string $id)
    {
        $result = RoleLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(RoleLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function create()
    {
        $params = $this->request->post();
        $result = RoleLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(RoleLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function update(string $id)
    {
        $params = $this->request->post();
        $result = RoleLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(RoleLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function delete(string $id)
    {
        $result = RoleLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(RoleLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function permissions(string $id)
    {
        $result = RoleLogic::getPermissions($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(RoleLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('employee:role', '角色管理', 'pc', '员工管理', ['boss'])]
    public function savePermissions(string $id)
    {
        $params = $this->request->post();
        $permissionIds = $params['permission_ids'] ?? [];
        $result = RoleLogic::savePermissions($id, $this->storeId, $permissionIds);
        if ($result === false) {
            return JsonService::fail(RoleLogic::getError());
        }
        return JsonService::success('保存成功');
    }
}
