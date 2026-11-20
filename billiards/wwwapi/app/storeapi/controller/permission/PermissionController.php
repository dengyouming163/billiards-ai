<?php

namespace app\storeapi\controller\permission;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\permission\PermissionLogic;
use app\storeapi\logic\role\PermissionLogic as RolePermissionLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class PermissionController extends BaseStoreController
{
    public array $notNeedLogin = ['all', 'myPermissions'];

    #[Permission('employee:role', '权限管理', 'pc', '员工管理', ['boss'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = PermissionLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('employee:role', '权限管理', 'pc', '员工管理', ['boss'])]
    public function tree()
    {
        $result = PermissionLogic::getTree($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('employee:role', '权限管理', 'pc', '员工管理', ['boss'])]
    public function detail(string $id)
    {
        $result = PermissionLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PermissionLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('employee:role', '权限管理', 'pc', '员工管理', ['boss'])]
    public function create()
    {
        $params = $this->request->post();
        $result = PermissionLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PermissionLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('employee:role', '权限管理', 'pc', '员工管理', ['boss'])]
    public function update(string $id)
    {
        $params = $this->request->put();
        $result = PermissionLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PermissionLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('employee:role', '权限管理', 'pc', '员工管理', ['boss'])]
    public function delete(string $id)
    {
        $result = PermissionLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PermissionLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function all(): \think\Response
    {
        $module = $this->request->get('module', '');
        $permissions = RolePermissionLogic::getAllPermissionsByModule($this->storeId, $module);
        return JsonService::data($permissions);
    }

    public function myPermissions(): \think\Response
    {
        $module = $this->request->get('module', '');
        $codes = RolePermissionLogic::getEmployeePermissions($this->employeeId, $this->storeId);
        if ($module) {
            $allByModule = RolePermissionLogic::getAllPermissionsByModule($this->storeId, $module);
            $moduleCodes = array_column($allByModule, 'code');
            $codes = array_intersect($codes, $moduleCodes);
        }
        return JsonService::data(array_values($codes));
    }
}
