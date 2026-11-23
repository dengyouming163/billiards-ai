<?php

declare (strict_types=1);

namespace app\common\logic;

use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use app\common\model\merchant\Member;
use app\common\model\merchant\Zone;
use app\common\model\merchant\Product;

class OrderLogic extends BaseLogic
{
    public static function getOrderDetail(string $orderId, string $storeId = ''): ?array
    {
        $query = Order::where('id', $orderId);
        if ($storeId) {
            $query->where('store_id', $storeId);
        }
        $order = $query->find();

        if (!$order) {
            return null;
        }

        return self::formatOrderData($order);
    }

    public static function getTableCurrentOrder(string $tableId, string $storeId = ''): ?array
    {
        $order = Order::where('table_id', $tableId)
            ->where('status', 'in_progress')
            ->find();
            
        if (!$order) {
            return null;
        }
        
        return self::formatOrderData($order);
    }

    /**
     * 计算助教实时计费金额 — 供暂停/恢复/账单展示复用
     */
    /**
     * 计算助教实时计费 — 总是扣除累计暂停秒数，使费用单调不降
     * 暂停期间的冻结值由 total_price 快照保证（PauseEndpoint 写入，formatOrderData 取 max）
     */
    public static function calcAssistantItemFee($item): float
    {
        if (empty($item['started_at'])) return 0;
        $startTs = strtotime($item['started_at']);
        $totalPaused = intval($item['total_paused_seconds'] ?? 0);
        $endTs = (!empty($item['is_paused']) && !empty($item['paused_at']))
            ? strtotime($item['paused_at'])   // 暂停中：冻结在暂停时刻
            : time();                           // 计费中：用当前时间
        $effectiveSeconds = max(0, ($endTs - $startTs) - $totalPaused);
        $mins = max(1, intval($effectiveSeconds / 60));
        $rate = floatval($item['unit_price'] ?? 0);
        $rule = $item['billing_rule'] ?? 'half_hour';
        if (empty($item['billing_rule']) && !empty($item['assistant_id'])) {
            $ast = \app\common\model\merchant\Assistant::where('id', $item['assistant_id'])->whereNull('deleted_at')->find();
            $rule = $ast['billing_rule'] ?? 'half_hour';
        }
        if ($rule === 'minute' || $rule === 'hourly') {
            return round(($mins / 60) * $rate, 2);
        }
        $units = ceil($mins / 30);
        return round($units * 0.5 * $rate, 2);
    }

