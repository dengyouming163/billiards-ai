<?php

declare (strict_types=1);

namespace app\storeapi\logic\order;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Table;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\constants\TableStatus;
use app\common\lib\WebSocketNotification;
use think\facade\Db;
use think\Exception;
use think\facade\Log;

class TableOpenLogic extends BaseLogic
{
    private static function normalizeTableStatus($status): string
    {
        if (empty($status)) {
            return TableStatus::IDLE;
        }

        $statusMap = [
            '0' => TableStatus::IDLE,
            'normal' => TableStatus::IDLE,
            'available' => TableStatus::IDLE,
            'free' => TableStatus::IDLE,
            TableStatus::IDLE => TableStatus::IDLE,
            '1' => TableStatus::OCCUPIED,
            'using' => TableStatus::OCCUPIED,
            'busy' => TableStatus::OCCUPIED,
            'in_use' => TableStatus::OCCUPIED,
            TableStatus::OCCUPIED => TableStatus::OCCUPIED,
            '2' => TableStatus::RESERVED,
            'booked' => TableStatus::RESERVED,
            TableStatus::RESERVED => TableStatus::RESERVED,
            '3' => TableStatus::MAINTENANCE,
            'repair' => TableStatus::MAINTENANCE,
            'broken' => TableStatus::MAINTENANCE,
            TableStatus::MAINTENANCE => TableStatus::MAINTENANCE,
        ];

        $key = strtolower(trim((string)$status));
        return $statusMap[$key] ?? TableStatus::IDLE;
    }

    private static function isTableAvailable($table): bool
    {
        $normalizedStatus = self::normalizeTableStatus($table->status);
        return $normalizedStatus === TableStatus::IDLE;
    }

    private static function validateTable(string $tableId, string $storeId): ?Table
    {
        $table = Table::where('id', $tableId)
            ->where(function($query) use ($storeId) {
                if (!empty($storeId)) {
                    $query->where('store_id', $storeId);
                }
            })
            ->find();

        if (!$table) {
            self::setError('台桌不存在');
            return null;
        }

        if (!self::isTableAvailable($table)) {
            self::setError('桌台当前不可用');
            return null;
        }

        $activeOrder = Order::where('table_id', $tableId)
            ->where('status', 'in_progress')
            ->find();

        if ($activeOrder) {
            // 如果台桌已空闲但订单仍为进行中（僵尸订单），自动取消
            if ($table->status === TableStatus::IDLE) {
                $activeOrder->status = 'cancelled';
                $activeOrder->end_time = date('Y-m-d H:i:s');
                $activeOrder->save();
            } else {
                self::setError('桌台已有进行中的订单');
                return null;
            }
        }

        return $table;
    }

