<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantOrder;
use app\common\model\merchant\CommissionRecord;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use think\facade\Db;
use Exception;

class AssistantOrderLogic extends BaseLogic
{
    public static function getPendingOrders($assistantId, $storeId)
    {
        try {
            $items = OrderItem::alias('oi')
                ->join('busi_order o', 'o.id = oi.order_id')
                ->where('o.store_id', $storeId)
                ->where('oi.assistant_id', $assistantId)
                ->where('oi.item_type', 'assistant')
                ->where('oi.status', 'pending')
                ->where(function ($q) {
                    $q->whereNull('oi.expires_at')->whereOr('oi.expires_at', '>', date('Y-m-d H:i:s'));
                })
                ->field('oi.*, o.table_id')
                ->order('oi.created_at', 'desc')
                ->select();

            $result = [];
            foreach ($items as $item) {
                $table = Table::find($item['table_id']);
                $result[] = [
                    'id' => $item['id'],
                    'order_id' => $item['order_id'],
                    'order_no' => '',
                    'table_id' => $item['table_id'] ?? '',
                    'table_no' => $table ? $table['name'] : '',
                    'table_name' => $table ? $table['name'] : '',
                    'student_name' => '',
                    'price' => (float)($item['unit_price'] ?? 0),
                    'total_amount' => (float)($item['unit_price'] ?? 0),
                    'status' => 'pending',
                    'created_at' => $item['created_at'],
                    'expires_at' => $item['expires_at'] ?? null,
                ];
            }
            return $result;
        } catch (Exception $e) {
            return [];
        }
    }

    public static function getActiveOrder($employeeId)
    {
        try {
            $assistant = Assistant::where('employee_id', $employeeId)->find();
            if (!$assistant) {
                return null;
            }
            
            $order = AssistantOrder::where('assistant_id', $assistant['id'])
                ->whereIn('status', ['accepted', 'in_progress'])
                ->order('created_at', 'desc')
                ->find();

            if (!$order) {
                return null;
            }

            $startTime = strtotime($order['start_time']);
            $duration = $startTime ? (time() - $startTime) : 0;

            return [
                'id' => $order['id'],
                'order_no' => $order['order_no'],
                'customer_name' => $order['student_name'] ?? '匿名客户',
                'customer_phone' => $order['student_phone'] ?? '',
                'table_id' => $order['table_id'] ?? '',
                'table_name' => self::getTableName($order['table_id'] ?? ''),
                'assistant_id' => $order['assistant_id'],
                'assistant_name' => '',
                'start_time' => $order['start_time'],
                'end_time' => '',
                'duration' => $duration,
                'price' => $order['total_amount'] ?? 0,
                'total_amount' => $order['total_amount'] ?? 0,
                'status' => $order['status'],
                'remark' => $order['remark'] ?? '',
                'created_at' => $order['created_at'],
            ];
        } catch (Exception $e) {
            return ['data' => [], 'order' => null];
        }
    }

    public static function acceptOrder($params)
    {
        try {
            $orderId = $params['order_id'] ?? $params['id'] ?? '';
            $employeeId = $params['employee_id'];

            $order = AssistantOrder::find($orderId);
            if (!$order) {
                self::setError('订单不存在');
                return false;
            }

            if (!empty($order['assistant_id'])) {
                self::setError('该订单已被其他助教接单');
                return false;
            }

            $assistant = Assistant::where('employee_id', $employeeId)->find();
            if (!$assistant) {
                self::setError('当前用户不是助教');
                return false;
            }

            $order->assistant_id = $assistant['id'];
            $order->status = 'accepted';
            $order->save();

            return true;
        } catch (Exception $e) {
            return self::setError('操作失败：' . $e->getMessage());
        }
    }

