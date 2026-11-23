<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Table;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Product;
use app\common\model\merchant\AssistantProfile;
use app\common\model\merchant\Pricing;
use app\common\model\merchant\PricingPeriod;
use app\common\constants\TableStatus;
use app\common\logic\TableFeeCalculatorLogic;
use app\common\logic\OrderLogic;
use app\storeapi\logic\order\CheckoutLogic;
use app\storeapi\logic\order\MergeLogic;
use app\storeapi\logic\order\TableOpenLogic;
use think\facade\Db;
use think\facade\Log;

class OrderController extends BaseTabletController
{
    public array $notNeedLogin = ['create', 'quickCreate', 'prepaidCreate', 'addItem', 'getOrder', 'getTableOrder', 'getTableOrders', 'tick', 'checkout', 'mergeCheckout', 'close', 'getBill', 'merge', 'changeTable', 'cancel', 'bookAssistant', 'acceptAssistant', 'startAssistantService', 'endAssistantService', 'cancelAssistant', 'getAssistantOrders'];
    
    private function getTableId(): string
    {
        return $this->request->table_id ?? $this->request->post('table_id', '') ?? $this->request->get('table_id', '');
    }
    
    
    /**
     * 标准化台桌状态值
     */
    private function normalizeTableStatus($status): string
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
    private function isTableAvailable($table): bool
    {
        $normalizedStatus = $this->normalizeTableStatus($table->status);
        return $normalizedStatus === TableStatus::IDLE;
    }
    
    public function quickCreate()
    {
        $data = $this->request->post();
        $tableId = $this->getTableId();
        $storeId = $this->getStoreId();

        $result = TableOpenLogic::quickOpen([
            'table_id' => $tableId,
            'player_count' => $data['player_count'] ?? 2
        ], $storeId);

        if (!$result['success']) {
            return $this->fail($result['message']);
        }

        if (!empty($result['need_confirm'])) {
            return $this->success($result['message'], [
                'need_confirm' => true,
                'token'        => $result['token'],
                'expires_at'   => $result['expires_at'],
            ]);
        }

        return $this->success($result['message'], $result['data']);
    }
    
    public function prepaidCreate()
    {
        $data = $this->request->post();
        $tableId = $this->getTableId();
        $storeId = $this->getStoreId();

        $result = TableOpenLogic::prepaidOpen([
            'table_id' => $tableId,
            'prepaid_hours' => $data['prepaid_hours'] ?? 1,
            'player_count' => $data['player_count'] ?? 2
        ], $storeId);

        if (!$result['success']) {
            return $this->fail($result['message']);
        }

        return $this->success($result['message'], $result['data']);
    }
    
    public function create()
    {
        $data = $this->request->post();
        
        $tableId = $this->getTableId();
        $playerCount = $data['player_count'] ?? 2;
        $needAssistant = $data['need_assistant'] ?? false;
        $prepaidHours = $data['prepaid_hours'] ?? 0;
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return $this->fail('桌台不存在');
        }
        
        if ($table->status != TableStatus::IDLE) {
            return $this->fail('桌台当前不可用');
        }
        
        $activeOrder = Order::where('table_id', $tableId)
            ->where('status', 'in_progress')
            ->find();
            
        if ($activeOrder) {
            return $this->fail('桌台已有进行中的订单');
        }
        
        Db::startTrans();
        
