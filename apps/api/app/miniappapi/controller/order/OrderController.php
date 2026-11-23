<?php

declare (strict_types=1);

namespace app\miniappapi\controller\order;

use app\common\model\merchant\Order as OrderModel;
use app\common\model\merchant\Table as TableModel;
use app\common\model\merchant\Member as MemberModel;
use app\common\model\merchant\Pricing as PricingModel;
use app\common\model\merchant\WxUser;
use app\common\service\JsonService;
use app\common\logic\PricingCalculatorLogic;
use think\facade\Cache;
use think\facade\Db;
use think\Request;

class OrderController
{
    /**
     * 根据 openid + store_id 获取或创建该门店下的会员
     */
    private function resolveMember(string $openid, string $storeId): ?string
    {
        $wxUser = WxUser::where('openid', $openid)->find();
        if (!$wxUser || empty($wxUser->phone)) {
            return null;
        }

        $member = MemberModel::where('phone', $wxUser->phone)
            ->where('store_id', $storeId)
            ->find();

        if ($member) {
            return $member->id;
        }

        $member = MemberModel::create([
            'id' => 'mem-' . date('YmdHis') . rand(1000, 9999),
            'name' => $wxUser->phone,
            'phone' => $wxUser->phone,
            'store_id' => $storeId,
            'balance' => 0,
            'points' => 0,
            'card_number' => '',
        ]);

        return $member->id;
    }

    /**
     * 开台
     * POST /miniappapi/order.Order/open
     */
    public function open(Request $request)
    {
        $tableId = $request->param('table_id', '');
        $openid = $request->openid;

        if (empty($tableId)) {
            return JsonService::fail('缺少 table_id 参数');
        }

        $table = TableModel::find($tableId);
        if (!$table) {
            return JsonService::fail('台桌不存在');
        }
        if ($table->status !== 'idle') {
            return JsonService::fail('台桌正在使用中');
        }

        // 按该台桌所属门店解析会员（同一手机号在不同门店有独立会员）
        $storeId = $table->store_id;
        $memberId = $this->resolveMember($openid, $storeId);
        if (empty($memberId)) {
            return JsonService::fail('请先在微信中绑定手机号');
        }

        // 更新 token 缓存中的 member_id 和 store_id
        $token = substr($request->header('Authorization'), 7);
        $loginInfo = Cache::get('mini_token:' . $token);
        if ($loginInfo) {
            $loginInfo['member_id'] = $memberId;
            $loginInfo['store_id'] = $storeId;
            Cache::set('mini_token:' . $token, $loginInfo, 86400 * 7);
        }

        Db::startTrans();
        try {
            $member = MemberModel::find($memberId);
            $order = OrderModel::create([
                'id' => 'order_' . substr(strval(time()), -8) . rand(1000, 9999),
                'store_id' => $table->store_id,
                'table_id' => $tableId,
                'member_id' => $memberId,
                'member_name' => $member->name ?? '微信用户',
                'member_phone' => $member->phone ?? '',
                'start_time' => date('Y-m-d H:i:s'),
                'status' => 'playing',
                'order_type' => 'table',
                'total_amount' => 0,
                'final_amount' => 0,
                'paid_amount' => 0,
            ]);

            $table->status = 'playing';
            $table->save();

            Db::commit();

            return JsonService::data([
                'order_id' => $order->id,
                'start_time' => $order->start_time,
                'store_id' => $table->store_id,
            ]);
        } catch (\Exception $e) {
            Db::rollback();
            return JsonService::fail('开台失败: ' . $e->getMessage());
        }
    }