    public static function startOrder($params)
    {
        $orderId = $params['order_id'] ?? $params['id'] ?? '';

        // New flow: try OrderItem first (tablet booking via OrderItem+Order)
        $item = OrderItem::find($orderId);
        if ($item && in_array($item['status'], ['processing', 'accepted'])) {
            try {
                Db::startTrans();
                $now = date('Y-m-d H:i:s');

                // Get parent Order for store_id / table_id context
                $parentOrder = Order::find($item['order_id']);
                $storeId = $parentOrder ? $parentOrder['store_id'] : '';
                $tableId = $parentOrder ? $parentOrder['table_id'] : '';
                $assistantId = $item['assistant_id'];

                if (empty($assistantId)) {
                    Db::rollback();
                    self::setError('订单未分配助教');
                    return false;
                }

                // Create new main Order for assistant service billing
                $orderNo = 'AO' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
                $mainOrder = new Order();
                $mainOrder->id = 'o_' . bin2hex(random_bytes(8));
                $mainOrder->store_id = $storeId;
                $mainOrder->order_no = $orderNo;
                $mainOrder->type = 'assistant';
                $mainOrder->status = 'in_progress';
                $mainOrder->table_id = $tableId;
                $mainOrder->assistant_id = $assistantId;
                $mainOrder->member_id = $parentOrder['member_id'] ?? '';
                $mainOrder->start_time = $now;
                $mainOrder->duration_minutes = 0;
                $mainOrder->table_fee = 0;
                $mainOrder->product_fee = 0;
                $mainOrder->assistant_fee = (float)($item['total_price'] ?? 0);
                $mainOrder->discount_fee = 0;
                $mainOrder->total_fee = $mainOrder->assistant_fee;
                $mainOrder->original_amount = $mainOrder->total_fee;
                $mainOrder->discount_amount = 0;
                $mainOrder->final_amount = $mainOrder->total_fee;
                $mainOrder->operator_id = $assistantId;
                $mainOrder->remark = $item['description'] ?? '';
                $mainOrder->save();

                // Update OrderItem — link to new main order and mark as serving
                $item->status = 'serving';
                $item->started_at = $now;
                $item->order_id = $mainOrder['id'];
                $item->save();

                // Update assistant status to serving (2)
                Assistant::where('id', $assistantId)->update(['status' => 2]);

                // Update table to occupied
                if (!empty($tableId)) {
                    $table = Table::find($tableId);
                    if ($table) {
                        $table->status = 'occupied';
                        $table->save();
                    }
                }

                // Sync legacy AssistantOrder if one exists (backward compat)
                $legacyOrder = AssistantOrder::where('order_id', $parentOrder['id'])->find();
                if ($legacyOrder) {
                    $legacyOrder->status = 'in_progress';
                    $legacyOrder->start_time = $now;
                    $legacyOrder->order_id = $mainOrder['id'];
                    $legacyOrder->save();
                }

                Db::commit();

                return [
                    'assistant_order_id' => $orderId,
                    'main_order_id' => $mainOrder['id'],
                    'order_no' => $mainOrder['order_no'],
                    'start_time' => $now,
                    'total_amount' => (float)($item['total_price'] ?? 0)
                ];
            } catch (\Exception $e) {
                Db::rollback();
                self::setError('开始服务失败: ' . $e->getMessage());
                return false;
            }
        }

        // Fallback: legacy AssistantOrder
        $assistantOrder = AssistantOrder::find($orderId);
        if (!$assistantOrder) {
            self::setError('订单不存在');
            return false;
        }

        if ($assistantOrder['status'] != 'accepted') {
            self::setError('订单状态不允许开始服务');
            return false;
        }

        try {
            Db::startTrans();

            $now = date('Y-m-d H:i:s');

            // 1. 创建主订单
            $orderNo = 'AO' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
            $mainOrder = new Order();
            $mainOrder->id = 'o_' . bin2hex(random_bytes(8));
            $mainOrder->store_id = $assistantOrder['store_id'];
            $mainOrder->order_no = $orderNo;
            $mainOrder->type = 'assistant';
            $mainOrder->status = 'in_progress';
            $mainOrder->table_id = $assistantOrder['table_id'];
            $mainOrder->assistant_id = $assistantOrder['assistant_id'];
            $mainOrder->member_id = $assistantOrder['member_id'] ?? '';
            $mainOrder->start_time = $now;
            $mainOrder->duration_minutes = 0;
            $mainOrder->table_fee = 0;
            $mainOrder->product_fee = 0;
            $mainOrder->assistant_fee = $assistantOrder['total_amount'] ?? 0;
            $mainOrder->discount_fee = 0;
            $mainOrder->total_fee = $mainOrder->assistant_fee;
            $mainOrder->original_amount = $mainOrder->total_fee;
            $mainOrder->discount_amount = 0;
            $mainOrder->final_amount = $mainOrder->total_fee;
            $mainOrder->operator_id = $assistantOrder['assistant_id'];
            $mainOrder->remark = $assistantOrder['remark'] ?? '';
            $mainOrder->save();

            // 2. 创建订单明细
            $orderItem = new OrderItem();
            $orderItem->id = 'oi_' . bin2hex(random_bytes(8));
            $orderItem->order_id = $mainOrder['id'];
            $orderItem->item_type = 'assistant';
            $orderItem->assistant_id = $assistantOrder['assistant_id'];
            $orderItem->item_name = self::getServiceTypeName($assistantOrder['type']);
            $orderItem->quantity = $assistantOrder['duration'] ?? 1;
            $orderItem->unit = '小时';
            $orderItem->unit_price = $assistantOrder['unit_price'] ?? 0;
            $orderItem->total_price = $assistantOrder['total_amount'] ?? 0;
            $orderItem->discount_rate = 100.00;
            $orderItem->final_price = $orderItem->total_price;
            $orderItem->description = $assistantOrder['student_name'] . ' - ' . ($assistantOrder['student_phone'] ?? '');
            $orderItem->save();

            // 3. 更新助教预约订单
            $assistantOrder->status = 'in_progress';
            $assistantOrder->start_time = $now;
            $assistantOrder->order_id = $mainOrder['id'];
            $assistantOrder->save();

            // 3.5 更新助教状态为服务中
            Assistant::where('id', $assistantOrder['assistant_id'])->update(['status' => 2]);

            // 4. 更新桌台状态
            $table = Table::find($assistantOrder['table_id']);
            if ($table) {
                $table->status = 'occupied';
                $table->save();
            }

            Db::commit();

            // 返回订单信息
            return [
                'assistant_order_id' => $assistantOrder['id'],
                'main_order_id' => $mainOrder['id'],
                'order_no' => $mainOrder['order_no'],
                'start_time' => $now,
                'total_amount' => $assistantOrder['total_amount']
            ];
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('开始服务失败: ' . $e->getMessage());
            return false;
        }
    }

