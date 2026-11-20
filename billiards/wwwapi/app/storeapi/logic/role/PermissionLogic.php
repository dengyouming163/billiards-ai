<?php

declare (strict_types=1);

namespace app\storeapi\logic\role;

use app\common\logic\BaseLogic;
use app\common\model\merchant\EmployeeRole;
use app\common\model\merchant\Permission;
use app\common\model\merchant\EmployeeRoleRelation;
use app\common\model\merchant\Employee;
use app\common\model\merchant\RolePermission;

class PermissionLogic extends BaseLogic
{
    public static function getAllPermissions(string $storeId): array
    {
        return Permission::where(function ($q) use ($storeId) {
                $q->where('store_id', $storeId)
                  ->whereOr('store_id', '__system__');
            })
            ->where('status', 1)
            ->order('sort_order', 'asc')
            ->select()
            ->toArray();
    }

    public static function getEmployeePermissions(string $employeeId, string $storeId): array
    {
        $permissionCodes = EmployeeRoleRelation::alias('err')
            ->join('bi_busi_role_permission rp', "err.role_id = rp.role_id AND (rp.store_id = '{$storeId}' OR rp.store_id = '' OR rp.store_id = '__system__')")
            ->join('bi_busi_permission p', "rp.permission_id = p.id")
            ->where('err.employee_id', $employeeId)
            ->where('p.status', 1)
            ->column('p.code');

        // 兜底：如果员工没有 EmployeeRoleRelation 记录，通过 Employee.role 字段推断
        if (empty($permissionCodes)) {
            $employee = Employee::find($employeeId);
            if ($employee && !empty($employee->role)) {
                // 查找该角色对应的系统全局角色记录
                $roleRecord = EmployeeRole::where('code', $employee->role)
                    ->where('status', 1)
                    ->where(function ($q) use ($storeId) {
                        $q->where('store_id', $storeId)
                          ->whereOr(function ($sq) {
                              $sq->where('is_system', 1)
                                 ->where(function ($ssq) {
                                     $ssq->where('store_id', '')->whereOr('store_id', '__system__');
                                 });
                          });
                    })
                    ->find();
                if ($roleRecord) {
                    $permissionCodes = RolePermission::alias('rp')
                        ->join('bi_busi_permission p', 'rp.permission_id = p.id')
                        ->where('rp.role_id', $roleRecord->id)
                        ->where(function ($q) use ($storeId) {
                            $q->where('rp.store_id', $storeId)
                              ->whereOr('rp.store_id', '')
                              ->whereOr('rp.store_id', '__system__');
                        })
                        ->where('p.status', 1)
                        ->column('p.code');
                }
            }
        }

        return array_unique($permissionCodes);
    }

    public static function hasPermission(string $employeeId, string $code, string $storeId): bool
    {
        $hasPermission = EmployeeRoleRelation::alias('err')
            ->join('bi_busi_role_permission rp', "err.role_id = rp.role_id AND (rp.store_id = '{$storeId}' OR rp.store_id = '' OR rp.store_id = '__system__')")
            ->join('bi_busi_permission p', "rp.permission_id = p.id")
            ->where('err.employee_id', $employeeId)
            ->where('p.code', $code)
            ->where('p.status', 1)
            ->count() > 0;

        // 兜底：如果员工没有 EmployeeRoleRelation 记录，通过 Employee.role 字段推断
        if (!$hasPermission) {
            $employee = Employee::find($employeeId);
            if ($employee && !empty($employee->role)) {
                $roleRecord = EmployeeRole::where('code', $employee->role)
                    ->where('status', 1)
                    ->where(function ($q) use ($storeId) {
                        $q->where('store_id', $storeId)
                          ->whereOr(function ($sq) {
                              $sq->where('is_system', 1)
                                 ->where(function ($ssq) {
                                     $ssq->where('store_id', '')->whereOr('store_id', '__system__');
                                 });
                          });
                    })
                    ->find();
                if ($roleRecord) {
                    $hasPermission = RolePermission::alias('rp')
                        ->join('bi_busi_permission p', 'rp.permission_id = p.id')
                        ->where('rp.role_id', $roleRecord->id)
                        ->where('p.code', $code)
                        ->where('p.status', 1)
                        ->where(function ($q) use ($storeId) {
                            $q->where('rp.store_id', $storeId)
                              ->whereOr('rp.store_id', '')
                              ->whereOr('rp.store_id', '__system__');
                        })
                        ->count() > 0;
                }
            }
        }

        return $hasPermission;
    }

    public static function getAllPermissionsByModule(string $storeId, string $module = ''): array
    {
        $query = Permission::where('status', 1);
        if ($module) {
            $query->where('module', $module);
        }
        return $query->order('sort_order', 'asc')->select()->toArray();
    }

    public static function getAllSystemPermissions(string $module = ''): array
    {
        $query = Permission::where('status', 1);
        if ($module) {
            $query->where('module', $module);
        }
        return $query->order('sort_order', 'asc')->select()->toArray();
    }

    private static function isBoss(string $employeeId): bool
    {
        $employee = Employee::find($employeeId);
        return $employee && $employee->role === 'boss';
    }
}