    public static function quickOpen(array $params, string $storeId, bool $force = false): array
    {
        // 检查是否需要收银端确认（$force=true 时跳过，用于 POS 确认后直接开台）
        if (!$force) {
            $store = Db::name('busi_store')->where('id', $storeId)->find();
            if (($store['open_table_confirm'] ?? 0) == 1) {
                return self::createConfirmRequest($params, $storeId, $store);
            }
        }

        $tableId = $params['table_id'] ?? '';
        $playerCount = $params['player_count'] ?? 2;

        if (empty($tableId)) {
            return [
                'success' => false,
                'message' => '台桌ID不能为空',
                'data' => null
            ];
        }

        $table = self::validateTable($tableId, $storeId);
        if (!$table) {
            return [
                'success' => false,
                'message' => self::getError(),
                'data' => null
            ];
        }

        Db::startTrans();
        try {
            $orderNo = 'TB' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

            $order = new Order();
            $order->id = self::generateId();
            $order->store_id = $storeId ?: $table->store_id;
            $order->order_no = $orderNo;
            $order->type = 'table';
            $order->status = 'in_progress';
            $order->table_id = $tableId;
            $order->start_time = date('Y-m-d H:i:s');
            $order->payment_status = 'unpaid';
            $order->operator_id = $params['operator_id'] ?? request()->employeeId ?? '';
            $order->operator_name = $params['operator_name'] ?? request()->employeeInfo['name'] ?? '';
            $order->save();

            $hourlyRate = $table->hourly_rate ?? 0;
            $orderItem = new OrderItem();
            $orderItem->id = self::generateId();
            $orderItem->order_id = $order->id;
            $orderItem->item_type = 'table';
            $orderItem->item_name = '台费';
            $orderItem->quantity = 1;
            $orderItem->unit = '小时';
            $orderItem->unit_price = $hourlyRate;
            $orderItem->total_price = 0;
            $orderItem->final_price = 0;
            $orderItem->status = 'active';
            $orderItem->save();

            $table->status = TableStatus::OCCUPIED;
            $table->save();

            // 推送 WebSocket 通知到门店频道
            try {
                \app\common\lib\WebSocketNotification::sendToGroup(
                    "store_{$storeId}",
                    [
                        'type' => 'table_open',
                        'data' => [
                            'table_id' => $tableId,
                            'table_name' => $table->name ?? $table->number ?? '',
                            'player_count' => $playerCount,
                            'order_id' => $order->id,
                        ]
                    ]
                );
            } catch (\Exception $e) {
                Log::warning('WebSocket push failed for table_open: ' . $e->getMessage());
            }

            // 写入通知表
            try {
                \app\common\logic\NotificationLogic::createNotification(
                    $storeId ?: $table->store_id,
                    'table_open',
                    ($table->name ?? $table->number ?? '?号桌') . ' 开台，' . $playerCount . '人',
                    json_encode(['table_id'=>$tableId,'table_name'=>$table->name ?? $table->number,'player_count'=>$playerCount,'order_id'=>$order->id])
                );
            } catch (\Exception $e) {
                Log::warning('Notification create failed for table_open: ' . $e->getMessage());
            }

            // 开台开灯
            try {
                WebSocketNotification::sendLightControl($tableId, 'on');
            } catch (\Exception $e) {
                // 灯控失败不影响开台流程
            }

            Db::commit();

            return [
                'success' => true,
                'message' => '一键开台成功',
                'data' => [
                    'order_id' => $order->id,
                    'order_no' => $order->order_no,
                    'table_id' => $tableId,
                    'table_no' => $table->number,
                    'start_time' => $order->start_time,
                    'hourly_rate' => $hourlyRate,
                    'order_type' => 'quick'
                ]
            ];
        } catch (Exception $e) {
            Db::rollback();
            Log::error('quickOpen error: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => '开台失败: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }

    private static function generateId(): string
    {
        return 'order_' . bin2hex(random_bytes(8));
    }

    /**
     * 创建开台确认请求 — 暂不开台，等待 POS 确认
     */
    private static function createConfirmRequest(array $params, string $storeId, array $store): array
    {
        $tableId = $params['table_id'];
        $table = Table::where('id', $tableId)->where('store_id', $storeId)->find();
        if (!$table) return ['success' => false, 'message' => '桌台不存在', 'data' => null];
        if ($table->status !== 'idle') return ['success' => false, 'message' => '桌台已被占用', 'data' => null];

        $playerCount = $params['player_count'] ?? 2;
        $token = 'oc_' . bin2hex(random_bytes(16));

        // 读取门店配置的超时时间（分钟），默认 1 分钟
        $timeoutMinutes = max(1, intval($store['open_table_confirm_timeout'] ?? 1));
        $expiresAt = time() + ($timeoutMinutes * 60);
        $cacheTtl = ($timeoutMinutes * 60) + 10; // Cache 比超时多 10 秒缓冲

        \think\facade\Cache::set('open_confirm_' . $token, [
            'table_id'     => $tableId,
            'store_id'     => $storeId,
            'table_name'   => $table->name,
            'player_count' => $playerCount,
            'expires_at'   => $expiresAt,
            'timeout'      => $timeoutMinutes,
        ], $cacheTtl);

        // 加入待处理列表（供 pendingConfirmRequests 轮询）
        $pendingKey = 'pending_open_requests_' . $storeId;
        $pending = \think\facade\Cache::get($pendingKey) ?: [];
        $pending[] = $token;
        \think\facade\Cache::set($pendingKey, $pending, $cacheTtl + 30);

        // WS 通知 POS
        try {
            \app\common\lib\WebSocketNotification::sendToGroup("store_{$storeId}", [
                'type' => 'table_open_confirm_request',
                'data' => [
                    'token'        => $token,
                    'table_id'     => $tableId,
                    'table_name'   => $table->name,
                    'player_count' => $playerCount,
                    'expires_at'   => $expiresAt,
                    'timeout'      => $timeoutMinutes,
                    'timestamp'    => time(),
                ]
            ]);
        } catch (\Exception $e) {
            \think\facade\Log::error('[TableOpen] WS推送确认请求失败: ' . $e->getMessage());
        }

        return [
            'success'      => true,
            'need_confirm' => true,
            'token'        => $token,
            'expires_at'   => $expiresAt,
            'timeout'      => $timeoutMinutes,
            'message'      => '已通知收银端，等待确认开台',
        ];
    }

    public static function prepaidOpen(array $params, string $storeId, bool $force = false): array
    {
        // 检查是否需要收银端确认（$force=true 时跳过，用于 POS/验券直接开台）
        if (!$force) {
            $store = Db::name('busi_store')->where('id', $storeId)->find();
            if (($store['open_table_confirm'] ?? 0) == 1) {
                $confirmResult = self::createConfirmRequest($params, $storeId, $store);
                $confirmResult['prepaid'] = true;
                return $confirmResult;
            }
        }

        $tableId = $params['table_id'] ?? '';
        $prepaidHours = $params['prepaid_hours'] ?? 1;
        $playerCount = $params['player_count'] ?? 2;
        $skipDiscount = $params['skip_discount'] ?? false;
        $couponPrice  = $params['coupon_price'] ?? null;
        $source       = $params['source'] ?? 'instore';

        if (empty($tableId)) {
            return [
                'success' => false,
                'message' => '台桌ID不能为空',
                'data' => null
            ];
        }

        // 套餐券不受1-4小时限制
        if (!$skipDiscount && !in_array($prepaidHours, [1, 2, 3, 4])) {
            return [
                'success' => false,
                'message' => '预付时长只能选择1-4小时',
                'data' => null
            ];
        }

        $table = self::validateTable($tableId, $storeId);
        if (!$table) {
            return [
                'success' => false,
                'message' => self::getError(),
                'data' => null
            ];
        }

        $hourlyRate = floatval($table->hourly_rate ?? 30);
        $prepaidHours = max(1, min(12, intval($prepaidHours)));

        if ($skipDiscount && $couponPrice !== null) {
            // 套餐券固定价格，不参与内置折扣
            $discountRate = round($couponPrice / ($hourlyRate * $prepaidHours), 2);
            $finalAmount = $couponPrice;
            $originalAmount = $hourlyRate * $prepaidHours;
            $discountAmount = 0;
        } else {
            // 原有折扣逻辑
            $discountRate = $prepaidHours >= 2 ? 0.9 : 1.0;
            $originalAmount = $hourlyRate * $prepaidHours;
            $discountAmount = $originalAmount * (1 - $discountRate);
            $finalAmount = $originalAmount * $discountRate;
        }

        Db::startTrans();
        try {
            $orderNo = 'TB' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

            $order = new Order();
            $order->id = self::generateId();
            $order->store_id = $storeId ?: $table->store_id;
            $order->order_no = $orderNo;
            $order->type = 'table';
            $order->order_type = 'prepaid';
            $order->source = $source;
            $order->status = 'in_progress';
            $order->table_id = $tableId;
            $order->table_fee = $finalAmount;
            $order->start_time = date('Y-m-d H:i:s');
            $order->prepaid_hours = $prepaidHours;
            $order->remaining_minutes = $prepaidHours * 60;
            $order->payment_status = 'paid';
            $order->prepaid_amount = $finalAmount;
            $order->original_amount = $originalAmount;
            $order->discount_amount = $discountAmount;
            $order->final_amount = $finalAmount;
            $order->operator_id = $params['operator_id'] ?? request()->employeeId ?? '';
            $order->operator_name = $params['operator_name'] ?? request()->employeeInfo['name'] ?? '';
            $order->save();

            $orderItem = new OrderItem();
            $orderItem->id = self::generateId();
            $orderItem->order_id = $order->id;
            $orderItem->item_type = 'table';
            $orderItem->item_name = '预付台费(' . $prepaidHours . '小时)';
            $orderItem->quantity = $prepaidHours;
            $orderItem->unit = '小时';
            $orderItem->unit_price = $hourlyRate;
            $orderItem->total_price = $originalAmount;
            $orderItem->final_price = $finalAmount;
            $orderItem->status = 'active';
            $orderItem->save();

            $table->status = TableStatus::OCCUPIED;
            $table->save();

            // 推送 WebSocket + 写通知表 (same pattern as quickOpen)
            try {
                \app\common\lib\WebSocketNotification::sendToGroup(
                    "store_{$storeId}",
                    [
                        'type' => 'table_open',
                        'data' => [
                            'table_id' => $tableId,
                            'table_name' => $table->name ?? $table->number ?? '',
                            'player_count' => $playerCount,
                            'order_id' => $order->id,
                            'prepaid_hours' => $prepaidHours,
                        ]
                    ]
                );
                \app\common\logic\NotificationLogic::createNotification(
                    $storeId ?: $table->store_id,
                    'table_open',
                    ($table->name ?? $table->number ?? '?号桌') . ' 预付开台' . $prepaidHours . '小时，' . $playerCount . '人',
                    json_encode(['table_id'=>$tableId,'table_name'=>$table->name ?? $table->number,'player_count'=>$playerCount,'order_id'=>$order->id,'prepaid_hours'=>$prepaidHours])
                );
            } catch (\Exception $e) {
                Log::warning('WS/notification push failed for prepaidOpen: ' . $e->getMessage());
            }

            // 开台开灯
            try {
                WebSocketNotification::sendLightControl($tableId, 'on');
            } catch (\Exception $e) {
                // 灯控失败不影响开台流程
            }

            Db::commit();

            return [
                'success' => true,
                'message' => '预付开台成功',
                'data' => [
                    'order_id' => $order->id,
                    'order_no' => $order->order_no,
                    'table_id' => $tableId,
                    'table_no' => $table->number,
                    'start_time' => $order->start_time,
                    'hourly_rate' => $table->hourly_rate,
                    'order_type' => 'prepaid',
                    'prepaid_info' => [
                        'hours' => $prepaidHours,
                        'original_amount' => $originalAmount,
                        'discount_amount' => $discountAmount,
                        'final_amount' => $finalAmount,
                        'remaining_minutes' => $prepaidHours * 60
                    ]
                ]
            ];
        } catch (Exception $e) {
            Db::rollback();
            Log::error('prepaidOpen error: ' . $e->getMessage() . ' | File: ' . $e->getFile() . ' | Line: ' . $e->getLine() . ' | Trace: ' . $e->getTraceAsString());
            return [
                'success' => false,
                'message' => '开台失败: ' . $e->getMessage(),
                'data' => null
            ];
        }
    }
}
