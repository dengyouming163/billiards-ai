<?php

namespace app\api\controller;

use app\common\controller\BaseLikeAdminController;
use think\facade\Db;
use think\facade\Log;

/**
 * 微信支付回调接收器
 * 验签 → 更新 payment_records → 完成订单
 */
class PayHubCallbackController extends BaseLikeAdminController
{
    protected array $notNeedLogin = ['receive'];

    /**
     * POST /api/pay-hub/callback
     */
    public function receive()
    {
        try {
            $service = new \app\common\service\pay\WechatPaymentService();
            $event = $service->handleCallback();

            if (!$event) {
                Log::error('[WechatCallback] 签名验证或解密失败');
                return json(['code' => 'FAIL', 'message' => '验证失败']);
            }

            $outTradeNo = $event['outTradeNo'] ?? '';
            $transactionId = $event['transactionId'] ?? '';
            $paidAmount = (int)($event['amount'] ?? 0) / 100; // 分转元
            $eventType = $event['eventType'] ?? '';

            if ($eventType !== 'TRANSACTION.SUCCESS') {
                return json(['code' => 'SUCCESS']); // 非支付成功事件，ack即可
            }

            // 查找支付记录
            $record = \think\facade\Db::name('payment_records')
                ->where('payment_id', $outTradeNo)
                ->find();

            if (!$record) {
                // 可能是旧 pay-hub 格式的 payment_id，按 order 查询
                $orderId = $outTradeNo;
                // 截取 order id（移除时间后缀）
                if (str_contains($outTradeNo, '_')) {
                    $parts = explode('_', $outTradeNo);
                    $orderId = $parts[0] . '_' . ($parts[1] ?? '');
                }
                $record = \think\facade\Db::name('payment_records')
                    ->where('order_id', $orderId)
                    ->order('id', 'desc')
                    ->find();
            }

            if (!$record) {
                Log::error("[WechatCallback] 支付记录未找到: outTradeNo={$outTradeNo}");
                return json(['code' => 'FAIL', 'message' => '支付记录不存在']);
            }

            // 防重复处理
            if ($record['status'] === 'paid' || $record['status'] === 'refunded') {
                return json(['code' => 'SUCCESS', 'message' => '已处理']);
            }

            // 更新支付记录
            \think\facade\Db::name('payment_records')->where('id', $record['id'])->update([
                'status' => 'paid',
                'channel_trade_no' => $transactionId,
                'paid_amount' => $paidAmount,
            ]);

            // 完成订单
            \app\storeapi\logic\payment\PaymentLogic::completeOrderAfterPayment(
                $record['order_id'],
                $record['store_id'],
                $paidAmount
            );

            Log::info("[WechatCallback] 支付成功: order={$record['order_id']} amount={$paidAmount}");
            return json(['code' => 'SUCCESS']);

        } catch (\Throwable $e) {
            Log::error('[WechatCallback] 异常: ' . $e->getMessage());
            return json(['code' => 'FAIL', 'message' => '处理异常']);
        }
    }
}