    /**
     * 查询活动订单
     * GET /miniappapi/order.Order/active
     */
    public function active(Request $request)
    {
        $memberId = $request->memberId;
        if (empty($memberId)) {
            return JsonService::data(['orders' => []]);
        }

        $orders = OrderModel::where('member_id', $memberId)
            ->whereIn('status', ['playing', 'paused'])
            ->select();

        $result = [];
        foreach ($orders as $order) {
            $table = TableModel::find($order->table_id);
            $endTime = date('Y-m-d H:i:s');
            $durationMinutes = 0;
            $currentFee = 0;

            if ($table) {
                $calcResult = PricingCalculatorLogic::calculateByTableId(
                    $table->id,
                    $order->start_time,
                    $endTime
                );
                $durationMinutes = $calcResult['duration_minutes'] ?? 0;
                $currentFee = $calcResult['total_amount'] ?? 0;
            }

            $result[] = [
                'order_id' => $order->id,
                'table_id' => $order->table_id,
                'table_name' => $table->name ?? '',
                'start_time' => $order->start_time,
                'duration' => round($durationMinutes, 1),
                'current_fee' => round($currentFee, 2),
            ];
        }

        return JsonService::data(['orders' => $result]);
    }

    /**
     * 账单详情
     * GET /miniappapi/order.Order/bill
     */
    public function bill(Request $request)
    {
        $orderId = $request->param('order_id', '');
        $memberId = $request->memberId;

        if (empty($orderId)) {
            return JsonService::fail('缺少 order_id 参数');
        }

        $order = OrderModel::find($orderId);
        if (!$order) {
            return JsonService::fail('订单不存在');
        }
        if ($order->member_id != $memberId) {
            return JsonService::fail('无权查看此订单');
        }

        $table = TableModel::find($order->table_id);
        $pricing = $table ? PricingModel::find($table->pricing_id) : null;
        $endTime = date('Y-m-d H:i:s');

        $calcResult = $table ? PricingCalculatorLogic::calculateByTableId(
            $table->id,
            $order->start_time,
            $endTime
        ) : ['total_amount' => 0, 'duration_minutes' => 0];

        return JsonService::data([
            'order' => [
                'id' => $order->id,
                'table_name' => $table->name ?? '',
                'start_time' => $order->start_time,
                'status' => $order->status,
                'duration_minutes' => round($calcResult['duration_minutes'] ?? 0, 1),
            ],
            'items' => [],
            'total_fee' => round($calcResult['total_amount'] ?? 0, 2),
            'discount' => round($calcResult['discount_amount'] ?? 0, 2),
            'final_amount' => round($calcResult['total_amount'] ?? 0, 2),
            'pricing_detail' => $pricing ? ($pricing->name . ' ¥' . ($pricing->rate_per_hour ?? 0) . '/小时') : '',
        ]);
    }

