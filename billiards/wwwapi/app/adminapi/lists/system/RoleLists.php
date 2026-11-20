<?php
namespace app\adminapi\lists\system;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\auth\SystemRole;
use app\common\model\auth\SystemRoleMenu;
use app\common\model\auth\AdminRole;

class RoleLists extends BaseAdminDataLists implements ListsSearchInterface
{
    public function setSearch(): array
    {
        return [
            '%like%' => ['name', 'desc'],
            '=' => ['is_system'],
        ];
    }

    public function lists(): array
    {
        $roleIds = SystemRole::where($this->searchWhere)
            ->order('create_time', 'desc')
            ->limit($this->limitOffset, $this->limitLength)
            ->column('id');

        if (empty($roleIds)) {
            return [];
        }

        $permissionCount = SystemRoleMenu::whereIn('role_id', $roleIds)
            ->group('role_id')
            ->column('count(*)', 'role_id');

        $userCount = AdminRole::whereIn('role_id', $roleIds)
            ->group('role_id')
            ->column('count(*)', 'role_id');

        $list = SystemRole::whereIn('id', $roleIds)
            ->order('create_time', 'desc')
            ->select()
            ->toArray();

        foreach ($list as &$item) {
            $item['permissions'] = SystemRoleMenu::where('role_id', $item['id'])->column('menu_id');
            $item['user_count'] = $userCount[$item['id']] ?? 0;
            $item['is_system'] = isset($item['is_system']) && $item['is_system'] == 1;
            $item['created_at'] = isset($item['create_time']) && is_numeric($item['create_time']) ? date('Y-m-d H:i:s', $item['create_time']) : '';
            $item['description'] = $item['desc'] ?? '';
        }

        return $list;
    }

    public function count(): int
    {
        return SystemRole::where($this->searchWhere)->count();
    }
}