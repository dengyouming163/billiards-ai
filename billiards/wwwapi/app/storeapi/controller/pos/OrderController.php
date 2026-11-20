<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use app\common\model\merchant\Member;
use app\common\model\merchant\Product;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\OrderTableLog;
use app\common\logic\OrderLogic;
use app\storeapi\logic\order\MergeLogic;
use app\storeapi\logic\order\CheckoutLogic;
use app\common\constants\TableStatus;
use app\storeapi\logic\order\TableOpenLogic;
use app\storeapi\logic\order\OrderLogic as StoreOrderLogic;
use app\common\service\JsonService;
use think\facade\Db;
use think\facade\Log;

class OrderController extends BasePosController
{
    public function getStoreId(): string
    {
        return $this->storeId;
    }

    public function getCurrentOrder()
    {
        $tableId = $this->request->get('table_id', '');

        if (empty($tableId)) {
            return $this->fail('台桌ID不能为空');
        }

        $orderData = OrderLogic::getTableCurrentOrder($tableId);

        if (!$orderData) {
            return $this->success('获取成功', []);
        }

        return $this->success('获取成功', $orderData);
    }

    /**
     * 获取订单权威账单（与 mobile 端共用 CheckoutLogic::getBill）
     * 返回含服务端计费计算的完整账单，包括台费/商品费/助教费/会员折扣/时段系数等
     */
    public function bill()
    {
        $orderId = $this->request->get('order_id', '');

        if (empty($orderId)) {
            return $this->fail('订单ID不能为空');
        }

        $storeId = $this->getStoreId();
        $bill = CheckoutLogic::getBill($orderId, $storeId);

        if ($bill === false) {
            return $this->fail(CheckoutLogic::getError());
        }

        // 将 items 替换为平板同款格式（name/price/image），前端展示统一
        $order = \app\common\model\merchant\Order::where('id', $orderId)->find();
        if ($order) {
            $formatted = \app\common\logic\OrderLogic::formatOrderData($order);
            $bill['items'] = $formatted['items'] ?? $bill['items'];
        }

        return $this->success('获取成功', $bill);
    }

