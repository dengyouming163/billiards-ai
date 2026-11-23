<?php

declare (strict_types=1);

namespace app\storeapi\logic\order;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\OrderPayment;
use app\common\model\merchant\OrderRefund;
use app\common\model\merchant\Table;
use app\common\model\merchant\Member;
use app\common\model\merchant\AssistantOrder;
use app\common\model\merchant\OrderPauseLog;
use app\common\model\merchant\OrderTableLog;
use app\common\model\merchant\Pricing;
use app\common\model\merchant\TimePeriod;
use app\common\logic\PricingCalculatorLogic;
use app\common\constants\TableStatus;
use app\common\lib\WebSocketNotification;
use think\facade\Db;
use think\Exception;

class OrderLogic extends BaseLogic
{
    /**
     * 订单列表（与 POS 数据一致）
     * - LEFT JOIN table_name
     * - 排除并入子订单
     * - 聚合自身+子订单 items
     * - 标记 has_merged
     */
    public static function getList(array $params, string $storeId)
    {
        try {
            $query = Order::alias('o')
                ->where('o.store_id', $storeId)
                ->whereNull('o.deleted_at')
                ->whereNull('o.merged_to_order_id')
                ->leftJoin(Table::getTable() . ' t', 'o.table_id = t.id')
                ->field('o.*, t.name as table_name')
                ->order('o.created_at', 'desc');

            if (!empty($params['type'])) {
                $query->where('o.type', $params['type']);
            }
            if (!empty($params['status'])) {
                $query->where('o.status', $params['status']);
            }
            if (!empty($params['member_id'])) {
                $query->where('o.member_id', $params['member_id']);
            }
            if (!empty($params['table_id'])) {
                $query->where('o.table_id', $params['table_id']);
            }
            if (!empty($params['keyword'])) {
                $keyword = $params['keyword'];
                $query->where(function ($q) use ($keyword) {
                    $q->where('o.order_no', 'like', "%{$keyword}%")
                      ->whereOr('o.member_name', 'like', "%{$keyword}%");
                });
            }

            $page = $params['page'] ?? 1;
            $pageSize = $params['page_size'] ?? 20;

            $list = $query->paginate(['page' => $page, 'list_rows' => $pageSize]);
            $orders = $list->items();

            // 批量查哪些是父订单（有子订单并入）
            $ordersArr = [];
            foreach ($orders as $o) { $ordersArr[] = is_object($o) ? $o->toArray() : (array)$o; }
            $parentIds = array_column($ordersArr, 'id');
            $hasMergedMap = [];
            if (!empty($parentIds)) {
                $mergedParents = \think\facade\Db::name('busi_order')
                    ->whereIn('merged_to_order_id', $parentIds)
                    ->where('status', 'completed')
                    ->column('merged_to_order_id');
                $hasMergedMap = array_flip(array_unique($mergedParents));
            }

            $data = [];
            foreach ($orders as $order) {
                $arr = $order->toArray();
                $arr['table_name'] = $order['table_name'] ?? '';

                // 聚合自身 + 并入子订单的 items（与 POS 一致）
                $itemOrderIds = [$order['id']];
                $childIds = \think\facade\Db::name('busi_order')
                    ->where('merged_to_order_id', $order['id'])
                    ->where('status', 'completed')
                    ->column('id');
                $itemOrderIds = array_merge($itemOrderIds, $childIds);
                $arr['items'] = OrderItem::whereIn('order_id', $itemOrderIds)
                    ->field('id, item_type, item_name, quantity, unit, unit_price, total_price, final_price, discount_rate, description, status, created_at')
                    ->select()->toArray();
                $arr['has_merged'] = isset($hasMergedMap[$order['id']]);

                // 支付记录
                $arr['payments'] = OrderPayment::where('order_id', $order['id'])->select()->toArray();

                $data[] = $arr;
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

    public static function export(array $params, string $storeId)
    {
        try {
            $query = Order::where('store_id', $storeId)
                ->whereNull('deleted_at');

            if (!empty($params['type'])) {
                $query->where('type', $params['type']);
            }
            if (!empty($params['status'])) {
                $query->where('status', $params['status']);
            }
            if (!empty($params['keyword'])) {
                $keyword = $params['keyword'];
                $query->where(function ($q) use ($keyword) {
                    $q->where('order_no', 'like', "%{$keyword}%")
                      ->whereOr('member_name', 'like', "%{$keyword}%");
                });
            }
            if (!empty($params['start_date'])) {
                $query->where('created_at', '>=', $params['start_date'] . ' 00:00:00');
            }
            if (!empty($params['end_date'])) {
                $query->where('created_at', '<=', $params['end_date'] . ' 23:59:59');
            }

            $list = $query->order('created_at', 'desc')->select();

            $header = ['订单号', '类型', '状态', '台桌', '会员', '原价', '优惠', '实付', '支付方式', '创建时间', '结束时间'];

            $statusMap = [
                'pending' => '待支付',
                'in_progress' => '进行中',
                'paused' => '已暂停',
                'completed' => '已完成',
                'cancelled' => '已取消',
                'merged' => '已合并',
            ];

            $incomeTypeLabels = [
                'table' => '台费',
                'product' => '商品',
                'assistant' => '助教',
                'quick_order' => '快速下单',
            ];

            $filename = '订单导出_' . date('Y-m-d') . '.csv';
            header('Content-Type: text/csv; charset=utf-8');
            header('Content-Disposition: attachment; filename=' . $filename);

            $fp = fopen('php://output', 'w');
            fprintf($fp, chr(0xEF) . chr(0xBB) . chr(0xBF));
            fputcsv($fp, $header);

            foreach ($list as $order) {
                $payments = OrderPayment::where('order_id', $order->id)->select()->toArray();
                $paymentMethod = !empty($payments[0]['payment_method']) ? $payments[0]['payment_method'] : '';

                fputcsv($fp, [
                    $order->order_no,
                    $incomeTypeLabels[$order->type] ?? $order->type,
                    $statusMap[$order->status] ?? $order->status,
                    $order->table_name ?: ($order->table_id ?: ''),
                    $order->member_name ?: '',
                    $order->original_amount,
                    $order->discount_amount,
                    $order->final_amount,
                    $paymentMethod,
                    $order->created_at,
                    $order->end_time ?: '',
                ]);
            }

            fclose($fp);
            exit;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function getDetail(string $id, string $storeId)
    {
        try {
            $order = Order::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$order) {
                return self::setError('订单不存在');
            }

            return self::formatOrder($order);
        } catch (Exception $e) {
            return self::setError('查询失败: ' . $e->getMessage());
        }
    }

    /**
     * 格式化订单（用于详情，与 POS 数据一致）
     */
    private static function formatOrder($order)
    {
        $result = $order->toArray();

        // table_name 优先用 JOIN 结果，fallback 单查
        $result['table_name'] = $order['table_name'] ?? '';
        if (empty($result['table_name']) && !empty($order->table_id)) {
            $table = Table::where('id', $order->table_id)->find();
            $result['table_name'] = $table ? ($table->name ?: '') : '';
        }

        // 聚合自身 + 并入子订单的 items（与 POS 一致）
        $itemOrderIds = [$order->id];
        $childIds = \think\facade\Db::name('busi_order')
            ->where('merged_to_order_id', $order->id)
            ->where('status', 'completed')
            ->column('id');
        $itemOrderIds = array_merge($itemOrderIds, $childIds);
        $result['items'] = OrderItem::whereIn('order_id', $itemOrderIds)
            ->field('id, item_type, item_name, quantity, unit_price, total_price, final_price, status')
            ->select()->toArray();
        $result['has_merged'] = !empty($childIds);

        $result['payments'] = OrderPayment::where('order_id', $order->id)->select()->toArray();

        return $result;
    }

    public static function createTableOrder(array $params, string $storeId)
    {
        if (empty($params['table_id'])) {
            return self::setError('台桌ID不能为空');
        }

        $orderNo = 'TB' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

        try {
            $order = new Order();
            $order->id = self::generateId();
            $order->store_id = $storeId;
            $order->order_no = $orderNo;
            $order->type = 'table';
            $order->status = 'in_progress';
            $order->table_id = $params['table_id'];
            $order->member_id = $params['member_id'] ?? '';
            $order->member_name = $params['member_name'] ?? '';
            $order->operator_id = $params['operator_id'] ?? '';
            $order->operator_name = $params['operator_name'] ?? '';
            $order->start_time = date('Y-m-d H:i:s');
            $order->original_amount = 0;
            $order->discount_amount = 0;
            $order->final_amount = 0;
            $order->balance_paid = 0;
            $order->cash_paid = 0;
            $order->wechat_paid = 0;
            $order->alipay_paid = 0;
            $order->card_paid = 0;
            $order->points_deduct = 0;
            $order->points_gained = 0;
            $order->save();

            $log = new \app\common\model\merchant\OrderTableLog();
            $log->id = self::generateId();
            $log->store_id = $storeId;
            $log->order_id = $order->id;
            $log->table_id = $params['table_id'];
            $log->action = 'create';
            $log->operator_id = $params['operator_id'] ?? '';
            $log->operator_name = $params['operator_name'] ?? '';
            $log->remark = '开台';
            $log->save();

            return self::getDetail($order->id, $storeId);
        } catch (Exception $e) {
            return self::setError('创建失败: ' . $e->getMessage());
        }
    }

    public static function extend(string $id, string $storeId, array $params)
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        if ($order->status != 'in_progress') {
            return self::setError('订单状态不允许加时');
        }

        try {
            $order->duration_minutes = ($order->duration_minutes ?? 0) + ($params['minutes'] ?? 60);
            $order->save();

            return self::getDetail($id, $storeId);
        } catch (Exception $e) {
            return self::setError('加时失败: ' . $e->getMessage());
        }
    }

    /**
     * 暂停订单费用（支持台费和助教费独立暂停）
     * @param string $id 订单ID
     * @param string $storeId 门店ID
     * @param string $pauseType 暂停类型：'table' 或 'assistant'
     */
    public static function pause(string $id, string $storeId, string $pauseType = 'table')
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        if ($order->status != 'in_progress') {
            return self::setError('订单状态不允许暂停');
        }

        // 检查该费用类型是否已在暂停中
        $pausedField = $pauseType . '_paused_at';
        if (!empty($order->$pausedField)) {
            $label = $pauseType === 'table' ? '台费' : '助教费';
            return self::setError($label . '已在暂停中');
        }

        try {
            // 获取上次恢复时间（即本段计费的起始时间）
            $lastResumeTime = self::getLastResumeTime($id, $pauseType) ?? $order->created_at;
            $now = date('Y-m-d H:i:s');

            // 计算本段费用
            $fee = 0;
            $coefficient = 1.0;

            if ($pauseType === 'table' && !empty($order->table_id)) {
                // 使用 PricingCalculatorLogic 计算台费（含时段系数）
                $calcResult = PricingCalculatorLogic::calculateByTableId(
                    $order->table_id,
                    $lastResumeTime,
                    $now,
                    null
                );
                if (!empty($calcResult['success'])) {
                    $fee = $calcResult['total_amount'] ?? 0;
                }

                // 获取当前时段系数（用于记录）
                $currentTime = date('H:i:s');
                $currentPeriod = TimePeriod::where('store_id', $storeId)
                    ->where('status', 1)
                    ->where('start_time', '<=', $currentTime)
                    ->where('end_time', '>', $currentTime)
                    ->order('priority', 'desc')
                    ->find();
                if ($currentPeriod) {
                    $coefficient = (float)($currentPeriod->coefficient ?? 1.0);
                }
            }

            // 写入暂停日志（记录已发生的消费段）
            $pauseLog = new OrderPauseLog();
            $pauseLog->id = bin2hex(random_bytes(16));
            $pauseLog->store_id = $storeId;
            $pauseLog->order_id = $id;
            $pauseLog->pause_type = $pauseType;
            $pauseLog->start_time = $lastResumeTime;
            $pauseLog->end_time = $now;
            $pauseLog->duration_seconds = strtotime($now) - strtotime($lastResumeTime);
            $pauseLog->fee = round($fee, 2);
            $pauseLog->rate_coefficient = $coefficient;
            $pauseLog->save();

            // 设置暂停标记
            $order->$pausedField = $now;
            if ($pauseType === 'table') $order->table_fee_paused = 1;
            if ($pauseType === 'assistant') $order->assistant_fee_paused = 1;
            $order->save();

            // 写入操作日志
            $log = new OrderTableLog();
            $log->id = self::generateId();
            $log->store_id = $storeId;
            $log->order_id = $id;
            $log->table_id = $order->table_id ?? '';
            $log->action = 'pause_' . $pauseType;
            $log->operator_id = request()->employee_id ?? '';
            $log->remark = ($pauseType === 'table' ? '暂停台费' : '暂停助教费');
            $log->save();

            return self::getDetail($id, $storeId);
        } catch (Exception $e) {
            return self::setError('暂停失败: ' . $e->getMessage());
        }
    }

    /**
     * 恢复订单费用（支持台费和助教费独立恢复）
     * @param string $id 订单ID
     * @param string $storeId 门店ID
     * @param string $pauseType 暂停类型：'table' 或 'assistant'
     */
    public static function resume(string $id, string $storeId, string $pauseType = 'table')
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        // 检查该费用类型是否在暂停中
        $pausedField = $pauseType . '_paused_at';
        if (empty($order->$pausedField)) {
            $label = $pauseType === 'table' ? '台费' : '助教费';
            return self::setError($label . '未在暂停中');
        }

        try {
            $now = date('Y-m-d H:i:s');

            // 累计暂停时长 + 清除暂停标记
            if (!empty($order->$pausedField)) {
                $pausedSec = max(0, strtotime($now) - strtotime($order->$pausedField));
                if ($pauseType === 'table') {
                    $order->table_fee_paused_duration = intval($order->table_fee_paused_duration ?? 0) + $pausedSec;
                    $order->table_fee_paused = 0;
                } elseif ($pauseType === 'assistant') {
                    $order->assistant_fee_paused = 0;
                }
            }

            // 清除暂停标记
            $order->$pausedField = null;
            $order->save();

            // 写入操作日志
            $log = new OrderTableLog();
            $log->id = self::generateId();
            $log->store_id = $storeId;
            $log->order_id = $id;
            $log->table_id = $order->table_id ?? '';
            $log->action = 'resume_' . $pauseType;
            $log->operator_id = request()->employee_id ?? '';
            $log->remark = ($pauseType === 'table' ? '恢复台费' : '恢复助教费');
            $log->save();

            return self::getDetail($id, $storeId);
        } catch (Exception $e) {
            return self::setError('恢复失败: ' . $e->getMessage());
        }
    }

    public static function checkout(string $id, string $storeId, array $params)
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        try {
            $finalAmount = ($params['wechat_paid'] ?? 0) 
                + ($params['alipay_paid'] ?? 0) 
                + ($params['cash_paid'] ?? 0) 
                + ($params['balance_paid'] ?? 0)
                + ($params['card_paid'] ?? 0);

            Db::startTrans();

            $order->status = 'completed';
            $order->end_time = date('Y-m-d H:i:s');
            $order->final_amount = $finalAmount;
            $order->balance_paid = $params['balance_paid'] ?? 0;
            $order->cash_paid = $params['cash_paid'] ?? 0;
            $order->wechat_paid = $params['wechat_paid'] ?? 0;
            $order->alipay_paid = $params['alipay_paid'] ?? 0;
            $order->card_paid = $params['card_paid'] ?? 0;
            $order->points_deduct = $params['points_deduct'] ?? 0;
            $order->points_gained = (int)$finalAmount;
            $order->save();

            if ($finalAmount > 0) {
                $payment = new OrderPayment();
                $payment->id = self::generateId();
                $payment->order_id = $id;
                $payment->store_id = $storeId;
                $payment->order_no = $order->order_no;
                $payment->amount = $finalAmount;
                $payment->status = 'paid';
                $payment->paid_at = date('Y-m-d H:i:s');
                $payment->operator_id = $params['operator_id'] ?? '';
                $payment->operator_name = $params['operator_name'] ?? '';

                if ($params['wechat_paid'] > 0) {
                    $payment->payment_method = 'wechat';
                } elseif ($params['alipay_paid'] > 0) {
                    $payment->payment_method = 'alipay';
                } elseif ($params['cash_paid'] > 0) {
                    $payment->payment_method = 'cash';
                } elseif ($params['balance_paid'] > 0) {
                    $payment->payment_method = 'balance';
                } elseif ($params['card_paid'] > 0) {
                    $payment->payment_method = 'card';
                } else {
                    $payment->payment_method = 'other';
                }
                $payment->save();
            }

            Db::commit();

            return self::getDetail($id, $storeId);
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('结账失败: ' . $e->getMessage());
        }
    }

