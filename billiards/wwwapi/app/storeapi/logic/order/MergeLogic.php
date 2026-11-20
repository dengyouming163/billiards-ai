<?php

declare (strict_types=1);

namespace app\storeapi\logic\order;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use app\common\constants\TableStatus;
use app\common\logic\TableFeeCalculatorLogic;
use app\common\model\merchant\OrderTableLog;
use think\facade\Db;
use think\Exception;

class MergeLogic extends BaseLogic
{
    /**
     * 返回错误响应（统一格式）
     */
    private static function error(string $message): array
    {
        self::setError($message);
        return ['success' => false, 'message' => $message];
    }

    /**
     * 标准化台桌状态值
     */
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
    
    /**
     * 检查桌台是否可用（支持旧格式状态）
     */
    private static function isTableAvailable($table): bool
    {
        $normalizedStatus = self::normalizeTableStatus($table->status);
        return $normalizedStatus === TableStatus::IDLE;
    }
    
    public static function mergeOrders(array $params, string $storeId)
    {
        $orderIds = $params['order_ids'] ?? [];
        
        if (count($orderIds) < 2) {
            return self::error('并台操作至少需要选择2个订单');
        }

        try {
            $mainOrder = Order::where('id', $orderIds[0])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$mainOrder) {
                return self::error('主订单不存在');
            }

            if ($mainOrder->status != 'in_progress') {
                return self::error('主订单状态必须为进行中');
            }

            $ordersToMerge = [];
            $totalAmount = $mainOrder->final_amount;

            foreach (array_slice($orderIds, 1) as $orderId) {
                $order = Order::where('id', $orderId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();

                if (!$order) {
                    return self::error("订单 {$orderId} 不存在");
                }

                if ($order->status != 'in_progress') {
                    return self::error("订单 {$orderId} 状态必须为进行中");
                }

                $ordersToMerge[] = $order;
                $totalAmount += $order->final_amount;
            }

            Db::startTrans();

            foreach ($ordersToMerge as $subOrder) {
                $subItems = OrderItem::where('order_id', $subOrder->id)->select();
                foreach ($subItems as $item) {
                    $newItem = new OrderItem();
                    $newItem->id = self::generateId();
                    $newItem->order_id = $mainOrder->id;
                    $newItem->item_type = $item->item_type;
                    $newItem->product_id = $item->product_id;
                    $newItem->item_name = $item->item_name;
                    $newItem->quantity = $item->quantity;
                    $newItem->unit = $item->unit;
                    $newItem->unit_price = $item->unit_price;
                    $newItem->total_price = $item->total_price;
                    $newItem->final_price = $item->final_price;
                    $newItem->save();
                }

                $subOrder->merged_to_order_id = $mainOrder->id;
                $subOrder->status = 'merged';
                $subOrder->save();

                if (!empty($subOrder->table_id)) {
                    $table = Table::where('id', $subOrder->table_id)
                        ->where('store_id', $storeId)
                        ->find();
                    if ($table) {
                        $table->status = TableStatus::IDLE;
                        $table->save();
                    }
                }
            }

            $mainOrder->final_amount = $totalAmount;
            $mainOrder->original_amount = $mainOrder->original_amount + 
                array_sum(array_map(fn($o) => $o->original_amount, $ordersToMerge));
            $mainOrder->save();

            Db::commit();

            return [
                'success' => true,
                'message' => '并台成功',
                'data' => [
                    'main_order_id' => $mainOrder->id,
                    'merged_order_ids' => array_map(fn($o) => $o->id, $ordersToMerge),
                    'total_amount' => $totalAmount,
                    'items' => OrderItem::where('order_id', $mainOrder->id)->select()->toArray(),
                ],
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::error('并台失败: ' . $e->getMessage());
        }
    }

    public static function merge(string $sourceOrderId, string $targetOrderId, string $storeId)
    {
        if (empty($sourceOrderId) || empty($targetOrderId)) {
            return self::error('参数错误');
        }

        if ($sourceOrderId === $targetOrderId) {
            return self::error('源订单和目标订单不能相同');
        }

        try {
            $sourceOrder = Order::where('id', $sourceOrderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$sourceOrder) {
                return self::error('源订单不存在');
            }

            if ($sourceOrder->status != 'in_progress') {
                return self::error('源订单状态必须为进行中');
            }

            $targetOrder = Order::where('id', $targetOrderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$targetOrder) {
                return self::error('目标订单不存在');
            }

            if ($targetOrder->status != 'in_progress') {
                return self::error('目标订单状态必须为进行中');
            }

            Db::startTrans();

            // 关联模式：不复制 items，仅记录关联。账单查询时通过 merged_to_order_id 聚合子订单。

            // 计算源桌台费（用于固化 table item）
            $sourceTableFee = 0;
            if (!empty($sourceOrder->start_time) && !empty($sourceOrder->table_id)) {
                $sourceTable = Table::where('id', $sourceOrder->table_id)
                    ->where('store_id', $storeId)->find();
                if ($sourceTable) {
                    $calculator = new TableFeeCalculatorLogic($sourceTable, $sourceOrder);
                    $durationMinutes = max(0, (int)floor((time() - strtotime($sourceOrder->start_time)) / 60));
                    $sourceTableFee = $calculator->calculateFee($durationMinutes);
                }
            }

            // 固原子订单所有未完成项的费用（历史追溯+助教提成+报表依赖）
            $childTableFee = 0;
            $childProductFee = 0;
            $childAssistantFee = 0;
            $childChargingFee = 0;
            $childItems = OrderItem::where('order_id', $sourceOrder->id)->select();
            foreach ($childItems as $ci) {
                if ($ci->item_type === 'table') {
                    // 台费：实时计算并回写 final_price
                    $childTableFee = $sourceTableFee ?? 0;
                    $ci->final_price = $childTableFee;
                    $ci->total_price = $childTableFee;
                    $ci->status = 'completed';
                    $ci->save();
                } elseif ($ci->item_type === 'assistant' && $ci->status === 'serving' && !empty($ci->started_at)) {
                    $fee = floatval($ci->final_price ?? 0);
                    // 买断(flat_rate): 保留固定价格，不按实时重算
                    if (($ci->billing_mode ?? '') === 'flat_rate') {
                        $fee = floatval($ci->final_price ?? $ci->total_price ?? 0);
                    } else {
                        // 实时计费: 按计费规则计算 final_price
                        $mins = max(1, intval((time() - strtotime($ci->started_at)) / 60));
                        $rate = floatval($ci->unit_price ?? 0);
                        $rule = null;
                        if (!empty($ci->assistant_id)) {
                            $ast = \app\common\model\merchant\Assistant::where('id', $ci->assistant_id)->whereNull('deleted_at')->find();
                            $rule = $ast['billing_rule'] ?? 'half_hour';
                        }
                        $rule = $rule ?: 'half_hour';
                        if ($rule === 'minute' || $rule === 'hourly') {
                            $fee = round(($mins / 60) * $rate, 2);
                        } else {
                            $fee = round(ceil($mins / 30) * 0.5 * $rate, 2);
                        }
                    }
                    $ci->final_price = $fee;
                    $ci->total_price = $fee;
                    $ci->status = 'completed';
                    $ci->ended_at = date('Y-m-d H:i:s');
                    $ci->save();
                    $childAssistantFee += $fee;
                } elseif ($ci->item_type === 'assistant' && in_array($ci->status, ['completed', 'cancelled'])) {
                    $childAssistantFee += floatval($ci->final_price ?? 0);
                } elseif ($ci->item_type === 'assistant_overtime') {
                    // 加钟记录: 固定价格，直接计入
                    $childAssistantFee += floatval($ci->final_price ?? $ci->total_price ?? 0);
                } elseif ($ci->item_type === 'product') {
                    $childProductFee += floatval($ci->final_price ?? $ci->total_price ?? 0);
                }
            }
            // 固原子订单充电会话
            $childSessions = \think\facade\Db::name('charging_session')
                ->where('order_id', $sourceOrder->id)
                ->select();
            foreach ($childSessions as $cs) {
                if ($cs['status'] === 'active') {
                    $elapsed = time() - strtotime($cs['started_at']);
                    $fee = round(($elapsed / 3600) * (float)$cs['rate_per_hour'], 2);
                    \think\facade\Db::name('charging_session')
                        ->where('id', $cs['id'])
                        ->update(['total_fee' => $fee, 'status' => 'completed']);
                    $childChargingFee += $fee;
                } elseif ($cs['status'] === 'completed') {
                    $childChargingFee += (float)$cs['total_fee'];
                }
            }
            // 回写子订单费用明细
            $sourceOrder->table_fee    = round($childTableFee, 2);
            $sourceOrder->product_fee  = round($childProductFee, 2);
            $sourceOrder->assistant_fee = round($childAssistantFee, 2);
            $sourceOrder->charging_fee = round($childChargingFee, 2);
            $sourceOrder->total_fee    = round($childTableFee + $childProductFee + $childAssistantFee + $childChargingFee, 2);
            $sourceOrder->final_amount = (string)$sourceOrder->total_fee;

            // 关联源订单：标记 completed + paid，消费合并到目标订单
            $sourceOrder->merged_to_order_id = $targetOrder->id;
            $sourceOrder->status = 'completed';
            $sourceOrder->payment_status = 'paid';
            $sourceOrder->end_time = date('Y-m-d H:i:s');
            $sourceOrder->save();

            if (!empty($sourceOrder->table_id)) {
                $table = Table::where('id', $sourceOrder->table_id)
                    ->where('store_id', $storeId)
                    ->find();
                if ($table) {
                    $table->status = TableStatus::IDLE;
                    $table->save();
                }
            }

            $targetOrder->final_amount = bcadd((string)($targetOrder->final_amount ?? 0), (string)($sourceOrder->final_amount ?? 0), 2);
            $targetOrder->original_amount = bcadd((string)($targetOrder->original_amount ?? 0), (string)($sourceOrder->original_amount ?? 0), 2);
            // 转移已付金额（买断先付/预付套餐等）
            $sourcePaidAmount = floatval($sourceOrder->paid_amount ?? 0);
            if ($sourcePaidAmount > 0) {
                $targetOrder->paid_amount = round(floatval($targetOrder->paid_amount ?? 0) + $sourcePaidAmount, 2);
            }

            // 回写聚合费用到目标订单（DB一致性，报表/直查依赖）
            $mergedIds = \think\facade\Db::name('busi_order')
                ->where('merged_to_order_id', $targetOrder->id)
                ->where('status', 'completed')
                ->column('id');
            $allOrderIds = array_merge([$targetOrder->id], $mergedIds);
            $allItems = OrderItem::whereIn('order_id', $allOrderIds)->select()->toArray();
            $productFee   = \app\storeapi\logic\order\CheckoutLogic::calculateProductFee($allItems);
            $assistantFee = \app\storeapi\logic\order\CheckoutLogic::calculateAssistantFee($allItems);
            $chargingFee  = \app\storeapi\logic\order\CheckoutLogic::calculateChargingFee($allItems);
            // 并台转入台费（merge_fee 类型 item，不属 product/assistant/charging）
            $mergeFee = 0;
            foreach ($allItems as $it) {
                if (($it['item_type'] ?? '') === 'merge_fee') {
                    $mergeFee += (float)($it['final_price'] ?? $it['total_price'] ?? 0);
                }
            }
            $targetOrder->product_fee   = round($productFee, 2);
            $targetOrder->assistant_fee = round($assistantFee, 2);
            $targetOrder->charging_fee  = round($chargingFee, 2);
            $targetOrder->total_fee     = round(
                (float)($targetOrder->table_fee ?? 0) + $productFee + $assistantFee + $chargingFee + $mergeFee + $childTableFee, 2
            );
            // final_amount 对齐 total_fee（覆盖之前的 bcadd 估算值）
            $targetOrder->final_amount = $targetOrder->total_fee;
            $targetOrder->save();

            // 记录审计日志
            if (!empty($sourceOrder->table_id)) {
                $sourceLog = new OrderTableLog();
                $sourceLog->id = self::generateId();
                $sourceLog->store_id = $storeId;
                $sourceLog->order_id = $sourceOrder->id;
                $sourceLog->table_id = $sourceOrder->table_id;
                $sourceLog->action = 'merge_from';
                $sourceLog->related_order_id = $targetOrder->id;
                $sourceLog->operator_id = $sourceOrder->operator_id ?? '';
                $sourceLog->operator_name = $sourceOrder->operator_name ?? '';
                $sourceLog->remark = '并台至订单' . $targetOrder->id;
                $sourceLog->save();
            }

            $targetLog = new OrderTableLog();
            $targetLog->id = self::generateId();
            $targetLog->store_id = $storeId;
            $targetLog->order_id = $targetOrder->id;
            $targetLog->table_id = $targetOrder->table_id;
            $targetLog->action = 'merge_to';
            $targetLog->related_order_id = $sourceOrder->id;
            $targetLog->operator_id = $sourceOrder->operator_id ?? '';
            $targetLog->operator_name = $sourceOrder->operator_name ?? '';
            $targetLog->remark = '并入订单' . $sourceOrder->id . '的消费';
            $targetLog->save();

            Db::commit();

            return [
                'success' => true,
                'message' => '并台成功',
                'data' => [
                    'source_order_id' => $sourceOrderId,
                    'target_order_id' => $targetOrderId,
                    'total_amount' => $targetOrder->final_amount,
                ],
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::error('并台失败: ' . $e->getMessage());
        }
    }

    public static function changeTable(string $orderId, string $newTableId, string $storeId)
    {
        if (empty($orderId)) {
            return self::error('订单ID不能为空');
        }

        if (empty($newTableId)) {
            return self::error('目标桌台ID不能为空');
        }

        try {
            $order = Order::where('id', $orderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$order) {
                return self::error('订单不存在');
            }

            if ($order->status != 'in_progress') {
                return self::error('订单状态必须为进行中才能换台');
            }

            $newTable = Table::where('id', $newTableId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$newTable) {
                return self::error('目标桌台不存在');
            }

            if (!self::isTableAvailable($newTable)) {
                return self::error('目标桌台不是空闲状态');
            }
            
            $oldTableId = $order->table_id ?? '';

            Db::startTrans();
            
            if (!empty($oldTableId)) {
                $oldTable = Table::where('id', $oldTableId)
                    ->where('store_id', $storeId)
                    ->find();
                if ($oldTable) {
                    $oldTable->status = TableStatus::IDLE;
                    $oldTable->save();
                }
            }
            
            $newTable->status = TableStatus::OCCUPIED;
            $newTable->save();

            $order->table_id = $newTableId;
            $order->save();

            // 记录换台审计日志
            $fromLog = new OrderTableLog();
            $fromLog->id = self::generateId();
            $fromLog->store_id = $storeId;
            $fromLog->order_id = $order->id;
            $fromLog->table_id = $oldTableId;
            $fromLog->action = 'transfer_from';
            $fromLog->related_order_id = null;
            $fromLog->operator_id = $order->operator_id ?? '';
            $fromLog->operator_name = $order->operator_name ?? '';
            $fromLog->remark = '换台至台桌' . $newTableId;
            $fromLog->save();

            $toLog = new OrderTableLog();
            $toLog->id = self::generateId();
            $toLog->store_id = $storeId;
            $toLog->order_id = $order->id;
            $toLog->table_id = $newTableId;
            $toLog->action = 'transfer_to';
            $toLog->related_order_id = null;
            $toLog->operator_id = $order->operator_id ?? '';
            $toLog->operator_name = $order->operator_name ?? '';
            $toLog->remark = '来自台桌' . $oldTableId . '的换台';
            $toLog->save();

            Db::commit();

            // 通知旧桌台平板：订单已转走，清空界面
            if (!empty($oldTableId)) {
                try {
                    \app\common\lib\WebSocketNotification::init();
                    \app\common\lib\WebSocketNotification::sendToGroup("table_{$oldTableId}", [
                        'type' => 'table_released',
                        'data' => [
                            'table_id'     => $oldTableId,
                            'order_id'     => $order->id,
                            'new_table_id' => $newTableId,
                            'reason'       => 'transferred',
                            'timestamp'    => time(),
                        ]
                    ]);
                } catch (\Exception $e) {
                    \think\facade\Log::warning('[MergeLogic] changeTable WS推送失败: ' . $e->getMessage());
                }
            }

            return [
                'success' => true,
                'message' => '换台成功',
                'data' => [
                    'order_id' => $order->id,
                    'old_table_id' => $oldTableId,
                    'new_table_id' => $newTableId,
                    'new_table' => $newTable->toArray(),
                ],
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::error('换台失败: ' . $e->getMessage());
        }
    }

    public static function getMergeableOrders(string $storeId)
    {
        try {
            $orders = Order::where('store_id', $storeId)
                ->where('status', 'in_progress')
                ->whereNull('deleted_at')
                ->whereNull('merged_to_order_id')
                ->order('created_at', 'desc')
                ->select();

            $data = [];
            foreach ($orders as $order) {
                $orderData = $order->toArray();
                $orderData['items'] = OrderItem::where('order_id', $order->id)->select()->toArray();
                $data[] = $orderData;
            }

            return [
                'success' => true,
                'data' => $data,
            ];
        } catch (Exception $e) {
            return self::error('查询失败: ' . $e->getMessage());
        }
    }

    public static function getMergeHistory(string $orderId, string $storeId)
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$order) {
                return self::error('订单不存在');
            }

            $mergedOrders = Order::where('merged_to_order_id', $orderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->select();

            $data = [];
            foreach ($mergedOrders as $mergedOrder) {
                $orderData = $mergedOrder->toArray();
                $orderData['items'] = OrderItem::where('order_id', $mergedOrder->id)->select()->toArray();
                $data[] = $orderData;
            }

            return [
                'success' => true,
                'data' => $data,
            ];
        } catch (Exception $e) {
            return self::error('查询失败: ' . $e->getMessage());
        }
    }

    public static function splitOrder(string $orderId, array $splitItems, string $storeId)
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$order) {
                return self::error('订单不存在');
            }