    public static function formatOrderData(Order $order): array
    {
        // 聚合自身 + 并入的子订单 items（关联模式，无数据冗余）
        $orderIds = [$order->id];
        $mergedIds = \think\facade\Db::name('busi_order')
            ->where('merged_to_order_id', $order->id)
            ->where('status', 'completed')
            ->column('id');
        $orderIds = array_merge($orderIds, $mergedIds);
        $items = OrderItem::whereIn('order_id', $orderIds)->select()->toArray();

        $orderData = [
            'id' => $order->id,
            'order_no' => $order->order_no,
            'status' => $order->status,
            'order_type' => $order->order_type ?? 'normal',
            'source' => $order->source ?? 'instore',
            'table_id' => $order->table_id,
            'start_time' => $order->start_time,
            'prepaid_hours' => $order->prepaid_hours,
            'remaining_minutes' => $order->prepaid_hours > 0 ? max(0, ($order->remaining_minutes ?? 0) - ($orderData['duration_minutes'] ?? 0)) : 0,
            'customer_count' => $order->customer_count ?? 0,
            'table_fee' => (float)($order->table_fee ?? 0),
            'product_fee' => (float)($order->product_fee ?? 0),
            'assistant_fee' => (float)($order->assistant_fee ?? 0),
            'charging_fee' => (float)($order->charging_fee ?? 0),
            'total_fee' => (float)($order->total_fee ?? 0),
            'final_amount' => (float)($order->final_amount ?? 0),
            'table_paused_at' => $order->table_paused_at ?? null,
            'table_fee_paused' => intval($order->table_fee_paused ?? 0),
            'table_fee_paused_duration' => intval($order->table_fee_paused_duration ?? 0),
            'assistant_paused_at' => $order->assistant_paused_at ?? null,
            'prepaid_amount' => floatval($order->prepaid_amount ?? 0),
            // 套餐券信息
            'coupon_package_name' => '',
            'coupon_price' => 0,
        ];

        // 查询套餐券信息
        if ($order->prepaid_hours > 0) {
            $coupon = \think\facade\Db::name('busi_coupon_verify')
                ->where('order_id', $order->id)
                ->where('status', 'verified')
                ->order('id', 'desc')
                ->find();
            if ($coupon) {
                $orderData['coupon_package_name'] = $coupon['package_name'] ?? '';
                $orderData['coupon_price'] = (float)($coupon['verify_price'] ?? 0);
            }
        }
        
        if ($order->start_time) {
            $startTime = strtotime($order->start_time);
            $now = time();
            // 台费暂停时冻结时长，恢复后扣除累计暂停时长
            $totalPausedSeconds = intval($order->table_fee_paused_duration ?? 0);
            if (!empty($order->table_paused_at)) {
                // 当前正在暂停中: 冻结在暂停时刻
                $pausedAt = strtotime($order->table_paused_at);
                $durationMinutes = (int) floor(($pausedAt - $startTime) / 60);
            } else {
                // 计费中: 扣除累计暂停秒数
                $effectiveSeconds = max(0, ($now - $startTime) - $totalPausedSeconds);
                $durationMinutes = (int) floor($effectiveSeconds / 60);
            }
            $orderData['duration_minutes'] = $durationMinutes;
            
            if ($order->prepaid_hours > 0 && $order->remaining_minutes !== null) {
                $orderData['remaining_minutes'] = max(0, $order->remaining_minutes - $durationMinutes);
            }
            
            $table = Table::where('id', $order->table_id)->find();
            $orderData['table_name'] = $table ? ($table->name ?? '') : '';
            if ($table) {
                $member = null;
                if ($order->member_id) {
                    $member = Member::where('id', $order->member_id)->find();
                }
                $calculator = new TableFeeCalculatorLogic($table, $order, $member);
                $orderData['hourly_rate'] = $calculator->getCurrentHourlyRate();
                $orderData['pricing_info'] = [
                    'pricing_type' => $calculator->getCurrentPricingType(),
                    'current_rate' => $calculator->getCurrentHourlyRate(),
                    'is_member_discount' => !empty($order->member_id),
                ];
                
                $tableFee = $calculator->calculateFee($durationMinutes);
                // 预付套餐券：台费显示为套餐券金额（非0）
                if (!empty($order->prepaid_amount) && floatval($order->prepaid_amount) > 0 && ($order->remaining_minutes ?? 0) > 0) {
                    $tableFee = floatval($order->prepaid_amount);
                }
                $orderData['table_fee'] = $tableFee;
            } else {
                $orderData['hourly_rate'] = 0;
                $orderData['table_fee'] = 0;
                $orderData['pricing_info'] = [];
            }
            
            $productFee = 0;
            $assistantFee = 0;
            $mergeFee = 0;
            $simpleItems = [];
            
            // 过滤不可计费的状态（未确认、已取消、已拒绝）
            $skipStatuses = ['preorder_pending', 'cancelled', 'rejected'];

            foreach ($items as $item) {
                if (in_array($item['status'] ?? '', $skipStatuses)) {
                    continue;
                }
                if ($item['item_type'] === 'product') {
                    $productFee += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                    // 获取商品图片
                    $productImage = '';
                    if (!empty($item['product_id'])) {
                        $img = \think\facade\Db::name('busi_product')->where('id', $item['product_id'])->value('image');
                        $productImage = $img ?: '';
                    }
                    $simpleItems[] = [
                        'id' => $item['id'],
                        'name' => $item['item_name'],
                        'quantity' => (float)$item['quantity'],
                        'price' => (float)($item['final_price'] ?? $item['total_price'] ?? 0),
                        'status' => $item['status'],
                        'item_type' => $item['item_type'],
                        'image' => $productImage,
                    ];
                } elseif ($item['item_type'] === 'assistant') {
                    $isFlatRate = ($item['billing_mode'] ?? '') === 'flat_rate';
                    // 买断模式：固定价格，不实时计算
                    // 实时模式 completed 用 stored final_price，serving 用实时计算
                    $itemFee = 0;
                    if ($isFlatRate) {
                        $itemFee = (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                        $assistantFee += $itemFee;
                    } elseif ($item['status'] === 'serving' && !empty($item['started_at'])) {
                        // 实时计费: 先按当前有效时长计算，再取 max(计算值, 冻结值) 保证费用单调不降
                        $itemFee = self::calcAssistantItemFee($item);
                        $frozenFee = floatval($item['total_price'] ?? 0);
                        if ($frozenFee > 0 && $frozenFee > $itemFee) {
                            $itemFee = $frozenFee;
                        }
                        $assistantFee += $itemFee;
                    } else {
                        $itemFee = (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                        $assistantFee += $itemFee;
                    }
                    $simpleItems[] = [
                        'id' => $item['id'],
                        'name' => $item['item_name'],
                        'quantity' => (float)$item['quantity'],
                        'price' => $itemFee,
                        'status' => $item['status'],
                        'item_type' => $item['item_type'],
                        'assistant_id' => $item['assistant_id'] ?? '',
                        'assistant_name' => $item['item_name'],
                        'hourly_rate' => (float)($item['unit_price'] ?? 0),
                        'started_at' => $item['started_at'] ?? '',
                        'ended_at' => $item['ended_at'] ?? '',
                        'billing_mode' => $item['billing_mode'] ?? 'realtime',
                        'is_paid' => (int)($item['is_paid'] ?? 0),
                        'is_paused' => (int)($item['is_paused'] ?? 0),
                        'paused_at' => $item['paused_at'] ?? '',
                        'total_paused_seconds' => (int)($item['total_paused_seconds'] ?? 0),
                        'pay_mode' => $item['pay_mode'] ?? 'postpaid',
                    ];
                } elseif ($item['item_type'] === 'table') {
                    // 主订单(active): 用计算器实时台费; 并台子订单(completed): 用固化后的 final_price
                    $itemPrice = $item['status'] === 'completed'
                        ? (float)($item['final_price'] ?? $item['total_price'] ?? 0)
                        : ($tableFee > 0 ? $tableFee : (float)($item['final_price'] ?? $item['total_price'] ?? 0));
                    $simpleItems[] = [
                        'id' => $item['id'],
                        'name' => $item['item_name'] ?: '台费',
                        'quantity' => (float)$item['quantity'],
                        'price' => $itemPrice,
                        'status' => $item['status'],
                        'item_type' => 'table',
                        'billing_mode' => $item['billing_mode'] ?? 'realtime',
                        'is_paid' => (int)($item['is_paid'] ?? 0),
                        'pay_mode' => $item['pay_mode'] ?? 'postpaid',
                    ];
                } elseif ($item['item_type'] === 'charging') {
                    $chargingFee = $chargingFee ?? 0;
                    $chargingFee += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                    $simpleItems[] = [
                        'id' => $item['id'],
                        'name' => $item['item_name'] ?: '充电',
                        'quantity' => (float)$item['quantity'],
                        'price' => $chargingFee > 0 ? $chargingFee : (float)($item['final_price'] ?? $item['total_price'] ?? 0),
                        'status' => $item['status'],
                        'item_type' => 'charging',
                        'is_paid' => (int)($item['is_paid'] ?? 0),
                    ];
                } elseif ($item['item_type'] === 'merge_fee') {
                    $mergeFee += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                    $simpleItems[] = [
                        'id' => $item['id'],
                        'name' => '并入台费',
                        'quantity' => 1,
                        'price' => (float)($item['final_price'] ?? $item['total_price'] ?? 0),
                        'status' => $item['status'],
                        'item_type' => 'merge_fee',
                    ];
                } elseif ($item['item_type'] === 'assistant_overtime') {
                    // 加钟: flat_rate 一口价, 等同买断后付
                    $overtimeFee = (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                    $assistantFee += $overtimeFee;
                    $simpleItems[] = [
                        'id' => $item['id'],
                        'name' => $item['item_name'],
                        'quantity' => (float)$item['quantity'],
                        'price' => $overtimeFee,
                        'status' => $item['status'],
                        'item_type' => 'assistant_overtime',
                        'assistant_id' => $item['assistant_id'] ?? '',
                        'assistant_name' => $item['item_name'],
                        'hourly_rate' => (float)($item['unit_price'] ?? 0),
                        'billing_mode' => 'flat_rate',
                        'is_paid' => (int)($item['is_paid'] ?? 0),
                        'is_paused' => (int)($item['is_paused'] ?? 0),
                        'pay_mode' => $item['pay_mode'] ?? 'postpaid',
                        'parent_item_id' => $item['parent_item_id'] ?? '',
                    ];
                }
            }
            
            // 累加并台子订单的固化台费
            $mergedTableFee = 0;
            foreach ($items as $item) {
                if (($item['item_type'] ?? '') === 'table' && ($item['status'] ?? '') === 'completed') {
                    $mergedTableFee += (float)($item['final_price'] ?? $item['total_price'] ?? 0);
                }
            }
            $tableFee = round($tableFee + $mergedTableFee, 2);
            $orderData['table_fee'] = $tableFee;

            $orderData['product_fee'] = $productFee;
            $orderData['assistant_fee'] = $assistantFee;
            $orderData['merge_fee'] = $mergeFee;

            // 充电费（聚合自身+子订单）
            $chargingFee = 0;
            $chargingSessions = \app\common\model\merchant\ChargingSession::whereIn('order_id', $orderIds)
                ->where('status', 'completed')->select()->toArray();
            foreach ($chargingSessions as $cs) {
                $chargingFee += (float)$cs['total_fee'];
            }
            $activeCharging = \app\common\model\merchant\ChargingSession::whereIn('order_id', $orderIds)
                ->where('status', 'active')->select()->toArray();
            foreach ($activeCharging as $as) {
                $elapsed = time() - strtotime($as['started_at']);
                $chargingFee += round(($elapsed / 3600) * (float)$as['rate_per_hour'], 2);
            }
            $orderData['charging_fee'] = $chargingFee;

            // 回填服务端实时计费金额到 items（DB 中为0）
            foreach ($simpleItems as &$si) {
                if ($si['item_type'] === 'charging' && $chargingFee > 0) {
                    $si['price'] = round($chargingFee, 2);
                }
            }
            unset($si);

            $orderData['total_fee'] = $orderData['table_fee'] + $mergeFee + $productFee + $assistantFee + $chargingFee;
            $orderData['items'] = $simpleItems;
        } else {
            $orderData['items'] = [];
        }

        $orderData['member_info'] = null;
        if (!empty($order->member_id)) {
            $member = Member::where('id', $order->member_id)
                ->where('store_id', $order->store_id)
                ->with('level')
                ->find();

            if ($member) {
                $orderData['member_info'] = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'phone' => $member->phone,
                    'card_number' => $member->card_number ?? '',
                    'balance' => (float)($member->balance ?? 0),
                    'points' => (int)($member->points ?? 0),
                    'level_id' => $member->level_id,
                    'level_name' => $member->level->name ?? '',
                    'level_color' => $member->level->color ?? '#94a3b8',
                    'level_code' => $member->level->code ?? '',
                    'discount_rate' => (float)($member->level->discount_rate ?? 100),
                ];
            }
        }
        
        // v2: 账单总额 / 已付 / 待付
        $prepaidAmount = floatval($order->prepaid_amount ?? 0);
        $prepaidItemFee = 0;
        foreach ($items as $item) {
            $itemType = $item['item_type'] ?? '';
            if (($itemType === 'assistant' || $itemType === 'assistant_overtime') && ($item['is_paid'] ?? 0) == 1) {
                $prepaidItemFee += floatval($item['final_price'] ?? $item['total_price'] ?? 0);
            }
        }
        $orderData['total_amount'] = round($tableFee + $productFee + $assistantFee + $chargingFee + $mergeFee, 2);
        $orderData['paid_amount'] = round($prepaidAmount + $prepaidItemFee, 2);
        $orderData['payable_amount'] = max(0, round($orderData['total_amount'] - $orderData['paid_amount'], 2));
        // 账单快照时点 — 结算时传回，保证金额一致
        $orderData['bill_locked_at'] = date('Y-m-d H:i:s');

        return $orderData;
    }

    public static function getOrdersByStore(string $storeId, array $filters = []): array
    {
        $query = Order::where('store_id', $storeId);
        
        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        if (!empty($filters['start_time'])) {
            $query->where('created_at', '>=', $filters['start_time']);
        }
        
        if (!empty($filters['end_time'])) {
            $query->where('created_at', '<=', $filters['end_time']);
        }
        
        $orders = $query->order('created_at', 'desc')->select()->toArray();
        
        foreach ($orders as &$order) {
            $order['items'] = OrderItem::where('order_id', $order['id'])->select()->toArray();
        }
        
        return $orders;
    }

    public static function calculateOrderTotal(Order $order): float
    {
        $table = Table::where('id', $order->table_id)->find();
        if (!$table) {
            return 0;
        }
        
        $calculator = new TableFeeCalculatorLogic($table, $order);
        $tableFee = $calculator->calculateFee($order->duration_minutes ?? 0);
        
        $items = OrderItem::where('order_id', $order->id)->select()->toArray();
        $productFee = 0;
        $assistantFee = 0;
        
        foreach ($items as $item) {
            if ($item['item_type'] === 'product') {
                $productFee += $item['final_price'] ?? $item['total_price'] ?? 0;
            } elseif ($item['item_type'] === 'assistant') {
                $assistantFee += $item['final_price'] ?? $item['total_price'] ?? 0;
            }
        }
        
        return $tableFee + $productFee + $assistantFee;
    }

    public static function addItem(string $orderId, array $params, string $storeId): array
    {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->find();
        
        if (!$order) {
            return ['error' => '订单不存在'];
        }
        
        if ($order->status != 'in_progress') {
            return ['error' => '订单状态不允许添加商品'];
        }
        
        $product = \app\common\model\merchant\Product::where('id', $params['product_id'])
            ->where('store_id', $storeId)
            ->find();
        
        if (!$product) {
            return ['error' => '商品不存在'];
        }
        
        if ($product->stock <= 0) {
            return ['error' => '商品库存不足'];
        }
        
        try {
            \think\facade\Db::startTrans();
            
            $quantity = $params['quantity'] ?? 1;
            $unitPrice = (float)$product->price;
            $totalPrice = $unitPrice * $quantity;
            
            $orderItem = new OrderItem();
            $orderItem->id = self::generateId();
            $orderItem->order_id = $orderId;
            $orderItem->product_id = $params['product_id'];
            $orderItem->item_type = 'product';
            $orderItem->item_name = $product->name;
            $orderItem->quantity = $quantity;
            $orderItem->unit = $product->unit ?: '件';
            $orderItem->unit_price = $unitPrice;
            $orderItem->total_price = $totalPrice;
            $orderItem->final_price = $totalPrice;
            $orderItem->status = 'pending';
            if (!empty($params['remark'])) {
                $orderItem->description = $params['remark'];
            }
            $orderItem->save();
            
            $product->stock -= $quantity;
            $product->save();
            
            $order->final_amount = ($order->final_amount ?? 0) + $totalPrice;
            $order->save();
            
            NotificationLogic::sendOrderItemNotification($orderItem, $order, $storeId);
            
            \think\facade\Db::commit();
            
            return [
                'success' => true,
                'item_id' => $orderItem->id,
                'order_id' => $orderId,
                'total_amount' => $order->final_amount,
                'notification_sent' => true
            ];
            
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return ['error' => '添加失败: ' . $e->getMessage()];
        }
    }

    public static function acceptItem(string $itemId, string $employeeId, string $storeId): array
    {
        $orderItem = OrderItem::where('id', $itemId)
            ->where('item_type', 'product')
            ->find();
        
        if (!$orderItem) {
            return ['error' => '订单项不存在'];
        }
        
        $order = Order::where('id', $orderItem->order_id)
            ->where('store_id', $storeId)
            ->find();
        
        if (!$order) {
            return ['error' => '订单不存在'];
        }
        
        if (!in_array($orderItem->status, ['pending', 'preorder_pending'])) {
            return ['error' => '当前状态不允许接单'];
        }
        
        $orderItem->status = 'processing';
        $orderItem->accepted_by = $employeeId;
        $orderItem->accepted_at = date('Y-m-d H:i:s');
        $orderItem->save();

        // WS通知平板订单项状态变更
        try {
            $tableId = $order['table_id'] ?? '';
            if ($tableId) {
                \app\common\lib\WebSocketNotification::sendOrderItemStatus($tableId, [
                    'item_id' => $itemId,
                    'order_id' => $order['id'],
                    'status' => 'processing',
                    'item_type' => 'product',
                    'table_id' => $tableId,
                ]);
            }
        } catch (\Exception $e) {
            \think\facade\Log::warning('[OrderLogic] acceptItem WS推送失败: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'item_id' => $itemId,
            'status' => 'processing',
            'accepted_at' => $orderItem->accepted_at
        ];
    }

    public static function deliverItem(string $itemId, string $storeId, string $employeeId = ''): array
    {
        $orderItem = OrderItem::where('id', $itemId)
            ->where('item_type', 'product')
            ->find();

        if (!$orderItem) {
            return ['error' => '订单项不存在'];
        }

        $order = Order::where('id', $orderItem->order_id)->where('store_id', $storeId)->find();
        if (!$order) {
            return ['error' => '订单项不属于当前门店'];
        }
        
        if (!in_array($orderItem->status, ['preorder_pending', 'pending', 'processing'])) {
            return ['error' => '当前状态不允许送达'];
        }

        if (in_array($orderItem->status, ['preorder_pending', 'pending'])) {
            $orderItem->status = 'processing';
            $orderItem->accepted_by = $employeeId;
            $orderItem->accepted_at = date('Y-m-d H:i:s');
        }

        $orderItem->status = 'delivered';
        $orderItem->delivered_at = date('Y-m-d H:i:s');
        // 确保 final_price 已设置（兜底：unit_price × quantity）
        if (floatval($orderItem->final_price) <= 0) {
            $orderItem->final_price = round(floatval($orderItem->unit_price) * floatval($orderItem->quantity), 2);
            $orderItem->total_price = $orderItem->final_price;
        }
        $orderItem->save();

        // 同步商品费到主订单
        $deliveredTotal = OrderItem::where('order_id', $order->id)
            ->where('item_type', 'product')
            ->where('status', 'delivered')
            ->sum('final_price');
        $order->product_fee = round(floatval($deliveredTotal), 2);
        $order->save();

        // WS通知平板商品已送达
        try {
            $tableId = $order['table_id'] ?? '';
            if ($tableId) {
                \app\common\lib\WebSocketNotification::sendOrderItemStatus($tableId, [
                    'item_id' => $itemId,
                    'order_id' => $order['id'],
                    'status' => 'delivered',
                    'item_type' => 'product',
                    'table_id' => $tableId,
                ]);
            }
        } catch (\Exception $e) {
            \think\facade\Log::warning('[OrderLogic] deliverItem WS推送失败: ' . $e->getMessage());
        }

        return [
            'success' => true,
            'item_id' => $itemId,
            'status' => 'delivered',
            'delivered_at' => $orderItem->delivered_at
        ];
    }

    public static function createPreOrder(string $orderId, array $items, string $storeId): array
    {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->find();

        if (!$order || $order->status != 'in_progress') {
            return ['error' => '订单不存在或已结束'];
        }

        $preorderGroupId = self::generateId();
        $totalAmount = 0;
        $itemCount = 0;

        // 读取门店预下单处理时限
        $store = \think\facade\Db::name('busi_store')->where('id', $storeId)->find();
        $timeoutMinutes = max(1, intval($store['product_order_timeout'] ?? 5));
        $expiresAt = date('Y-m-d H:i:s', time() + $timeoutMinutes * 60);

        try {
            \think\facade\Db::startTrans();

            foreach ($items as $item) {
                if (empty($item['product_id']) || empty($item['quantity'])) continue;

                $product = \app\common\model\merchant\Product::where('id', $item['product_id'])
                    ->where('store_id', $storeId)
                    ->find();

                if (!$product) continue;

                $quantity = (int)$item['quantity'];
                $unitPrice = (float)$product->price;
                $totalPrice = $unitPrice * $quantity;

                $orderItem = new OrderItem();
                $orderItem->id = self::generateId();
                $orderItem->order_id = $orderId;
                $orderItem->preorder_group_id = $preorderGroupId;
                $orderItem->product_id = $item['product_id'];
                $orderItem->item_type = 'product';
                $orderItem->item_name = $product->name;
                $orderItem->quantity = $quantity;
                $orderItem->unit = $product->unit ?: '份';
                $orderItem->unit_price = $unitPrice;
                $orderItem->total_price = $totalPrice;
                $orderItem->final_price = $totalPrice;
                $orderItem->status = 'preorder_pending';
                $orderItem->expires_at = $expiresAt;
                if (!empty($item['remark'])) {
                    $orderItem->description = $item['remark'];
                }
                $orderItem->save();

                $totalAmount += $totalPrice;
                $itemCount += $quantity;
            }

            if ($itemCount === 0) {
                \think\facade\Db::rollback();
                return ['error' => '商品无效'];
            }

            \think\facade\Db::commit();

            // WS 通知 POS：新点单
            try {
                $table = \app\common\model\merchant\Table::where('id', $order->table_id)->find();
                \app\common\lib\WebSocketNotification::sendToGroup('store_' . $storeId, [
                    'type' => 'new_order_item',
                    'data' => [
                        'order_id'     => $orderId,
                        'table_id'     => $order->table_id ?? '',
                        'table_name'   => $table->name ?? '',
                        'item_count'   => $itemCount,
                        'total_amount' => $totalAmount,
                    ]
                ]);
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] createPreOrder WS推送失败: ' . $e->getMessage());
            }

            return [
                'success' => true,
                'preorder_group_id' => $preorderGroupId,
                'total_amount' => $totalAmount,
                'item_count' => $itemCount
            ];

        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return ['error' => '创建预订单失败: ' . $e->getMessage()];
        }
    }

    public static function confirmPreOrder(string $preorderGroupId, string $employeeId, string $storeId): array
    {
        $items = OrderItem::where('preorder_group_id', $preorderGroupId)
            ->where('status', 'preorder_pending')
            ->select();

        if ($items->isEmpty()) {
            return ['error' => '预订单不存在或状态异常'];
        }

        $orderId = $items[0]->order_id;
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->where('status', 'in_progress')
            ->find();

        if (!$order) {
            return ['error' => '订单不存在或已结束'];
        }

        try {
            \think\facade\Db::startTrans();

            $totalAmount = 0;
            foreach ($items as $item) {
                $item->status = 'pending';
                $item->accepted_by = $employeeId;
                $item->accepted_at = date('Y-m-d H:i:s');
                $item->save();

                \app\common\model\merchant\Product::where('id', $item->product_id)
                    ->dec('stock', $item->quantity)
                    ->update();

                $totalAmount += $item->final_price;
            }

            $order->final_amount = ($order->final_amount ?? 0) + $totalAmount;
            $order->save();

            \think\facade\Db::commit();

            // WS通知平板预订单已确认
            try {
                $tableId = $order['table_id'] ?? '';
                if ($tableId) {
                    \app\common\lib\WebSocketNotification::sendOrderItemStatus($tableId, [
                        'order_id' => $order['id'],
                        'status' => 'confirmed',
                        'item_type' => 'preorder',
                        'table_id' => $tableId,
                        'preorder_group_id' => $preorderGroupId,
                    ]);
                }
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] confirmPreOrder WS推送失败: ' . $e->getMessage());
            }

            return [
                'success' => true,
                'order_id' => $orderId,
                'total_amount' => $totalAmount,
                'item_count' => count($items)
            ];

        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return ['error' => '确认预订单失败: ' . $e->getMessage()];
        }
    }

    public static function rejectPreOrder(string $preorderGroupId): array
    {
        $items = OrderItem::where('preorder_group_id', $preorderGroupId)
            ->where('status', 'preorder_pending')
            ->select();

        if ($items->isEmpty()) {
            return ['error' => '预订单不存在或状态异常'];
        }

        $orderId = $items[0]->order_id;

        try {
            \think\facade\Db::startTrans();

            foreach ($items as $item) {
                $item->delete();
            }

            \think\facade\Db::commit();

            // WS通知平板预订单已被拒绝
            try {
                $order = Order::where('id', $orderId)->find();
                $tableId = $order['table_id'] ?? '';
                if ($tableId) {
                    \app\common\lib\WebSocketNotification::sendToGroup('table_' . $tableId, [
                        'type' => 'preorder_rejected',
                        'data' => [
                            'preorder_group_id' => $preorderGroupId,
                            'reason' => $reason ?? '',
                            'order_id' => $order['id'],
                        ]
                    ]);
                }
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] rejectPreOrder WS推送失败: ' . $e->getMessage());
            }

            return ['success' => true];

        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            return ['error' => '拒绝预订单失败: ' . $e->getMessage()];
        }
    }

