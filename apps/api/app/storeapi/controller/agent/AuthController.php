<?php

declare(strict_types=1);

namespace app\storeapi\controller\agent;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\agent\StoreAccessLogic;
use app\storeapi\logic\role\PermissionLogic;

class AuthController extends BaseStoreController
{
    public function context()
    {
        StoreAccessLogic::rejectIdentityOverrides($this->request->get(), $this->request->post());

        $storeId = $this->getStoreId();
        if ($storeId === '') {
            return json(['code' => 'invalid_store_context', 'message' => 'store_id 不能为空'], 422);
        }

        $access = StoreAccessLogic::assertAccess($this->employeeId, $storeId);
        $employee = $access['employee'];
        $permissions = $access['is_boss']
            ? ['*']
            : array_values(PermissionLogic::getEmployeePermissions($this->employeeId, $storeId));

        return json([
            'employee_id' => $employee['id'],
            'merchant_id' => $employee['merchant_id'],
            'store_id' => $storeId,
            'role' => $employee['role'],
            'permissions' => $permissions,
        ]);
    }
}
