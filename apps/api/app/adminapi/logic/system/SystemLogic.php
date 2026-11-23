<?php
namespace app\adminapi\logic\system;

use app\adminapi\lists\system\AdminLists;
use app\adminapi\lists\system\RoleLists;
use app\adminapi\lists\system\OperationLogLists;
use app\common\logic\BaseLogic;
use app\common\model\auth\Admin;
use app\common\model\auth\AdminRole;
use app\common\model\auth\SystemRole;
use app\common\model\auth\SystemRoleMenu;
use app\common\model\auth\SystemMenu;
use app\common\model\OperationLog;
use app\common\service\JsonService;
use think\facade\Db;

class SystemLogic extends BaseLogic
{
    public static function userLists(array $params)
    {
        $lists = new AdminLists($params);
        return JsonService::dataLists($lists);
    }

    public static function userDetail(string $id)
    {
        $admin = Admin::find($id);
        if (empty($admin)) {
            self::setError('用户不存在');
            return false;
        }
        
        $data = $admin->toArray();
        
        $roleIds = AdminRole::where('admin_id', $id)->column('role_id');
        if (!empty($roleIds)) {
            $role = SystemRole::find($roleIds[0]);
            $data['role_name'] = $role ? $role['name'] : '';
        } else {
            $data['role_name'] = '';
        }
        
        $data['status'] = $admin['disable'] == 0 ? 'active' : 'inactive';
        
        return $data;
    }

    public static function userAdd(array $params)
    {
        $account = $params['username'] ?? '';
        $name = $params['name'] ?? '';
        $email = $params['email'] ?? '';
        $phone = $params['phone'] ?? '';
        $role_id = $params['role_id'] ?? '';
        $password = $params['password'] ?? '';

        if (empty($account) || empty($name) || empty($email) || empty($role_id) || empty($password)) {
            self::setError('请填写完整信息');
            return false;
        }

        if (Admin::where('account', $account)->count() > 0) {
            self::setError('用户名已存在');
            return false;
        }

        Db::startTrans();
        try {
            $admin = new Admin();
            $admin->account = $account;
            $admin->name = $name;
            $admin->email = $email;
            $admin->phone = $phone;
            $admin->password = md5($password);
            $admin->disable = 0;
            $admin->create_time = time();
            $admin->save();

            $adminRole = new AdminRole();
            $adminRole->admin_id = $admin->id;
            $adminRole->role_id = $role_id;
            $adminRole->save();

            Db::commit();
            return $admin->toArray();
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('添加失败');
            return false;
        }
    }

    public static function userEdit(string $id, array $params)
    {
        $admin = Admin::find($id);
        if (empty($admin)) {
            self::setError('用户不存在');
            return false;
        }

        Db::startTrans();
        try {
            if (isset($params['name'])) $admin->name = $params['name'];
            if (isset($params['email'])) $admin->email = $params['email'];
            if (isset($params['phone'])) $admin->phone = $params['phone'];
            if (isset($params['password']) && !empty($params['password'])) {
                $admin->password = md5($params['password']);
            }
            $admin->update_time = time();
            $admin->save();

            if (isset($params['role_id'])) {
                AdminRole::where('admin_id', $id)->delete();
                $adminRole = new AdminRole();
                $adminRole->admin_id = $id;
                $adminRole->role_id = $params['role_id'];
                $adminRole->save();
            }

            Db::commit();
            return $admin->toArray();
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('修改失败');
            return false;
        }
    }

    public static function userToggleStatus(string $id)
    {
        $admin = Admin::find($id);
        if (empty($admin)) {
            self::setError('用户不存在');
            return false;
        }

        $admin->disable = $admin->disable == 0 ? 1 : 0;
        if (!$admin->save()) {
            self::setError('操作失败');
            return false;
        }

        return ['status' => $admin->disable == 0 ? 'active' : 'inactive'];
    }

    public static function userDelete(string $id)
    {
        $admin = Admin::find($id);
        if (empty($admin)) {
            self::setError('用户不存在');
            return false;
        }

        Db::startTrans();
        try {
            AdminRole::where('admin_id', $id)->delete();
            $admin->delete();
            Db::commit();
            return true;
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('删除失败');
            return false;
        }
    }

    public static function roleLists(array $params)
    {
        $lists = new RoleLists($params);
        return JsonService::dataLists($lists);
    }

    public static function roleDetail(string $id)
    {
        $role = SystemRole::find($id);
        if (empty($role)) {
            self::setError('角色不存在');
            return false;
        }

        $data = $role->toArray();
        $data['permissions'] = SystemRoleMenu::where('role_id', $id)->column('menu_id');
        $data['description'] = $data['describe'] ?? '';
        
        return $data;
    }

