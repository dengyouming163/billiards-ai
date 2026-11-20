<?php
use \GatewayWorker\Lib\Gateway;
use \Workerman\Worker;
use Billiards\Models\LightDevice;
use Billiards\Models\LightChannel;
use Billiards\Protocol\LightDeviceProtocol;

class Events
{
    public static function onWorkerStart($businessWorker)
    {
        echo "BilliardsBusinessWorker starting...\n";

        if ($businessWorker && property_exists($businessWorker, 'id')) {
            echo "BilliardsBusinessWorker started (id: {$businessWorker->id})\n";
        }

        try {
            require_once __DIR__ . '/../../vendor/autoload.php';
            echo "Database connection initialized\n";
        } catch (\Exception $e) {
            echo "Database connection failed: {$e->getMessage()}\n";
        }
    }

    public static function onConnect($client_id)
    {
        echo "Client connected: {$client_id}\n";
    }

    public static function onMessage($client_id, $message)
    {
        $session = Gateway::getSession($client_id);

        if (isset($session['type']) && $session['type'] === 'device') {
            self::handleDeviceMessage($client_id, $message, $session);
            return;
        }

        $decoded = json_decode($message, true);

        if ($decoded && isset($decoded['cmd'])) {
            self::handleDeviceMessage($client_id, $message, $session);
            return;
        }

        if ($decoded && isset($decoded['type']) && isset($decoded['channel'])) {
            self::handleGatewayClientMessage($client_id, $message);
            return;
        }

        self::handleWebsocketMessage($client_id, $message);
    }

    public static function onClose($client_id)
    {
        $session = Gateway::getSession($client_id);

        if (isset($session['type']) && $session['type'] === 'device') {
            $deviceSn = $session['device_sn'] ?? '';

            if ($deviceSn) {
                try {
                    $deviceModel = new LightDevice();
                    $deviceModel->setOffline($deviceSn);
                } catch (\Exception $e) {
                    echo "Error setting device offline: {$e->getMessage()}\n";
                }

                echo "Device disconnected: {$deviceSn}\n";
            }
        }

        echo "Client disconnected: {$client_id}\n";
    }

    private static function handleDeviceMessage($client_id, $message, $session)
    {
        $decoded = LightDeviceProtocol::decode($message);

        if (!$decoded) {
            echo "Invalid device message from {$client_id}\n";
            return;
        }

        $deviceSn = $decoded['id'] ?? $session['device_sn'] ?? '';
        $addr = $decoded['addr'] ?? '';

        if (LightDeviceProtocol::isUploadMessage($decoded)) {
            self::handleDeviceUpload($client_id, $decoded, $deviceSn, $addr);
            return;
        }

        echo "Device message: unknown cmd from {$client_id}\n";
    }

    private static function handleDeviceUpload($client_id, $data, $deviceSn, $addr)
    {
        $statuses = $data['y'] ?? [];
        $channelCount = count($statuses);

        echo "Device message: upload from {$client_id}, device_id: {$deviceSn}, addr: {$addr}\n";

        if ($channelCount > 0) {
            echo "Channel statuses: [" . implode(',', $statuses) . "]\n";
        }

        $deviceModel = new LightDevice();
        $channelModel = new LightChannel();

        $device = $deviceModel->findByDeviceSn($deviceSn);

        if ($device) {
            $deviceModel->updateHeartbeat($deviceSn);
            echo "Device heartbeat updated: {$deviceSn}\n";

            if (!empty($statuses)) {
                $channelModel->syncChannelStatuses($device['id'], $statuses);
                echo "Channel statuses synced for device {$deviceSn}\n";
            }
        } else {
            $deviceId = $deviceModel->registerDevice($deviceSn, $addr, $channelCount);
            echo "New device registered: {$deviceSn}, ID: {$deviceId}, channels: {$channelCount}\n";

            $channelModel->createChannelsForDevice($deviceId, $channelCount);
            echo "Created {$channelCount} channels for device {$deviceSn}\n";
        }

        Gateway::joinGroup($client_id, 'device_' . $deviceSn);

        Gateway::updateSession($client_id, [
            'type'      => 'device',
            'device_sn' => $deviceSn,
            'addr'      => $addr,
        ]);
    }

