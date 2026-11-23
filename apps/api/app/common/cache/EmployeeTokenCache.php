<?php

declare(strict_types=1);

namespace app\common\cache;

use app\common\model\merchant\EmployeeSession;
use app\common\model\merchant\Employee;
use app\common\model\merchant\EmployeeStore;
use app\common\model\merchant\Store;
use think\facade\Config;

class EmployeeTokenCache extends BaseCache
{
    private $prefix = 'store_employee_token_';

    public function getEmployeeInfo(string $token)
    {
        $key = $this->prefix . $token;
        $employeeInfo = $this->store()->get($key);
        
        if ($employeeInfo && time() <= $employeeInfo['expire_time']) {
            return $employeeInfo;
        }
        
        return $this->rebuildFromDb($token);
    }

    public function setEmployeeInfo(string $token)
    {
        $key = $this->prefix . $token;
        
        $session = EmployeeSession::where('token', '=', $token)->find();
        if (!$session || $session->expire_time < time()) {
            return null;
        }
        
        $employee = Employee::find($session->employee_id);
        if (!$employee) {
            return null;
        }
        
        $employeeStore = EmployeeStore::where('employee_id', $employee->id)->find();
        $storeId = $session->store_id ?: ($employeeStore['store_id'] ?? '');
        $store = $storeId ? Store::find($storeId) : null;
        $storeName = $store ? $store['name'] : '';

        $data = [
            'token' => $token,
            'id' => $employee->id,
            'name' => $employee->name,
            'phone' => $employee->phone,
            'role' => $employee->role,
            'store_id' => $storeId,
            'store_name' => $storeName,
            'expire_time' => $session->expire_time,
            'login_ip' => request()->ip(),
        ];

        $ttl = $session->expire_time - time();
        $this->store()->set($key, $data, $ttl);

        return $data;
    }

    public function deleteEmployeeInfo(string $token): bool
    {
        $key = $this->prefix . $token;
        return $this->store()->delete($key);
    }

    private function rebuildFromDb(string $token)
    {
        $session = EmployeeSession::where('token', '=', $token)->find();
        if (!$session || $session->expire_time < time()) {
            return null;
        }

        $employee = Employee::find($session->employee_id);
        if (!$employee) {
            return null;
        }

        $employeeStore = EmployeeStore::where('employee_id', $employee->id)->find();
        $storeId = $session->store_id ?: ($employeeStore['store_id'] ?? '');
        $store = $storeId ? Store::find($storeId) : null;
        $storeName = $store ? $store['name'] : '';
        
        $data = [
            'id' => $employee->id,
            'name' => $employee->name,
            'phone' => $employee->phone,
            'role' => $employee->role,
            'store_id' => $storeId,
            'store_name' => $storeName,
            'expire_time' => $session->expire_time,
            'login_ip' => request()->ip(),
        ];
        
        $ttl = $session->expire_time - time();
        $this->store()->set($this->prefix . $token, $data, $ttl);
        
        return $data;
    }
}