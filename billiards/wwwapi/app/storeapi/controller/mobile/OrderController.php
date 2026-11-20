<?php

declare (strict_types=1);

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\common\logic\OrderLogic;
use app\storeapi\logic\order\OrderLogic as StoreOrderLogic;
use app\storeapi\logic\order\TableOpenLogic;
use app\storeapi\logic\order\MergeLogic;
use app\storeapi\logic\order\CheckoutLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\OrderTableLog;
use app\common\model\merchant\Member;
use app\common\model\merchant\Product;
use app\common\model\merchant\Table;
use app\common\annotation\Permission;
use app\common\service\JsonService;
use think\facade\Db;
use think\facade\Log;

class OrderController extends BaseStoreController
{
    #[Permission('mobile:table:open', '开台', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function open()
    {
        $tableId = $this->request->post('table_id', '');
        $playerCount = $this->request->post('player_count', 1);

        if (empty($tableId)) {
            return JsonService::fail('台桌ID不能为空');
        }

        $result = TableOpenLogic::quickOpen([
            'table_id'     => $tableId,
            'player_count' => $playerCount,
            'operator_id'   => $this->employeeId,
            'operator_name' => $this->employeeInfo['name'] ?? '',
        ], $this->storeId, true);

        if (!$result['success']) {
            return JsonService::fail($result['message']);
        }

        // 推送开台通知到收银端
        try {
            \app\common\lib\WebSocketNotification::sendTableStatusChange(
                $this->storeId, $tableId, [
                    'action'      => 'open',
                    'table_name'  => $result['data']['table_name'] ?? '',
                    'order_id'    => $result['data']['order_id'] ?? '',
                    'player_count' => $playerCount,
                ]);
        } catch (\Exception $e) {
            \think\facade\Log::warning('[Mobile] open WS推送失败: ' . $e->getMessage());
        }

        return JsonService::success($result['message'] ?? '开台成功', $result['data'] ?? []);
    }

    /**
     * 临时开台（清洁、免费试玩等场景）
     * POST /mobile.Order/tempOpen { table_id, temp_type }
     */
    #[Permission('mobile:table:open', '临时开台', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function tempOpen()
    {
        $data = $this->request->post();
        $result = StoreOrderLogic::tempOpen($data, $this->storeId);
        if ($result === false) return JsonService::fail(StoreOrderLogic::getError());
        return JsonService::success('临时开台成功', $result);
    }

    /**
     * 关闭临时订单 / 转为正式订单
     * POST /mobile.Order/tempClose { order_id, convert_to_normal }
     */
    #[Permission('mobile:table:open', '关闭临时订单', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function tempClose()
    {
        $orderId = $this->request->post('order_id', '');
        $convertToNormal = (bool)$this->request->post('convert_to_normal', false);
        $result = StoreOrderLogic::tempClose($orderId, $this->storeId, $convertToNormal);
        if ($result === false) return JsonService::fail(StoreOrderLogic::getError());
        return JsonService::success('操作成功', $result);
    }

    #[Permission('mobile:table', '台桌管理', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function current()
    {
        $tableId = $this->request->get('table_id', '');

        if (empty($tableId)) {
            return JsonService::fail('台桌ID不能为空');
        }

        // 使用与 POS 端完全相同的计费逻辑，确保两端金额一致
        $orderData = OrderLogic::getTableCurrentOrder($tableId);

        if (!$orderData) {
            return JsonService::data([]);
        }

        return JsonService::success('success', $orderData);
    }

    #[Permission('mobile:table', '台桌管理', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function bill()
    {
        $orderId = $this->request->get('order_id', '');

        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }

        $bill = CheckoutLogic::getBill($orderId, $this->storeId);
        if ($bill === false) {
            return JsonService::fail(CheckoutLogic::getError());
        }

