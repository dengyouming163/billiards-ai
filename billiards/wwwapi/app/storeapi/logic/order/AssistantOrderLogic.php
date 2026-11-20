<?php

declare (strict_types=1);

namespace app\storeapi\logic\order;

use app\common\logic\BaseLogic;
use app\common\constants\AssistantOrderStatus;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantOrder;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use think\facade\Db;
use think\Exception;

class AssistantOrderLogic extends BaseLogic
{
    public static function createAssistantOrder(string $orderId, array $params, string $storeId)
    {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        if ($order->status !== 'in_progress') {
            return self::setError('订单状态必须为进行中');
        }

        $assistantId = $params['assistant_id'] ?? '';
        if (empty($assistantId)) {
            return self::setError('助教ID不能为空');
        }

        $assistant = Assistant::where('id', $assistantId)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistant) {
            return self::setError('助教不存在或未启用');
        }

        try {
            Db::startTrans();

            $busyOrderItem = OrderItem::where('assistant_id', $assistantId)
                ->where('item_type', 'assistant_service')
                ->whereIn('status', [AssistantOrderStatus::ACCEPTED, AssistantOrderStatus::IN_PROGRESS])
                ->lock(true)
                ->find();

            if ($busyOrderItem) {
                Db::rollback();
                return self::setError('助教正在服务中，请稍后再试');
            }

            $existingOrderItem = OrderItem::where('order_id', $orderId)
                ->where('item_type', 'assistant_service')
                ->whereIn('status', [AssistantOrderStatus::PENDING, AssistantOrderStatus::ACCEPTED, AssistantOrderStatus::IN_PROGRESS])
                ->lock(true)
                ->find();

            if ($existingOrderItem) {
                Db::rollback();
                return self::setError('该订单已有助教服务');
            }

            $orderNo = 'ZA' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

            $assistantOrder = new AssistantOrder();
            $assistantOrder->id = self::generateId();
            $assistantOrder->order_no = $orderNo;
            $assistantOrder->store_id = $storeId;
            $assistantOrder->order_id = $orderId;
            $assistantOrder->table_id = $order->table_id;
            $assistantOrder->assistant_id = $assistantId;
            $assistantOrder->member_id = $order->member_id ?? '';
            $assistantOrder->student_name = $params['student_name'] ?? '';
            $assistantOrder->student_phone = $params['student_phone'] ?? '';
            $assistantOrder->type = $params['service_type'] ?? 'practice';
            $assistantOrder->duration = $params['duration'] ?? 1.0;
            $assistantOrder->unit_price = $assistant->hourly_rate ?? 0;
            $assistantOrder->total_amount = ($assistantOrder->duration) * ($assistantOrder->unit_price);
            $assistantOrder->status = AssistantOrderStatus::PENDING;
            $assistantOrder->operator_id = $params['operator_id'] ?? '';
            $assistantOrder->operator_name = $params['operator_name'] ?? '';
            $assistantOrder->remark = $params['remark'] ?? '';
            $assistantOrder->save();

            // 更新助教状态为服务中 (status=2)
            Assistant::where('id', $assistantId)->update(['status' => 2]);

            Db::commit();

            return [
                'id' => $assistantOrder->id,
                'order_no' => $assistantOrder->order_no,
                'order_id' => $orderId,
                'assistant_id' => $assistantId,
                'assistant_name' => $assistant->name,
                'student_name' => $assistantOrder->student_name,
                'student_phone' => $assistantOrder->student_phone,
                'service_type' => $assistantOrder->type,
                'duration' => $assistantOrder->duration,
                'unit_price' => $assistantOrder->unit_price,
                'total_amount' => $assistantOrder->total_amount,
                'status' => $assistantOrder->status,
                'created_at' => $assistantOrder->created_at,
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('创建助教订单失败: ' . $e->getMessage());
        }
    }

