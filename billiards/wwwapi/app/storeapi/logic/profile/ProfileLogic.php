<?php

declare (strict_types=1);

namespace app\storeapi\logic\profile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Employee;

class ProfileLogic extends BaseLogic
{
    public static function getDetail(string $userId)
    {
        try {
            $employee = Employee::where('id', $userId)->find();

            if (!$employee) {
                self::setError('用户不存在');
                return false;
            }

            return [
                'id' => $employee['id'],
                'name' => $employee['name'],
                'phone' => $employee['phone'] ?? '',
                'avatar' => $employee['avatar'] ?? '',
                'role' => $employee['role'] ?? '员工',
                'storeId' => $employee['store_id'],
            ];
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function updateProfile(string $userId, array $params)
    {
        try {
            $employee = Employee::where('id', $userId)->find();

            if (!$employee) {
                self::setError('用户不存在');
                return false;
            }

            if (!empty($params['name'])) {
                $employee->name = $params['name'];
            }
            if (isset($params['phone'])) {
                $employee->phone = $params['phone'];
            }

            $employee->save();

            return self::getDetail($userId);
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function updateAvatar(string $userId, string $avatar)
    {
        try {
            $employee = Employee::where('id', $userId)->find();

            if (!$employee) {
                self::setError('用户不存在');
                return false;
            }

            $employee->avatar = $avatar;
            $employee->save();

            return ['avatar' => $avatar];
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }
}