    public static function cancel(string $id, string $storeId, array $params)
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        if ($order->status == 'completed') {
            return self::setError('已完成订单无法取消');
        }

        if ($order->status == 'cancelled') {
            return self::setError('订单已取消');
        }

        try {
            Db::startTrans();

            $cancelReason = $params['reason'] ?? '用户取消';
            $refundAmount = 0;

            if ($order->type === 'table' && !empty($order->table_id)) {
                $table = Table::where('id', $order->table_id)
                    ->where('store_id', $storeId)
                    ->find();

                if ($table) {
                    $table->status = TableStatus::IDLE;
                    $table->save();
                }

                // 取消订单关灯
                if (($order->status ?? '') === 'in_progress') {
                    try {
                        WebSocketNotification::sendLightControl($order->table_id, 'off');
                    } catch (\Exception $e) {
                        // 灯控失败不影响取消流程
                    }
                }
            }

            if ($order->payment_status === 'prepaid' && $order->remaining_minutes > 0) {
                $refundMinutes = $order->remaining_minutes;
                $prepaidHours = $order->prepaid_hours ?? 1;
                $prepaidAmount = floatval($order->prepaid_amount ?? 0);

                if ($prepaidHours > 0) {
                    $hourlyRate = $prepaidAmount / $prepaidHours;
                    $refundAmount = round(($refundMinutes / 60) * $hourlyRate, 2);
                }

                if ($refundAmount > 0 && !empty($order->member_id)) {
                    $member = Member::where('id', $order->member_id)
                        ->where('store_id', $storeId)
                        ->find();

                    if ($member) {
                        $currentBalance = floatval($member->balance);
                        $member->balance = bcadd((string)$currentBalance, (string)$refundAmount, 2);
                        $member->save();
                    }
                }
            }

            if (!empty($order->balance_paid) && floatval($order->balance_paid) > 0) {
                $balancePaid = floatval($order->balance_paid);

                if (!empty($order->member_id)) {
                    $member = Member::where('id', $order->member_id)
                        ->where('store_id', $storeId)
                        ->find();

                    if ($member) {
                        $currentBalance = floatval($member->balance);
                        $member->balance = bcadd((string)$currentBalance, (string)$balancePaid, 2);
                        $member->save();
                    }
                }

                $refundAmount = bcadd((string)$refundAmount, (string)$balancePaid, 2);
            }

            $assistantOrders = AssistantOrder::where('order_id', $id)
                ->whereIn('status', ['pending', 'accepted', 'in_progress'])
                ->whereNull('deleted_at')
                ->select();

            foreach ($assistantOrders as $assistantOrder) {
                $assistantOrder->status = 'cancelled';
                $assistantOrder->remark = '主订单取消，联动取消';
                $assistantOrder->save();
            }

            $order->status = 'cancelled';
            $order->cancel_time = date('Y-m-d H:i:s');
            $order->cancel_reason = $cancelReason;
            $order->refund_amount = $refundAmount;
            $order->remark = $params['remark'] ?? $cancelReason;
            $order->save();

            Db::commit();

            return [
                'order_id' => $id,
                'order_no' => $order->order_no,
                'status' => 'cancelled',
                'cancel_time' => $order->cancel_time,
                'cancel_reason' => $cancelReason,
                'refund_amount' => $refundAmount,
                'message' => '订单取消成功' . ($refundAmount > 0 ? '，已退款' . $refundAmount . '元' : ''),
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('取消失败: ' . $e->getMessage());
        }
    }

