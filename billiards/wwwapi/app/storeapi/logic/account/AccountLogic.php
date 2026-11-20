<?php

declare (strict_types=1);

namespace app\storeapi\logic\account;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Employee;
use app\common\model\merchant\Config;

class AccountLogic extends BaseLogic
{
    private static $securityDefaults = [
        'twoFactor' => false,
        'loginAlert' => true,
        'sessionTimeout' => 30,
    ];

    public static function changePassword(string $userId, array $params)
    {
        try {
            if (empty($params['oldPassword']) || empty($params['newPassword']) || empty($params['confirmPassword'])) {
                self::setError('密码不能为空');
                return false;
            }

            if ($params['newPassword'] !== $params['confirmPassword']) {
                self::setError('两次密码输入不一致');
                return false;
            }

            if (strlen($params['newPassword']) < 6) {
                self::setError('密码长度不能少于6位');
                return false;
            }

            $employee = Employee::where('id', $userId)->find();

            if (!$employee) {
                self::setError('用户不存在');
                return false;
            }

            if (!empty($employee['password']) && $employee['password'] !== md5($params['oldPassword'])) {
                self::setError('原密码错误');
                return false;
            }

            $employee->password = md5($params['newPassword']);
            $employee->save();

            return true;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function getSecuritySettings(string $userId)
    {
        try {
            $configs = Config::where('store_id', '')
                ->where('user_id', $userId)
                ->where('category', 'security')
                ->select()
                ->toArray();

            $result = self::$securityDefaults;

            foreach ($configs as $config) {
                $key = $config['key'];
                if (isset($result[$key])) {
                    if ($config['type'] === 'boolean') {
                        $result[$key] = (bool)$config['value'];
                    } elseif ($config['type'] === 'integer') {
                        $result[$key] = (int)$config['value'];
                    } else {
                        $result[$key] = $config['value'];
                    }
                }
            }

            return $result;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return self::$securityDefaults;
        }
    }

    public static function saveSecuritySettings(string $userId, array $params)
    {
        try {
            foreach (self::$securityDefaults as $key => $default) {
                if (isset($params[$key])) {
                    $value = $params[$key];
                    $type = 'boolean';
                    $saveValue = $value ? '1' : '0';

                    if (is_int($value)) {
                        $type = 'integer';
                        $saveValue = (string)$value;
                    }

                    $config = Config::where('store_id', '')
                        ->where('user_id', $userId)
                        ->where('category', 'security')
                        ->where('key', $key)
                        ->find();

                    if ($config) {
                        $config->value = $saveValue;
                        $config->type = $type;
                        $config->save();
                    } else {
                        $config = new Config();
                        $config->id = 'config_' . uniqid();
                        $config->store_id = '';
                        $config->user_id = $userId;
                        $config->category = 'security';
                        $config->key = $key;
                        $config->value = $saveValue;
                        $config->type = $type;
                        $config->save();
                    }
                }
            }

            return self::getSecuritySettings($userId);
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }
}