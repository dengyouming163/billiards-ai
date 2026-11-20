<?php
namespace app\adminapi\lists\system;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\auth\Admin;
use app\common\model\auth\AdminRole;
use app\common\model\auth\SystemRole;

class AdminLists extends BaseAdminDataLists implements ListsSearchInterface
{
    public function setSearch(): array
    {
        return [
            '%like%' => ['account', 'name', 'email'],
            '=' => ['disable'],
        ];
    }

    public function lists(): array
    {
        $adminIds = Admin::where($this->searchWhere)
            ->order('create_time', 'desc')
            ->limit($this->limitOffset, $this->limitLength)
            ->column('id');

        if (empty($adminIds)) {
            return [];
        }

        $roleMap = [];
        $adminRoles = AdminRole::whereIn('admin_id', $adminIds)->select();
        foreach ($adminRoles as $ar) {
            $roleMap[$ar['admin_id']] = $ar['role_id'];
        }

        $roleIdList = array_unique(array_values($roleMap));
        $roleNameMap = [];
        if (!empty($roleIdList)) {
            $roles = SystemRole::whereIn('id', $roleIdList)->select();
            foreach ($roles as $r) {
                $roleNameMap[$r['id']] = $r['name'];
            }
        }

        $list = Admin::whereIn('id', $adminIds)
            ->order('create_time', 'desc')
            ->select()
            ->toArray();

        foreach ($list as &$item) {
            $item['username'] = $item['account'] ?? '';
            $item['role_id'] = $roleMap[$item['id']] ?? '';
            $item['role_name'] = $roleNameMap[$roleMap[$item['id']] ?? ''] ?? '';
            $item['status'] = $item['disable'] == 0 ? 'active' : 'inactive';
            $item['last_login'] = !empty($item['login_time']) ? (is_numeric($item['login_time']) ? date('Y-m-d H:i:s', $item['login_time']) : $item['login_time']) : null;
            $item['created_at'] = is_numeric($item['create_time']) ? date('Y-m-d H:i:s', $item['create_time']) : $item['create_time'];
        }

        return $list;
    }

    public function count(): int
    {
        return Admin::where($this->searchWhere)->count();
    }
}