<?php
namespace app\storeapi\logic\order;
use app\common\model\merchant\ChargingConfig;
use app\common\model\merchant\ChargingSession;
use app\common\model\merchant\OrderItem;

class ChargingLogic
{
    public static function startSession(string $orderId, string $tableId, string $storeId, string $port): array
    {
        $config = ChargingConfig::getByStore($storeId);
        if (!$config || !$config->status) return ['error' => '充电功能未启用'];
        $existing = ChargingSession::where('order_id', $orderId)->where('port', $port)->where('status', 'active')->find();
        if ($existing) return ['error' => '该充电口已在充电中'];
        $id = md5(uniqid((string)mt_rand(), true));
        $session = new ChargingSession();
        $session->id = $id; $session->order_id = $orderId; $session->table_id = $tableId;
        $session->store_id = $storeId; $session->port = $port; $session->status = 'active';
        $session->started_at = date('Y-m-d H:i:s'); $session->rate_per_hour = $config->rate_per_hour;
        $session->save();

        // 创建充电子订单项
        $orderItem = new OrderItem();
        $orderItem->id = md5(uniqid((string)mt_rand(), true) . $port);
        $orderItem->order_id = $orderId;
        $orderItem->item_type = 'charging';
        $orderItem->item_name = '充电-' . strtoupper($port);
        $orderItem->quantity = 1;
        $orderItem->unit_price = (float)$config->rate_per_hour;
        $orderItem->total_price = 0;
        $orderItem->final_price = 0;
        $orderItem->unit = '小时';
        $orderItem->status = 'active';
        $orderItem->save();

        return ['session_id' => $id, 'port' => $port, 'status' => 'active', 'item_id' => $orderItem->id];
    }

    public static function stopSession(string $orderId, string $port): array
    {
        $session = ChargingSession::where('order_id', $orderId)->where('port', $port)->where('status', 'active')->find();
        if (!$session) return ['error' => '无活跃充电会话'];
        $session->ended_at = date('Y-m-d H:i:s');
        $session->duration_seconds = strtotime($session->ended_at) - strtotime($session->started_at);
        $session->total_fee = round(($session->duration_seconds / 3600) * $session->rate_per_hour, 2);
        $session->status = 'completed'; $session->save();

        // 更新对应端口的充电子订单项
        $portLabel = '充电-' . strtoupper($port);
        $orderItem = OrderItem::where('order_id', $orderId)
            ->where('item_type', 'charging')
            ->where('item_name', $portLabel)
            ->where('status', 'active')
            ->find();
        if ($orderItem) {
            $orderItem->final_price = $session->total_fee;
            $orderItem->total_price = $session->total_fee;
            $orderItem->status = 'completed';
            $orderItem->save();
        }

        // 从所有已完成充电会话重新计算订单 charging_fee（避免累积叠加错误）
        try {
            $totalChargingFee = ChargingSession::where('order_id', $orderId)
                ->where('status', 'completed')
                ->sum('total_fee');
            \think\facade\Db::name('busi_order')->where('id', $orderId)->update([
                'charging_fee' => round(floatval($totalChargingFee), 2),
            ]);
        } catch (\Exception $e) {
            \think\facade\Log::warning('[Charging] 更新订单充电费失败: ' . $e->getMessage());
        }

        return ['session_id' => $session->id, 'duration_seconds' => $session->duration_seconds, 'total_fee' => $session->total_fee];
    }

    public static function getActiveSessions(string $orderId): array
    {
        $allSessions = ChargingSession::where('order_id', $orderId)
            ->order('created_at', 'desc')
            ->select()->toArray();
        $activePorts = [];
        $totalFee = 0;
        foreach ($allSessions as &$s) {
            if ($s['status'] === 'active') {
                $elapsed = time() - strtotime($s['started_at']);
                $s['elapsed_seconds'] = $elapsed;
                $s['estimated_fee'] = round(($elapsed / 3600) * $s['rate_per_hour'], 2);
                $totalFee += $s['estimated_fee'];
                $activePorts[] = $s['port'];
            } elseif ($s['status'] === 'completed') {
                $totalFee += (float)$s['total_fee'];
            }
        }
        return ['sessions' => $allSessions, 'total_fee' => $totalFee, 'active_ports' => $activePorts];
    }
}