    public static function createProductOrder(array $params, string $storeId)
    {
        $orderNo = 'SP' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

        try {
            Db::startTrans();

            $order = new Order();
            $order->id = self::generateId();
            $order->store_id = $storeId;
            $order->order_no = $orderNo;
            $order->type = 'product';
            $order->status = 'completed';
            $order->member_id = $params['member_id'] ?? '';
            $order->member_name = $params['member_name'] ?? '';
            $order->table_id = $params['table_id'] ?? '';
            $order->operator_id = $params['operator_id'] ?? '';
            $order->operator_name = $params['operator_name'] ?? '';
            
            $items = $params['items'] ?? [];
            $totalAmount = 0;
            foreach ($items as $item) {
                $totalAmount += ($item['quantity'] ?? 1) * ($item['unit_price'] ?? 0);
            }
            
            $order->original_amount = $totalAmount;
            $order->discount_amount = 0;
            $order->final_amount = $totalAmount;
            $order->points_gained = (int)$totalAmount;
            $order->save();

            foreach ($items as $item) {
                $orderItem = new OrderItem();
                $orderItem->id = self::generateId();
                $orderItem->order_id = $order->id;
                $orderItem->item_type = 'product';
                $orderItem->product_id = $item['product_id'] ?? '';
                $orderItem->item_name = $item['item_name'] ?? '';
                $orderItem->quantity = $item['quantity'] ?? 1;
                $orderItem->unit = $item['unit'] ?? '件';
                $orderItem->unit_price = $item['unit_price'] ?? 0;
                $orderItem->total_price = $item['total_price'] ?? 0;
                $orderItem->final_price = $item['final_price'] ?? $orderItem->total_price;
                $orderItem->save();
            }

            Db::commit();

            return self::getDetail($order->id, $storeId);
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('创建失败: ' . $e->getMessage());
        }
    }