    public static function roleAdd(array $params)
    {
        $name = $params['name'] ?? '';
        $description = $params['description'] ?? '';
        $permissions = $params['permissions'] ?? [];

        if (empty($name)) {
            self::setError('请输入角色名称');
            return false;
        }

        Db::startTrans();
        try {
            $role = new SystemRole();
            $role->name = $name;
            $role->describe = $description;
            $role->rules = '';
            $role->is_system = 0;
            $role->create_time = time();
            $role->save();

            foreach ($permissions as $menuId) {
                $roleMenu = new SystemRoleMenu();
                $roleMenu->role_id = $role->id;
                $roleMenu->menu_id = $menuId;
                $roleMenu->save();
            }

            Db::commit();
            return $role->toArray();
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('添加失败');
            return false;
        }
    }

    public static function roleEdit(string $id, array $params)
    {
        $role = SystemRole::find($id);
        if (empty($role)) {
            self::setError('角色不存在');
            return false;
        }

        if ($role->is_system == 1) {
            self::setError('系统角色不能修改');
            return false;
        }

        Db::startTrans();
        try {
            if (isset($params['name'])) $role->name = $params['name'];
            if (isset($params['description'])) $role->describe = $params['description'];
            $role->update_time = time();
            $role->save();

            SystemRoleMenu::where('role_id', $id)->delete();
            $permissions = $params['permissions'] ?? [];
            foreach ($permissions as $menuId) {
                $roleMenu = new SystemRoleMenu();
                $roleMenu->role_id = $id;
                $roleMenu->menu_id = $menuId;
                $roleMenu->save();
            }

            Db::commit();
            return $role->toArray();
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('修改失败');
            return false;
        }
    }

    public static function roleDelete(string $id)
    {
        $role = SystemRole::find($id);
        if (empty($role)) {
            self::setError('角色不存在');
            return false;
        }

        if ($role->is_system == 1) {
            self::setError('系统角色不能删除');
            return false;
        }

        $adminCount = AdminRole::where('role_id', $id)->count();
        if ($adminCount > 0) {
            self::setError('该角色下有用户，无法删除');
            return false;
        }

        Db::startTrans();
        try {
            SystemRoleMenu::where('role_id', $id)->delete();
            $role->delete();
            Db::commit();
            return true;
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('删除失败');
            return false;
        }
    }

    public static function getPermissions()
    {
        $menus = SystemMenu::where('is_show', 1)->order('sort', 'asc')->select()->toArray();
        
        $categories = [
            ['id' => 'merchant', 'name' => '商户管理'],
            ['id' => 'package', 'name' => '套餐管理'],
            ['id' => 'bill', 'name' => '账单管理'],
            ['id' => 'ticket', 'name' => '工单管理'],
            ['id' => 'announcement', 'name' => '公告管理'],
            ['id' => 'user', 'name' => '用户管理'],
            ['id' => 'service', 'name' => '增值服务'],
            ['id' => 'support', 'name' => '球房支持'],
            ['id' => 'dashboard', 'name' => '数据分析'],
        ];

        $permissions = [];
        foreach ($menus as $menu) {
            $permissions[] = [
                'id' => $menu['id'],
                'name' => $menu['name'],
                'code' => $menu['route'],
                'category' => self::getCategoryByRoute($menu['route']),
            ];
        }

        return [
            'categories' => $categories,
            'permissions' => $permissions,
        ];
    }

    private static function getCategoryByRoute($route)
    {
        if (str_contains($route, 'merchant')) return 'merchant';
        if (str_contains($route, 'package')) return 'package';
        if (str_contains($route, 'bill')) return 'bill';
        if (str_contains($route, 'ticket') && !str_contains($route, 'support')) return 'ticket';
        if (str_contains($route, 'announcement') && !str_contains($route, 'support')) return 'announcement';
        if (str_contains($route, 'admin') || str_contains($route, 'role') || str_contains($route, 'system')) return 'user';
        if (str_contains($route, 'service')) return 'service';
        if (str_contains($route, 'support')) return 'support';
        if (str_contains($route, 'dashboard')) return 'dashboard';
        return 'other';
    }

    public static function logLists(array $params)
    {
        $lists = new OperationLogLists($params);
        return JsonService::dataLists($lists);
    }

    public static function logDetail(string $id)
    {
        $log = OperationLog::find($id);
        if (empty($log)) {
            self::setError('日志不存在');
            return false;
        }
        return $log->toArray();
    }

    private static function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}