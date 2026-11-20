<?php

declare (strict_types=1);

namespace app\storeapi\logic\setting;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Config;
use think\facade\Log;

class SettingLogic extends BaseLogic
{
    private static $notificationDefaults = [
        'tableTimeout' => true,
        'lowStock' => true,
        'newOrder' => true,
    ];

    private static $securityDefaults = [
        'twoFactor' => false,
        'operationLog' => true,
        'dataBackup' => true,
    ];

    private static $displayDefaults = [
        'darkMode' => false,
        'realTimeRefresh' => true,
    ];

    private static $businessDefaults = [
        'bookingEnabled' => true,
        'bookingTimeout' => true,
        'bookingMaxHours' => 4,
    ];

    private static $paymentDefaults = [
        'wechat' => true,
        'alipay' => true,
        'cash' => true,
        'member' => true,
        'autoChange' => true,
        'roundZero' => false,
        'receiptPrint' => true,
        'receiptCopies' => 2,
    ];

    public static function getSettings(string $storeId, string $category = '')
    {
        $query = Config::where('store_id', $storeId);
        
        if (!empty($category)) {
            $query->where('category', $category);
        }
        
        $configs = $query->select()->toArray();
        
        $result = [];
        foreach ($configs as $config) {
            $value = $config['value'];
            if ($config['type'] === 'json') {
                $value = json_decode($value, true) ?: $value;
            } elseif ($config['type'] === 'boolean') {
                $value = (bool)$value;
            } elseif ($config['type'] === 'integer') {
                $value = (int)$value;
            }
            if (!isset($result[$config['category']])) {
                $result[$config['category']] = [];
            }
            $result[$config['category']][$config['key']] = $value;
        }
        
        return $result;
    }

    public static function saveSettings(string $storeId, array $params)
    {
        try {
            foreach ($params as $category => $configs) {
                foreach ($configs as $key => $value) {
                    self::saveConfig($storeId, $category, $key, $value);
                }
            }
            return self::getSettings($storeId);
        } catch (\Exception $e) {
            Log::error('SettingLogic::saveSettings: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('保存设置失败，请稍后重试');
        }
    }

    private static function saveConfig(string $storeId, string $category, string $key, $value)
    {
        $type = 'string';
        $saveValue = $value;
        
        if (is_bool($value)) {
            $type = 'boolean';
            $saveValue = $value ? '1' : '0';
        } elseif (is_int($value)) {
            $type = 'integer';
            $saveValue = (string)$value;
        } elseif (is_array($value)) {
            $type = 'json';
            $saveValue = json_encode($value);
        }
        
        $config = Config::where('store_id', $storeId)
            ->where('category', $category)
            ->where('key', $key)
            ->find();
        
        if ($config) {
            $config->value = $saveValue;
            $config->type = $type;
            $config->save();
        } else {
            $config = new Config();
            $config->id = 'config_' . uniqid();
            $config->store_id = $storeId;
            $config->category = $category;
            $config->key = $key;
            $config->value = $saveValue;
            $config->type = $type;
            $config->save();
        }
    }

    public static function getNotificationSettings(string $storeId)
    {
        $configs = self::getSettings($storeId, 'notification');
        return array_merge(self::$notificationDefaults, $configs['notification'] ?? []);
    }

    public static function saveNotificationSettings(string $storeId, array $params)
    {
        foreach (array_keys(self::$notificationDefaults) as $key) {
            if (isset($params[$key])) {
                self::saveConfig($storeId, 'notification', $key, $params[$key]);
            }
        }
        return self::getNotificationSettings($storeId);
    }

    public static function getSecuritySettings(string $storeId)
    {
        $configs = self::getSettings($storeId, 'security');
        return array_merge(self::$securityDefaults, $configs['security'] ?? []);
    }

    public static function saveSecuritySettings(string $storeId, array $params)
    {
        foreach (array_keys(self::$securityDefaults) as $key) {
            if (isset($params[$key])) {
                self::saveConfig($storeId, 'security', $key, $params[$key]);
            }
        }
        return self::getSecuritySettings($storeId);
    }

    public static function getDisplaySettings(string $storeId)
    {
        $configs = self::getSettings($storeId, 'display');
        return array_merge(self::$displayDefaults, $configs['display'] ?? []);
    }

    public static function saveDisplaySettings(string $storeId, array $params)
    {
        foreach (array_keys(self::$displayDefaults) as $key) {
            if (isset($params[$key])) {
                self::saveConfig($storeId, 'display', $key, $params[$key]);
            }
        }
        return self::getDisplaySettings($storeId);
    }

    public static function getBusinessSettings(string $storeId)
    {
        $configs = self::getSettings($storeId, 'business');
        return array_merge(self::$businessDefaults, $configs['business'] ?? []);
    }

    public static function saveBusinessSettings(string $storeId, array $params)
    {
        foreach (array_keys(self::$businessDefaults) as $key) {
            if (isset($params[$key])) {
                self::saveConfig($storeId, 'business', $key, $params[$key]);
            }
        }
        return self::getBusinessSettings($storeId);
    }

    public static function getPaymentSettings(string $storeId)
    {
        $configs = self::getSettings($storeId, 'payment');
        return array_merge(self::$paymentDefaults, $configs['payment'] ?? []);
    }

    public static function savePaymentSettings(string $storeId, array $params)
    {
        foreach (array_keys(self::$paymentDefaults) as $key) {
            if (isset($params[$key])) {
                self::saveConfig($storeId, 'payment', $key, $params[$key]);
            }
        }
        return self::getPaymentSettings($storeId);
    }
}