    private static function handleWebsocketMessage($client_id, $message)
    {
        $decoded = json_decode($message, true);

        if (!$decoded || !isset($decoded['type'])) {
            echo "Invalid websocket message from {$client_id}\n";
            return;
        }

        $type = $decoded['type'];
        $data = $decoded['data'] ?? [];

        echo "Websocket message: {$type} from {$client_id}\n";

        switch ($type) {
            case 'subscribe':
                self::handleSubscribe($client_id, $data);
                break;
            case 'unsubscribe':
                self::handleUnsubscribe($client_id, $data);
                break;
            case 'service_call':
                self::handleServiceCall($client_id, $data);
                break;
            case 'service_call_response':
                self::handleServiceCallResponse($client_id, $data);
                break;
            case 'ping':
                self::handlePing($client_id);
                break;
            default:
                echo "Unknown websocket message type: {$type}\n";
        }
    }

    private static function handleGatewayClientMessage($client_id, $message)
    {
        $decoded = json_decode($message, true);

        if (!$decoded || !isset($decoded['type'])) {
            echo "Invalid GatewayClient message from {$client_id}\n";
            Worker::log("GW_MSG: Invalid GatewayClient msg from {$client_id}");
            return;
        }

        $type = $decoded['type'];
        $channel = $decoded['channel'] ?? null;
        $data = $decoded['data'] ?? [];

        echo "GatewayClient message: {$type} from {$client_id}\n";
        Worker::log("GW_MSG: type={$type} channel={$channel} data=" . json_encode($data, JSON_UNESCAPED_UNICODE));

        // 需要特殊处理的消息类型（不能简单转发）
        $specialTypes = ['light_control'];

        if (in_array($type, $specialTypes, true)) {
            Worker::log("GW_MSG: routing to special handler for {$type}");
            switch ($type) {
                case 'light_control':
                    self::handleLightControlRequest($client_id, $data);
                    break;
            }
            return;
        }

        // 通用转发：所有其他 GatewayClient 消息直接路由到指定 channel
        if ($channel) {
            self::routeBusinessMessage($client_id, $type, $channel, $data, $decoded);
        } else {
            echo "Warning: GatewayClient message type '{$type}' has no channel, ignored\n";
        }
    }

    private static function routeBusinessMessage($client_id, $type, $channel, $data, $original)
    {
        if ($channel) {
            $payload = json_encode($original);
            Gateway::sendToGroup($channel, $payload);
            echo "Routed {$type} to channel {$channel}\n";
        } else {
            echo "Warning: {$type} has no channel, ignored\n";
        }
    }

    private static function handleSubscribe($client_id, $data)
    {
        $storeId = $data['store_id'] ?? '';
        $userId = $data['user_id'] ?? '';
        $channels = $data['channels'] ?? [];

        if ($storeId) {
            Gateway::joinGroup($client_id, 'store_' . $storeId);
        }

        if ($userId) {
            Gateway::bindUid($client_id, $userId);
        }

        foreach ($channels as $channel) {
            Gateway::joinGroup($client_id, $channel);
        }

        $response = json_encode([
            'type' => 'subscribe_ack',
            'data' => [
                'success'   => true,
                'channels'  => $channels,
                'store_id'  => $storeId,
                'timestamp' => time(),
            ],
        ]);
        Gateway::sendToClient($client_id, $response);

        echo "Client {$client_id} subscribed to channels\n";
    }

    private static function handleUnsubscribe($client_id, $data)
    {
        $channels = $data['channels'] ?? [];

        foreach ($channels as $channel) {
            Gateway::leaveGroup($client_id, $channel);
        }

        $response = json_encode([
            'type' => 'unsubscribe_ack',
            'data' => [
                'success'   => true,
                'channels'  => $channels,
                'timestamp' => time(),
            ],
        ]);
        Gateway::sendToClient($client_id, $response);

        echo "Client {$client_id} unsubscribed from channels\n";
    }

    private static function handleServiceCall($client_id, $data)
    {
        $storeId = $data['store_id'] ?? null;
        $tableId = $data['table_id'] ?? null;
        $serviceType = $data['service_type'] ?? 'general';
        $message = $data['message'] ?? '';

        if (!$storeId) {
            $response = json_encode([
                'type' => 'service_call_error',
                'data' => [
                    'error'     => 'store_id is required',
                    'timestamp' => time(),
                ],
            ]);
            Gateway::sendToClient($client_id, $response);
            return;
        }

        $notification = json_encode([
            'type' => 'service_call',
            'data' => [
                'store_id'          => $storeId,
                'table_id'          => $tableId,
                'table_no'          => $data['table_no'] ?? '',
                'service_type'      => $serviceType,
                'service_type_text' => $data['service_type_text'] ?? '',
                'message'           => $message,
                'call_time'         => date('Y-m-d H:i:s'),
            ],
        ]);

        Gateway::sendToGroup('store_' . $storeId, $notification);

        $response = json_encode([
            'type' => 'service_call_ack',
            'data' => [
                'success'   => true,
                'timestamp' => time(),
            ],
        ]);
        Gateway::sendToClient($client_id, $response);

        echo "Service call from {$client_id} for store {$storeId}\n";
    }