    public static function getPreOrders(string $orderId): array
    {
        $items = OrderItem::where('order_id', $orderId)
            ->whereIn('status', ['preorder_pending', 'pending'])
            ->order('created_at', 'asc')
            ->select();

        $groups = [];
        foreach ($items as $item) {
            $gid = $item->preorder_group_id;
            if (!isset($groups[$gid])) {
                $groups[$gid] = [
                    'preorder_group_id' => $gid,
                    'total_amount' => 0,
                    'item_count' => 0,
                    'items' => [],
                    'created_at' => $item->created_at
                ];
            }
            $groups[$gid]['total_amount'] += $item->final_price;
            $groups[$gid]['item_count'] += $item->quantity;
            $groups[$gid]['items'][] = $item->toArray();
        }

        return array_values($groups);
    }

    public static function getPendingPreOrders(string $storeId): array
    {
        $items = OrderItem::alias('oi')
            ->join(Order::getTable() . ' o', 'o.id = oi.order_id')
            ->where('o.store_id', $storeId)
            ->where('oi.item_type', 'product')
            ->where('oi.status', 'preorder_pending')
            ->whereNull('oi.deleted_at')
            ->order('oi.created_at', 'asc')
            ->select();

        $groups = [];
        foreach ($items as $item) {
            $gid = $item->preorder_group_id;
            if (!$gid) continue;
            if (!isset($groups[$gid])) {
                $order = Order::where('id', $item->order_id)->find();
                $table = $order ? Table::where('id', $order->table_id)->find() : null;
                $groups[$gid] = [
                    'preorder_group_id' => $gid,
                    'order_id' => $item->order_id,
                    'table_id' => $order ? $order->table_id : '',
                    'table_name' => $table ? $table->name : '',
                    'total_amount' => 0,
                    'item_count' => 0,
                    'items' => [],
                    'created_at' => $item->created_at,
                ];
            }
            $groups[$gid]['total_amount'] += $item->final_price;
            $groups[$gid]['item_count'] += $item->quantity;
            $groups[$gid]['items'][] = $item->toArray();
        }

        return array_values($groups);
    }