    /**
     * POS 收银端直接开台
     * POST /pos.Order/open { table_id, player_count?, prepaid_hours? }
     *
     * 收银端是开台确认方，强制跳过平板确认流程（$force=true）
     */
    public function open()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['table_id'])) {
            return $this->fail('台桌ID不能为空');
        }

        // 收银端直接开台，跳过 open_table_confirm 确认流程
        $result = TableOpenLogic::quickOpen([
            'table_id'     => $data['table_id'],
            'player_count' => $data['player_count'] ?? 1,
            'prepaid_hours' => $data['prepaid_hours'] ?? 0,
        ], $storeId, true);

        if (!$result['success']) {
            return $this->fail($result['message'] ?? '开台失败');
        }

        return $this->success('开台成功', $result['data'] ?? []);
    }

    /**
     * POS 确认/拒绝开台请求
     * POST /pos.Order/confirmOpen { token, action }
     */
    public function confirmOpen()
    {
        $token  = $this->request->post('token', '');
        $action = $this->request->post('action', 'confirm');

        if (empty($token)) return JsonService::fail('缺少 token');

        $data = \think\facade\Cache::get('open_confirm_' . $token);
        if (!$data) return JsonService::fail('确认请求已过期或不存在');

        \think\facade\Cache::delete('open_confirm_' . $token);

        $tableName = $data['table_name'] ?? '';
        $storeId   = $data['store_id'] ?? $this->storeId;

        // 从待处理列表中移除
        $pendingKey = 'pending_open_requests_' . $storeId;
        $pending = \think\facade\Cache::get($pendingKey) ?: [];
        $pending = array_filter($pending, fn($t) => $t !== $token);
        \think\facade\Cache::set($pendingKey, $pending, 120);

        if ($action === 'confirm') {
            $result = \app\storeapi\logic\order\TableOpenLogic::quickOpen([
                'table_id'     => $data['table_id'],
                'player_count' => $data['player_count'],
            ], $storeId, true);

            try {
                \app\common\lib\WebSocketNotification::sendToGroup("store_{$storeId}", [
                    'type' => 'table_open_confirmed',
                    'data' => [
                        'table_name'   => $tableName,
                        'player_count' => $data['player_count'],
                        'order_id'     => $result['data']['order_id'] ?? '',
                    ]
                ]);
            } catch (\Exception $e) {
                \think\facade\Log::warning('[POS] confirmOpen WS推送失败: ' . $e->getMessage());
            }

            return JsonService::success('已确认开台', $result['data'] ?? []);
        }

        try {
            \app\common\lib\WebSocketNotification::sendToGroup("store_{$storeId}", [
                'type' => 'table_open_rejected',
                'data' => ['table_name' => $tableName]
            ]);
        } catch (\Exception $e) {
            \think\facade\Log::warning('[POS] confirmOpen 拒绝WS推送失败: ' . $e->getMessage());
        }

        return JsonService::success('已拒绝开台请求');
    }

    /**
     * 获取当前门店所有待处理的开台确认请求
     * GET /pos.Order/pendingConfirmRequests
     */
    public function pendingConfirmRequests()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }

        $pendingKey = 'pending_open_requests_' . $storeId;
        $tokens = \think\facade\Cache::get($pendingKey) ?: [];
        $requests = [];

        foreach ($tokens as $token) {
            $data = \think\facade\Cache::get('open_confirm_' . $token);
            if (!$data) continue;
            if (($data['expires_at'] ?? 0) < time()) continue; // 跳过过期
            $requests[] = [
                'token'        => $token,
                'table_id'     => $data['table_id'] ?? '',
                'table_name'   => $data['table_name'] ?? '',
                'player_count' => $data['player_count'] ?? 0,
                'expires_at'   => $data['expires_at'] ?? 0,
                'timeout'      => $data['timeout'] ?? 1,
                'store_id'     => $data['store_id'] ?? '',
            ];
        }

        return $this->success('获取成功', $requests);
    }

    public function addProductItem()
    {
        $data = $this->request->post();
        $storeId = $this->storeId;
        $quantity = (int)($data['quantity'] ?? 1);
        if ($quantity <= 0) {
            return $this->fail('数量必须大于0');
        }
        if (empty($data['order_id']) || empty($data['product_id'])) {
            return $this->fail('参数错误');
        }

        Db::startTrans();
        try {
            $order = Order::where('id', $data['order_id'])
                ->where('store_id', $storeId)
                ->lock(true)
                ->find();
            if (!$order) {
                Db::rollback();
                return $this->fail('订单不存在');
            }
            if ($order->status !== 'in_progress') {
                Db::rollback();
                return $this->fail('订单状态不正确，当前状态：' . $order->status);
            }

            $product = Product::where('id', $data['product_id'])
                ->where('store_id', $storeId)
                ->lock(true)
                ->find();
            if (!$product) {
                Db::rollback();
                return $this->fail('商品不存在');
            }
            if ($product->status != 1) {
                Db::rollback();
                return $this->fail('商品已下架');
            }
            if ($product->stock < $quantity) {
                Db::rollback();
                return $this->fail('商品库存不足，当前库存：' . $product->stock);
            }

            $unitPrice = (float)$product->price;
            $totalPrice = round($unitPrice * $quantity, 2);

            $orderItem = new OrderItem();
            $orderItem->id = $this->uuid();
            $orderItem->order_id = $data['order_id'];
            $orderItem->product_id = $data['product_id'];
            $orderItem->item_type = 'product';
            $orderItem->item_name = $product->name;
            $orderItem->quantity = $quantity;
            $orderItem->unit = $product->unit ?? '件';
            $orderItem->unit_price = $unitPrice;
            $orderItem->total_price = $totalPrice;
            $orderItem->final_price = $totalPrice;
            $orderItem->status = 'delivered';
            $orderItem->delivered_at = date('Y-m-d H:i:s');
            if ($orderItem->save() === false) {
                Db::rollback();
                return $this->fail('创建订单项失败');
            }

            $beforeStock = $product->stock;
            $product->stock = $beforeStock - $quantity;
            if ($product->save() === false) {
                Db::rollback();
                return $this->fail('更新库存失败');
            }

            $order->final_amount = round(($order->final_amount ?? 0) + $totalPrice, 2);
            if ($order->save() === false) {
                Db::rollback();
                return $this->fail('更新订单金额失败');
            }

            Db::commit();

            // 推送 WebSocket 通知
            try {
                \app\common\lib\WebSocketNotification::sendToGroup("store_{$storeId}", [
                    'type' => 'new_order_item',
                    'data' => [
                        'order_id' => $order->id,
                        'table_id' => $order->table_id,
                        'table_name' => $order->table_name ?? '',
                        'item_name' => $product->name,
                        'quantity' => $quantity,
                        'total_price' => $totalPrice,
                    ]
                ]);
            } catch (\Exception $e) {
                Log::warning('WS push failed for new_order_item: ' . $e->getMessage());
            }

            return $this->success('添加成功', [
                'item_id' => $orderItem->id,
                'total_amount' => $order->final_amount,
            ]);
        } catch (\Exception $e) {
            if (Db::getInstance()->inTransaction()) {
                Db::rollback();
            }
            Log::error('POS addProductItem失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return $this->fail('添加商品失败，请稍后重试');
        }
    }

    public function addAssistantItem()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['order_id']) || empty($data['assistant_id'])) {
            return $this->fail('参数错误');
        }

        $order = Order::where('id', $data['order_id'])
            ->where('store_id', $storeId)
            ->where('status', 'in_progress')
            ->find();

        if (!$order) {
            return $this->fail('订单不存在或未开台');
        }

        $assistant = Assistant::where('id', $data['assistant_id'])
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->find();

        if (!$assistant) {
            return $this->fail('助教不存在或未启用');
        }

        $autoStart = !empty($data['auto_start']);
        $now = date('Y-m-d H:i:s');

        Db::startTrans();
        try {
            // 检查助教是否在当前进行中的订单中忙碌（排除已完结订单的残留记录）
            $busyItem = OrderItem::alias('oi')
                ->join(Order::getTable() . ' o', 'oi.order_id = o.id')
                ->where('oi.assistant_id', $data['assistant_id'])
                ->whereIn('oi.status', ['pending', 'processing', 'serving', 'prepay_draft'])
                ->where('o.status', 'in_progress')
                ->lock(true)
                ->find();

            if ($busyItem) {
                Db::rollback();
                return $this->fail('该助教当前正忙');
            }

            $payMode = $data['pay_mode'] ?? 'postpaid';
            $orderItem = new OrderItem();
            $orderItem->id = $this->uuid();
            $orderItem->order_id = $data['order_id'];
            $orderItem->assistant_id = $data['assistant_id'];
            $orderItem->item_type = 'assistant';
            $orderItem->item_name = $assistant->name;
            $orderItem->quantity = 0;
            $orderItem->unit = '小时';
            $orderItem->unit_price = $assistant->hourly_rate ?? 0;
            $orderItem->total_price = 0;
            $orderItem->final_price = 0;
            $orderItem->status = 'pending';
            $orderItem->billing_mode = $data["billing_mode"] ?? "realtime";
            $orderItem->pay_mode = $payMode;
            $orderItem->is_paid = 0;
            if (($data["billing_mode"] ?? "realtime") === "flat_rate" && floatval($data["buyout_hours"] ?? 0) > 0) {
                $hours = floatval($data["buyout_hours"]);
                $total = round(floatval($orderItem->unit_price) * $hours, 2);
                $orderItem->quantity = $hours;
                $orderItem->total_price = $total;
                $orderItem->final_price = $total;
                // 先付买断: 创建 prepay_draft（支付完才 delivered）
                // 后付买断: 直接 delivered
                $orderItem->status = ($payMode === 'prepaid') ? 'prepay_draft' : 'delivered';
                if ($payMode !== 'prepaid') {
                    $orderItem->delivered_at = date("Y-m-d H:i:s");
                }
            }
            $orderItem->save();

            if ($autoStart) {
                $orderItem->status = 'serving';
                $orderItem->started_at = $now;
                $orderItem->save();
            }

            Db::commit();

            // 推送 WebSocket 通知
            try {
                \app\common\lib\WebSocketNotification::sendToGroup(
                    "store_{$storeId}",
                    [
                        'type' => 'assistant_apply',
                        'data' => [
                            'table_id' => $order->table_id,
                            'table_name' => $order->table_name ?? '',
                            'assistant_id' => $data['assistant_id'],
                            'assistant_name' => $assistant->name,
                            'order_id' => $data['order_id'],
                        ]
                    ]
                );
            } catch (\Exception $e) {
                Log::warning('WebSocket push failed for assistant_apply: ' . $e->getMessage());
            }

            // 写入通知表
            try {
                \app\common\logic\NotificationLogic::createNotification(
                    $storeId,
                    'assistant_apply',
                    ($order->table_name ?? '?号桌') . ' 申请助教 ' . $assistant->name,
                    json_encode([
                        'table_id' => $order->table_id,
                        'table_name' => $order->table_name,
                        'assistant_id' => $data['assistant_id'],
                        'assistant_name' => $assistant->name,
                        'order_id' => $data['order_id'],
                    ])
                );
            } catch (\Exception $e) {
                Log::warning('Notification create failed for assistant_apply: ' . $e->getMessage());
            }
        } catch (\Exception $e) {
            Db::rollback();
            return $this->fail('添加助教失败: ' . $e->getMessage());
        }

        $itemData = [
            'item_id' => $orderItem->id,
            'assistant_id' => $data['assistant_id'],
            'assistant_name' => $assistant->name,
            'hourly_rate' => (float)$assistant->hourly_rate,
            'status' => $orderItem->status,
        ];

        if ($autoStart) {
            $itemData['started_at'] = $orderItem->started_at;
        }

        return $this->success('添加成功', $itemData);
    }

    /**
     * 先付买断 — 创建 prepay_draft + 发起支付
     * POST /pos.Order/prepayAssistant
     */
    public function prepayAssistant()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['order_id']) || empty($data['assistant_id']) || empty($data['buyout_hours'])) {
            return $this->fail('参数错误: 缺少 order_id/assistant_id/buyout_hours');
        }

        $result = \app\storeapi\logic\order\OrderLogic::prepayAssistant(
            $data['order_id'],
            $data['assistant_id'],
            floatval($data['buyout_hours']),
            $data['pay_channel'] ?? 'wechat_native',
            $storeId,
            !empty($data['auto_start'])
        );

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('OK', $result);
    }

    /**
     * 取消订单项（设为 cancelled 状态）
     */
    public function cancelItem()
    {
        $itemId = $this->request->post('item_id', '');
        if (empty($itemId)) {
            return $this->fail('参数错误');
        }

        $item = OrderItem::where('id', $itemId)->find();
        if (!$item) {
            return $this->fail('订单项不存在');
        }

        $item->status = 'cancelled';
        $item->save();

        return $this->success('已取消');
    }

    public function removeItem()
    {
        $itemId = $this->request->post('item_id', '');

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
            return $this->fail('删除失败');
        }
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

        $storeId = $this->getStoreId();
        $employeeId = $this->getEmployeeId() ?? '';
        $result = OrderLogic::deliverItem($data['item_id'], $storeId, $employeeId);

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('送达成功', $result);
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

    public function bindMember()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['order_id']) || empty($data['member_id'])) {
            return $this->fail('参数错误');
        }

        $order = Order::where('id', $data['order_id'])
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();

        if (!$order) {
            return $this->fail('订单不存在');
        }

        $member = Member::where('id', $data['member_id'])
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->find();

        if (!$member) {
            return $this->fail('会员不存在');
        }

        $order->member_id = $data['member_id'];
        $order->member_name = $member->name ?? '';
        $order->save();

        return $this->success('绑定成功', [
            'order_id' => $order->id,
            'member_id' => $order->member_id,
            'member_name' => $order->member_name,
        ]);
    }

    public function changeTable()
    {
        $data = $this->request->post();
        $orderId = $data['order_id'] ?? '';
        $targetTableId = $data['target_table_id'] ?? '';

        if (!$orderId || !$targetTableId) {
            return $this->fail('参数错误');
        }

        $result = MergeLogic::changeTable($orderId, $targetTableId, $this->getStoreId());

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('换台成功', $result);
    }

    public function merge()
    {
        $data = $this->request->post();
        $sourceOrderId = $data['source_order_id'] ?? '';
        $targetOrderId = $data['target_order_id'] ?? '';

        if (!$sourceOrderId || !$targetOrderId) {
            return $this->fail('参数错误');
        }

        $result = MergeLogic::merge($sourceOrderId, $targetOrderId, $this->getStoreId());

        if (!isset($result['success']) || !$result['success']) {
            return $this->fail($result['message'] ?? '并台失败');
        }

        return $this->success('并台成功', $result);
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

            if ($table) {
                $table->status = TableStatus::IDLE;
                $table->save();
            }

            Db::commit();

            return $this->success('关台成功', [
                'order_id' => $order->id,
                'status' => 'completed',
                'final_amount' => $order->final_amount,
                'duration_minutes' => $durationMinutes,
            ]);
        } catch (\Exception $e) {
            Db::rollback();
            return $this->fail('关台失败');
        }
    }

    /**
     * 临时开台（清洁、免费试玩等场景）
     * POST /pos.Order/tempOpen { table_id, temp_type }
     */
    public function tempOpen()
    {
        $data = $this->request->post();
        $result = StoreOrderLogic::tempOpen($data, $this->storeId);
        if ($result === false) return $this->fail(StoreOrderLogic::getError());
        return $this->success('临时开台成功', $result);
    }

    /**
     * 关闭临时订单 / 转为正式订单
     * POST /pos.Order/tempClose { order_id, convert_to_normal }
     */
    public function tempClose()
    {
        $orderId = $this->request->post('order_id', '');
        $convertToNormal = (bool)$this->request->post('convert_to_normal', false);
        $result = StoreOrderLogic::tempClose($orderId, $this->storeId, $convertToNormal);
        if ($result === false) return $this->fail(StoreOrderLogic::getError());
        return $this->success('操作成功', $result);
    }

    public function checkout()
    {
        $data = $this->request->post();
        $orderId = $data['order_id'] ?? '';
        $payType = $data['pay_type'] ?? 'wechat';
        $payAmount = $data['pay_amount'] ?? 0;

        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }

        $result = CheckoutLogic::checkout($orderId, $this->getStoreId(), [
            'balance_paid'  => floatval($data['balance_paid'] ?? 0),
            'cash_paid'     => floatval($data['cash_paid'] ?? 0),
            'wechat_paid'   => floatval($data['wechat_paid'] ?? 0),
            'alipay_paid'   => floatval($data['alipay_paid'] ?? 0),
            'card_paid'     => floatval($data['card_paid'] ?? 0),
            'points_deduct' => intval($data['points_deduct'] ?? 0),
            'operator_id'   => $this->getEmployeeId(),
            'operator_name' => $this->getEmployeeInfo()['name'] ?? '',
            'channel'       => $this->request->post('channel', 'cash'),
            'discount_type' => $this->request->post('discount_type', null),
            'discount_value' => $this->request->post('discount_value', null),
            'rounding_mode' => $this->request->post('rounding_mode', 'none'),
            'verify_code'   => $this->request->post('verify_code', null),
            'pay_type'      => $this->request->post('pay_type', 'cash'),
            'pay_amount'    => floatval($data['pay_amount'] ?? 0),
            'bill_locked_at' => $this->request->post('bill_locked_at', null),
            'discount'      => floatval($data['discount'] ?? 0),
            'remark'        => $this->request->post('remark', ''),
        ]);

        if ($result === false) {
            return $this->fail(CheckoutLogic::getError());
        }

        return $this->success('结账成功', $result);
    }

    public function getAssistantOrders()
    {
        $orderId = $this->request->get('order_id', '');

        if (!$orderId) {
            return $this->fail('参数错误');
        }

        $items = OrderItem::where('order_id', $orderId)
            ->where('item_type', 'assistant')
            ->order('created_at', 'desc')
            ->select();

        $data = [];
        foreach ($items as $item) {
            $assistant = Assistant::where('id', $item->assistant_id)->find();
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
                'assistant_avatar' => $assistant ? ($assistant->avatar ?? '') : '',
                'hourly_rate' => (float)$item->unit_price,
                'status' => $item->status,
                'started_at' => $item->started_at,
                'duration' => $duration,
            ];
        }

        return $this->success('获取成功', $data);
    }

    public function pendingDeliveries()
    {
        $storeId = $this->getStoreId();
        $result = OrderLogic::getPendingDeliveries($storeId);
        return $this->success('获取成功', $result);
    }

    public function pendingAssistantBookings()
    {
        $storeId = $this->getStoreId();
        $result = OrderLogic::getPendingAssistantBookings($storeId);
        return $this->success('获取成功', $result);
    }

    public function quickOrder()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['items']) || !is_array($data['items'])) {
            return $this->fail('商品列表不能为空');
        }

        $result = OrderLogic::quickCreateOrder($data, $storeId);

        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }

        return $this->success('下单成功', $result);
    }

    /**
     * 获取订单的台桌变更审计日志
     */
    public function tableLog()
    {
        $orderId = $this->request->get('order_id', '');
        if (empty($orderId)) {
            return $this->fail('参数错误');
        }

        $storeId = $this->getStoreId();

        $logs = OrderTableLog::where('order_id', $orderId)
            ->where('store_id', $storeId)
            ->order('operated_at', 'asc')
            ->select();

        $result = [];
        foreach ($logs as $log) {
            $table = Table::where('id', $log->table_id)->find();
            $result[] = [
                'action' => $log->action,
                'table_name' => $table ? ($table->name ?? $table->number ?? '') : '',
                'table_id' => $log->table_id,
                'operator_name' => $log->operator_name ?? '',
                'related_order_id' => $log->related_order_id ?? '',
                'remark' => $log->remark ?? '',
                'operated_at' => $log->operated_at,
            ];
        }

        return $this->success('获取成功', $result);
    }

    /**
     * 订单列表 — 支持类型/状态/日期范围/关键词筛选
     * GET /pos.Order/lists?type=&status=&dateRange=&startDate=&endDate=&keyword=&page=&pageSize=
     */
    public function lists()
    {
        $storeId = $this->getStoreId();
        if (empty($storeId)) {
            return $this->fail('门店ID不能为空');
        }

        $status    = $this->request->get('status', 'all');
        $type      = $this->request->get('type', 'all');
        $dateRange = $this->request->get('dateRange', 'all');
        $startDate = $this->request->get('startDate', '');
        $endDate   = $this->request->get('endDate', '');
        $keyword   = $this->request->get('keyword', '');
        $page      = (int)$this->request->get('page', 1);
        $pageSize  = (int)$this->request->get('pageSize', 20);

        // 排除并入子订单（消费已合并到父订单，避免重复显示和金额为0的误导）
        $query = Order::alias('o')
            ->where('o.store_id', $storeId)
            ->whereNull('o.merged_to_order_id')
            ->leftJoin(Table::getTable() . ' t', 'o.table_id = t.id')
            ->field('o.*, t.name as table_name')
            ->order('o.created_at', 'desc');

        // 类型筛选
        if ($type !== 'all') {
            if ($type === 'table') {
                $query->where('o.type', 'table');
            } elseif ($type === 'quick') {
                $query->where('o.type', 'quick_order');
            }
        }

        // 状态筛选
        if ($status !== 'all') {
            $query->where('o.status', $status);
        }

        // 日期筛选：优先使用自定义日期范围
        if (!empty($startDate) && !empty($endDate)) {
            $query->where('o.created_at', '>=', $startDate . ' 00:00:00')
                  ->where('o.created_at', '<=', $endDate . ' 23:59:59');
        } elseif ($dateRange !== 'all') {
            $dateMap = [
                'today'     => [date('Y-m-d') . ' 00:00:00', date('Y-m-d') . ' 23:59:59'],
                'yesterday' => [date('Y-m-d', strtotime('-1 day')) . ' 00:00:00', date('Y-m-d', strtotime('-1 day')) . ' 23:59:59'],
                'week'      => [date('Y-m-d', strtotime('-6 day')) . ' 00:00:00', date('Y-m-d') . ' 23:59:59'],
                'month'     => [date('Y-m-01') . ' 00:00:00', date('Y-m-t') . ' 23:59:59'],
            ];
            $range = $dateMap[$dateRange] ?? $dateMap['today'];
            $query->where('o.created_at', '>=', $range[0])
                  ->where('o.created_at', '<=', $range[1]);
        }

        // 关键词搜索
        if (!empty($keyword)) {
            $query->where(function ($q) use ($keyword) {
                $q->whereOr('t.name', 'like', "%{$keyword}%")
                  ->whereOr('o.order_no', 'like', "%{$keyword}%");
            });
        }

        $paginator = $query->paginate($pageSize, false, ['page' => $page]);
        $orders = $paginator->items();

        // 批量查哪些订单有并入子订单
        $parentIds = array_column($orders, 'id');
        $hasMergedMap = [];
        if (!empty($parentIds)) {
            $mergedParents = \think\facade\Db::name('busi_order')
                ->whereIn('merged_to_order_id', $parentIds)
                ->where('status', 'completed')
                ->column('merged_to_order_id');
            $hasMergedMap = array_flip(array_unique($mergedParents));
        }

        foreach ($orders as &$order) {
            // 聚合自身 + 并入子订单的 items（与账单查询一致）
            $itemOrderIds = [$order['id']];
            $childIds = \think\facade\Db::name('busi_order')
                ->where('merged_to_order_id', $order['id'])
                ->where('status', 'completed')
                ->column('id');
            $itemOrderIds = array_merge($itemOrderIds, $childIds);
            $items = OrderItem::whereIn('order_id', $itemOrderIds)
                ->field('id, item_type, item_name, quantity, unit_price, total_price, final_price')
                ->select();
            $order['items'] = $items->toArray();
            $order['has_merged'] = !empty($childIds);
        }

        return $this->success('获取成功', [
            'lists'      => $orders,
            'count'      => $paginator->total(),
            'page_no'    => $paginator->currentPage(),
            'page_size'  => $paginator->listRows(),
        ]);
    }

    /**
     * 暂停台费（独立暂停，不影响助教费）
     * POST /pos.Order/pauseTableFee { order_id }
     */
    public function pauseTableFee()
    {
        $orderId = $this->request->post('order_id', '');
        if (empty($orderId)) {
            return $this->fail('订单ID不能为空');
        }
        $result = StoreOrderLogic::pause($orderId, $this->storeId, 'table');
        if ($result === false) {
            return $this->fail(StoreOrderLogic::getError());
        }
        return $this->success('台费已暂停', $result);
    }

    /**
     * 恢复台费
     * POST /pos.Order/resumeTableFee { order_id }
     */
    public function resumeTableFee()
    {
        $orderId = $this->request->post('order_id', '');
        if (empty($orderId)) {
            return $this->fail('订单ID不能为空');
        }
        $result = StoreOrderLogic::resume($orderId, $this->storeId, 'table');
        if ($result === false) {
            return $this->fail(StoreOrderLogic::getError());
        }
        return $this->success('台费已恢复', $result);
    }

    /**
     * 暂停助教费
     * POST /pos.Order/pauseAssistantFee { order_id, item_id? }
     * - 有 item_id: 暂停单条助教服务 (bi_busi_order_item.is_paused=1)
     * - 无 item_id: 暂停全部助教费 (bi_busi_order.assistant_paused_at, 兼容旧版)
     */
    public function pauseAssistantFee()
    {
        $orderId = $this->request->post('order_id', '');
        $itemId  = $this->request->post('item_id', '');

        if (empty($orderId)) {
            return $this->fail('订单ID不能为空');
        }

        // 按条暂停
        if (!empty($itemId)) {
            $item = \app\common\model\merchant\OrderItem::where('id', $itemId)
                ->where('order_id', $orderId)
                ->find();
            if (!$item) {
                return $this->fail('助教服务记录不存在');
            }
            if (!empty($item->is_paused)) {
                return $this->fail('该助教服务已在暂停中');
            }
            // 冻结当前费用到 total_price，后面恢复后在此基础累加，防止 ceil 取整跳变
            $item->total_price = \app\common\logic\OrderLogic::calcAssistantItemFee($item);
            $item->is_paused = 1;
            $item->paused_at = date('Y-m-d H:i:s');
            $item->save();
            return $this->success('助教服务已暂停', ['item_id' => $itemId, 'is_paused' => 1]);
        }

        // 订单级暂停（兼容旧版）
        $result = StoreOrderLogic::pause($orderId, $this->storeId, 'assistant');
        if ($result === false) {
            return $this->fail(StoreOrderLogic::getError());
        }
        return $this->success('助教费已暂停', $result);
    }

    /**
     * 恢复助教费
     * POST /pos.Order/resumeAssistantFee { order_id, item_id? }
     */
    public function resumeAssistantFee()
    {
        $orderId = $this->request->post('order_id', '');
        $itemId  = $this->request->post('item_id', '');

        if (empty($orderId)) {
            return $this->fail('订单ID不能为空');
        }

        // 按条恢复
        if (!empty($itemId)) {
            $item = \app\common\model\merchant\OrderItem::where('id', $itemId)
                ->where('order_id', $orderId)
                ->find();
            if (!$item) {
                return $this->fail('助教服务记录不存在');
            }
            if (empty($item->is_paused)) {
                return $this->fail('该助教服务未在暂停中');
            }
            // 累计暂停时长到 total_paused_seconds
            if (!empty($item->paused_at)) {
                $pausedSec = max(0, time() - strtotime($item->paused_at));
                $item->total_paused_seconds = intval($item->total_paused_seconds ?? 0) + $pausedSec;
            }
            $item->is_paused = 0;
            $item->paused_at = null;
            $item->save();
            return $this->success('助教服务已恢复', ['item_id' => $itemId, 'is_paused' => 0]);
        }

        // 订单级恢复（兼容旧版）
        $result = StoreOrderLogic::resume($orderId, $this->storeId, 'assistant');
        if ($result === false) {
            return $this->fail(StoreOrderLogic::getError());
        }
        return $this->success('助教费已恢复', $result);
    }

    protected function uuid(): string
    {
        return md5(uniqid((string)mt_rand(), true));
    }

    /**
     * 助教加钟 — 支持赠品和付费两种模式
     * POST /pos.Order/addGiftHours { item_id, gift_hours?, overtime_hours?, hourly_rate? }
     * - gift_hours > 0: 赠品加钟 (免费，累加到原 item.gift_hours)
     * - overtime_hours > 0: 付费加钟 (创建新 assistant_overtime 记录)
     */
    public function addGiftHours()
    {
        $itemId       = $this->request->post('item_id', '');
        $giftHours    = floatval($this->request->post('gift_hours', 0));
        $overtimeHours = floatval($this->request->post('overtime_hours', 0));
        $hourlyRate   = floatval($this->request->post('hourly_rate', 0));

        if (empty($itemId)) {
            return $this->fail('参数错误: 缺少 item_id');
        }

        $parentItem = \app\common\model\merchant\OrderItem::where('id', $itemId)->find();
        if (!$parentItem || $parentItem->item_type !== 'assistant') {
            return $this->fail('助教服务记录不存在');
        }
        $orderId = $parentItem->order_id;

        // 赠品加钟: 直接累加到原记录
        if ($giftHours > 0) {
            $parentItem->gift_hours = round(floatval($parentItem->gift_hours ?? 0) + $giftHours, 2);
            $parentItem->save();
        }

        // 付费加钟: 创建新 OrderItem
        if ($overtimeHours > 0) {
            if ($hourlyRate <= 0) {
                $hourlyRate = floatval($parentItem->unit_price ?? 0);
            }
            $overtimeAmount = round($overtimeHours * $hourlyRate, 2);

            $newItem = new \app\common\model\merchant\OrderItem();
            $newItem->id          = 'oi_' . bin2hex(random_bytes(8));
            $newItem->order_id    = $orderId;
            $newItem->item_type   = 'assistant_overtime';
            $newItem->item_name   = ($parentItem->item_name ?: '助教') . '(加钟' . $overtimeHours . 'h)';
            $newItem->assistant_id = $parentItem->assistant_id ?? '';
            $newItem->quantity    = $overtimeHours;
            $newItem->unit        = '小时';
            $newItem->unit_price  = $hourlyRate;
            $newItem->total_price = $overtimeAmount;
            $newItem->final_price = $overtimeAmount;
            $newItem->status       = 'delivered';   // 一口价，无需 pending→serving 流程
            $newItem->billing_mode = 'flat_rate';    // 固定金额，类买断
            $newItem->pay_mode     = 'postpaid';     // 后付费，结账时支付
            $newItem->gift_hours   = 0;
            $newItem->parent_item_id = $itemId;
            $newItem->store_id    = $parentItem->store_id ?? '';
            $newItem->save();

            // 更新订单总金额
            $order = \app\common\model\merchant\Order::where('id', $orderId)->find();
            if ($order) {
                $order->final_amount = round(floatval($order->final_amount ?? 0) + $overtimeAmount, 2);
                $order->assistant_fee = round(floatval($order->assistant_fee ?? 0) + $overtimeAmount, 2);
                $order->save();
            }
        }

        if ($giftHours <= 0 && $overtimeHours <= 0) {
            return $this->fail('参数错误: gift_hours 或 overtime_hours 必须大于0');
        }

        // 返回更新后的账单
        $bill = \app\storeapi\logic\order\CheckoutLogic::getBill($orderId, $this->storeId);
        if (\app\storeapi\logic\order\CheckoutLogic::hasError()) {
            return $this->fail(\app\storeapi\logic\order\CheckoutLogic::getError());
        }
        return $this->success('加钟成功', $bill);
    }
}