        try {
            $orderNo = date('YmdHis') . mt_rand(1000, 9999);
            
            $order = new Order();
            $order->id = $this->uuid();
            $order->store_id = $this->getStoreId() ?: $table->store_id;
            $order->order_no = $orderNo;
            $hourlyRate = $table->hourly_rate ?? 0;
            $order->type = 'table';
            $order->status = 'in_progress';
            $order->table_id = $tableId;
            $order->start_time = date('Y-m-d H:i:s');
            
            if ($prepaidHours > 0) {
                $discountRate = $prepaidHours >= 2 ? 0.9 : 1.0;
                $originalAmount = $hourlyRate * $prepaidHours;
                $discountAmount = $originalAmount * (1 - $discountRate);
                $finalAmount = $originalAmount * $discountRate;
                
                $order->prepaid_hours = $prepaidHours;
                $order->remaining_minutes = $prepaidHours * 60;
                $order->payment_status = 'paid';
                $order->prepaid_amount = $finalAmount;
                $order->original_amount = $originalAmount;
                $order->discount_amount = $discountAmount;
                $order->final_amount = $finalAmount;
            } else {
                $order->payment_status = 'unpaid';
            }
            
            $order->save();
            
            $orderItem = new OrderItem();
            $orderItem->id = $this->uuid();
            $orderItem->order_id = $order->id;
            $orderItem->item_type = 'table';
            $orderItem->status = 'active';

            if ($prepaidHours > 0) {
                $orderItem->item_name = '预付台费(' . $prepaidHours . '小时)';
                $orderItem->quantity = $prepaidHours;
                $orderItem->unit_price = $hourlyRate;
                $orderItem->total_price = $order->original_amount;
                $orderItem->final_price = $order->final_amount;
            } else {
                $orderItem->item_name = '台费';
                $orderItem->quantity = 1;
                $orderItem->unit_price = $hourlyRate;
                $orderItem->total_price = 0;
                $orderItem->final_price = 0;
            }
            
            $orderItem->unit = '小时';
            $orderItem->save();
            
            $table->status = 'occupied';
            $table->save();
            
            Db::commit();
            
            return $this->success('开台成功', [
                'order_id' => $order->id,
                'order_no' => $order->order_no,
                'start_time' => $order->start_time,
                'hourly_rate' => $hourlyRate,
                'prepaid_hours' => $prepaidHours,
                'order_type' => $prepaidHours > 0 ? 'prepaid' : 'quick'
            ]);
            
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('开台失败: ' . $e->getMessage());
            return $this->fail('开台失败');
        }
    }

    public function addItem()
    {
        $data = $this->request->post();
        
        $orderId = $data['order_id'] ?? '';
        $productId = $data['product_id'] ?? '';
        $quantity = $data['quantity'] ?? 1;
        
        if (!$orderId || !$productId) {
            return $this->fail('参数错误');
        }
        
        $order = Order::where('id', $orderId)->find();
        if (!$order || $order->status != 'in_progress') {
            return $this->fail('订单不存在或已结束');
        }
        
        $product = Product::where('id', $productId)->find();
        if (!$product || $product->status != 1) {
            return $this->fail('商品不存在');
        }
        
        $orderItem = new OrderItem();
        $orderItem->id = $this->uuid();
        $orderItem->order_id = $orderId;
        $orderItem->product_id = $productId;
        $orderItem->item_type = 'product';
        $orderItem->item_name = $product->name;
        $orderItem->quantity = $quantity;
        $orderItem->unit = $product->unit ?? '件';
        $orderItem->unit_price = $product->price;
        $orderItem->total_price = $product->price * $quantity;
        $orderItem->final_price = $product->price * $quantity;
        $orderItem->status = 'pending';
        // 读取门店配置的商品点单处理时限
        $store = \think\facade\Db::name('busi_store')->where('id', $order->store_id)->find();
        $timeoutMinutes = max(1, intval($store['product_order_timeout'] ?? 5));
        $orderItem->expires_at = date('Y-m-d H:i:s', time() + $timeoutMinutes * 60);
        
        if ($orderItem->save()) {
            $order->final_amount += $orderItem->final_price;
            $order->save();
            
            return $this->success('添加成功', [
                'item_id' => $orderItem->id,
                'total_amount' => $order->final_amount
            ]);
        }
        
        return $this->fail('添加失败');
    }

    public function getOrder()
    {
        $orderId = $this->request->get('order_id');
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $order = Order::where('id', $orderId)->find();
        if (!$order) {
            return $this->fail('订单不存在');
        }
        
        $items = OrderItem::where('order_id', $orderId)->select()->toArray();
        
        $orderData = $order->toArray();
        $orderData['items'] = $items;
        
        if ($order->status == 'in_progress' && $order->start_time) {
            $startTime = strtotime($order->start_time);
            $now = time();
            $durationMinutes = floor(($now - $startTime) / 60);
            $orderData['duration_minutes'] = $durationMinutes;
            
            if ($order->prepaid_hours > 0 && $order->remaining_minutes !== null) {
                $orderData['remaining_minutes'] = max(0, $order->remaining_minutes - $durationMinutes);
            }
            
            $table = Table::where('id', $order->table_id)->find();
            if ($table) {
                $hours = $durationMinutes / 60;
                $tableFee = $table->hourly_rate * $hours;
                $orderData['estimated_table_fee'] = $tableFee;
            }
        }
        
        return $this->success('获取成功', $orderData);
    }

    public function getTableOrder()
    {
        $tableId = $this->request->get('table_id');
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $orderData = OrderLogic::getTableCurrentOrder($tableId);
        
        if (!$orderData) {
            return $this->success('获取成功', []);
        }
        
        return $this->success('获取成功', $orderData);
    }

    public function getTableOrders()
    {
        $tableId = $this->request->get('table_id');
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $orders = Order::where('table_id', $tableId)
            ->order('created_at', 'desc')
            ->select()->toArray();
            
        foreach ($orders as &$order) {
            $items = OrderItem::where('order_id', $order['id'])->select()->toArray();
            $order['items'] = $items;
            
            if ($order['start_time'] && $order['end_time']) {
                $startTime = strtotime($order['start_time']);
                $endTime = strtotime($order['end_time']);
                $order['duration_minutes'] = floor(($endTime - $startTime) / 60);
            } elseif ($order['start_time'] && $order['status'] == 'in_progress') {
                $startTime = strtotime($order['start_time']);
                $now = time();
                $order['duration_minutes'] = floor(($now - $startTime) / 60);
                
                if ($order['prepaid_hours'] > 0 && $order['remaining_minutes'] !== null) {
                    $order['remaining_minutes'] = max(0, $order['remaining_minutes'] - $order['duration_minutes']);
                }
            }
        }
        
        return $this->success('获取成功', $orders);
    }

    public function tick()
    {
        $orderId = $this->request->post('order_id');
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $order = Order::where('id', $orderId)->where('status', 'in_progress')->find();
        if (!$order) {
            return $this->fail('订单不存在或已结束');
        }
        
        $startTime = strtotime($order->start_time);
        $now = time();
        $durationMinutes = floor(($now - $startTime) / 60);
        
        $order->duration_minutes = $durationMinutes;
        
        if ($order->prepaid_hours > 0 && $order->remaining_minutes !== null) {
            $remainingMinutes = max(0, $order->remaining_minutes - ($durationMinutes - ($order->duration_minutes ?? 0)));
            $order->remaining_minutes = $remainingMinutes;
        }
        
        $order->save();

        // If prepaid and less than 5 minutes remaining, push checkout_remind
        if (!empty($order->prepaid_hours) && ($order->remaining_minutes ?? 0) <= 5 && ($order->remaining_minutes ?? 0) > 0) {
            try {
                $tableName = \think\facade\Db::name('busi_table')->where('id', $order->table_id)->value('name') ?? '';
                \app\common\lib\WebSocketNotification::sendToGroup('store_' . $order->store_id, [
                    'type' => 'checkout_remind',
                    'data' => [
                        'order_id' => $order->id,
                        'table_name' => $tableName,
                        'remaining_minutes' => $order->remaining_minutes ?? 0,
                    ]
                ]);
            } catch (\Exception $e) {}
        }

        return $this->success('更新成功', [
            'duration_minutes' => $durationMinutes,
            'duration_formatted' => $this->formatDuration($durationMinutes),
            'remaining_minutes' => $order->remaining_minutes
        ]);
    }

    public function checkout()
    {
        $data = $this->request->post();
        
        $orderId = $data['order_id'] ?? '';
        $payType = $data['pay_type'] ?? 'wechat';
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $order = Order::where('id', $orderId)->find();
        if (!$order) {
            return $this->fail('订单不存在');
        }
        
        if ($order->status == 'completed') {
            // 支付回调已处理，返回已完成的订单信息
            $bill = CheckoutLogic::getBill($orderId, $this->getStoreId());
            return $this->success('订单已完成', [
                'order_id' => $order->id,
                'order_no' => $order->order_no,
                'status' => 'completed',
                'final_amount' => $bill['billing']['final_amount'] ?? $order->final_amount,
                'pay_type' => $payType
            ]);
        }

        // 调用统一结账逻辑（创建 OrderPayment + 完成订单）
        $params = [
            'wechat_paid'  => $payType === 'wechat' ? floatval($order->prepaid_amount > 0 ? $order->prepaid_amount : $order->final_amount) : 0,
            'cash_paid'    => $payType === 'cash' ? floatval($order->final_amount) : 0,
            'balance_paid' => 0,
            'alipay_paid'  => 0,
            'card_paid'    => 0,
            'channel'      => $payType === 'cash' ? 'cash' : 'wechat',
            'remark'       => '平板端结账',
        ];

        $result = CheckoutLogic::checkout($orderId, $this->getStoreId(), $params);
        if ($result === false) {
            return $this->fail(CheckoutLogic::getError());
        }

        return $this->success('结账成功', $result);
    }

    public function mergeCheckout()
    {
        $data = $this->request->post();
        
        $orderIds = $data['order_ids'] ?? [];
        $payType = $data['pay_type'] ?? 'wechat';
        
        if (empty($orderIds)) {
            return $this->fail('订单ID列表不能为空');
        }
        
        $totalAmount = 0;
        $orderCount = 0;

        foreach ($orderIds as $orderId) {
            $order = Order::where('id', $orderId)->find();
            if (!$order || $order->status === 'completed') continue;

            $params = [
                'wechat_paid'  => $payType === 'wechat' ? floatval($order->prepaid_amount > 0 ? $order->prepaid_amount : $order->final_amount) : 0,
                'cash_paid'    => $payType === 'cash' ? floatval($order->final_amount) : 0,
                'balance_paid' => 0,
                'alipay_paid'  => 0,
                'card_paid'    => 0,
                'channel'      => $payType === 'cash' ? 'cash' : 'wechat',
                'remark'       => '平板端合并结账',
            ];

            $result = CheckoutLogic::checkout($orderId, $this->getStoreId(), $params);
            if ($result !== false) {
                $totalAmount += floatval($result['final_amount'] ?? 0);
                $orderCount++;
            }
        }

        return $this->success('合并结账成功', [
            'total_amount' => $totalAmount,
            'order_count' => $orderCount,
            'pay_type' => $payType
        ]);
    }

    public function close()
    {
        $data = $this->request->post();
        
        $orderId = $data['order_id'] ?? '';
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $order = Order::where('id', $orderId)->find();
        if (!$order) {
            return $this->fail('订单不存在');
        }
        
        Db::startTrans();
        
        try {
            $startTime = strtotime($order->start_time);
            $endTime = time();
            $durationMinutes = floor(($endTime - $startTime) / 60);
            
            $table = Table::where('id', $order->table_id)->find();
            
            if ($order->prepaid_hours > 0) {
                $order->end_time = date('Y-m-d H:i:s');
                $order->duration_minutes = $durationMinutes;
                $order->status = 'completed';
                
                if ($order->remaining_minutes !== null && $order->remaining_minutes > 0) {
                    $refundMinutes = $order->remaining_minutes;
                    $refundAmount = ($refundMinutes / 60) * $table->hourly_rate;
                    $order->final_amount = max(0, $order->final_amount - $refundAmount);
                }
            } else {
                $tableFee = $table ? $table->hourly_rate * ($durationMinutes / 60) : 0;
                
                $order->end_time = date('Y-m-d H:i:s');
                $order->duration_minutes = $durationMinutes;
                $order->status = 'completed';
                $order->final_amount = $order->final_amount + $tableFee;
                
                $orderItem = OrderItem::where('order_id', $orderId)->where('item_type', 'table')->find();
                if ($orderItem) {
                    $orderItem->total_price = $tableFee;
                    $orderItem->final_price = $tableFee;
                    $orderItem->save();
                }
            }
            
            $order->save();
            
            $table->status = TableStatus::IDLE;
            $table->save();
            
            Db::commit();
            
            return $this->success('关台成功', [
                'order_id' => $order->id,
                'status' => 'completed',
                'final_amount' => $order->final_amount,
                'duration_minutes' => $durationMinutes
            ]);
            
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('关台失败: ' . $e->getMessage());
            return $this->fail('关台失败');
        }
    }

    public function getBill()
    {
        $orderId = $this->request->get('order_id');
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $result = CheckoutLogic::getBill($orderId, $this->getStoreId());
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('获取成功', $result);
    }

    public function merge()
    {
        $data = $this->request->post();
        $orderIds = $data['order_ids'] ?? [];
        
        if (count($orderIds) < 2) {
            return $this->fail('至少需要选择2个订单进行合并');
        }
        
        $result = MergeLogic::mergeOrders($orderIds, $this->getStoreId());
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('并台成功', $result);
    }

    public function changeTable()
    {
        $data = $this->request->post();
        $orderId = $data['order_id'] ?? '';
        $newTableId = $data['new_table_id'] ?? '';
        
        if (!$orderId || !$newTableId) {
            return $this->fail('参数错误');
        }
        
        $result = MergeLogic::changeTable($orderId, $newTableId, $this->getStoreId());
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('换台成功', $result);
    }

    public function cancel()
    {
        $data = $this->request->post();
        $orderId = $data['order_id'] ?? '';
        $reason = $data['reason'] ?? '';
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $result = OrderLogic::cancel($orderId, $this->getStoreId(), [
            'reason' => $reason
        ]);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('取消成功', $result);
    }

    public function getOrderFee()
    {
        $orderId = $this->request->get('order_id');
        $tableId = $this->request->get('table_id');
        
        if (!$orderId && !$tableId) {
            return $this->fail('订单ID或桌台ID不能为空');
        }
        
        if ($orderId) {
            $order = Order::where('id', $orderId)->find();
            if (!$order) {
                return $this->fail('订单不存在');
            }
            
            $fee = TableFeeCalculatorLogic::calculateOrderFee($order);
            $pricingInfo = [];
            
            $table = Table::where('id', $order->table_id)->find();
            if ($table) {
                $calculator = new TableFeeCalculatorLogic($table, $order);
                $pricingInfo = $calculator->getPricingInfo();
            }
            
            $startTime = strtotime($order->start_time);
            $now = time();
            $durationMinutes = floor(($now - $startTime) / 60);
            
            return $this->success('获取成功', [
                'order_id' => $order->id,
                'fee' => $fee,
                'duration_minutes' => $durationMinutes,
                'pricing_info' => $pricingInfo,
                'current_rate' => $pricingInfo['current_rate'] ?? 0,
            ]);
        }
        
        if ($tableId) {
            $rate = TableFeeCalculatorLogic::getTableCurrentRate($tableId);
            return $this->success('获取成功', [
                'table_id' => $tableId,
                'current_rate' => $rate,
            ]);
        }
        
        return $this->fail('参数错误');
    }

    private function formatDuration($minutes)
    {
        $hours = floor($minutes / 60);
        $mins = $minutes % 60;
        return sprintf('%02d:%02d', $hours, $mins);
    }

    protected function uuid(): string
    {
        return md5(uniqid(mt_rand(), true));
    }

    public function addProductItem()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();
        
        if (empty($data['order_id']) || empty($data['product_id'])) {
            return $this->fail('参数错误');
        }
        
        $result = OrderLogic::addItem($data['order_id'], $data, $storeId);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('添加成功', $result);
    }

    public function createPreOrder()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['order_id']) || empty($data['items']) || !is_array($data['items'])) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::createPreOrder($data['order_id'], $data['items'], $storeId);

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('预订单已提交', $result);
    }

    public function confirmPreOrder()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['preorder_group_id'])) {
            return $this->fail('参数错误');
        }

        $employeeId = $data['employee_id'] ?? 'system';
        $result = OrderLogic::confirmPreOrder($data['preorder_group_id'], $employeeId, $storeId);

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('预订单已确认', $result);
    }

    public function rejectPreOrder()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['preorder_group_id'])) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::rejectPreOrder($data['preorder_group_id']);

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('预订单已拒绝', $result);
    }

    public function getPreOrders()
    {
        $orderId = $this->request->get('order_id', '');
        $storeId = $this->getStoreId();

        if (empty($orderId)) {
            return $this->fail('参数错误');
        }

        $groups = OrderLogic::getPreOrders($orderId);

        return $this->success('获取成功', ['groups' => $groups]);
    }

    public function acceptItem()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();
        
        if (empty($data['item_id']) || empty($data['employee_id'])) {
            return $this->fail('参数错误');
        }
        
        $result = OrderLogic::acceptItem($data['item_id'], $data['employee_id'], $storeId);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('接单成功', $result);
    }

    public function deliverItem()
    {
        $data = $this->request->post();
        
        if (empty($data['item_id'])) {
            return $this->fail('参数错误');
        }
        
        $result = OrderLogic::deliverItem($data['item_id']);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('送达成功', $result);
    }

    public function pendingItems()
    {
        $storeId = $this->getStoreId();
        
        $items = OrderLogic::getPendingItems($storeId);
        
        return $this->success('获取成功', [
            'list' => $items,
            'total' => count($items)
        ]);
    }

    public function notifications()
    {
        $params = $this->request->get();
        $storeId = $this->getStoreId();
        $lastTime = $params['last_time'] ?? null;
        
        $result = \app\common\logic\NotificationLogic::getNotificationsSince($storeId, $lastTime);
        
        return $this->success('获取成功', $result);
    }

    public function removeItem()
    {
        $input = json_decode(file_get_contents('php://input'), true) ?: [];
        $itemId = $input['item_id'] ?? $this->request->delete('item_id', '') ?: $this->request->post('item_id', '');
        
        if (empty($itemId)) {
            return $this->fail('参数错误');
        }
        
        $item = OrderItem::where('id', $itemId)->find();
        if (!$item) {
            return $this->fail('订单项不存在');
        }
        
        $order = Order::where('id', $item->order_id)->find();
        if ($order && $order->status != 'in_progress') {
            return $this->fail('订单已结束，无法修改');
        }
        
        Db::startTrans();
        
        try {
            if ($item->status == 'preorder_pending' && $order) {
                $product = Product::where('id', $item->product_id)->find();
                if ($product) {
                    $product->stock += $item->quantity;
                    $product->save();
                }
            }
            
            if ($item->status == 'pending' && $order) {
                $order->final_amount = max(0, ($order->final_amount ?? 0) - $item->final_price);
                $order->save();
            }
            
            $item->delete();
            
            Db::commit();
            
            return $this->success('删除成功');
            
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('删除订单项失败: ' . $e->getMessage());
            return $this->fail('删除失败');
        }
    }

    public function updateItem()
    {
        $data = $this->request->put();
        $itemId = $data['item_id'] ?? '';
        $quantity = $data['quantity'] ?? null;
        
        if (empty($itemId)) {
            return $this->fail('参数错误');
        }
        
        $item = OrderItem::where('id', $itemId)->find();
        if (!$item) {
            return $this->fail('订单项不存在');
        }
        
        if ($quantity !== null) {
            $item->quantity = (int)$quantity;
            $item->total_price = $item->unit_price * (int)$quantity;
            $item->final_price = $item->total_price;
        }
        
        if ($item->save()) {
            return $this->success('更新成功');
        }
        
        return $this->fail('更新失败');
    }

    public function bookAssistant()
    {
        $data = $this->request->post();
        $orderId = $data['order_id'] ?? '';
        $assistantId = $data['assistant_id'] ?? '';

        if (!$orderId || !$assistantId) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::bookAssistant($orderId, $assistantId, $this->getStoreId());

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('预约成功', $result);
    }

    public function acceptAssistant()
    {
        $itemId = $this->request->post('item_id', '');

        if (!$itemId) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::acceptAssistant($itemId, $this->getStoreId());

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('已接单', $result);
    }

    public function startAssistantService()
    {
        $itemId = $this->request->post('item_id', '');

        if (!$itemId) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::startAssistantService($itemId, $this->getStoreId());

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('服务已开始', $result);
    }

    public function endAssistantService()
    {
        $itemId = $this->request->post('item_id', '');

        if (!$itemId) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::endAssistantService($itemId, $this->getStoreId());

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('服务已结束', $result);
    }

    public function cancelAssistant()
    {
        $itemId = $this->request->post('item_id', '');

        if (!$itemId) {
            return $this->fail('参数错误');
        }

        $result = OrderLogic::cancelAssistant($itemId, $this->getStoreId());

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('已取消', $result);
    }

    public function getAssistantOrders()
    {
        $orderId = $this->request->get('order_id', '');

        if (!$orderId) {
            return $this->fail('参数错误');
        }

        // 聚合自身 + 并入子订单的助教 items
        $orderIds = [$orderId];
        $mergedIds = \think\facade\Db::name('busi_order')
            ->where('merged_to_order_id', $orderId)
            ->where('status', 'completed')
            ->column('id');
        $orderIds = array_merge($orderIds, $mergedIds);

        $items = OrderItem::whereIn('order_id', $orderIds)
            ->where('item_type', 'assistant')
            ->order('created_at', 'desc')
            ->select();

        $data = [];
        foreach ($items as $item) {
            $assistant = \app\common\model\merchant\Assistant::where('id', $item->assistant_id)->find();
            $profile = $assistant ? \app\common\model\merchant\AssistantProfile::where('employee_id', $assistant->employee_id)->find() : null;
            $avatar = $profile ? ($profile->avatar ?: ($assistant->avatar ?? '')) : ($assistant->avatar ?? '');
            $album = $profile ? ($profile->album ?: []) : [];
            $duration = '';
            if ($item->started_at) {
                $start = strtotime($item->started_at);
                $end = $item->ended_at ? strtotime($item->ended_at) : time();
                $diff = $end - $start;
                $duration = sprintf('%02d:%02d:%02d', intdiv($diff, 3600), intdiv($diff % 3600, 60), $diff % 60);
            }
            $data[] = [
                'item_id' => $item->id,
                'assistant_id' => $item->assistant_id,
                'assistant_name' => $assistant ? $assistant->name : '',
                'assistant_avatar' => $avatar,
                'hourly_rate' => (float)$item->unit_price,
                'status' => $item->status,
                'status_text' => self::getAssistantStatusText($item->status),
                'started_at' => $item->started_at,
                'duration' => $duration,
                'final_price' => (float)($item->final_price ?? 0),
                'total_price' => (float)($item->total_price ?? 0),
            ];
        }

        return $this->success('获取成功', $data);
    }

    /**
     * 获取可合并的订单列表
     * GET /tablet.Order/getMergeableOrders
     */
    public function getMergeableOrders()
    {
        $tableId = $this->getTableId();
        $storeId = $this->storeId;

        if (empty($tableId)) {
            return $this->fail('桌台ID不能为空');
        }

        $orders = Order::where('table_id', '<>', $tableId)
            ->where('store_id', $storeId)
            ->where('status', 'in_progress')
            ->field(['id', 'order_no', 'table_id', 'status', 'total_amount', 'start_time'])
            ->select()
            ->toArray();

        foreach ($orders as &$order) {
            $table = Table::find($order['table_id'] ?? 0);
            $order['table_name'] = $table ? ($table['name'] ?? $table['number'] ?? '') : '';
        }

        return $this->success('获取成功', $orders);
    }

    /**
     * 获取可用（空闲）的台桌列表
     * GET /tablet.Order/getAvailableTables
     */
    public function getAvailableTables()
    {
        $tableId = $this->getTableId();
        $storeId = $this->storeId;

        $tables = Table::where('store_id', $storeId)
            ->where('status', TableStatus::IDLE)
            ->where('id', '<>', $tableId)
            ->field(['id', 'name', 'number', 'type', 'hourly_rate', 'status', 'zone_id'])
            ->select()
            ->toArray();

        return $this->success('获取成功', $tables);
    }

    private function getAssistantStatusText(string $status): string
    {
        $map = [
            'pending' => '待处理',
            'processing' => '已确认',
            'serving' => '服务中',
            'completed' => '已完成',
        ];
        return $map[$status] ?? $status;
    }

    /**
     * 平板端绑定会员（顾客输入手机号）
     */
    public function bindMember()
    {
        $orderId = $this->request->post('order_id');
        $phone = $this->request->post('phone', '');

        if (empty($orderId)) return JsonService::fail('缺少订单ID');
        if (empty($phone)) return JsonService::fail('请输入手机号');

        // 通过手机号查找会员
        $member = \app\common\model\merchant\Member::where('phone', $phone)
            ->where('store_id', $this->storeId)
            ->whereNull('deleted_at')
            ->find();
        if (!$member) return JsonService::fail('未找到该手机号对应的会员');

        $result = \app\storeapi\logic\order\OrderLogic::bindMember($orderId, $this->storeId, $member->id);
        if (\app\storeapi\logic\order\OrderLogic::hasError()) return JsonService::fail(\app\storeapi\logic\order\OrderLogic::getError());
        return JsonService::success($result);
    }
}