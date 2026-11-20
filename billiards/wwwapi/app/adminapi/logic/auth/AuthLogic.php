<?php
namespace app\adminapi\logic\auth;

use app\adminapi\service\AdminTokenService;
use app\common\model\auth\Admin;
use app\common\model\auth\AdminRole;
use app\common\model\auth\SystemRole;
use think\facade\Db;

class AuthLogic
{
    protected static $error = '';

    public static function getError()
    {
        return self::$error;
    }

    public static function login($params)
    {
        $username = $params['username'] ?? '';
        $password = $params['password'] ?? '';

        if (empty($username)) {
            self::$error = '请输入用户名';
            return false;
        }

        if (empty($password)) {
            self::$error = '请输入密码';
            return false;
        }

        $admin = Admin::where('account', $username)->find();
        if (!$admin) {
            self::$error = '用户名或密码错误';
            return false;
        }

        if (md5($password) !== $admin['password']) {
            self::$error = '用户名或密码错误';
            return false;
        }

        if ($admin['disable'] == 1) {
            self::$error = '账号已被禁用';
            return false;
        }

        $adminTokenCache = new \app\common\cache\AdminTokenCache();
        $adminInfo = AdminTokenService::setToken($admin['id'], 1, $admin['multipoint_login']);
        
        if (empty($adminInfo)) {
            self::$error = '登录失败';
            return false;
        }

        Admin::where('id', $admin['id'])->update([
            'login_time' => time(),
            'update_time' => time(),
        ]);

        $roleIds = AdminRole::where('admin_id', $admin['id'])->column('role_id');
        $roles = SystemRole::whereIn('id', $roleIds)->column('name');

        $token = Db::name('admin_session')->where('admin_id', $admin['id'])->value('token');

        return [
            'id' => $admin['id'],
            'username' => $admin['account'],
            'name' => $admin['name'],
            'avatar_url' => $admin['avatar'],
            'roles' => $roles,
            'token' => $token,
        ];
    }

    public static function logout()
    {
        $token = request()->header('token');
        if ($token) {
            AdminTokenService::expireToken($token);
        }
        return true;
    }

    public static function info()
    {
        $adminId = request()->adminId;
        if (!$adminId) {
            self::$error = '请先登录';
            return false;
        }

        $admin = Admin::where('id', $adminId)->find();
        if (!$admin) {
            self::$error = '管理员不存在';
            return false;
        }

        $roleIds = AdminRole::where('admin_id', $adminId)->column('role_id');
        $roles = SystemRole::whereIn('id', $roleIds)->column('name');

        return [
            'id' => $admin['id'],
            'username' => $admin['account'],
            'name' => $admin['name'],
            'avatar_url' => $admin['avatar'],
            'roles' => $roles,
        ];
    }

    public static function getAllAuth()
    {
        static $authList = [];
        
        if (!empty($authList)) {
            return $authList;
        }

        $config = config('auth');
        if (empty($config)) {
            return [];
        }

        foreach ($config as $module) {
            foreach ($module['auth'] as $auth) {
                $authList[] = $auth['uri'];
            }
        }

        return $authList;
    }

    public static function getAuthByAdminId($adminId)
    {
        $roleIds = AdminRole::where('admin_id', $adminId)->column('role_id');
        
        if (empty($roleIds)) {
            return [];
        }

        $menuIds = Db::name('system_role_menu')
            ->whereIn('role_id', $roleIds)
            ->column('menu_id');

        if (empty($menuIds)) {
            return [];
        }

        $routes = Db::name('system_menu')
            ->whereIn('id', $menuIds)
            ->column('route');

        $authList = [];
        $config = config('auth');
        
        foreach ($routes as $route) {
            foreach ($config as $module) {
                foreach ($module['auth'] as $auth) {
                    if (str_contains($auth['uri'], $route)) {
                        $authList[] = $auth['uri'];
                    }
                }
            }
        }

        return array_unique($authList);
    }
}