    /**
     * 结算 - 生成微信支付参数
     * POST /miniappapi/order.Order/checkout
     */
    public function checkout(Request $request)
    {
        $orderId = $request->param('order_id', '');
        $memberId = $request->memberId;
        $openid = $request->openid;

        if (empty($orderId)) {
            return JsonService::fail('缺少 order_id 参数');
        }

        $order = OrderModel::find($orderId);
        if (!$order) {
            return JsonService::fail('订单不存在');
        }
        if ($order->member_id != $memberId) {
            return JsonService::fail('无权操作此订单');
        }
        if (!in_array($order->status, ['playing', 'paused'])) {
            return JsonService::fail('订单状态不允许结算');
        }

        // 计算最终费用
        $endTime = date('Y-m-d H:i:s');
        $table = TableModel::find($order->table_id);
        $calcResult = $table ? PricingCalculatorLogic::calculateByTableId(
            $table->id,
            $order->start_time,
            $endTime
        ) : ['total_amount' => 0];
        $finalAmount = round($calcResult['total_amount'] ?? 0, 2);

        // 更新订单
        $order->final_amount = $finalAmount;
        $order->total_amount = $finalAmount;
        $order->end_time = $endTime;
        $order->save();

        // 生成支付单号
        $outTradeNo = 'MINIAPP_' . $order->id . '_' . time();

        // 调用 pay-hub 创建支付
        $payHubUrl = 'http://127.0.0.1:20003/api/v1/payments';
        $payHubBody = [
            'out_trade_no' => $outTradeNo,
            'amount' => $finalAmount,
            'channel' => 'wechat_miniapp',
            'openid' => $openid,
            'description' => '台球消费 - ' . ($table->name ?? ''),
        ];

        try {
            $ch = curl_init($payHubUrl);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode($payHubBody),
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'X-Client-Id: wwwapi',
                    'X-Signature: ' . hash_hmac('sha256', json_encode($payHubBody), '43fd280f23158801a3a28079a31dc1eaaae9ea34c991c1166c7e39a2c19c36ea'),
                ],
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 10,
            ]);
            $payResponse = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 200) {
                $payResult = json_decode($payResponse, true);
                return JsonService::data([
                    'order_id' => $order->id,
                    'final_amount' => $finalAmount,
                    'payment_params' => $payResult['payment_params'] ?? [],
                ]);
            }
        } catch (\Exception $e) {
            // pay-hub 调用失败，降级返回
        }

        // 降级：返回订单金额信息
        return JsonService::data([
            'order_id' => $order->id,
            'final_amount' => $finalAmount,
            'payment_params' => null,
            'message' => '支付网关暂未就绪，请联系店员结算',
        ]);
    }

    /**
     * 绑定会员到订单（扫码绑定）
     * POST /miniappapi/order.Order/bindMemberByQR
     */
    public function bindMemberByQR(Request $request)
    {
        $orderId = $request->param('order_id', '');
        $storeId = $request->param('store_id', '');
        $phone = $request->param('phone', '');

        if (empty($orderId)) {
            return JsonService::fail('缺少 order_id 参数');
        }
        if (empty($phone)) {
            return JsonService::fail('缺少手机号');
        }

        $order = OrderModel::find($orderId);
        if (!$order) {
            return JsonService::fail('订单不存在');
        }

        // 查找会员
        $member = null;
        if (!empty($storeId)) {
            $member = MemberModel::where('phone', $phone)
                ->where('store_id', $storeId)
                ->find();
        }
        if (!$member) {
            $member = MemberModel::where('phone', $phone)->find();
        }
        if (!$member) {
            // 自动创建会员
            $member = MemberModel::create([
                'id' => 'mem-' . date('YmdHis') . rand(1000, 9999),
                'name' => $phone,
                'phone' => $phone,
                'store_id' => $storeId ?: 0,
                'balance' => 0,
                'points' => 0,
                'card_number' => '',
            ]);
        }

        // 绑定会员到订单
        $order->member_id = $member->id;
        $order->member_name = $member->name;
        $order->member_phone = $member->phone;
        if (!empty($storeId)) {
            $order->store_id = $storeId;
        }
        $order->save();

        // 更新 token 缓存
        $token = substr($request->header('Authorization'), 7);
        $loginInfo = Cache::get('mini_token:' . $token);
        if ($loginInfo) {
            $loginInfo['member_id'] = $member->id;
            $loginInfo['store_id'] = $order->store_id;
            Cache::set('mini_token:' . $token, $loginInfo, 86400 * 7);
        }

        return JsonService::data([
            'code' => 1,
            'msg' => '绑定成功',
            'order_id' => $order->id,
            'member_id' => $member->id,
        ]);
    }

    /**
     * 我的历史账单
     * GET /miniappapi/order.Order/myBills
     */
    public function myBills(Request $request)
    {
        $memberId = $request->memberId;

        if (empty($memberId)) {
            return JsonService::data(['list' => [], 'total' => 0]);
        }

        $orders = OrderModel::where('member_id', $memberId)
            ->order('created_at', 'desc')
            ->limit(50)
            ->select();

        $list = [];
        foreach ($orders as $order) {
            $table = TableModel::find($order->table_id);
            $startTime = strtotime($order->start_time);
            $endTime = strtotime($order->end_time);
            $duration = $endTime > $startTime ? ($endTime - $startTime) / 60 : 0;

            $list[] = [
                'order_id' => $order->id,
                'table_name' => $table->name ?? '',
                'start_time' => $order->start_time,
                'end_time' => $order->end_time,
                'duration_minutes' => round($duration, 1),
                'final_amount' => (float)$order->final_amount,
                'status' => $order->status,
                'store_id' => $order->store_id,
            ];
        }

        return JsonService::data([
            'list' => $list,
            'total' => count($list),
        ]);
    }
}