        return JsonService::data($bill);
    }

    #[Permission('mobile:table:order', '台桌点单', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function addProduct()
    {
        $orderId = $this->request->post('order_id', '');
        $productId = $this->request->post('product_id', '');
        $quantity = (int)($this->request->post('quantity', 1));

        if ($quantity <= 0) {
            return JsonService::fail('数量必须大于0');
        }
        if (empty($orderId) || empty($productId)) {
            return JsonService::fail('参数错误');
        }

        Db::startTrans();
        try {
            $order = Order::where('id', $orderId)
                ->where('store_id', $this->storeId)
                ->lock(true)
                ->find();
            if (!$order) {
                Db::rollback();
                return JsonService::fail('订单不存在');
            }
            if ($order->status !== 'in_progress') {
                Db::rollback();
                return JsonService::fail('订单状态不正确，当前状态：' . $order->status);
            }

            $product = Product::where('id', $productId)
                ->where('store_id', $this->storeId)
                ->lock(true)
                ->find();
            if (!$product) {
                Db::rollback();
                return JsonService::fail('商品不存在');
            }
            if ($product->status != 1) {
                Db::rollback();
                return JsonService::fail('商品已下架');
            }
            if ($product->stock < $quantity) {
                Db::rollback();
                return JsonService::fail('商品库存不足，当前库存：' . $product->stock);
            }

            $unitPrice = (float)$product->price;
            $totalPrice = round($unitPrice * $quantity, 2);

            $orderItem = new OrderItem();
            $orderItem->id = $this->uuid();
            $orderItem->order_id = $orderId;
            $orderItem->product_id = $productId;
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
                return JsonService::fail('创建订单项失败');
            }

            $beforeStock = $product->stock;
            $product->stock = $beforeStock - $quantity;
            if ($product->save() === false) {
                Db::rollback();
                return JsonService::fail('更新库存失败');
            }

            $order->final_amount = round(($order->final_amount ?? 0) + $totalPrice, 2);
            if ($order->save() === false) {
                Db::rollback();
                return JsonService::fail('更新订单金额失败');
            }

            Db::commit();
            return JsonService::success('添加成功', [
                'item_id'      => $orderItem->id,
                'total_amount' => $order->final_amount,
            ]);
        } catch (\Exception $e) {
            if (Db::getInstance()->inTransaction()) {
                Db::rollback();
            }
            Log::error('mobile addProduct失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return JsonService::fail('添加商品失败，请稍后重试');
        }
    }

    #[Permission('mobile:table:order', '台桌点单', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function removeProduct()
    {
        $itemId = $this->request->post('item_id', '');

        if (empty($itemId)) {
            return JsonService::fail('参数错误');
        }

        $item = OrderItem::where('id', $itemId)->find();
        if (!$item) {
            return JsonService::fail('订单项不存在');
        }

        $order = Order::where('id', $item->order_id)->find();
        if ($order && $order->status != 'in_progress') {
            return JsonService::fail('订单已结束，无法修改');
        }

        Db::startTrans();
        try {
            if ($order) {
                $order->final_amount = max(0, round(($order->final_amount ?? 0) - ($item->final_price ?? 0), 2));
                $order->save();
            }

            $item->delete();

            Db::commit();
            return JsonService::success('删除成功', [
                'final_amount' => $order ? $order->final_amount : 0,
            ]);
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('mobile removeProduct失败: ' . $e->getMessage());
            return JsonService::fail('删除失败');
        }
    }

    #[Permission('mobile:table:order', '台桌点单', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function deliverProduct()
    {
        $itemId = $this->request->post('item_id', '');

        if (empty($itemId)) {
            return JsonService::fail('参数错误');
        }

        $result = OrderLogic::deliverItem($itemId, $this->storeId, $this->employeeId ?? '');

        if (isset($result['error'])) {
            return JsonService::fail($result['error']);
        }

        return JsonService::success('送达成功', $result);
    }

    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function addAssistant()
    {
        $orderId = $this->request->post('order_id', '');
        $assistantId = $this->request->post('assistant_id', '');
        $billingMode = $this->request->post('billing_mode', 'realtime');
        $buyoutHours = floatval($this->request->post('buyout_hours', 0));
        $payMode = $this->request->post('pay_mode', 'postpaid');

        if (empty($orderId) || empty($assistantId)) {
            return JsonService::fail('参数错误');
        }

        $autoStart = boolval($this->request->post('auto_start', false));

        // 买断模式：直接 delivered + 固定价格，不走预约流程
        if ($billingMode === 'flat_rate' && $buyoutHours > 0) {
            $result = OrderLogic::buyoutAssistant($orderId, $assistantId, $buyoutHours, $payMode, $this->storeId);
        } else {
            // 实时计费：auto_start=true 时直接进入 serving 状态，跳过 pending 确认
            $result = OrderLogic::bookAssistant($orderId, $assistantId, $this->storeId, $autoStart);
        }

        if (isset($result['error'])) {
            return JsonService::fail($result['error']);
        }

        return JsonService::success($billingMode === 'flat_rate' ? '下单成功' : '预约成功', $result);
    }

    /**
     * 先付买断 — 移动端
     * POST /mobile.Order/prepayAssistant
     */
    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function prepayAssistant()
    {
        $data = $this->request->post();
        $storeId = $this->getStoreId();

        if (empty($data['order_id']) || empty($data['assistant_id']) || empty($data['buyout_hours'])) {
            return JsonService::fail('参数错误: 缺少 order_id/assistant_id/buyout_hours');
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
            return JsonService::fail($result['error']);
        }

        return JsonService::success('OK', $result);
    }

    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function confirmAssistant()
    {
        $itemId = $this->request->post('item_id', '');

        if (empty($itemId)) {
            return JsonService::fail('参数错误');
        }

        $result = OrderLogic::acceptAssistant($itemId, $this->storeId);

        if (isset($result['error'])) {
            return JsonService::fail($result['error']);
        }

        return JsonService::success('已接单', $result);
    }

    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function startAssistant()
    {
        $itemId = $this->request->post('item_id', '');

        if (empty($itemId)) {
            return JsonService::fail('参数错误');
        }

        $result = OrderLogic::startAssistantService($itemId, $this->storeId);

        if (isset($result['error'])) {
            return JsonService::fail($result['error']);
        }

        return JsonService::success('服务已开始', $result);
    }

    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function endAssistant()
    {
        $itemId = $this->request->post('item_id', '');

        if (empty($itemId)) {
            return JsonService::fail('参数错误');
        }

        $result = OrderLogic::endAssistantService($itemId, $this->storeId);

        if (isset($result['error'])) {
            return JsonService::fail($result['error']);
        }

        return JsonService::success('服务已结束', $result);
    }

    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function cancelAssistant()
    {
        $itemId = $this->request->post('item_id', '');

        if (empty($itemId)) {
            return JsonService::fail('参数错误');
        }

        $result = OrderLogic::cancelAssistant($itemId, $this->storeId);

        if (isset($result['error'])) {
            return JsonService::fail($result['error']);
        }

        return JsonService::success('已取消', $result);
    }

    #[Permission('mobile:table:transfer', '换台并台', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function changeTable()
    {
        $orderId = $this->request->post('order_id', '');
        $targetTableId = $this->request->post('target_table_id', '');

        if (empty($orderId) || empty($targetTableId)) {
            return JsonService::fail('参数错误');
        }

        $result = MergeLogic::changeTable($orderId, $targetTableId, $this->storeId);

        if (!$result['success']) {
            return JsonService::fail($result['message']);
        }

        // 推送换台通知到 POS
        try {
            $order = \app\common\model\merchant\Order::where('id', $orderId)->find();
            \app\common\lib\WebSocketNotification::sendTableStatusChange(
                $this->storeId, $targetTableId, [
                    'action'       => 'transfer',
                    'table_name'   => $order ? ($order->table_name ?? '') : '',
                    'order_id'     => $orderId,
                    'to_table_id'  => $targetTableId,
                    'from_table_id' => $order ? ($order->table_id ?? '') : '',
                ]);
        } catch (\Exception $e) {
            \think\facade\Log::warning('[Mobile] changeTable WS推送失败: ' . $e->getMessage());
        }

        return JsonService::success($result['message'], $result['data'] ?? []);
    }

    #[Permission('mobile:table:transfer', '换台并台', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function merge()
    {
        $sourceOrderId = $this->request->post('source_order_id', '');
        $targetOrderId = $this->request->post('target_order_id', '');

        if (empty($sourceOrderId) || empty($targetOrderId)) {
            return JsonService::fail('参数错误');
        }

        $result = MergeLogic::merge($sourceOrderId, $targetOrderId, $this->storeId);

        if (!$result['success']) {
            return JsonService::fail($result['message']);
        }

        // 推送并台通知到 POS
        try {
            $sourceOrder = \app\common\model\merchant\Order::where('id', $sourceOrderId)->find();
            $targetOrder = \app\common\model\merchant\Order::where('id', $targetOrderId)->find();
            if ($targetOrder && $targetOrder->table_id) {
                \app\common\lib\WebSocketNotification::sendTableStatusChange(
                    $this->storeId, $targetOrder->table_id, [
                        'action'         => 'merge',
                        'table_name'     => $targetOrder->table_name ?? '',
                        'order_id'       => $targetOrderId,
                        'from_order_id'  => $sourceOrderId,
                        'from_table_id'  => $sourceOrder ? ($sourceOrder->table_id ?? '') : '',
                    ]);
            }
            // 源桌已关闭，推送关闭通知
            if ($sourceOrder && $sourceOrder->table_id) {
                \app\common\lib\WebSocketNotification::sendTableStatusChange(
                    $this->storeId, $sourceOrder->table_id, [
                        'action'      => 'close',
                        'table_name'  => $sourceOrder->table_name ?? '',
                        'order_id'    => $sourceOrderId,
                    ]);
            }
        } catch (\Exception $e) {
            \think\facade\Log::warning('[Mobile] merge WS推送失败: ' . $e->getMessage());
        }

        return JsonService::success($result['message'], $result['data'] ?? []);
    }

    #[Permission('mobile:table:member', '绑定会员', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function bindMember()
    {
        $orderId = $this->request->post("order_id", "");
        $memberId = $this->request->post("member_id", "");
        $result = \app\storeapi\logic\order\OrderLogic::bindMember($orderId, $this->storeId, $memberId);
        if (\app\storeapi\logic\order\OrderLogic::hasError()) return JsonService::fail(\app\storeapi\logic\order\OrderLogic::getError());
        return JsonService::success('绑定成功', $result);
    }


    #[Permission('mobile:table:checkout', '结账收银', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function checkout()
    {
        $orderId = $this->request->post('order_id', '');

        if (empty($orderId)) return JsonService::fail('缺少订单ID');

        $params = [
            'cash_paid'      => floatval($this->request->post('cash_paid', 0)),
            'wechat_paid'    => floatval($this->request->post('wechat_paid', 0)),
            'alipay_paid'    => 0,
            'balance_paid'   => floatval($this->request->post('balance_paid', 0)),
            'card_paid'      => 0,
            'points_deduct'  => intval($this->request->post('points_deduct', 0)),
            'pay_type'       => $this->request->post('pay_type', 'cash'),
            'pay_amount'     => floatval($this->request->post('pay_amount', 0)),
            'bill_locked_at' => $this->request->post('bill_locked_at', null),
            'discount_type'  => $this->request->post('discount_type', null),
            'discount_value' => $this->request->post('discount_value', null),
            'rounding_mode'  => $this->request->post('rounding_mode', 'none'),
            'discount'       => floatval($this->request->post('discount', 0)),
            'remark'         => $this->request->post('remark', ''),
            'channel'        => $this->request->post('channel', 'cash'),
            'operator_id'    => $this->employeeId,
            'operator_name'  => $this->employeeInfo['name'] ?? '',
        ];

        $result = \app\storeapi\logic\order\CheckoutLogic::checkout($orderId, $this->storeId, $params);
        if ($result === false) return JsonService::fail(\app\storeapi\logic\order\CheckoutLogic::getError());

        // 推送关台通知到 POS 端
        try {
            $order = \app\common\model\merchant\Order::where('id', $orderId)->find();
            if ($order && $order->table_id) {
                \app\common\lib\WebSocketNotification::sendTableStatusChange(
                    $this->storeId, $order->table_id, [
                        'action'     => 'close',
                        'table_name' => $order->table_name ?? '',
                        'order_id'   => $orderId,
                    ]);
            }
        } catch (\Exception $e) {
            \think\facade\Log::warning('[Mobile] checkout WS推送失败: ' . $e->getMessage());
        }
        return JsonService::success('结账成功', $result);
    }

    #[Permission('mobile:table:log', '操作日志', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function tableLog()
    {
        $tableId = $this->request->get('table_id', '');
        $orderId = $this->request->get('order_id', '');

        $query = OrderTableLog::where('store_id', $this->storeId);

        if (!empty($tableId)) {
            $query->where('table_id', $tableId);
        }
        if (!empty($orderId)) {
            $query->where('order_id', $orderId);
        }

        $logs = $query->order('operated_at', 'desc')
            ->limit(50)
            ->select();

        return JsonService::data($logs->toArray());
    }

    #[Permission('mobile:table:order', '台桌点单', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function pendingItems()
    {
        $items = OrderItem::alias('oi')
            ->leftJoin(Order::getTable() . ' o', 'oi.order_id = o.id')
            ->leftJoin(Table::getTable() . ' t', 'o.table_id = t.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'in_progress')
            ->where('oi.item_type', 'product')
            ->where('oi.created_at', '>=', date('Y-m-d H:i:s', strtotime('-2 hours')))
            ->field('oi.id, oi.item_name, oi.quantity, oi.unit_price, oi.status, oi.created_at, oi.delivered_at, oi.order_id, o.table_id, t.name as table_name')
            ->order('oi.created_at', 'desc')
            ->limit(200)
            ->select()
            ->toArray();

        $grouped = [];
        foreach ($items as $item) {
            $tableId = $item['table_id'] ?? 'unknown';
            $tableName = $item['table_name'] ?? '未知桌台';
            $key = $tableId;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'tableId'   => $tableId,
                    'tableName' => $tableName,
                    'items'     => [],
                ];
            }
            $grouped[$key]['items'][] = [
                'id'          => $item['id'],
                'product_name' => $item['item_name'],
                'quantity'    => $item['quantity'],
                'price'       => $item['unit_price'],
                'status'      => $item['status'],
                'created_at'  => $item['created_at'],
            ];
        }

        return JsonService::data(array_values($grouped));
    }

    #[Permission('mobile:table:assistant', '台桌助教', 'mobile', '台桌管理', ['boss', 'manager'])]
    public function pendingAssistants()
    {
        $items = OrderItem::alias('oi')
            ->leftJoin(Order::getTable() . ' o', 'oi.order_id = o.id')
            ->leftJoin(Table::getTable() . ' t', 'o.table_id = t.id')
            ->where('o.store_id', $this->storeId)
            ->where('o.status', 'in_progress')
            ->where('oi.item_type', 'assistant')
            ->where('oi.created_at', '>=', date('Y-m-d H:i:s', strtotime('-6 hours')))
            ->field('oi.id, oi.item_name, oi.assistant_id, oi.unit_price, oi.status, oi.created_at, oi.started_at, oi.accepted_at, oi.order_id, o.table_id, t.name as table_name')
            ->order('oi.created_at', 'desc')
            ->limit(200)
            ->select()
            ->toArray();

        $grouped = [];
        foreach ($items as $item) {
            $tableId = $item['table_id'] ?? 'unknown';
            $tableName = $item['table_name'] ?? '未知桌台';
            $key = $tableId;
            if (!isset($grouped[$key])) {
                $grouped[$key] = [
                    'tableId'   => $tableId,
                    'tableName' => $tableName,
                    'items'     => [],
                ];
            }
            $grouped[$key]['items'][] = [
                'id'             => $item['id'],
                'assistant_name' => $item['item_name'],
                'assistant_id'   => $item['assistant_id'],
                'hourly_rate'    => $item['unit_price'],
                'status'         => $item['status'],
                'created_at'     => $item['created_at'],
                'started_at'     => $item['started_at'],
                'accepted_at'    => $item['accepted_at'],
            ];
        }

        return JsonService::data(array_values($grouped));
    }

    #[Permission('mobile:order', '订单管理', 'mobile', '订单', ['boss', 'manager', 'employee', 'cashier'])]
    public function lists()
    {
        $params = $this->request->get();
        $params['store_id'] = $this->storeId;

        $dateRange = $params['dateRange'] ?? '';
        if (!empty($dateRange) && $dateRange !== 'all') {
            $dateMap = [
                'today'     => [date('Y-m-d') . ' 00:00:00', date('Y-m-d') . ' 23:59:59'],
                'yesterday' => [date('Y-m-d', strtotime('-1 day')) . ' 00:00:00', date('Y-m-d', strtotime('-1 day')) . ' 23:59:59'],
                'week'      => [date('Y-m-d', strtotime('-6 day')) . ' 00:00:00', date('Y-m-d') . ' 23:59:59'],
                'month'     => [date('Y-m-01') . ' 00:00:00', date('Y-m-t') . ' 23:59:59'],
            ];
            if (isset($dateMap[$dateRange])) {
                $params['start_date'] = $dateMap[$dateRange][0];
                $params['end_date'] = $dateMap[$dateRange][1];
            }
        }

        $result = StoreOrderLogic::getList($params, $this->storeId);

        if ($result === false) {
            return JsonService::fail(StoreOrderLogic::getError());
        }

        return JsonService::data($result);
    }

    #[Permission('mobile:order', '订单管理', 'mobile', '订单', ['boss', 'manager', 'employee', 'cashier'])]
    public function detail()
    {
        $orderId = $this->request->get('order_id', '');

        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }

        $result = StoreOrderLogic::getDetail($orderId, $this->storeId);

        if ($result === false) {
            return JsonService::fail(StoreOrderLogic::getError());
        }

        return JsonService::data($result);
    }

    #[Permission('mobile:table:fee', '暂停恢复费用', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function pauseTableFee()
    {
        $orderId = $this->request->post('order_id', '');
        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }
        $result = StoreOrderLogic::pause($orderId, $this->storeId, 'table');
        if ($result === false) {
            return JsonService::fail(StoreOrderLogic::getError());
        }
        return JsonService::success('台费已暂停', $result);
    }

    #[Permission('mobile:table:fee', '暂停恢复费用', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    public function resumeTableFee()
    {
        $orderId = $this->request->post('order_id', '');
        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }
        $result = StoreOrderLogic::resume($orderId, $this->storeId, 'table');
        if ($result === false) {
            return JsonService::fail(StoreOrderLogic::getError());
        }
        return JsonService::success('台费已恢复', $result);
    }

    #[Permission('mobile:table:fee', '暂停恢复费用', 'mobile', '台桌管理', ['boss', 'manager', 'employee'])]
    /**
     * 暂停助教费 — 对齐 pos.Order/pauseAssistantFee
     * POST /mobile.Order/pauseAssistantFee { order_id, item_id? }
     * - 有 item_id: 暂停单条助教服务 (bi_busi_order_item.is_paused=1)
     * - 无 item_id: 暂停全部助教费 (bi_busi_order.assistant_paused_at, 兼容旧版)
     */
    public function pauseAssistantFee()
    {
        $orderId = $this->request->post('order_id', '');
        $itemId  = $this->request->post('item_id', '');

        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }

        // 按条暂停
        if (!empty($itemId)) {
            $item = \app\common\model\merchant\OrderItem::where('id', $itemId)
                ->where('order_id', $orderId)
                ->find();
            if (!$item) {
                return JsonService::fail('助教服务记录不存在');
            }
            if (!empty($item->is_paused)) {
                return JsonService::fail('该助教服务已在暂停中');
            }
            // 冻结当前费用到 total_price，恢复后在此基础累加，防止计费跳变
            $item->total_price = \app\common\logic\OrderLogic::calcAssistantItemFee($item);
            $item->is_paused = 1;
            $item->paused_at = date('Y-m-d H:i:s');
            $item->save();
            return JsonService::success('助教服务已暂停', ['item_id' => $itemId, 'is_paused' => 1]);
        }

        // 订单级暂停（兼容旧版）
        $result = StoreOrderLogic::pause($orderId, $this->storeId, 'assistant');
        if ($result === false) {
            return JsonService::fail(StoreOrderLogic::getError());
        }
        return JsonService::success('助教费已暂停', $result);
    }

    /**
     * 恢复助教费 — 对齐 pos.Order/resumeAssistantFee
     * POST /mobile.Order/resumeAssistantFee { order_id, item_id? }
     */
    public function resumeAssistantFee()
    {
        $orderId = $this->request->post('order_id', '');
        $itemId  = $this->request->post('item_id', '');

        if (empty($orderId)) {
            return JsonService::fail('订单ID不能为空');
        }

        // 按条恢复
        if (!empty($itemId)) {
            $item = \app\common\model\merchant\OrderItem::where('id', $itemId)
                ->where('order_id', $orderId)
                ->find();
            if (!$item) {
                return JsonService::fail('助教服务记录不存在');
            }
            if (empty($item->is_paused)) {
                return JsonService::fail('该助教服务未在暂停中');
            }
            // 累计暂停时长到 total_paused_seconds
            if (!empty($item->paused_at)) {
                $pausedSec = max(0, time() - strtotime($item->paused_at));
                $item->total_paused_seconds = intval($item->total_paused_seconds ?? 0) + $pausedSec;
            }
            $item->is_paused = 0;
            $item->paused_at = null;
            $item->save();
            return JsonService::success('助教服务已恢复', ['item_id' => $itemId, 'is_paused' => 0]);
        }

        // 订单级恢复（兼容旧版）
        $result = StoreOrderLogic::resume($orderId, $this->storeId, 'assistant');
        if ($result === false) {
            return JsonService::fail(StoreOrderLogic::getError());
        }
        return JsonService::success('助教费已恢复', $result);
    }

    protected function uuid(): string
    {
        return md5(uniqid((string)mt_rand(), true));
    }

    /**
     * 助教加钟 — 支持赠品和付费两种模式（对齐 POS 端 pos.Order/addGiftHours）
     * POST /mobile.Order/addGiftHours { item_id, gift_hours?, overtime_hours?, hourly_rate? }
     */
    public function addGiftHours()
    {
        $itemId        = $this->request->post('item_id', '');
        $giftHours     = floatval($this->request->post('gift_hours', 0));
        $overtimeHours = floatval($this->request->post('overtime_hours', 0));
        $hourlyRate    = floatval($this->request->post('hourly_rate', 0));

        if (empty($itemId)) {
            return JsonService::fail('参数错误: 缺少 item_id');
        }

        $parentItem = \app\common\model\merchant\OrderItem::where('id', $itemId)->find();
        if (!$parentItem || $parentItem->item_type !== 'assistant') {
            return JsonService::fail('助教服务记录不存在');
        }
        if ($parentItem->billing_mode === 'flat_rate') {
            return JsonService::fail('买断模式不支持加钟');
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
            $newItem->status       = 'delivered';
            $newItem->billing_mode = 'flat_rate';
            $newItem->pay_mode     = 'postpaid';
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
            return JsonService::fail('参数错误: gift_hours 或 overtime_hours 必须大于0');
        }

        $bill = \app\storeapi\logic\order\CheckoutLogic::getBill($orderId, $this->storeId);
        if (\app\storeapi\logic\order\CheckoutLogic::hasError()) {
            return JsonService::fail(\app\storeapi\logic\order\CheckoutLogic::getError());
        }
        return JsonService::success('加钟成功', $bill);
    }

    /**
     * 折扣列表（移动端结账用）
     * GET /mobile.Order/discountList?store_id=
     */
    public function discountList()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $list = \app\common\model\merchant\DiscountConfig::where('store_id', $storeId)
            ->order('sort_order', 'asc')
            ->select()
            ->toArray();
        return JsonService::data($list);
    }
}
