<?php

declare (strict_types=1);

namespace app\storeapi\logic\pos;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Employee;
use app\common\model\merchant\Store;
use app\common\model\merchant\EmployeeStore;
use think\facade\Cache;

class PosAuthLogic extends BaseLogic
{
    public static function login(array $params)
    {
        $phone = $params['phone'] ?? '';
        $password = $params['password'] ?? '';

        if (empty($phone) || empty($password)) {
            self::setError('手机号或密码不能为空');
            return false;
        }

        $employee = Employee::where('phone', $phone)
            ->where('status', 1)
            ->find();

        if (!$employee) {
            self::setError('账号不存在');
            return false;
        }

        if (empty($employee['password'])) {
            self::setError('请使用短信验证码登录');
            return false;
        }

        $isValid = false;
        if (password_verify($password, $employee['password'])) {
            $isValid = true;
        } elseif (md5($password) === $employee['password']) {
            $isValid = true;
        }
        
        if (!$isValid) {
            self::setError('密码错误');
            return false;
        }

        $employeeStore = EmployeeStore::where('employee_id', $employee['id'])->find();
        $storeId = $employeeStore['store_id'] ?? $employee['store_id'] ?? '';
        $store = $storeId ? Store::find($storeId) : null;
        $storeName = $store ? $store['name'] : '未知门店';

        $employeeInfo = [
            'id' => $employee['id'],
            'username' => $employee['name'],
            'name' => $employee['name'],
            'phone' => $employee['phone'],
            'email' => $employee['email'],
            'role' => $employee['role'],
            'role_id' => $employee['role_id'] ?? '',
            'role_name' => $employee['role'],
            'roles' => [$employee['role']],
            'store_id' => $storeId,
            'store_name' => $storeName,
            'status' => 'active',
            'avatar_url' => $employee['avatar_url'] ?? '',
        ];

        $tokenInfo = \app\storeapi\service\PosEmployeeTokenService::setToken($employee['id'], $storeId, 'pos');

        return [
            'token' => $tokenInfo['token'],
            'refresh_token' => '',
            'expires_in' => \think\facade\Config::get('project.employee_token.expire_duration', 7200),
            'employee' => $employeeInfo,
        ];
    }

    public static function logout(string $token)
    {
        \app\storeapi\service\PosEmployeeTokenService::expireToken($token);
        return true;
    }

    public static function info(array $employeeInfo)
    {
        return $employeeInfo;
    }

    public static function refresh(array $params)
    {
        $refreshToken = $params['refresh_token'] ?? '';
        
        if (empty($refreshToken)) {
            self::setError('缺少refresh_token');
            return false;
        }

        self::setError('暂不支持refresh_token刷新');
        return false;
    }

    public static function changePassword(array $params, array $employeeInfo)
    {
        $oldPassword = $params['old_password'] ?? '';
        $newPassword = $params['new_password'] ?? '';

        if (empty($oldPassword) || empty($newPassword)) {
            self::setError('请输入原密码和新密码');
            return false;
        }

        $employee = Employee::find($employeeInfo['id']);
        if (!$employee) {
            self::setError('用户不存在');
            return false;
        }

        if (!password_verify($oldPassword, $employee['password']) && md5($oldPassword) !== $employee['password']) {
            self::setError('原密码错误');
            return false;
        }

        $employee->password = password_hash($newPassword, PASSWORD_DEFAULT);
        $employee->save();

        return true;
    }