            if ($order->status != 'in_progress') {
                return self::error('只有进行中的订单才能拆分');
            }

            $allItems = OrderItem::where('order_id', $orderId)->select();
            
            if (empty($splitItems)) {
                return self::error('请选择要拆分的订单项');
            }

            Db::startTrans();

            $newOrder = new Order();
            $newOrder->id = self::generateId();
            $newOrder->store_id = $storeId;
            $newOrder->order_no = 'SP' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $newOrder->type = $order->type;
            $newOrder->status = 'in_progress';
            $newOrder->table_id = $order->table_id;
            $newOrder->member_id = $order->member_id;
            $newOrder->member_name = $order->member_name;
            $newOrder->operator_id = $order->operator_id;
            $newOrder->operator_name = $order->operator_name;
            $newOrder->start_time = date('Y-m-d H:i:s');
            $newOrder->original_amount = 0;
            $newOrder->discount_amount = 0;
            $newOrder->final_amount = 0;
            $newOrder->save();

            $totalSplitAmount = 0;
            foreach ($allItems as $item) {
                if (in_array($item->id, $splitItems)) {
                    $newItem = new OrderItem();
                    $newItem->id = self::generateId();
                    $newItem->order_id = $newOrder->id;
                    $newItem->item_type = $item->item_type;
                    $newItem->product_id = $item->product_id;
                    $newItem->item_name = $item->item_name;
                    $newItem->quantity = $item->quantity;
                    $newItem->unit = $item->unit;
                    $newItem->unit_price = $item->unit_price;
                    $newItem->total_price = $item->total_price;
                    $newItem->final_price = $item->final_price;
                    $newItem->save();

                    $totalSplitAmount += $item->final_price;
                    $item->delete();
                }
            }

            $order->final_amount = $order->final_amount - $totalSplitAmount;
            $order->original_amount = $order->original_amount - $totalSplitAmount;
            $order->save();

            $newOrder->final_amount = $totalSplitAmount;
            $newOrder->original_amount = $totalSplitAmount;
            $newOrder->save();

            Db::commit();

            return [
                'success' => true,
                'message' => '拆分成功',
                'data' => [
                    'original_order' => Order::where('id', $orderId)->with('items')->find()->toArray(),
                    'new_order' => Order::where('id', $newOrder->id)->with('items')->find()->toArray(),
                ],
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::error('拆分失败: ' . $e->getMessage());
        }
    }

    private static function generateId()
    {
        return 'order_' . bin2hex(random_bytes(8));
    }
}
