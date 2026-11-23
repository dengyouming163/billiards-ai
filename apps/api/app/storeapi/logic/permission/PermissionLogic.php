<?php

declare (strict_types=1);

namespace app\storeapi\logic\permission;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Permission;

class PermissionLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $query = Permission::where('store_id', $storeId)
            ->where('status', 1);

        if (!empty($params['parent_id'])) {
            $query->where('parent_id', $params['parent_id']);
        }

        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->whereLike('name', "%{$keyword}%");
        }

        $permissions = $query->order('sort_order', 'asc')->select()->toArray();

        return $permissions;
    }

    public static function getTree(string $storeId)
    {
        $permissions = Permission::where('store_id', $storeId)
            ->where('status', 1)
            ->order('sort_order', 'asc')
            ->select()
            ->toArray();

        return self::buildTree($permissions);
    }

    protected static function buildTree(array $permissions, string $parentId = '')
    {
        $tree = [];

        foreach ($permissions as $permission) {
            if ($permission['parent_id'] == $parentId) {
                $children = self::buildTree($permissions, $permission['id']);
                if (!empty($children)) {
                    $permission['children'] = $children;
                }
                $tree[] = $permission;
            }
        }

        return $tree;
    }

    public static function getDetail(string $id, string $storeId)
    {
        $permission = Permission::where('id', $id)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->find();

        if (!$permission) {
            return self::setError('权限不存在');
        }

        return $permission->toArray();
    }

    public static function create(array $params, string $storeId)
    {
        $required = ['name', 'code'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return self::setError($field . '不能为空');
            }
        }

        $exists = Permission::where('store_id', $storeId)
            ->where('code', $params['code'])
            ->where('status', 1)
            ->find();

        if ($exists) {
            return self::setError('权限编码已存在');
        }

        $permission = new Permission();
        $permission->id = 'perm_' . uniqid();
        $permission->store_id = $storeId;
        $permission->parent_id = $params['parent_id'] ?? '';
        $permission->name = $params['name'];
        $permission->code = $params['code'];
        $permission->uri = $params['uri'] ?? '';
        $permission->icon = $params['icon'] ?? '';
        $permission->sort_order = $params['sort_order'] ?? 0;
        $permission->type = $params['type'] ?? 'menu';
        $permission->status = 1;
        $permission->save();

        return $permission->toArray();
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $permission = Permission::where('id', $id)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->find();

        if (!$permission) {
            return self::setError('权限不存在');
        }

        if (!empty($params['code'])) {
            $exists = Permission::where('store_id', $storeId)
                ->where('code', $params['code'])
                ->where('id', '<>', $id)
                ->where('status', 1)
                ->find();

            if ($exists) {
                return self::setError('权限编码已存在');
            }
            $permission->code = $params['code'];
        }

        if (!empty($params['name'])) {
            $permission->name = $params['name'];
        }
        if (isset($params['parent_id'])) {
            $permission->parent_id = $params['parent_id'];
        }
        if (isset($params['uri'])) {
            $permission->uri = $params['uri'];
        }
        if (isset($params['icon'])) {
            $permission->icon = $params['icon'];
        }
        if (isset($params['sort_order'])) {
            $permission->sort_order = $params['sort_order'];
        }
        if (isset($params['type'])) {
            $permission->type = $params['type'];
        }

        $permission->save();

        return $permission->toArray();
    }

    public static function delete(string $id, string $storeId)
    {
        $permission = Permission::where('id', $id)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->find();

        if (!$permission) {
            return self::setError('权限不存在');
        }

        $hasChildren = Permission::where('parent_id', $id)
            ->where('status', 1)
            ->find();

        if ($hasChildren) {
            return self::setError('请先删除子权限');
        }

        $permission->status = 0;
        $permission->save();

        return true;
    }
}