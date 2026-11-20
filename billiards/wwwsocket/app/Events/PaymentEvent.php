<?php
namespace app\Events;

/**
 * 支付成功事件 — 推送到门店 WebSocket channel
 * 由 wwwapi PayHubCallback 发起调用
 */
class PaymentEvent
{
    /**
     * 支付成功后推送到门店 channel
     * @param string $storeId 门店ID
     * @param array  $data   { order_id, amount, table_name, paid_at }
     */
    public static function notify(string $storeId, array $data): void
    {
        $message = json_encode([
            'type' => 'payment_success',
            'data' => $data,
        ], JSON_UNESCAPED_UNICODE);

        \GatewayWorker\Lib\Gateway::sendToGroup('store_' . $storeId, $message);
    }
}