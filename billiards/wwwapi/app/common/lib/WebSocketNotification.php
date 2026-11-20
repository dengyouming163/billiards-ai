<?php

declare(strict_types=1);

namespace app\common\lib;

use GatewayClient\Gateway;
use app\common\model\merchant\LightChannel;
use app\common\model\merchant\LightDevice;

class WebSocketNotification
{
    private static bool $initialized = false;

    private static string $registerAddress = '127.0.0.1:1238';

    private static string $secretKey = '';

    public static function init(): void
    {
        if (self::$initialized) {
            return;
        }

        Gateway::$registerAddress = self::$registerAddress;
        Gateway::$secretKey = self::$secretKey;
        self::$initialized = true;
    }

    private static function ensureInit(): void
    {
        if (!self::$initialized) {
            self::init();
        }
    }

    private static function buildMessage(string $type, string $channel, array $data): string
    {
        return json_encode([
            'version' => '1.0',
            'type' => $type,
            'channel' => $channel,
            'data' => $data,
            'timestamp' => time(),
        ], JSON_UNESCAPED_UNICODE);
    }

    public static function sendNewOrderItem(string $storeId, array $data): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $message = self::buildMessage('new_order_item', $channel, $data);
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function sendOrderItemStatus(string $tableId, array $data): bool
    {
        self::ensureInit();

        try {
            $channel = 'table_' . $tableId;
            $message = self::buildMessage('order_item_status', $channel, $data);
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function sendTableStatusChange(string $storeId, string $tableId, array $data): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $message = self::buildMessage('table_status_change', $channel, array_merge($data, [
                'table_id' => $tableId,
            ]));
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * 灯控指令 — 直接构建 GE IO JSON 格式下发到设备
     * 绕过 BusinessWorker (GatewayClient::sendToGroup 直发 Gateway → 设备)
     */
    public static function sendLightControl(string $tableId, string $action): array
    {
        self::ensureInit();

        $result = [
            'success' => false,
            'channels' => [],
            'errors' => [],
        ];

        if (!in_array($action, ['on', 'off'])) {
            $result['errors'][] = 'Invalid action. Must be "on" or "off".';
            return $result;
        }

        try {
            $lightChannelModel = new LightChannel();
            $channels = $lightChannelModel->findByTableId($tableId);

            if (empty($channels)) {
                $result['errors'][] = 'No light channels bound to this table.';
                return $result;
            }

            $lightDeviceModel = new LightDevice();
            $deviceChannels = [];

            foreach ($channels as $channel) {
                $deviceId = $channel['device_id'];
                if (!isset($deviceChannels[$deviceId])) {
                    $deviceChannels[$deviceId] = [];
                }
                $deviceChannels[$deviceId][] = $channel;
            }

            // GE IO 通道动作常量
            $chActionOff  = 0;
            $chActionOn   = 1;
            $chActionNoop = 3;

            $targetAction = ($action === 'on') ? $chActionOn : $chActionOff;

            foreach ($deviceChannels as $deviceId => $deviceChannelList) {
                $device = $lightDeviceModel->find($deviceId);

                if (!$device) {
                    $result['errors'][] = "Device not found: {$deviceId}";
                    continue;
                }

                $deviceSn     = $device['device_sn'] ?? '';
                $addr         = (int)($device['addr'] ?? 64);
                $channelCount = (int)($device['channel_count'] ?? 8);

                if (!$deviceSn) {
                    $result['errors'][] = "Device {$deviceId} has no device_sn";
                    continue;
                }

                // 构建 GE IO set 命令：所有通道默认 NOOP，只操作目标通道
                $y = array_fill(0, $channelCount, $chActionNoop);
                foreach ($deviceChannelList as $channel) {
                    $idx = (int)$channel['channel_no'] - 1;
                    if ($idx >= 0 && $idx < $channelCount) {
                        $y[$idx] = $targetAction;
                    }
                }

                // GE IO JSON 协议格式（纯JSON，不带换行符）
                $setCmd = json_encode([
                    'addr' => $addr,
                    'cmd'  => 'set',
                    'y'    => $y,
                ], JSON_UNESCAPED_UNICODE);

                // 直接发到设备所在 Gateway 组（绕过 BusinessWorker）
                Gateway::sendToGroup('device_' . $deviceSn, $setCmd);

                foreach ($deviceChannelList as $channel) {
                    $result['channels'][] = [
                        'device_id'  => $deviceId,
                        'device_sn'  => $deviceSn,
                        'channel_no' => $channel['channel_no'],
                        'action'     => $action,
                    ];
                }
            }

            $result['success'] = !empty($result['channels']);
        } catch (\Exception $e) {
            $result['errors'][] = $e->getMessage();
        }

        return $result;
    }

    public static function sendToGroup(string $group, array $data): bool
    {
        self::ensureInit();

        try {
            // 确保 channel 字段存在，Events.php 依赖它路由 GatewayClient 消息
            if (!isset($data['channel'])) {
                $data['channel'] = $group;
            }
            $message = json_encode($data, JSON_UNESCAPED_UNICODE);
            Gateway::sendToGroup($group, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function sendToUid(string $uid, array $data): bool
    {
        self::ensureInit();

        try {
            $message = json_encode($data, JSON_UNESCAPED_UNICODE);
            Gateway::sendToUid($uid, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function sendServiceCall(string $storeId, ?string $tableId, string $serviceType, string $tableName = '', string $remark = ''): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $notification = self::buildMessage('service_call', $channel, [
                'store_id' => $storeId,
                'table_id' => $tableId,
                'table_name' => $tableName,
                'service_type' => $serviceType,
                'remark' => $remark,
            ]);
            Gateway::sendToGroup($channel, $notification);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function sendDeviceOnline(string $storeId, array $deviceData): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $message = self::buildMessage('device_online', $channel, $deviceData);
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * 发送超时预警（预付时间即将用完，< 5分钟）
     */
    public static function sendTableTimeout(string $storeId, array $data): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $message = self::buildMessage('table_timeout', $channel, array_merge($data, [
                'store_id' => $storeId,
            ]));
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * 发送结账提醒（预付时间已用完，提醒续时或结账）
     */
    public static function sendCheckoutRemind(string $storeId, array $data): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $message = self::buildMessage('checkout_remind', $channel, array_merge($data, [
                'store_id' => $storeId,
            ]));
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function sendDeviceOffline(string $storeId, array $deviceData): bool
    {
        self::ensureInit();

        try {
            $channel = 'store_' . $storeId;
            $message = self::buildMessage('device_offline', $channel, $deviceData);
            Gateway::sendToGroup($channel, $message);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function isClientOnline(string $clientId): bool
    {
        self::ensureInit();

        try {
            return Gateway::isOnline($clientId);
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function isUidOnline(string $uid): bool
    {
        self::ensureInit();

        try {
            return Gateway::isUidOnline($uid);
        } catch (\Exception $e) {
            return false;
        }
    }

    public static function getGroupClients(string $group): array
    {
        self::ensureInit();

        try {
            return Gateway::getClientIdListByGroup($group);
        } catch (\Exception $e) {
            return [];
        }
    }

    public static function getUidClients(string $uid): array
    {
        self::ensureInit();

        try {
            return Gateway::getClientIdByUid($uid);
        } catch (\Exception $e) {
            return [];
        }
    }

    /**
     * 直接发送原始指令到设备（用于通道开关测试）
     */
    public static function sendRawToDevice(string $deviceSn, string $rawMessage): bool
    {
        self::ensureInit();
        try {
            Gateway::sendToGroup('device_' . $deviceSn, $rawMessage);
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