    private static function handleServiceCallResponse($client_id, $data)
    {
        $callId = $data['call_id'] ?? null;
        $tableId = $data['table_id'] ?? null;
        $responder = $data['responder'] ?? 'unknown';
        $responseType = $data['response_type'] ?? 'accept';
        $responseText = $data['response_text'] ?? '';

        if (!$callId || !$tableId) {
            $response = json_encode([
                'type' => 'service_call_response_error',
                'data' => [
                    'error'     => 'call_id and table_id are required',
                    'timestamp' => time(),
                ],
            ]);
            Gateway::sendToClient($client_id, $response);
            return;
        }

        $notification = json_encode([
            'type' => 'service_call_response',
            'data' => [
                'call_id'       => $callId,
                'table_id'      => $tableId,
                'responder'     => $responder,
                'response_type' => $responseType,
                'response_text' => $responseText,
                'response_time' => date('Y-m-d H:i:s'),
            ],
        ]);

        Gateway::sendToGroup('table_' . $tableId, $notification);

        $ack = json_encode([
            'type' => 'service_call_response_ack',
            'data' => [
                'success'   => true,
                'call_id'   => $callId,
                'timestamp' => time(),
            ],
        ]);
        Gateway::sendToClient($client_id, $ack);

        echo "Service call response from {$client_id}: call={$callId}, responder={$responder}, type={$responseType}\n";
    }

    private static function handleLightControlRequest($client_id, $data)
    {
        $deviceSn = $data['device_sn'] ?? '';
        $channelNo = $data['channel_no'] ?? 1;
        $action = $data['action'] ?? 'on';

        Worker::log("LIGHT_CTL: START device_sn={$deviceSn} channel={$channelNo} action={$action}");

        if (!$deviceSn) {
            echo "Light control failed: device_sn is required\n";
            Worker::log("LIGHT_CTL: FAIL missing device_sn");
            return;
        }

        try {
            $deviceModel = new LightDevice();
            $device = $deviceModel->findByDeviceSn($deviceSn);

            if (!$device) {
                echo "Light control failed: device {$deviceSn} not found\n";
                Worker::log("LIGHT_CTL: FAIL device {$deviceSn} not found in DB");

                $errorMsg = json_encode([
                    'type' => 'light_control_error',
                    'data' => [
                        'error'     => 'device not found',
                        'device_id' => $deviceSn,
                        'timestamp' => time(),
                    ],
                ]);
                Gateway::sendToClient($client_id, $errorMsg);
                return;
            }

            $addr = $device['addr'];
            $channelCount = (int)($device['channel_count'] ?? 8);

            $controlMessage = LightDeviceProtocol::buildControlCommand($addr, $channelCount, $channelNo, $action);

            $encoded = LightDeviceProtocol::encode($controlMessage);
            $group = 'device_' . $deviceSn;
            Worker::log("LIGHT_CTL: SEND to group={$group} payload=" . trim($encoded));
            Gateway::sendToGroup($group, $encoded);

            echo "Light control sent to device {$deviceSn}: channel={$channelNo}, action={$action}\n";
            Worker::log("LIGHT_CTL: SUCCESS sent to {$deviceSn}");

            $successMsg = json_encode([
                'type' => 'light_control_sent',
                'data' => [
                    'device_id'  => $deviceSn,
                    'channel_no' => $channelNo,
                    'action'     => $action,
                    'timestamp'  => time(),
                ],
            ]);
            Gateway::sendToClient($client_id, $successMsg);

        } catch (\Exception $e) {
            echo "Light control error: {$e->getMessage()}\n";
        }
    }

    private static function handlePing($client_id)
    {
        $response = json_encode([
            'type' => 'pong',
            'data' => [
                'timestamp' => time(),
            ],
        ]);
        Gateway::sendToClient($client_id, $response);
    }
}
