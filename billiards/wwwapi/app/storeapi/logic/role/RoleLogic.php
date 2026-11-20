<?php

declare (strict_types=1);

namespace app\storeapi\logic\role;

use app\common\logic\BaseLogic;
use app\common\model\merchant\EmployeeRole;
use app\common\model\merchant\Permission;
use app\common\model\merchant\RolePermission;
use app\common\model\merchant\Store;

class RoleLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $query = EmployeeRole::where('status', 1)
            ->where(function ($q) use ($storeId) {
                $q->where('is_system', 1)
                  ->where(function ($sq) {
                      $sq->where('store_id', '')->whereOr('store_id', '__system__');
                  })
                  ->whereOr('store_id', $storeId);
            });

        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->whereLike('name', "%{$keyword}%");
        }

        return $query->order('sort_order', 'asc')->select()->toArray();
    }

    public static function getDetail(string $id, string $storeId)
    {
        $role = EmployeeRole::where('id', $id)
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

        if (!$role) {
            return self::setError('角色不存在');
        }

        return $role->toArray();
    }

    public static function create(array $params, string $storeId)
    {
        if (empty($params['name'])) {
            return self::setError('name不能为空');
        }
        // 前端未传 code 时自动生成
        if (empty($params['code'])) {
            $params['code'] = 'role_' . bin2hex(random_bytes(4));
        }

        $exists = EmployeeRole::where('store_id', $storeId)
            ->where('code', $params['code'])
            ->where('status', 1)
            ->find();

        if ($exists) {
            return self::setError('角色编码已存在');
        }

        $role = new EmployeeRole();
        $role->id = 'role_' . bin2hex(random_bytes(8));
        $role->merchant_id = Store::where('id', $storeId)->value('merchant_id') ?: '';
        $role->store_id = $storeId;
        $role->name = $params['name'];
        $role->code = $params['code'];
        $role->description = $params['description'] ?? '';
        $role->sort_order = $params['sort_order'] ?? 0;
        $role->status = 1;
        $role->is_system = 0;
        $role->save();

        if (!empty($params['permission_ids'])) {
            self::savePermissions($role->id, $storeId, $params['permission_ids']);
        }

        return $role->toArray() ?: [];
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $role = self::findRole($id, $storeId);
        if (!$role) {
            return self::setError('角色不存在');
        }

        if (!empty($role['is_system']) && $role['is_system'] == 1) {
            return self::setError('系统预设角色不可编辑');
        }

        if (!empty($params['name'])) {
            $existing = EmployeeRole::where('name', $params['name'])
                ->where('store_id', $storeId)
                ->where('id', '<>', $id)
                ->find();
            if ($existing) {
                return self::setError('角色名称已存在');
            }
            $role->name = $params['name'];
        }

        if (isset($params['description'])) {
            $role->description = $params['description'];
        }
        if (isset($params['status'])) {
            $role->status = $params['status'];
        }
        if (isset($params['sort_order'])) {
            $role->sort_order = $params['sort_order'];
        }

        $role->save();
        return $role->toArray();
    }

    public static function delete(string $id, string $storeId)
    {
        $role = self::findRole($id, $storeId);
        if (!$role) {
            return self::setError('角色不存在');
        }

        if ($role->is_system == 1) {
            return self::setError('系统预设角色不可删除');
        }

        $role->status = 0;
        $role->save();

        RolePermission::where('role_id', $id)->where('store_id', $storeId)->delete();

        return true;
    }

    public static function getPermissions(string $roleId, string $storeId)
    {
        $role = self::findRole($roleId, $storeId);
        if (!$role) {
            return self::setError('角色不存在');
        }

        // 获取该角色已分配的权限 ID 列表
        $assignedIds = RolePermission::where('role_id', $roleId)
            ->where(function ($q) use ($storeId) {
                $q->where('store_id', $storeId)
                  ->whereOr('store_id', '')
                  ->whereOr('store_id', '__system__');
            })
            ->column('permission_id');

        // 加载所有活跃权限（权限目录全局可见，不按 store 过滤）
        $allPermissions = Permission::where('status', 1)
            ->order('sort_order', 'asc')
            ->select()
            ->toArray();

        // 按 module 分组并构建树形结构
        $pcTree = self::buildPermissionTree(
            array_values(array_filter($allPermissions, fn($p) => ($p['module'] ?? 'pc') === 'pc'))
        );
        $mobileTree = self::buildPermissionTree(
            array_values(array_filter($allPermissions, fn($p) => ($p['module'] ?? 'pc') === 'mobile'))
        );

        return [
            'pc' => [
                'tree' => $pcTree,
                'assigned_ids' => array_values(array_intersect($assignedIds, array_column(
                    array_filter($allPermissions, fn($p) => ($p['module'] ?? 'pc') === 'pc'),
                    'id'
                ))),
            ],
            'mobile' => [
                'tree' => $mobileTree,
                'assigned_ids' => array_values(array_intersect($assignedIds, array_column(
                    array_filter($allPermissions, fn($p) => ($p['module'] ?? 'pc') === 'mobile'),
                    'id'
                ))),
            ],
        ];
    }

    /**
     * 构建权限树（基于 parent_id，保留自然层级）
     */
    private static function buildPermissionTree(array $permissions): array
    {
        $tree = [];
        $map = [];
        foreach ($permissions as &$p) {
            $p['children'] = [];
            $map[$p['id']] = &$p;
        }
        unset($p);
        foreach ($permissions as &$p) {
            if (!empty($p['parent_id']) && isset($map[$p['parent_id']])) {
                $map[$p['parent_id']]['children'][] = &$p;
            } else {
                $tree[] = &$p;
            }
        }
        unset($p);
        return $tree;
    }

    public static function savePermissions(string $id, string $storeId, array $permissionIds)
    {
        $role = self::findRole($id, $storeId);
        if (!$role) {
            return self::setError('角色不存在');
        }

        if (!empty($role['is_system']) && $role['is_system'] == 1) {
            return self::setError('系统预设角色权限不可修改');
        }

        RolePermission::where('role_id', $id)
            ->where('store_id', $storeId)
            ->delete();

        foreach ($permissionIds as $permId) {
            $perm = Permission::find($permId);
            if ($perm) {
                RolePermission::create([
                    'id' => 'rp_' . uniqid(),
                    'role_id' => $id,
                    'permission_id' => $permId,
                    'store_id' => $storeId,
                ]);
            }
        }

        return true;
    }

    private static function findRole(string $id, string $storeId)
    {
        return EmployeeRole::where('id', $id)
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
    }
}