    public static function getPreOrdersByTable(string $tableId, string $storeId): array
    {
        $orderIds = Order::where('table_id', $tableId)
            ->where('store_id', $storeId)
            ->column('id');

        if (empty($orderIds)) {
            return [];
        }

        $items = OrderItem::whereIn('order_id', $orderIds)
            ->whereIn('status', ['preorder_pending', 'pending'])
            ->order('created_at', 'asc')
            ->select();

        $groups = [];
        foreach ($items as $item) {
            $gid = $item->preorder_group_id;
            if (!$gid) continue;
            if (!isset($groups[$gid])) {
                $order = Order::where('id', $item->order_id)->find();
                $groups[$gid] = [
                    'preorder_group_id' => $gid,
                    'order_id' => $item->order_id,
                    'total_amount' => 0,
                    'item_count' => 0,
                    'items' => [],
                    'created_at' => $item->created_at,
                ];
            }
            $groups[$gid]['total_amount'] += $item->final_price;
            $groups[$gid]['item_count'] += $item->quantity;
            $groups[$gid]['items'][] = $item->toArray();
        }

        return array_values($groups);
    }

    public static function getPendingItems(string $storeId): array
    {
        return NotificationLogic::getPendingOrderItems($storeId);
    }

    public static function bookAssistant(string $orderId, string $assistantId, string $storeId, bool $autoStart = false): array
    {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->where('status', 'in_progress')
            ->find();

        if (!$order) {
            return ['error' => '订单不存在或未开台'];
        }

        $assistant = \app\common\model\merchant\Assistant::where('id', $assistantId)
            ->where('store_id', $storeId)
            ->whereIn('status', [0, 1, 2])
            ->whereNull('deleted_at')
            ->find();

        if (!$assistant) {
            return ['error' => '助教不存在或未启用'];
        }

        // 忙检测：只查 in_progress 订单中活跃的助教服务项
        // (delivered 固定时长已完成不算忙，已修复)
        $busyItem = OrderItem::alias('oi')
            ->join(Order::getTable() . ' o', 'oi.order_id = o.id')
            ->where('oi.assistant_id', $assistantId)
            ->where('oi.item_type', 'assistant')
            ->whereIn('oi.status', ['pending', 'processing', 'serving', 'prepay_draft'])
            ->where('o.status', 'in_progress')
            ->find();

        if ($busyItem) {
            // prepay_draft 不可取消
            if ($busyItem->status === 'prepay_draft') {
                return ['error' => '该助教当前正忙'];
            }
            // 同一订单重新预约：取消旧记录
            if ($busyItem->order_id === $orderId) {
                $busyItem->status = 'cancelled';
                $busyItem->save();
            } else {
                return ['error' => '该助教当前正忙'];
            }
        }

        try {
            \think\facade\Db::startTrans();
            $item = new OrderItem();
            $item->id = self::generateId();
            $item->order_id = $orderId;
            $item->assistant_id = $assistantId;
            $item->item_type = 'assistant';
            $item->item_name = $assistant->name;
            $item->quantity = 0;
            $item->unit = '小时';
            $item->unit_price = $assistant->hourly_rate ?? 0;
            $item->total_price = 0;
            $item->final_price = 0;
            $item->status = $autoStart ? 'serving' : 'pending';
            if ($autoStart) {
                $item->started_at = date('Y-m-d H:i:s');
            }
            // 读取门店配置的处理时限
            $store = \think\facade\Db::name('busi_store')->where('id', $order->store_id)->find();
            $timeoutMinutes = max(1, intval($store['assistant_booking_timeout'] ?? 5));
            $item->expires_at = date('Y-m-d H:i:s', time() + $timeoutMinutes * 60);
            $item->save();

            // 更新助教状态为服务中 (status=2)
            \app\common\model\merchant\Assistant::where('id', $assistantId)
                ->update(['status' => 2]);

            \think\facade\Db::commit();

            // WS 通知 POS：助教预约
            try {
                $table = \app\common\model\merchant\Table::where('id', $order->table_id)->find();
                \app\common\lib\WebSocketNotification::sendToGroup('store_' . $storeId, [
                    'type' => 'assistant_apply',
                    'data' => [
                        'order_id'       => $orderId,
                        'table_id'       => $order->table_id ?? '',
                        'table_name'     => $table->name ?? '',
                        'assistant_id'   => $assistantId,
                        'assistant_name' => $assistant->name,
                        'hourly_rate'    => (float)$assistant->hourly_rate,
                        'item_id'        => $item->id,
                    ]
                ]);
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] bookAssistant WS推送失败: ' . $e->getMessage());
            }

            return [
                'item_id' => $item->id,
                'assistant_id' => $assistantId,
                'assistant_name' => $assistant->name,
                'assistant_avatar' => $assistant->avatar ?? '',
                'hourly_rate' => (float)$assistant->hourly_rate,
                'status' => 'pending',
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('预约助教失败: ' . $e->getMessage());
            return ['error' => '预约失败: ' . $e->getMessage()];
        }
    }