    public static function rejectOrder($params)
    {
        try {
            $orderId = $params['order_id'] ?? $params['id'] ?? '';

            // New flow: try OrderItem first (tablet booking)
            $item = OrderItem::find($orderId);
            if ($item) {
                if (!in_array($item['status'], ['pending', 'processing'])) {
                    self::setError('订单状态不允许拒绝');
                    return false;
                }
                $item->status = 'cancelled';
                $item->rejected_at = date('Y-m-d H:i:s');
                $item->reject_reason = $params['reason'] ?? '';
                $item->save();
                return true;
            }

            // Fallback: legacy AssistantOrder
            $order = AssistantOrder::find($orderId);
            if (!$order) {
                self::setError('订单不存在');
                return false;
            }

            if ($order['status'] != 'pending') {
                self::setError('订单状态不允许拒绝');
                return false;
            }

            $order->status = 'cancelled';
            $order->remark = $params['reason'] ?? '';
            $order->save();

            return true;
        } catch (Exception $e) {
            return self::setError('操作失败：' . $e->getMessage());
        }
    }

    public static function completeOrder($params)
    {
        $orderId = $params['order_id'] ?? $params['id'] ?? '';

        // New flow: try Order (main order) first — created by startOrder
        $mainOrder = Order::find($orderId);
        if ($mainOrder && $mainOrder['type'] === 'assistant' && $mainOrder['status'] === 'in_progress') {
            try {
                Db::startTrans();
                $now = date('Y-m-d H:i:s');
                $startTime = $mainOrder['start_time'];

                // Calculate actual duration
                $actualDuration = 0;
                $durationMinutes = 0;
                if ($startTime) {
                    $startTimestamp = strtotime($startTime);
                    $endTimestamp = strtotime($now);
                    $actualDuration = round(($endTimestamp - $startTimestamp) / 3600, 1);
                    $durationMinutes = round(($endTimestamp - $startTimestamp) / 60);
                }

                // Find related OrderItem for unit price
                $orderItem = OrderItem::where('order_id', $orderId)
                    ->where('item_type', 'assistant')
                    ->where('status', 'serving')
                    ->find();

                $unitPrice = $orderItem ? (float)($orderItem['unit_price'] ?? 0) : 0;
                $actualAmount = $actualDuration * $unitPrice;

                // POS 同款逻辑：只结束助教服务，不动主订单和桌台
                // Update only the OrderItem — main order stays in_progress for table time
                if ($orderItem) {
                    $orderItem->status = 'completed';
                    $orderItem->ended_at = $now;
                    $orderItem->actual_quantity = $actualDuration;
                    $orderItem->final_price = $actualAmount;
                    $orderItem->save();
                }

                // Update main order's assistant_fee (accumulated, for checkout later)
                $mainOrder->assistant_fee = (float)($mainOrder->assistant_fee ?? 0) + $actualAmount;
                $mainOrder->save();

                // Restore assistant to idle — only this assistant is freed
                if (!empty($mainOrder['assistant_id'])) {
                    Assistant::where('id', $mainOrder['assistant_id'])->update(['status' => 1]);
                }

                // Sync legacy AssistantOrder if exists (backward compat)
                $legacyOrder = AssistantOrder::where('order_id', $orderId)->find();
                if ($legacyOrder) {
                    $legacyOrder->status = 'completed';
                    $legacyOrder->end_time = $now;
                    $legacyOrder->actual_duration = $actualDuration;
                    $legacyOrder->actual_amount = $actualAmount;
                    $legacyOrder->completed_at = $now;
                    $legacyOrder->save();
                }

                Db::commit();

                return [
                    'assistant_order_id' => $orderItem ? $orderItem['id'] : '',
                    'main_order_id' => $orderId,
                    'end_time' => $now,
                    'actual_duration' => $actualDuration,
                    'actual_amount' => $actualAmount
                ];
            } catch (\Exception $e) {
                Db::rollback();
                self::setError('结束服务失败: ' . $e->getMessage());
                return false;
            }
        }

        // Fallback: legacy AssistantOrder
        // Try direct lookup first, then by linked main order ID
        $assistantOrder = AssistantOrder::find($orderId);
        if (!$assistantOrder) {
            $assistantOrder = AssistantOrder::where('order_id', $orderId)->find();
        }

        if (!$assistantOrder) {
            self::setError('订单不存在');
            return false;
        }

        if (!in_array($assistantOrder['status'], ['in_progress', 'accepted'])) {
            self::setError('订单状态不允许结束服务');
            return false;
        }

        try {
            Db::startTrans();

            $now = date('Y-m-d H:i:s');
            $startTime = $assistantOrder['start_time'];

            // 计算实际时长
            $actualDuration = 0;
            $durationMinutes = 0;
            if ($startTime) {
                $startTimestamp = strtotime($startTime);
                $endTimestamp = strtotime($now);
                $actualDuration = round(($endTimestamp - $startTimestamp) / 3600, 1);
                $durationMinutes = round(($endTimestamp - $startTimestamp) / 60);
            }

            // 计算实际金额
            $unitPrice = $assistantOrder['unit_price'] ?? 0;
            $actualAmount = $actualDuration * $unitPrice;

            // POS 同款：只结束助教服务，不动主订单状态和桌台
            if (!empty($assistantOrder['order_id'])) {
                $mainOrder = Order::find($assistantOrder['order_id']);
                if ($mainOrder) {
                    $mainOrder->assistant_fee = (float)($mainOrder->assistant_fee ?? 0) + $actualAmount;
                    $mainOrder->save();
                }
            }

            // 更新助教订单
            $assistantOrder->status = 'completed';
            $assistantOrder->end_time = $now;
            $assistantOrder->actual_duration = $actualDuration;
            $assistantOrder->actual_amount = $actualAmount;
            $assistantOrder->completed_at = $now;
            $assistantOrder->save();

            // 恢复助教状态为空闲
            Assistant::where('id', $assistantOrder['assistant_id'])->update(['status' => 1]);

            Db::commit();

            return [
                'assistant_order_id' => $assistantOrder['id'],
                'main_order_id' => $assistantOrder['order_id'],
                'end_time' => $now,
                'actual_duration' => $actualDuration,
                'actual_amount' => $actualAmount
            ];
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('结束服务失败: ' . $e->getMessage());
            return false;
        }
    }