    public static function startService(string $assistantOrderId, string $storeId)
    {
        $assistantOrder = AssistantOrder::where('id', $assistantOrderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistantOrder) {
            return self::setError('助教订单不存在');
        }

        if ($assistantOrder->status !== AssistantOrderStatus::PENDING) {
            return self::setError('订单状态必须为待服务才能开始');
        }

        if (empty($assistantOrder->order_id)) {
            return self::setError('未关联主订单');
        }

        $mainOrder = Order::where('id', $assistantOrder->order_id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$mainOrder) {
            return self::setError('主订单不存在');
        }

        try {
            Db::startTrans();

            $now = date('Y-m-d H:i:s');

            $assistantOrder->status = 'in_progress';
            $assistantOrder->start_time = $now;
            $assistantOrder->save();

            $orderItem = new OrderItem();
            $orderItem->id = self::generateId();
            $orderItem->order_id = $mainOrder->id;
            $orderItem->item_type = 'assistant_service';
            $orderItem->assistant_id = $assistantOrder->assistant_id;
            $orderItem->item_name = self::getServiceTypeName($assistantOrder->type);
            $orderItem->quantity = $assistantOrder->duration;
            $orderItem->unit = '小时';
            $orderItem->unit_price = $assistantOrder->unit_price;
            $orderItem->total_price = $assistantOrder->total_amount;
            $orderItem->discount_rate = 100;
            $orderItem->final_price = $assistantOrder->total_amount;
            $orderItem->description = $assistantOrder->student_name . ' - ' . ($assistantOrder->student_phone ?? '');
            $orderItem->save();

            // 更新助教状态为服务中 (status=2)
            Assistant::where('id', $assistantOrder->assistant_id)->update(['status' => 2]);

            $mainOrder->final_amount = bcadd((string)$mainOrder->final_amount, (string)$assistantOrder->total_amount, 2);
            $mainOrder->save();

            Db::commit();

            return [
                'assistant_order_id' => $assistantOrder->id,
                'order_id' => $mainOrder->id,
                'order_no' => $mainOrder->order_no,
                'service_start_time' => $now,
                'unit_price' => $assistantOrder->unit_price,
                'duration' => $assistantOrder->duration,
                'estimated_amount' => $assistantOrder->total_amount,
                'main_order_amount' => $mainOrder->final_amount,
                'status' => $assistantOrder->status,
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('开始服务失败: ' . $e->getMessage());
        }
    }

    public static function endService(string $assistantOrderId, string $storeId, array $params = [])
    {
        $assistantOrder = AssistantOrder::where('id', $assistantOrderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistantOrder) {
            return self::setError('助教订单不存在');
        }

        if ($assistantOrder->status !== 'in_progress') {
            return self::setError('订单状态必须为服务中才能结束');
        }

        if (empty($assistantOrder->order_id)) {
            return self::setError('未关联主订单');
        }

        $mainOrder = Order::where('id', $assistantOrder->order_id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$mainOrder) {
            return self::setError('主订单不存在');
        }

        try {
            Db::startTrans();

            $now = date('Y-m-d H:i:s');
            $startTime = $assistantOrder->start_time;

            $actualDuration = 0;
            if ($startTime) {
                $startTimestamp = strtotime($startTime);
                $endTimestamp = strtotime($now);
                $actualDuration = bcdiv(
                    (string)($endTimestamp - $startTimestamp),
                    '3600',
                    2
                );
            }

            $unitPrice = $assistantOrder->unit_price ?? 0;
            $actualAmount = bcmul((string)$actualDuration, (string)$unitPrice, 2);

            $orderItem = OrderItem::where('order_id', $mainOrder->id)
                ->where('item_type', 'assistant_service')
                ->where('assistant_id', $assistantOrder->assistant_id)
                ->order('created_at', 'desc')
                ->find();

            if ($orderItem) {
                $priceDifference = bcsub((string)$actualAmount, (string)$orderItem->final_price, 2);

                $orderItem->quantity = $actualDuration;
                $orderItem->total_price = $actualAmount;
                $orderItem->final_price = $actualAmount;
                $orderItem->save();

                $mainOrder->final_amount = bcadd((string)$mainOrder->final_amount, $priceDifference, 2);
            } else {
                $mainOrder->final_amount = bcadd((string)$mainOrder->final_amount, (string)$actualAmount, 2);
            }

            $mainOrder->save();

            $assistantOrder->status = 'completed';
            $assistantOrder->end_time = $now;
            $assistantOrder->actual_duration = $actualDuration;
            $assistantOrder->actual_amount = $actualAmount;
            $assistantOrder->completed_at = $now;
            $assistantOrder->save();

            // 恢复助教状态为空闲 (status=1)
            Assistant::where('id', $assistantOrder->assistant_id)->update(['status' => 1]);

            Db::commit();

            try {
                if ($orderItem) {
                    \app\storeapi\logic\assistant\AssistantLogic::calculateCommission(
                        $assistantOrder->assistant_id,
                        $orderItem->id,
                        (float)$actualAmount,
                        $storeId
                    );
                }
            } catch (\Exception $e) {
                \think\facade\Log::error('calculateCommission failed: ' . $e->getMessage());
            }

            return [
                'assistant_order_id' => $assistantOrder->id,
                'order_id' => $mainOrder->id,
                'order_no' => $mainOrder->order_no,
                'service_end_time' => $now,
                'actual_duration' => $actualDuration,
                'actual_amount' => $actualAmount,
                'price_difference' => isset($priceDifference) ? $priceDifference : 0,
                'main_order_amount' => $mainOrder->final_amount,
                'status' => $assistantOrder->status,
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('结束服务失败: ' . $e->getMessage());
        }
    }

    public static function cancel(string $assistantOrderId, string $storeId, array $params = [])
    {
        $assistantOrder = AssistantOrder::where('id', $assistantOrderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistantOrder) {
            return self::setError('助教订单不存在');
        }

        if (in_array($assistantOrder->status, ['completed', 'cancelled'])) {
            return self::setError('订单已' . ($assistantOrder->status === 'completed' ? '完成' : '取消') . '，无法取消');
        }

        try {
            Db::startTrans();

            if (!empty($assistantOrder->order_id) && $assistantOrder->status === 'in_progress') {
                $mainOrder = Order::where('id', $assistantOrder->order_id)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();

                if ($mainOrder) {
                    $orderItem = OrderItem::where('order_id', $mainOrder->id)
                        ->where('item_type', 'assistant_service')
                        ->where('assistant_id', $assistantOrder->assistant_id)
                        ->order('created_at', 'desc')
                        ->find();

                    if ($orderItem) {
                        $amountToDeduct = $orderItem->final_price ?? 0;
                        $orderItem->status = 'cancelled';
                        $orderItem->save();

                        $mainOrder->final_amount = bcsub((string)$mainOrder->final_amount, (string)$amountToDeduct, 2);
                        if ($mainOrder->final_amount < 0) {
                            $mainOrder->final_amount = 0;
                        }
                        $mainOrder->save();
                    }
                }
            }

            $assistantOrder->status = 'cancelled';
            $assistantOrder->remark = $params['reason'] ?? '管理员取消';
            $assistantOrder->save();

            Db::commit();

            return [
                'assistant_order_id' => $assistantOrder->id,
                'order_id' => $assistantOrder->order_id,
                'cancelled_at' => date('Y-m-d H:i:s'),
                'status' => $assistantOrder->status,
                'cancelled_by' => $params['operator_name'] ?? '系统',
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('取消失败: ' . $e->getMessage());
        }
    }

    public static function getDetail(string $assistantOrderId, string $storeId)
    {
        $assistantOrder = AssistantOrder::where('id', $assistantOrderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistantOrder) {
            return self::setError('助教订单不存在');
        }

        $assistant = Assistant::where('id', $assistantOrder->assistant_id)
            ->whereNull('deleted_at')
            ->find();

        $result = [
            'id' => $assistantOrder->id,
            'order_no' => $assistantOrder->order_no,
            'order_id' => $assistantOrder->order_id,
            'store_id' => $assistantOrder->store_id,
            'table_id' => $assistantOrder->table_id,
            'assistant_id' => $assistantOrder->assistant_id,
            'assistant_name' => $assistant ? $assistant->name : '',
            'member_id' => $assistantOrder->member_id,
            'student_name' => $assistantOrder->student_name,
            'student_phone' => $assistantOrder->student_phone,
            'type' => $assistantOrder->type,
            'type_name' => self::getServiceTypeName($assistantOrder->type),
            'duration' => $assistantOrder->duration,
            'actual_duration' => $assistantOrder->actual_duration,
            'unit_price' => $assistantOrder->unit_price,
            'total_amount' => $assistantOrder->total_amount,
            'actual_amount' => $assistantOrder->actual_amount,
            'status' => $assistantOrder->status,
            'status_name' => self::getStatusName($assistantOrder->status),
            'start_time' => $assistantOrder->start_time,
            'end_time' => $assistantOrder->end_time,
            'completed_at' => $assistantOrder->completed_at,
            'operator_id' => $assistantOrder->operator_id,
            'operator_name' => $assistantOrder->operator_name,
            'remark' => $assistantOrder->remark,
            'created_at' => $assistantOrder->created_at,
        ];

        if (!empty($assistantOrder->order_id)) {
            $mainOrder = Order::where('id', $assistantOrder->order_id)
                ->whereNull('deleted_at')
                ->find();

            if ($mainOrder) {
                $result['main_order'] = [
                    'id' => $mainOrder->id,
                    'order_no' => $mainOrder->order_no,
                    'status' => $mainOrder->status,
                    'final_amount' => $mainOrder->final_amount,
                    'start_time' => $mainOrder->start_time,
                    'end_time' => $mainOrder->end_time,
                ];
            }
        }

        return $result;
    }

    public static function getList(array $params, string $storeId)
    {
        try {
            $query = AssistantOrder::where('store_id', $storeId)
                ->whereNull('deleted_at');

            if (!empty($params['status'])) {
                $query->where('status', $params['status']);
            }

            if (!empty($params['assistant_id'])) {
                $query->where('assistant_id', $params['assistant_id']);
            }

            if (!empty($params['order_id'])) {
                $query->where('order_id', $params['order_id']);
            }

            if (!empty($params['table_id'])) {
                $query->where('table_id', $params['table_id']);
            }

            if (!empty($params['keyword'])) {
                $keyword = $params['keyword'];
                $query->where(function ($q) use ($keyword) {
                    $q->where('order_no', 'like', "%{$keyword}%")
                      ->whereOr('student_name', 'like', "%{$keyword}%")
                      ->whereOr('student_phone', 'like', "%{$keyword}%");
                });
            }

            $page = $params['page'] ?? 1;
            $pageSize = $params['page_size'] ?? 20;

            $list = $query->order('created_at', 'desc')
                ->paginate([
                    'page' => $page,
                    'list_rows' => $pageSize,
                ]);

            $data = [];
            foreach ($list->items() as $order) {
                $data[] = self::getDetail($order->id, $storeId);
            }

            return [
                'data' => $data,
                'pagination' => [
                    'page' => (int)$page,
                    'page_size' => (int)$pageSize,
                    'total' => $list->total(),
                    'total_pages' => ceil($list->total() / $pageSize),
                ],
            ];
        } catch (Exception $e) {
            return self::setError('查询失败: ' . $e->getMessage());
        }
    }

    public static function getAllServices(string $storeId)
    {
        try {
            $list = AssistantOrder::where('store_id', $storeId)
                ->whereIn('status', ['pending', 'accepted', 'in_progress'])
                ->whereNull('deleted_at')
                ->order('created_at', 'desc')
                ->select()
                ->toArray();

            $data = [];
            foreach ($list as $order) {
                $detail = self::getDetail($order['id'], $storeId);
                if (!isset($detail['error'])) {
                    $data[] = $detail;
                }
            }

            return $data;
        } catch (Exception $e) {
            return self::setError('查询失败: ' . $e->getMessage());
        }
    }

    public static function getServicesByOrder(string $orderId, string $storeId)
    {
        try {
            $list = AssistantOrder::where('store_id', $storeId)
                ->where('order_id', $orderId)
                ->whereNull('deleted_at')
                ->order('created_at', 'desc')
                ->select()
                ->toArray();

            $data = [];
            foreach ($list as $order) {
                $detail = self::getDetail($order['id'], $storeId);
                if (!isset($detail['error'])) {
                    $data[] = $detail;
                }
            }

            return $data;
        } catch (Exception $e) {
            return self::setError('查询失败: ' . $e->getMessage());
        }
    }

    public static function acceptAssistantOrder(string $assistantOrderId, string $employeeId, string $storeId)
    {
        $assistantOrder = AssistantOrder::where('id', $assistantOrderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistantOrder) {
            return self::setError('助教订单不存在');
        }

        if ($assistantOrder->status !== 'pending') {
            return self::setError('订单状态必须为待服务才能接单');
        }

        try {
            $now = date('Y-m-d H:i:s');

            $assistantOrder->status = 'accepted';
            $assistantOrder->accepted_at = $now;
            $assistantOrder->operator_id = $employeeId;
            $assistantOrder->save();

            return [
                'assistant_order_id' => $assistantOrder->id,
                'status' => $assistantOrder->status,
                'accepted_at' => $now,
            ];
        } catch (Exception $e) {
            return self::setError('接单失败: ' . $e->getMessage());
        }
    }

    public static function cancelAssistantOrder(string $assistantOrderId, array $params, string $storeId)
    {
        return self::cancel($assistantOrderId, $storeId, $params);
    }

    public static function rejectAssistantOrder(string $assistantOrderId, string $employeeId, string $reason, string $storeId)
    {
        $orderItem = OrderItem::where('id', $assistantOrderId)
            ->where('item_type', 'assistant_service')
            ->find();

        if (!$orderItem) {
            return self::setError('助教服务项不存在');
        }

        if (!in_array($orderItem->status, AssistantOrderStatus::CAN_REJECT)) {
            return self::setError('当前状态不可拒绝');
        }

        try {
            $now = date('Y-m-d H:i:s');

            $orderItem->status = AssistantOrderStatus::REJECTED;
            $orderItem->rejected_at = $now;
            $orderItem->reject_reason = $reason;
            $orderItem->save();

            return [
                'order_item_id' => $orderItem->id,
                'status' => $orderItem->status,
                'rejected_at' => $now,
            ];
        } catch (Exception $e) {
            return self::setError('拒绝接单失败: ' . $e->getMessage());
        }
    }

    private static function generateId()
    {
        return 'ao_' . bin2hex(random_bytes(8));
    }

    private static function getStatusName($status)
    {
        $statusMap = [
            AssistantOrderStatus::PENDING => '待服务',
            AssistantOrderStatus::ACCEPTED => '已接单',
            AssistantOrderStatus::REJECTED => '已拒绝',
            AssistantOrderStatus::IN_PROGRESS => '服务中',
            AssistantOrderStatus::COMPLETED => '已完成',
            AssistantOrderStatus::REVIEWED => '已评价',
            AssistantOrderStatus::CANCELLED => '已取消',
        ];
        return $statusMap[$status] ?? $status;
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
