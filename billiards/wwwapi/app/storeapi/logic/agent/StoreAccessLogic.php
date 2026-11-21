<?php

declare(strict_types=1);

namespace app\storeapi\logic\agent;

use app\common\model\merchant\Employee;
use app\common\model\merchant\EmployeeStore;
use app\common\model\merchant\Store;
use think\exception\HttpException;

class StoreAccessLogic
{
    public static function assertAccess(string $employeeId, string $storeId): array
    {
        $employee = $employeeId !== '' ? Employee::find($employeeId) : null;
        $store = $storeId !== '' ? Store::find($storeId) : null;

        if (!$employee || !$store || $employee->status !== 1) {
            throw new HttpException(403, '无权访问该门店');
        }

        $isBoss = $employee->role === 'boss';
        if ($isBoss) {
            $merchantId = (string)$employee->merchant_id;
            if ($merchantId === '' || $merchantId !== (string)$store->merchant_id) {
                throw new HttpException(403, '无权访问该门店');
            }
        } else {
            $membership = EmployeeStore::where('employee_id', $employeeId)
                ->where('store_id', $storeId)
                ->find();
            if (!$membership) {
                throw new HttpException(403, '无权访问该门店');
            }
        }

        return [
            'employee' => $employee->toArray(),
            'store' => $store->toArray(),
            'is_boss' => $isBoss,
        ];
    }

    public static function rejectIdentityOverrides(array $query, array $body): void
    {
        foreach (['tenant_id', 'employee_id', 'role', 'permissions'] as $field) {
            if (array_key_exists($field, $query) || array_key_exists($field, $body)) {
                throw new HttpException(422, '身份字段只能来自登录令牌');
            }
        }
    }
}