    public static function sendSmsCode(array $params)
    {
        $phone = $params['phone'] ?? '';
        $type = $params['type'] ?? 'login';

        if (empty($phone)) {
            self::setError('手机号不能为空');
            return false;
        }

        $code = str_pad((string)mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
        $cacheKey = 'pos_sms_code_' . $phone . '_' . $type;
        
        Cache::set($cacheKey, $code, 300);

        return [
            'code' => $code,
            'expire_in' => 300,
            'message' => '短信验证码已发送',
        ];
    }

    public static function smsLogin(array $params)
    {
        $phone = $params['phone'] ?? '';
        $code = $params['code'] ?? '';

        if (empty($phone) || empty($code)) {
            self::setError('手机号或验证码不能为空');
            return false;
        }

        $cacheKey = 'pos_sms_code_' . $phone . '_login';
        $validCode = Cache::get($cacheKey);

        if ($validCode !== $code) {
            self::setError('验证码错误或已过期');
            return false;
        }

        Cache::delete($cacheKey);

        $employee = Employee::where('phone', $phone)
            ->where('status', 1)
            ->find();

        if (!$employee) {
            self::setError('员工不存在');
            return false;
        }

        $employeeStore = EmployeeStore::where('employee_id', $employee['id'])->find();
        $storeId = $employeeStore['store_id'] ?? $employee['store_id'] ?? '';
        $store = $storeId ? Store::find($storeId) : null;
        $storeName = $store ? $store['name'] : '未知门店';

        $employeeInfo = [
            'id' => $employee['id'],
            'username' => $employee['name'],
            'name' => $employee['name'],
            'phone' => $employee['phone'],
            'email' => $employee['email'],
            'role' => $employee['role'],
            'role_id' => $employee['role_id'] ?? '',
            'role_name' => $employee['role'],
            'roles' => [$employee['role']],
            'store_id' => $storeId,
            'store_name' => $storeName,
            'status' => 'active',
            'avatar_url' => $employee['avatar_url'] ?? '',
        ];

        $tokenInfo = \app\storeapi\service\PosEmployeeTokenService::setToken($employee['id'], $storeId, 'pos');

        return [
            'token' => $tokenInfo['token'],
            'refresh_token' => '',
            'expires_in' => \think\facade\Config::get('project.employee_token.expire_duration', 7200),
            'employee' => $employeeInfo,
        ];
    }

    public static function resetPasswordBySms(array $params)
    {
        $phone = $params['phone'] ?? '';
        $code = $params['code'] ?? '';
        $newPassword = $params['new_password'] ?? '';

        if (empty($phone) || empty($code) || empty($newPassword)) {
            self::setError('请填写完整信息');
            return false;
        }

        $cacheKey = 'pos_sms_code_' . $phone . '_reset_password';
        $validCode = Cache::get($cacheKey);

        if ($validCode !== $code) {
            self::setError('验证码错误或已过期');
            return false;
        }

        Cache::delete($cacheKey);

        $employee = Employee::where('phone', $phone)->find();
        if (!$employee) {
            self::setError('员工不存在');
            return false;
        }

        $employee->password = password_hash($newPassword, PASSWORD_DEFAULT);
        $employee->save();

        return true;
    }

    public static function getStores(array $employeeInfo): array
    {
        $employeeId = $employeeInfo['id'] ?? '';

        if (empty($employeeId)) {
            return ['error' => '员工ID不能为空'];
        }

        $employee = Employee::find($employeeId);

        if (!$employee) {
            return ['error' => '员工不存在'];
        }

        $storeIds = [];

        $employeeStore = EmployeeStore::where('employee_id', $employeeId)->find();
        if ($employeeStore) {
            $storeIds[] = $employeeStore['store_id'];
        }

        if (!empty($employee['store_ids'])) {
            $storeIds = array_merge($storeIds, explode(',', $employee['store_ids']));
        }

        if (!empty($employee['store_id'])) {
            $storeIds[] = $employee['store_id'];
        }

        $storeIds = array_unique(array_filter($storeIds));

        if (empty($storeIds)) {
            return ['error' => '该员工未绑定任何门店'];
        }

        $stores = Store::whereIn('id', $storeIds)
            ->where('status', 1)
            ->field(['id', 'name', 'address', 'phone', 'status'])
            ->select()
            ->toArray();

        return ['data' => $stores];
    }
}