    public static function createAssistantOrder(array $params, string $storeId)
    {
        $orderNo = 'ZS' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

        try {
            $order = new Order();
            $order->id = self::generateId();
            $order->store_id = $storeId;
            $order->order_no = $orderNo;
            $order->type = 'assistant';
            $order->status = 'in_progress';
            $order->member_id = $params['member_id'] ?? '';
            $order->member_name = $params['member_name'] ?? '';
            $order->assistant_id = $params['assistant_id'] ?? '';
            $order->table_id = $params['table_id'] ?? '';
            $order->operator_id = $params['operator_id'] ?? '';
            $order->operator_name = $params['operator_name'] ?? '';
            $order->start_time = date('Y-m-d H:i:s');
            $order->original_amount = 0;
            $order->discount_amount = 0;
            $order->final_amount = 0;
            $order->balance_paid = 0;
            $order->cash_paid = 0;
            $order->wechat_paid = 0;
            $order->alipay_paid = 0;
            $order->card_paid = 0;
            $order->points_deduct = 0;
            $order->points_gained = 0;
            $order->save();

            return self::getDetail($order->id, $storeId);
        } catch (Exception $e) {
            return self::setError('创建失败: ' . $e->getMessage());
        }
    }

    public static function merge(array $params, string $storeId)
    {
        $orderIds = $params['order_ids'] ?? [];
        if (empty($orderIds)) {
            return self::setError('请选择要合并的订单');
        }

        try {
            $mainOrder = Order::where('id', $orderIds[0])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$mainOrder) {
                return self::setError('主订单不存在');
            }

            $totalAmount = $mainOrder->final_amount;
            $items = [];

            foreach (array_slice($orderIds, 1) as $orderId) {
                $subOrder = Order::where('id', $orderId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();

                if ($subOrder) {
                    $totalAmount += $subOrder->final_amount;
                    $subItems = OrderItem::where('order_id', $orderId)->select()->toArray();
                    $items = array_merge($items, $subItems);
                }
            }

            return [
                'main_order_id' => $orderIds[0],
                'merged_order_ids' => array_slice($orderIds, 1),
                'total_amount' => $totalAmount,
                'items' => $items,
            ];
        } catch (Exception $e) {
            return self::setError('合并失败: ' . $e->getMessage());
        }
    }