    /**
     * 买断助教（固定时长后付）— 直接 delivered，不走预约流程
     */
    public static function buyoutAssistant(string $orderId, string $assistantId, float $buyoutHours, string $payMode, string $storeId): array
    {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->where('status', 'in_progress')
            ->find();
        if (!$order) return ['error' => '订单不存在或未开台'];

        $assistant = \app\common\model\merchant\Assistant::where('id', $assistantId)
            ->where('store_id', $storeId)
            ->whereIn('status', [0, 1, 2])
            ->whereNull('deleted_at')
            ->find();
        if (!$assistant) return ['error' => '助教不存在或未启用'];

        // 忙检测：只查 in_progress 订单中活跃的助教服务项
        $busyItem = OrderItem::alias('oi')
            ->join(Order::getTable() . ' o', 'oi.order_id = o.id')
            ->where('oi.assistant_id', $assistantId)
            ->where('oi.item_type', 'assistant')
            ->whereIn('oi.status', ['pending', 'processing', 'serving', 'prepay_draft'])
            ->where('o.status', 'in_progress')
            ->find();
        if ($busyItem && $busyItem->order_id !== $orderId) {
            return ['error' => '该助教当前正忙'];
        }

        $unitPrice = floatval($assistant->hourly_rate ?? 0);
        $amount = round($unitPrice * $buyoutHours, 2);

        try {
            \think\facade\Db::startTrans();

            $item = new OrderItem();
            $item->id = self::generateId();
            $item->order_id = $orderId;
            $item->assistant_id = $assistantId;
            $item->item_type = 'assistant';
            $item->item_name = $assistant->name;
            $item->quantity = $buyoutHours;
            $item->unit = '小时';
            $item->unit_price = $unitPrice;
            $item->total_price = $amount;
            $item->final_price = $amount;
            $item->billing_mode = 'flat_rate';
            $item->pay_mode = $payMode;
            $item->is_paid = 0;
            $item->status = 'delivered';
            $item->delivered_at = date('Y-m-d H:i:s');
            $item->save();

            $order->assistant_fee = round(floatval($order->assistant_fee) + $amount, 2);
            $order->save();

            \think\facade\Db::commit();

            return [
                'item_id' => $item->id,
                'assistant_id' => $assistantId,
                'assistant_name' => $assistant->name,
                'hourly_rate' => $unitPrice,
                'amount' => $amount,
                'status' => 'delivered',
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('买断助教失败: ' . $e->getMessage());
            return ['error' => '下单失败: ' . $e->getMessage()];
        }
    }

    public static function acceptAssistant(string $itemId, string $storeId): array
    {
        $item = OrderItem::where('id', $itemId)
            ->where('item_type', 'assistant')
            ->where('status', 'pending')
            ->find();

        if (!$item) {
            return ['error' => '预约不存在或状态异常'];
        }

        $order = Order::where('id', $item->order_id)
            ->where('store_id', $storeId)
            ->find();

        if (!$order) {
            return ['error' => '主订单不存在'];
        }

        try {
            \think\facade\Db::startTrans();

            $item->status = 'processing';
            $item->save();

            \think\facade\Db::commit();

            // WS通知平板助教已接单
            try {
                $tableId = $order['table_id'] ?? '';
                if ($tableId) {
                    \app\common\lib\WebSocketNotification::sendOrderItemStatus($tableId, [
                        'item_id' => $itemId,
                        'order_id' => $order['id'],
                        'status' => 'processing',
                        'item_type' => 'assistant',
                        'table_id' => $tableId,
                    ]);
                }
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] acceptAssistant WS推送失败: ' . $e->getMessage());
            }

            return [
                'item_id' => $item->id,
                'status' => 'processing',
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('确认助教接单失败: ' . $e->getMessage());
            return ['error' => '确认失败'];
        }
    }

    public static function startAssistantService(string $itemId, string $storeId): array
    {
        $item = OrderItem::where('id', $itemId)
            ->where('item_type', 'assistant')
            ->whereIn('status', ['pending', 'processing'])
            ->find();

        if (!$item) {
            return ['error' => '预约不存在或状态异常'];
        }

        $order = Order::where('id', $item->order_id)
            ->where('store_id', $storeId)
            ->find();

        if (!$order) {
            return ['error' => '主订单不存在'];
        }

        try {
            \think\facade\Db::startTrans();

            // 从 pending 直接开始服务时，记录接单时间
            if ($item->status === 'pending') {
                $item->accepted_at = date('Y-m-d H:i:s');
            }
            $item->status = 'serving';
            $item->started_at = date('Y-m-d H:i:s');
            $item->save();

            // 更新助教状态为服务中 (status=2)
            if (!empty($item->assistant_id)) {
                \app\common\model\merchant\Assistant::where('id', $item->assistant_id)
                    ->update(['status' => 2]);
            }

            \think\facade\Db::commit();

            // WS通知平板助教开始服务
            try {
                $tableId = $order['table_id'] ?? '';
                if ($tableId) {
                    \app\common\lib\WebSocketNotification::sendOrderItemStatus($tableId, [
                        'item_id' => $itemId,
                        'order_id' => $order['id'],
                        'status' => 'serving',
                        'item_type' => 'assistant',
                        'table_id' => $tableId,
                    ]);
                }
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] startAssistantService WS推送失败: ' . $e->getMessage());
            }

            return [
                'item_id' => $item->id,
                'status' => 'serving',
                'started_at' => $item->started_at,
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('开始助教服务失败: ' . $e->getMessage());
            return ['error' => '操作失败'];
        }
    }

    public static function endAssistantService(string $itemId, string $storeId): array
    {
        $item = OrderItem::where('id', $itemId)
            ->where('item_type', 'assistant')
            ->where('status', 'serving')
            ->find();

        if (!$item) {
            return ['error' => '服务不存在或状态异常'];
        }

        $order = Order::where('id', $item->order_id)
            ->where('store_id', $storeId)
            ->find();

        if (!$order) {
            return ['error' => '主订单不存在'];
        }

        try {
            \think\facade\Db::startTrans();

            $now = date('Y-m-d H:i:s');
            $startTimestamp = strtotime($item->started_at);
            $endTimestamp = strtotime($now);
            $actualMinutes = (int) max(1, round(($endTimestamp - $startTimestamp) / 60));
            $actualHours = round($actualMinutes / 60, 2);

            // Get assistant billing_rule
            $billingRule = 'half_hour';
            if (!empty($item->assistant_id)) {
                $assistant = \app\common\model\merchant\Assistant::where('id', $item->assistant_id)
                    ->whereNull('deleted_at')
                    ->find();
                if ($assistant) {
                    $billingRule = $assistant['billing_rule'] ?? 'half_hour';
                }
            }

            $unitPrice = (float)$item->unit_price;
            $totalPrice = \app\storeapi\logic\assistant\AssistantLogic::calculateFee($unitPrice, $actualMinutes, $billingRule);

            $item->status = 'completed';
            $item->ended_at = $now;
            $item->actual_quantity = $actualHours;
            $item->quantity = $actualHours;
            $item->total_price = $totalPrice;
            $item->final_price = $totalPrice;
            $item->save();

            // 同步助教费到主订单
            $assistantTotal = OrderItem::where('order_id', $order->id)
                ->where('item_type', 'assistant')
                ->where('status', 'completed')
                ->sum('final_price');
            $order->assistant_fee = round(floatval($assistantTotal), 2);
            $order->final_amount = bcadd((string)$order->final_amount, (string)$totalPrice, 2);
            $order->save();

            // Release assistant: busy → available
            if (!empty($item->assistant_id)) {
                \app\common\model\merchant\Assistant::where('id', $item->assistant_id)
                    ->update(['status' => 1]);
            }

            \think\facade\Db::commit();

            // WS通知平板助教服务结束
            try {
                $tableId = $order['table_id'] ?? '';
                if ($tableId) {
                    \app\common\lib\WebSocketNotification::sendOrderItemStatus($tableId, [
                        'item_id' => $itemId,
                        'order_id' => $order['id'],
                        'status' => 'completed',
                        'item_type' => 'assistant',
                        'table_id' => $tableId,
                    ]);
                }
            } catch (\Exception $e) {
                \think\facade\Log::warning('[OrderLogic] endAssistantService WS推送失败: ' . $e->getMessage());
            }

            return [
                'item_id' => $item->id,
                'status' => 'completed',
                'actual_duration' => $actualHours,
                'total_amount' => $totalPrice,
                'ended_at' => $now,
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('结束助教服务失败: ' . $e->getMessage());
            return ['error' => '操作失败'];
        }
    }

    public static function cancelAssistant(string $itemId, string $storeId): array
    {
        $item = OrderItem::where('id', $itemId)
            ->where('item_type', 'assistant')
            ->whereIn('status', ['pending', 'processing'])
            ->find();

        if (!$item) {
            return ['error' => '预约不存在或状态不允许取消'];
        }

        try {
            \think\facade\Db::startTrans();

            $item->status = 'cancelled';
            $item->save();

            // Release assistant: make available again
            if (!empty($item->assistant_id)) {
                \app\common\model\merchant\Assistant::where('id', $item->assistant_id)
                    ->update(['status' => 1]);
            }

            \think\facade\Db::commit();

            return [
                'item_id' => $item->id,
                'status' => 'cancelled',
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('取消助教预约失败: ' . $e->getMessage());
            return ['error' => '操作失败'];
        }
    }

    public static function getPendingDeliveries(string $storeId): array
    {
        $items = OrderItem::alias('oi')
            ->join(Order::getTable() . ' o', 'o.id = oi.order_id')
            ->where('o.store_id', $storeId)
            ->where('oi.item_type', 'product')
            ->whereIn('oi.status', ['pending', 'processing', 'preorder_pending'])
            ->where(function ($query) { $query->whereNull('oi.expires_at')->whereOr('oi.expires_at', '>', date('Y-m-d H:i:s')); })
            ->field('oi.*')
            ->order('oi.created_at', 'asc')
            ->select();

        $zoneCache = [];
        $getZoneName = function($zoneId) use ($storeId, &$zoneCache) {
            if (empty($zoneId)) return '';
            if (!isset($zoneCache[$zoneId])) {
                $zone = Zone::where('id', $zoneId)->where('store_id', $storeId)->find();
                $zoneCache[$zoneId] = $zone ? $zone->name : '';
            }
            return $zoneCache[$zoneId];
        };

        $grouped = [];
        foreach ($items as $item) {
            $order = Order::where('id', $item->order_id)->find();
            $table = $order ? Table::where('id', $order->table_id)->find() : null;
            $tableId = $order ? $order->table_id : '';
            $tableName = $table ? $table->name : '';
            $zoneName = $table ? $getZoneName($table->zone_id) : '';

            if (!isset($grouped[$tableId])) {
                $grouped[$tableId] = [
                    'table_id' => $tableId,
                    'table_name' => $tableName,
                    'zone_name' => $zoneName,
                    'order_id' => $item->order_id,
                    'items' => [],
                ];
            }
            $grouped[$tableId]['items'][] = [
                'item_id' => $item->id,
                'item_name' => $item->item_name,
                'quantity' => (float)$item->quantity,
                'unit_price' => (float)$item->unit_price,
                'total_price' => (float)$item->total_price,
                'final_price' => (float)$item->final_price,
                'status' => $item->status,
                'created_at' => $item->created_at,
                'expires_at' => $item->expires_at ?? null,
            ];
        }

        return array_values($grouped);
    }

    public static function getPendingAssistantBookings(string $storeId): array
    {
        $items = OrderItem::alias('oi')
            ->join(Order::getTable() . ' o', 'o.id = oi.order_id')
            ->field('oi.*')
            ->where('o.store_id', $storeId)
            ->where('oi.item_type', 'assistant')
            ->whereIn('oi.status', ['pending'])
            ->where(function ($query) { $query->whereNull('oi.expires_at')->whereOr('oi.expires_at', '>', date('Y-m-d H:i:s')); })
            ->order('oi.created_at', 'asc')
            ->select();

        $zoneCache = [];
        $getZoneName = function($zoneId) use ($storeId, &$zoneCache) {
            if (empty($zoneId)) return '';
            if (!isset($zoneCache[$zoneId])) {
                $zone = Zone::where('id', $zoneId)->where('store_id', $storeId)->find();
                $zoneCache[$zoneId] = $zone ? $zone->name : '';
            }
            return $zoneCache[$zoneId];
        };

        $result = [];
        foreach ($items as $item) {
            $order = Order::where('id', $item->order_id)->find();
            $table = $order ? Table::where('id', $order->table_id)->find() : null;
            $zoneName = $table ? $getZoneName($table->zone_id) : '';
            $result[] = [
                'item_id' => $item->id,
                'order_id' => $item->order_id,
                'table_id' => $order ? $order->table_id : '',
                'table_name' => $table ? $table->name : '',
                'zone_name' => $zoneName,
                'assistant_id' => $item->assistant_id,
                'assistant_name' => $item->item_name,
                'hourly_rate' => (float)$item->unit_price,
                'status' => $item->status,
                'created_at' => $item->created_at,
                'expires_at' => $item->expires_at ?? null,
            ];
        }

        return $result;
    }

    private static function generateId(): string
    {
        return bin2hex(random_bytes(16));
    }

    public static function quickCreateOrder(array $data, string $storeId): array
    {
        $items = $data['items'] ?? [];
        if (empty($items)) {
            return ['error' => '商品列表不能为空'];
        }

        $orderNo = 'DD' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        $orderId = self::generateId();

        \think\facade\Db::startTrans();
        try {
            $totalAmount = 0;
            $itemCount = 0;

            foreach ($items as $item) {
                $productId = $item['product_id'] ?? '';
                $quantity = (float)($item['quantity'] ?? 1);

                if (empty($productId) || $quantity <= 0) {
                    \think\facade\Db::rollback();
                    return ['error' => '商品参数错误'];
                }

                $product = Product::where('id', $productId)
                    ->where('store_id', $storeId)
                    ->find();

                if (!$product || $product->status != 1) {
                    \think\facade\Db::rollback();
                    return ['error' => '商品不存在: ' . $productId];
                }

                if ($product->stock < $quantity) {
                    \think\facade\Db::rollback();
                    return ['error' => '商品库存不足: ' . $product->name];
                }

                $unitPrice = (float)$product->price;
                $totalPrice = round($unitPrice * $quantity, 2);
                $finalPrice = $totalPrice;

                $totalAmount += $finalPrice;

                $orderItemId = self::generateId();
                $orderItem = new OrderItem();
                $orderItem->id = $orderItemId;
                $orderItem->order_id = $orderId;
                $orderItem->product_id = $productId;
                $orderItem->item_type = 'product';
                $orderItem->item_name = $product->name;
                $orderItem->quantity = $quantity;
                $orderItem->unit = $product->unit ?? '份';
                $orderItem->unit_price = $unitPrice;
                $orderItem->total_price = $totalPrice;
                $orderItem->final_price = $finalPrice;
                $orderItem->status = 'delivered'; // 快购直售，无需确认送达
                $orderItem->store_id = $storeId;
                $orderItem->save();

                $product->stock -= $quantity;
                $product->save();
                $itemCount++;
            }

            $order = new Order();
            $order->id = $orderId;
            $order->store_id = $storeId;
            $order->order_no = $orderNo;
            $order->type = 'quick_order';
            $order->status = 'in_progress';
            $order->table_id = '';
            $order->original_amount = $totalAmount;
            $order->final_amount = $totalAmount;
            $order->payment_status = 'unpaid';
            $order->start_time = date('Y-m-d H:i:s');
            $order->save();

            \think\facade\Db::commit();

            return [
                'order_id' => $orderId,
                'order_no' => $orderNo,
                'total_amount' => $totalAmount,
                'item_count' => $itemCount,
            ];
        } catch (\Exception $e) {
            \think\facade\Db::rollback();
            \think\facade\Log::error('quickCreateOrder error: ' . $e->getMessage());
            return ['error' => '下单失败: ' . $e->getMessage()];
        }
    }
}