    public static function createOrder($params, $storeId)
    {
        $orderNo = 'AST' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

        try {
            $order = new AssistantOrder();
            $order->id = 'ao_' . bin2hex(random_bytes(8));
            $order->order_no = $orderNo;
            $order->store_id = $storeId;
            $order->table_id = $params['table_id'] ?? '';
            $order->assistant_id = '';
            $order->member_id = $params['member_id'] ?? '';
            $order->student_name = $params['student_name'] ?? '';
            $order->student_phone = $params['student_phone'] ?? '';
            $order->type = $params['service_type'] ?? 'one_on_one';
            $order->duration = $params['duration'] ?? 1.0;
            $order->unit_price = $params['unit_price'] ?? 0;
            $order->total_amount = ($params['duration'] ?? 1.0) * ($params['unit_price'] ?? 0);
            $order->status = 'pending';
            $order->remark = $params['remark'] ?? '';
            $order->save();

            return $order->toArray();
        } catch (\Exception $e) {
            self::setError('创建订单失败: ' . $e->getMessage());
            return false;
        }
    }

    public static function getHistory($employeeId, $page = 1, $pageSize = 20)
    {
        try {
            $assistant = Assistant::where('employee_id', $employeeId)->find();
            if (!$assistant) {
                return [
                    'lists' => [],
                    'count' => 0,
                    'page_no' => $page,
                    'page_size' => $pageSize,
                ];
            }
            
            $list = AssistantOrder::where('assistant_id', $assistant['id'])
                ->whereIn('status', ['completed', 'cancelled'])
                ->order('created_at', 'desc')
                ->paginate($pageSize, false, ['page' => $page]);

            return [
                'lists' => $list->items(),
                'count' => $list->total(),
                'page_no' => $page,
                'page_size' => $pageSize,
            ];
        } catch (Exception $e) {
            return ['data' => [], 'pagination' => ['page' => $page, 'page_size' => $pageSize, 'total' => 0, 'total_pages' => 0]];
        }
    }