    public static function refund(string $id, string $storeId, array $params)
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        if ($order->status != 'completed') {
            return self::setError('只有已完成订单才能退款');
        }

        try {
            $refundAmount = $params['refund_amount'] ?? 0;
            if ($refundAmount > $order->final_amount) {
                return self::setError('退款金额不能超过订单金额');
            }

            $refund = new OrderRefund();
            $refund->id = self::generateId();
            $refund->order_id = $id;
            $refund->store_id = $storeId;
            $refund->order_no = $order->order_no;
            $refund->refund_amount = $refundAmount;
            $refund->refund_method = $params['refund_method'] ?? 'wechat';
            $refund->status = 'refunded';
            $refund->reason = $params['reason'] ?? '';
            $refund->operator_id = $params['operator_id'] ?? '';
            $refund->operator_name = $params['operator_name'] ?? '';
            $refund->save();

            return [
                'order_id' => $id,
                'refund_amount' => $refundAmount,
                'refund_method' => $refund->refund_method,
                'status' => 'refunded',
            ];
        } catch (Exception $e) {
            return self::setError('退款失败: ' . $e->getMessage());
        }
    }

    public static function getInProgress(string $storeId)
    {
        try {
            $orders = Order::where('store_id', $storeId)
                ->where('status', 'in_progress')
                ->whereNull('deleted_at')
                ->order('created_at', 'desc')
                ->select();

            $data = [];
            foreach ($orders as $order) {
                $data[] = self::formatOrder($order);
            }

            return $data;
        } catch (Exception $e) {
            return self::setError('查询失败: ' . $e->getMessage());
        }
    }

    public static function addRemark(string $id, string $storeId, array $params)
    {
        $order = Order::where('id', $id)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return self::setError('订单不存在');
        }

        try {
            $order->remark = $params['remark'] ?? '';
            $order->save();

            return self::getDetail($id, $storeId);
        } catch (Exception $e) {
            return self::setError('添加备注失败: ' . $e->getMessage());
        }
    }

    public static function getOrdersByTable(string $tableId, string $storeId)
    {
        try {
            $orders = Order::where('table_id', $tableId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->whereIn('status', ['in_progress', 'pending', 'paused'])
                ->order('created_at', 'desc')
                ->select();

            $data = [];
            foreach ($orders as $order) {
                $data[] = self::formatOrder($order);
            }

            return $data;
        } catch (Exception $e) {
            return self::setError('查询失败: ' . $e->getMessage());
        }
    }

    public static function batchCheckout(array $params, string $storeId)
    {
        $orderIds = $params['order_ids'] ?? [];
        if (empty($orderIds)) {
            return self::setError('请选择要结账的订单');
        }

        try {
            Db::startTrans();

            $totalAmount = 0;
            $orderCount = 0;

            foreach ($orderIds as $orderId) {
                $order = Order::where('id', $orderId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();

                if (!$order) {
                    continue;
                }

                if ($order->status == 'completed') {
                    continue;
                }

                $finalAmount = ($params['wechat_paid'] ?? 0) 
                    + ($params['alipay_paid'] ?? 0) 
                    + ($params['cash_paid'] ?? 0) 
                    + ($params['balance_paid'] ?? 0)
                    + ($params['card_paid'] ?? 0);

                $order->status = 'completed';
                $order->end_time = date('Y-m-d H:i:s');
                $order->final_amount = $finalAmount;
                $order->balance_paid = $params['balance_paid'] ?? 0;
                $order->cash_paid = $params['cash_paid'] ?? 0;
                $order->wechat_paid = $params['wechat_paid'] ?? 0;
                $order->alipay_paid = $params['alipay_paid'] ?? 0;
                $order->card_paid = $params['card_paid'] ?? 0;
                $order->points_deduct = $params['points_deduct'] ?? 0;
                $order->points_gained = (int)$finalAmount;
                $order->save();

                $totalAmount += $finalAmount;
                $orderCount++;
            }

            if ($totalAmount > 0 && $orderCount > 0) {
                $payment = new OrderPayment();
                $payment->id = self::generateId();
                $payment->order_id = $orderIds[0];
                $payment->store_id = $storeId;
                $payment->order_no = 'MERGE_' . date('YmdHis');
                $payment->amount = $totalAmount;
                $payment->status = 'paid';
                $payment->paid_at = date('Y-m-d H:i:s');
                $payment->operator_id = $params['operator_id'] ?? '';
                $payment->operator_name = $params['operator_name'] ?? '';

                if ($params['wechat_paid'] > 0) {
                    $payment->payment_method = 'wechat';
                } elseif ($params['alipay_paid'] > 0) {
                    $payment->payment_method = 'alipay';
                } elseif ($params['cash_paid'] > 0) {
                    $payment->payment_method = 'cash';
                } elseif ($params['balance_paid'] > 0) {
                    $payment->payment_method = 'balance';
                } elseif ($params['card_paid'] > 0) {
                    $payment->payment_method = 'card';
                } else {
                    $payment->payment_method = 'other';
                }
                $payment->save();
            }

            Db::commit();

            return [
                'success' => true,
                'message' => '结账成功',
                'data' => [
                    'total_amount' => $totalAmount,
                    'paid_amount' => $totalAmount,
                    'order_count' => $orderCount,
                ],
            ];
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('批量结账失败: ' . $e->getMessage());
        }
    }

    /**
     * 获取指定费用类型上次恢复的时间（即本段计费的起始时间）
     * 从暂停日志的 end_time 获取，若无记录则返回 null
     */
    private static function getLastResumeTime(string $orderId, string $pauseType): ?string
    {
        $lastPauseLog = OrderPauseLog::where('order_id', $orderId)
            ->where('pause_type', $pauseType)
            ->order('end_time', 'desc')
            ->find();
        return $lastPauseLog ? $lastPauseLog->end_time : null;
    }

    /**
     * 临时开台（清洁、免费试玩等场景）
     * @param array  $data    包含 table_id, temp_type
     * @param string $storeId 门店ID
     */
    public static function tempOpen(array $data, string $storeId)
    {
        $tableId = $data['table_id'] ?? '';
        if (empty($tableId)) {
            return self::setError('桌台ID不能为空');
        }

        $table = Table::where('id', $tableId)->where('store_id', $storeId)->find();
        if (!$table) return self::setError('桌台不存在');
        if ($table->status !== TableStatus::IDLE) return self::setError('桌台已被占用');

        $tempType = $data['temp_type'] ?? 'cleaning';
        if (!in_array($tempType, ['cleaning', 'free_trial'])) {
            return self::setError('无效的临时类型');
        }

        $orderNo = 'LS' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

        try {
            Db::startTrans();

            $order = new Order();
            $order->id = self::generateId();
            $order->store_id = $storeId;
            $order->order_no = $orderNo;
            $order->order_type = 'temp_' . $tempType;
            $order->type = 'temp_' . $tempType;
            $order->status = 'in_progress';
            $order->table_id = $tableId;
            $order->start_time = date('Y-m-d H:i:s');
            $order->original_amount = 0;
            $order->discount_amount = 0;
            $order->final_amount = 0;
            $order->balance_paid = 0;
            $order->cash_paid = 0;
            $order->wechat_paid = 0;
            $order->alipay_paid = 0;
            $order->card_paid = 0;
            $order->points_deduct = 0;
            $order->points_gained = 0;
            $order->save();

            $table->status = TableStatus::OCCUPIED;
            $table->save();

            $log = new OrderTableLog();
            $log->id = self::generateId();
            $log->store_id = $storeId;
            $log->order_id = $order->id;
            $log->table_id = $tableId;
            $log->action = 'temp_open';
            $log->operator_id = request()->employee_id ?? '';
            $log->remark = $tempType;
            $log->save();

            // 开台开灯
            try {
                WebSocketNotification::sendLightControl($tableId, 'on');
            } catch (\Exception $e) {
                // 灯控失败不影响开台流程
            }

            Db::commit();

            return self::getDetail($order->id, $storeId);
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('临时开台失败: ' . $e->getMessage());
        }
    }

    /**
     * 关闭临时订单 / 转为正式订单
     * @param string $orderId         订单ID
     * @param string $storeId         门店ID
     * @param bool   $convertToNormal 是否转为正式订单（仅 free_trial 类型可用）
     */
    public static function tempClose(string $orderId, string $storeId, bool $convertToNormal = false)
    {
        $order = Order::where('id', $orderId)->where('store_id', $storeId)->find();
        if (!$order) return self::setError('订单不存在');
        if (!in_array($order->type, ['temp_cleaning', 'temp_free_trial'])) {
            return self::setError('非临时订单');
        }

        try {
            Db::startTrans();

            if ($convertToNormal && $order->type === 'temp_free_trial') {
                // 免费试玩转为正式台桌订单
                $order->type = 'table';
                $order->save();
                $action = 'temp_convert';
            } else {
                // 关闭临时订单，释放台桌
                $order->status = 'cancelled';
                $order->end_time = date('Y-m-d H:i:s');
                $order->save();

                $table = Table::where('id', $order->table_id)->find();
                if ($table) {
                    $table->status = TableStatus::IDLE;
                    $table->save();
                }
                $action = 'temp_close';
            }

            $log = new OrderTableLog();
            $log->id = self::generateId();
            $log->store_id = $storeId;
            $log->order_id = $orderId;
            $log->table_id = $order->table_id;
            $log->action = $action;
            $log->operator_id = request()->employee_id ?? '';
            $log->save();

            Db::commit();

            return self::getDetail($orderId, $storeId);
        } catch (Exception $e) {
            Db::rollback();
            return self::setError('操作失败: ' . $e->getMessage());
        }
    }

    private static function generateId()
    {
        return 'order_' . bin2hex(random_bytes(8));
    }

    /**
     * 绑定会员到订单（结算前选择会员，触发折扣计算）
     */
    public static function bindMember(string $orderId, string $storeId, string $memberId)
    {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();
        if (!$order) return self::setError('订单不存在');

        $member = Member::where('id', $memberId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();
        if (!$member) return self::setError('会员不存在');

        $order->member_id = $memberId;
        $order->member_name = $member->name;
        $order->save();

        // 返回更新后的账单（含会员折扣）
        return CheckoutLogic::getBill($orderId, $storeId);
    }

    /**
     * 先付买断 — 创建 prepay_draft + 发起支付（两阶段提交）
     *
     * @param string $orderId
     * @param string $assistantId
     * @param float  $buyoutHours
     * @param string $payChannel wechat_native|wechat_micropay|cash|member_balance
     * @param string $storeId
     * @param bool   $autoStart
     * @return array {item_id, payment_id, pay_url?, amount, status}
     */
    public static function prepayAssistant(
        string $orderId,
        string $assistantId,
        float $buyoutHours,
        string $payChannel,
        string $storeId,
        bool $autoStart = false
    ): array {
        $order = Order::where('id', $orderId)
            ->where('store_id', $storeId)
            ->where('status', 'in_progress')
            ->find();
        if (!$order) return ['error' => '订单不存在或未开台'];

        $assistant = \app\common\model\merchant\Assistant::where('id', $assistantId)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->find();
        if (!$assistant) return ['error' => '助教不存在或未启用'];

        $unitPrice = floatval($assistant->hourly_rate ?? 0);
        if ($unitPrice <= 0) return ['error' => '助教费率未设置'];
        $amount = round($unitPrice * $buyoutHours, 2);

        Db::startTrans();
        try {
            // 守卫1: 行级锁防并发
            $busyItem = OrderItem::alias('oi')
                ->join(Order::getTable() . ' o', 'oi.order_id = o.id')
                ->where('oi.assistant_id', $assistantId)
                ->whereIn('oi.status', ['pending', 'processing', 'serving', 'prepay_draft'])
                ->where('o.status', 'in_progress')
                ->lock(true)
                ->find();

            if ($busyItem) {
                Db::rollback();
                return ['error' => '该助教当前正忙'];
            }

            // 创建 prepay_draft
            $itemId = md5(uniqid((string)mt_rand(), true));
            $orderItem = new OrderItem();
            $orderItem->id = $itemId;
            $orderItem->order_id = $orderId;
            $orderItem->assistant_id = $assistantId;
            $orderItem->item_type = 'assistant';
            $orderItem->item_name = $assistant->name;
            $orderItem->quantity = $buyoutHours;
            $orderItem->unit = '小时';
            $orderItem->unit_price = $unitPrice;
            $orderItem->total_price = $amount;
            $orderItem->final_price = $amount;
            $orderItem->billing_mode = 'flat_rate';
            $orderItem->pay_mode = 'prepaid';
            $orderItem->is_paid = 0;
            $orderItem->status = 'prepay_draft';
            $orderItem->save();

            if ($payChannel === 'cash') {
                // 现金: 直接标记 paid
                $orderItem->is_paid = 1;
                $orderItem->paid_at = date('Y-m-d H:i:s');
                $orderItem->status = 'delivered';
                $orderItem->delivered_at = date('Y-m-d H:i:s');
                if ($autoStart) {
                    $orderItem->status = 'serving';
                    $orderItem->started_at = date('Y-m-d H:i:s');
                }
                $orderItem->save();

                $order->assistant_fee = round(floatval($order->assistant_fee) + $amount, 2);
                $order->save();

                // 记录支付
                $op = new OrderPayment();
                $op->id = 'pay_' . date('YmdHis') . '_' . mt_rand(1000, 9999);
                $op->order_id = $orderId;
                $op->store_id = $storeId;
                $op->order_item_id = $itemId;
                $op->amount = $amount;
                $op->payment_method = 'cash';
                $op->channel = 'cash';
                $op->status = 'paid';
                $op->paid_at = date('Y-m-d H:i:s');
                $op->save();

                Db::commit();

                return [
                    'item_id' => $itemId,
                    'payment_id' => $op->id,
                    'pay_url' => null,
                    'amount' => $amount,
                    'status' => 'paid',
                ];
            }

            if ($payChannel === 'member_balance') {
                // 会员余额支付
                $memberId = $order->member_id ?? null;
                if (empty($memberId)) {
                    Db::rollback();
                    return ['error' => '请先绑定会员'];
                }
                $member = Member::where('id', $memberId)->find();
                if (!$member || floatval($member->balance ?? 0) < $amount) {
                    Db::rollback();
                    return ['error' => '会员余额不足'];
                }

                $member->balance = round(floatval($member->balance) - $amount, 2);
                $member->save();

                $orderItem->is_paid = 1;
                $orderItem->paid_at = date('Y-m-d H:i:s');
                $orderItem->status = 'delivered';
                $orderItem->delivered_at = date('Y-m-d H:i:s');
                if ($autoStart) {
                    $orderItem->status = 'serving';
                    $orderItem->started_at = date('Y-m-d H:i:s');
                }
                $orderItem->save();

                $order->assistant_fee = round(floatval($order->assistant_fee) + $amount, 2);
                $order->save();

                $op = new OrderPayment();
                $op->id = 'pay_' . date('YmdHis') . '_' . mt_rand(1000, 9999);
                $op->order_id = $orderId;
                $op->store_id = $storeId;
                $op->order_item_id = $itemId;
                $op->amount = $amount;
                $op->payment_method = 'member_balance';
                $op->channel = 'member_balance';
                $op->status = 'paid';
                $op->paid_at = date('Y-m-d H:i:s');
                $op->save();

                Db::commit();

                return [
                    'item_id' => $itemId,
                    'payment_id' => $op->id,
                    'pay_url' => null,
                    'amount' => $amount,
                    'status' => 'paid',
                ];
            }

            // 微信支付: COMMIT draft，发起支付
            Db::commit();

            $paymentLogic = new \app\storeapi\logic\PaymentLogic();
            $paymentResult = $paymentLogic->create([
                'order_id' => $orderId,
                'amount' => $amount,
                'trade_type' => $payChannel === 'wechat_micropay' ? 'MICROPAY' : 'NATIVE',
                'item_type' => 'assistant_buyout',
                'order_item_id' => $itemId,
            ], $storeId);

            if (isset($paymentResult['error'])) {
                // 支付创建失败，回滚 draft
                Db::startTrans();
                OrderItem::where('id', $itemId)->where('status', 'prepay_draft')->delete();
                Db::commit();
                return ['error' => $paymentResult['error']];
            }

            return [
                'item_id' => $itemId,
                'payment_id' => $paymentResult['payment_id'] ?? null,
                'pay_url' => $paymentResult['pay_url'] ?? null,
                'amount' => $amount,
                'status' => 'pending',
            ];

        } catch (\Exception $e) {
            try { Db::rollback(); } catch (\Throwable $t) {}
            return ['error' => '操作失败: ' . $e->getMessage()];
        }
    }
}