<?php

declare (strict_types=1);

namespace app\storeapi\service;

use app\common\cache\EmployeeTokenCache;
use app\common\model\merchant\EmployeeSession;
use think\facade\Config;

class EmployeeTokenService
{
    public static function getEmployeeInfo($token)
    {
        $cache = new EmployeeTokenCache();
        return $cache->getEmployeeInfo($token);
    }

    public static function refreshToken($token)
    {
        return self::overtimeToken($token);
    }

    public static function setToken($employeeId, $storeId = '', $terminal = 'pc', $multipointLogin = 1)
    {
        $time = time();
        $employeeSession = EmployeeSession::where([
            ['employee_id', '=', $employeeId], 
            ['terminal', '=', $terminal]
        ])->find();

        $expireTime = $time + Config::get('project.employee_token.expire_duration', 7200);
        $employeeTokenCache = new EmployeeTokenCache();
        
        $loginIp = request()->ip();

        if ($employeeSession) {
            if ($employeeSession->expire_time < $time || $multipointLogin === 0) {
                $employeeTokenCache->deleteEmployeeInfo($employeeSession->token);
                $employeeSession->token = create_token($employeeId);
            }
            if ($storeId && $employeeSession->store_id !== $storeId) {
                $employeeTokenCache->deleteEmployeeInfo($employeeSession->token);
                $employeeSession->token = create_token($employeeId);
                $employeeSession->store_id = $storeId;
            }
            $employeeSession->expire_time = $expireTime;
            $employeeSession->update_time = $time;
            $employeeSession->save();
        } else {
            $employeeSession = EmployeeSession::create([
                'id' => uniqid(),
                'store_id' => $storeId,
                'employee_id' => $employeeId,
                'terminal' => $terminal,
                'token' => create_token($employeeId),
                'login_ip' => $loginIp,
                'expire_time' => $expireTime,
                'update_time' => $time
            ]);
        }

        return $employeeTokenCache->setEmployeeInfo($employeeSession->token);
    }

    public static function overtimeToken($token)
    {
        $time = time();
        $employeeSession = EmployeeSession::where('token', '=', $token)->findOrEmpty();
        if ($employeeSession->isEmpty()) {
            return false;
        }
        
        $expireTime = $time + Config::get('project.employee_token.expire_duration', 7200);
        $employeeSession->expire_time = $expireTime;
        $employeeSession->update_time = $time;
        $employeeSession->save();
        
        return (new EmployeeTokenCache())->setEmployeeInfo($employeeSession->token);
    }

    public static function expireToken($token)
    {
        $employeeSession = EmployeeSession::where('token', '=', $token)->findOrEmpty();
        
        if ($employeeSession->isEmpty()) {
            return false;
        }

        $time = time();
        $employeeSession->expire_time = $time;
        $employeeSession->update_time = $time;
        $employeeSession->save();

        return (new EmployeeTokenCache())->deleteEmployeeInfo($token);
    }
}