    /**
     * 助教服务子订单记录（OrderItem），而非主订单
     */
    public static function getRecords($params)
    {
        try {
            $employeeId = $params['employee_id'];
            $storeId = $params['store_id'];
            $page = (int)($params['page_no'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);
            $startDate = $params['start_date'] ?? '';
            $endDate = $params['end_date'] ?? '';

            $assistant = Assistant::where('employee_id', $employeeId)->find();
            if (!$assistant) {
                return ['list' => [], 'count' => 0, 'page_no' => $page, 'page_size' => $pageSize];
            }
            $aid = $assistant['id'];

            $query = OrderItem::alias('oi')
                ->join('busi_order o', 'o.id = oi.order_id')
                ->where('o.store_id', $storeId)
                ->where('oi.item_type', 'assistant')
                ->where('oi.assistant_id', $aid)
                ->whereIn('oi.status', ['completed', 'serving'])
                ->field('oi.*, o.order_no, o.table_id, o.start_time as order_start_time, o.end_time as order_end_time, o.duration_minutes as order_duration');

            if (!empty($startDate)) $query->where('oi.created_at', '>=', $startDate . ' 00:00:00');
            if (!empty($endDate)) $query->where('oi.created_at', '<=', $endDate . ' 23:59:59');

            $totalCount = $query->count();
            $items = $query->order('oi.created_at', 'desc')->page($page, $pageSize)->select();

            $result = [];
            foreach ($items as $item) {
                $table = Table::find($item['table_id']);
                $commRecord = CommissionRecord::where('order_item_id', $item['id'])->find();
                $commissionAmount = $commRecord ? (float)($commRecord['commission_amount'] ?? 0) : 0;
                // 时长统一用 Order.duration_minutes，与 stats 同源
                $duration = (int)($item['order_duration'] ?? 0);

                $result[] = [
                    'id' => $item['id'],
                    'order_no' => $item['order_no'] ?? '',
                    'table_no' => $table ? $table['name'] : '',
                    'start_time' => $item['order_start_time'] ?? $item['started_at'] ?? '',
                    'end_time' => $item['order_end_time'] ?? $item['ended_at'] ?? '',
                    'duration_minutes' => $duration,
                    'assistant_fee' => (float)($item['final_price'] ?? $item['total_price'] ?? 0),
                    'commission_amount' => $commissionAmount,
                    'status' => $item['status'] === 'serving' ? 'in_progress' : 'completed',
                    'order_id' => $item['order_id'],
                    'created_at' => $item['created_at'] ?? '',
                ];
            }

            return ['list' => $result, 'count' => $totalCount, 'page_no' => $page, 'page_size' => $pageSize];
        } catch (Exception $e) {
            return ['list' => [], 'count' => 0, 'page_no' => '1', 'page_size' => '20'];
        }
    }

    /** POS 同款助教费实时计算 */
    private static function calcAssistantFee($order): float
    {
        if ($order['status'] === 'completed') {
            return (float)($order['assistant_fee'] ?? $order['total_fee'] ?? 0);
        }
        // in_progress: 从 OrderItem (serving) 实时计算
        $item = OrderItem::where('order_id', $order['id'])->where('item_type', 'assistant')->where('status', 'serving')->find();
        if (!$item || empty($item['started_at'])) {
            return (float)($order['assistant_fee'] ?? 0);
        }
        $mins = max(1, intval((time() - strtotime($item['started_at'])) / 60));
        $rate = floatval($item['unit_price'] ?? 0);
        $rule = $item['billing_rule'] ?? '';
        if (empty($rule) && !empty($item['assistant_id'])) {
            $ast = Assistant::where('id', $item['assistant_id'])->find();
            $rule = $ast['billing_rule'] ?? 'half_hour';
        }
        if ($rule === 'minute' || $rule === 'hourly') {
            return round(($mins / 60) * $rate, 2);
        }
        $units = ceil($mins / 30);
        return round($units * 0.5 * $rate, 2);
    }

    /**
     * 助教统计：提成金额从 CommissionRecord 读取，时长从 Order 读取
     */
    public static function getStats($params)
    {
        try {
            $employeeId = $params['employee_id'];
            $storeId = $params['store_id'];
            $startDate = $params['start_date'] ?? '';
            $endDate = $params['end_date'] ?? '';

            $assistant = Assistant::where('employee_id', $employeeId)->find();
            if (!$assistant) {
                return ['total_income' => 0, 'order_count' => 0, 'total_duration' => 0,
                        'avg_order_amount' => 0, 'this_month_income' => 0, 'this_month_count' => 0];
            }
            $aid = $assistant['id'];

            // 订单数+时长从 Order
            $orderQuery = Order::where('store_id', $storeId)->where('type', 'assistant')
                ->where('assistant_id', $aid)->where('status', 'completed');
            if (!empty($startDate)) $orderQuery->where('start_time', '>=', $startDate . ' 00:00:00');
            if (!empty($endDate)) $orderQuery->where('start_time', '<=', $endDate . ' 23:59:59');
            $orders = $orderQuery->select();
            $orderCount = count($orders);
            $totalDuration = 0;
            foreach ($orders as $o) { $totalDuration += (int)($o['duration_minutes'] ?? 0); }

            // 实际提成从 CommissionRecord
            $commQuery = CommissionRecord::where('assistant_id', $aid)
                ->whereIn('status', ['pending', 'paid']);
            if (!empty($startDate)) $commQuery->where('created_at', '>=', $startDate . ' 00:00:00');
            if (!empty($endDate)) $commQuery->where('created_at', '<=', $endDate . ' 23:59:59');
            $totalIncome = 0;
            foreach ($commQuery->select() as $r) { $totalIncome += (float)($r['commission_amount'] ?? 0); }
            $avgOrderAmount = $orderCount > 0 ? round($totalIncome / $orderCount, 2) : 0;

            // 本月
            $monthStart = date('Y-m-01 00:00:00'); $monthEnd = date('Y-m-t 23:59:59');
            $monthOrders = Order::where('store_id', $storeId)->where('type', 'assistant')
                ->where('assistant_id', $aid)->where('status', 'completed')
                ->where('start_time', '>=', $monthStart)->where('start_time', '<=', $monthEnd)->select();
            $thisMonthCount = count($monthOrders);
            $thisMonthIncome = 0;
            foreach (CommissionRecord::where('assistant_id', $aid)->whereIn('status', ['pending', 'paid'])
                ->where('created_at', '>=', $monthStart)->where('created_at', '<=', $monthEnd)->select() as $r) {
                $thisMonthIncome += (float)($r['commission_amount'] ?? 0);
            }

            // 总时长从 Order 读取
            return [
                'total_income' => round($totalIncome, 2),
                'order_count' => $orderCount,
                'total_duration' => $totalDuration,
                'avg_order_amount' => $avgOrderAmount,
                'this_month_income' => round($thisMonthIncome, 2),
                'this_month_count' => $thisMonthCount,
            ];
        } catch (Exception $e) {
            return ['total_income' => 0, 'order_count' => 0, 'total_duration' => 0,
                    'avg_order_amount' => 0, 'this_month_income' => 0, 'this_month_count' => 0];
        }
    }

    public static function getAllOrders($params)
    {
        try {
            $employeeId = $params['employee_id'];
            $storeId = $params['store_id'];
            $status = $params['status'] ?? '';
            $page = $params['page_no'] ?? 1;
            $pageSize = $params['page_size'] ?? 20;

            $assistant = Assistant::where('employee_id', $employeeId)->find();
            if (!$assistant) {
                return [
                    'list' => [],
                    'count' => 0,
                    'page_no' => $page,
                    'page_size' => $pageSize,
                ];
            }

            $query = AssistantOrder::where('store_id', $storeId)
                ->where('assistant_id', $assistant['id']);

            if (!empty($status)) {
                $query->where('status', $status);
            }

            $list = $query->order('created_at', 'desc')
                ->paginate($pageSize, false, ['page' => $page]);

            $result = [];
            foreach ($list->items() as $order) {
                $result[] = [
                    'id' => $order['id'],
                    'order_no' => $order['order_no'],
                    'table_no' => self::getTableName($order['table_id']),
                    'student_name' => $order['student_name'],
                    'student_phone' => $order['student_phone'],
                    'service_type' => self::getServiceTypeName($order['type']),
                    'duration' => $order['duration'],
                    'actual_duration' => $order['actual_duration'],
                    'unit_price' => $order['unit_price'],
                    'total_amount' => $order['total_amount'],
                    'actual_amount' => $order['actual_amount'],
                    'status' => $order['status'],
                    'status_name' => self::getStatusName($order['status']),
                    'start_time' => $order['start_time'],
                    'end_time' => $order['end_time'],
                    'order_id' => $order['order_id'],
                    'created_at' => $order['created_at'],
                    'completed_at' => $order['completed_at'],
                ];
            }

            return [
                'list' => $result,
                'count' => $list->total(),
                'page_no' => $page,
                'page_size' => $pageSize,
            ];
        } catch (Exception $e) {
            return ['data' => [], 'pagination' => ['page' => 1, 'page_size' => 20, 'total' => 0, 'total_pages' => 0]];
        }
    }

    public static function getList($params)
    {
        try {
            $employeeId = $params['employee_id'];
            $storeId = $params['store_id'];
            $status = $params['status'] ?? '';
            $page = (int)($params['page_no'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 50);

            $assistant = Assistant::where('employee_id', $employeeId)->find();
            $assistantId = $assistant ? $assistant['id'] : '';

            $result = [];

            // 1. Pending: OrderItem (tablet booking, waiting POS confirm)
            if (empty($status) || $status === 'pending' || $status === 'all') {
                $q = OrderItem::alias('oi')
                    ->join('busi_order o', 'o.id = oi.order_id')
                    ->where('o.store_id', $storeId)
                    ->where('oi.item_type', 'assistant')
                    ->where('oi.status', 'pending')
                    ->where(function ($sq) { $sq->whereNull('oi.expires_at')->whereOr('oi.expires_at', '>', date('Y-m-d H:i:s')); });
                if (!empty($assistantId)) $q->where('oi.assistant_id', $assistantId);
                $items = $q->field('oi.*, o.table_id, o.order_no')->order('oi.created_at', 'desc')->select();
                foreach ($items as $item) {
                    $table = Table::find($item['table_id']);
                    $result[] = [
                        'id' => $item['id'], 'order_no' => $item['order_no'] ?? '',
                        'table_id' => $item['table_id'] ?? '', 'table_no' => $table ? $table['name'] : '', 'table_name' => $table ? $table['name'] : '',
                        'student_name' => '', 'service_type' => '',
                        'price' => (float)($item['unit_price'] ?? 0), 'total_amount' => (float)($item['unit_price'] ?? 0), 'amount' => (float)($item['unit_price'] ?? 0),
                        'status' => 'pending', 'status_name' => '待确认',
                        'start_time' => '', 'created_at' => $item['created_at'], 'source' => 'order_item',
                    ];
                }
            }

            // 2. Accepted: OrderItem with status=processing (POS confirmed)
            if (empty($status) || $status === 'accepted' || $status === 'all') {
                $q = OrderItem::alias('oi')
                    ->join('busi_order o', 'o.id = oi.order_id')
                    ->where('o.store_id', $storeId)
                    ->where('oi.item_type', 'assistant')
                    ->where('oi.status', 'processing');
                if (!empty($assistantId)) $q->where('oi.assistant_id', $assistantId);
                $items = $q->field('oi.*, o.table_id, o.order_no')->order('oi.created_at', 'desc')->select();
                foreach ($items as $item) {
                    $table = Table::find($item['table_id']);
                    $result[] = [
                        'id' => $item['id'], 'order_no' => $item['order_no'] ?? '',
                        'table_id' => $item['table_id'] ?? '', 'table_no' => $table ? $table['name'] : '', 'table_name' => $table ? $table['name'] : '',
                        'student_name' => '', 'service_type' => '',
                        'price' => (float)($item['unit_price'] ?? 0), 'total_amount' => (float)($item['unit_price'] ?? 0), 'amount' => (float)($item['unit_price'] ?? 0),
                        'status' => 'accepted', 'status_name' => '已确认',
                        'start_time' => '', 'created_at' => $item['created_at'], 'source' => 'order_item',
                    ];
                }
            }

            // 3. InProgress + Completed: Order table
            if (empty($status) || in_array($status, ['in_progress', 'completed', 'all'])) {
                $q = Order::where('store_id', $storeId)->where('type', 'assistant');
                if (!empty($assistantId)) $q->where('assistant_id', $assistantId);
                if ($status === 'in_progress') $q->where('status', 'in_progress');
                elseif ($status === 'completed') $q->where('status', 'completed');
                elseif (empty($status) || $status === 'all') $q->whereIn('status', ['in_progress', 'completed']);
                $orders = $q->order('start_time', 'desc')->select();
                foreach ($orders as $order) {
                    $table = Table::find($order['table_id']);
                    // 检查关联 OrderItem 是否已被结束
                    $servingItem = OrderItem::where('order_id', $order['id'])->where('item_type', 'assistant')->where('status', 'serving')->find();
                    $completedItem = OrderItem::where('order_id', $order['id'])->where('item_type', 'assistant')->where('status', 'completed')->find();
                    $actualStatus = $order['status'];
                    $actualEndTime = $order['end_time'] ?? '';
                    if ($order['status'] === 'in_progress' && !$servingItem && $completedItem) {
                        $actualStatus = 'completed';
                        $actualEndTime = $completedItem['ended_at'] ?? $order['end_time'] ?? '';
                    }
                    $fee = self::calcAssistantFee($order);
                    $result[] = [
                        'id' => $order['id'], 'order_no' => $order['order_no'] ?? '',
                        'table_id' => $order['table_id'] ?? '', 'table_no' => $table ? $table['name'] : '', 'table_name' => $table ? $table['name'] : '',
                        'student_name' => $order['member_name'] ?? '', 'service_type' => '助教服务',
                        'price' => $fee, 'total_amount' => $fee, 'amount' => $fee,
                        'status' => $actualStatus,
                        'status_name' => $actualStatus === 'in_progress' ? '服务中' : '已完成',
                        'start_time' => $order['start_time'] ?? '', 'end_time' => $actualEndTime,
                        'duration_minutes' => (int)($order['duration_minutes'] ?? 0),
                        'created_at' => $order['created_at'] ?? '', 'source' => 'order',
                    ];
                }
            }

            usort($result, function($a, $b) { return strcmp($b['created_at'] ?? '', $a['created_at'] ?? ''); });
            $totalCount = count($result);
            $result = array_slice($result, ($page - 1) * $pageSize, $pageSize);

            return ['list' => $result, 'count' => $totalCount, 'page_no' => (string)$page, 'page_size' => (string)$pageSize];
        } catch (Exception $e) {
            return ['list' => [], 'count' => 0, 'page_no' => '1', 'page_size' => '50'];
        }
    }

    private static function getStatusName($status)
    {
        $statusMap = [
            'pending' => '待接单',
            'accepted' => '待服务',
            'in_progress' => '服务中',
            'completed' => '已完成',
            'cancelled' => '已取消',
        ];
        return $statusMap[$status] ?? $status;
    }

    private static function getTableName($tableId)
    {
        if (!$tableId) return '未知桌台';
        $table = Db::name('busi_table')->where('id', $tableId)->find();
        return $table ? $table['number'] : '未知桌台';
    }

    private static function getServiceTypeName($type)
    {
        $types = [
            'one_on_one' => '一对一教学',
            'group' => '小班课',
            'practice' => '陪练服务',
            'coaching' => '教学服务',
        ];
        return $types[$type] ?? '其他服务';
    }
}
