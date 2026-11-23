<?php

declare(strict_types=1);

namespace app\storeapi\controller;

use app\storeapi\logic\role\PermissionLogic;

class PermissionController extends BaseStoreController
{
    public array $notNeedLogin = ['all', 'myPermissions'];

    public function all(): \think\Response
    {
        $module = $this->request->get('module', '');
        $permissions = PermissionLogic::getAllPermissionsByModule($this->storeId, $module);
        return $this->success($permissions);
    }

    public function myPermissions(): \think\Response
    {
        $module = $this->request->get('module', '');
        $codes = PermissionLogic::getEmployeePermissions($this->employeeId, $this->storeId);
        if ($module) {
            $allByModule = PermissionLogic::getAllPermissionsByModule($this->storeId, $module);
            $moduleCodes = array_column($allByModule, 'code');
            $codes = array_intersect($codes, $moduleCodes);
        }
        return $this->success(array_values($codes));
    }
}
