<?php
namespace app\storeapi\logic\payment;

use app\common\logic\BaseLogic;
use app\common\model\PaymentRecord;
use app\storeapi\logic\order\CheckoutLogic;
use think\facade\Cache;
use think\facade\Log;
use think\facade\Db;

class PaymentLogic extends BaseLogic
{
    const LOCK_TTL = 120;      // 锁价有效期 2 分钟（秒）
    const POLL_TIMEOUT = 30;   // 轮询超时（秒）

    /**
     * 获取门店子商户号 — 从进件记录读取
     * 特约商户进件成功后 sub_mchid 写入 bi_wechat_applyment 表
     */
    private static function getStoreSubMchId(string $storeId): string
    {
        $record = \think\facade\Db::name('wechat_applyment')
            ->where('store_id', $storeId)
            ->whereNotNull('sub_mchid')
            ->where('sub_mchid', '<>', '')
            ->order('id', 'desc')
            ->find();
        return $record['sub_mchid'] ?? '';
    }

    /**
     * 准备结算 — 计算权威金额 + 生成锁价 token
     */
    public static function prepare(string $orderId, string $storeId): array|false
    {
        $bill = CheckoutLogic::getBill($orderId, $storeId);
        $finalAmount = $bill['billing']['final_amount'] ?? 0;
        if (!$bill || $finalAmount <= 0) {
            return self::err('订单不存在或已结算');
        }

        $token = 'pt_' . bin2hex(random_bytes(16));
        $expiresAt = time() + self::LOCK_TTL;

        Cache::set('payment_prepare_' . $token, [
            'order_id'   => $orderId,
            'store_id'   => $storeId,
            'amount'     => $finalAmount,
            'expires_at' => $expiresAt,
        ], self::LOCK_TTL);

        return [
            'token'      => $token,
            'amount'     => round($finalAmount, 2),
            'breakdown'  => $bill,
            'expires_at' => date('Y-m-d H:i:s', $expiresAt),
        ];
    }

    /**
     * 创建支付 — NATIVE / JSAPI
     */
    public static function create(array $params, string $storeId): array|false
    {
        $token     = $params['token'] ?? '';
        $orderId   = $params['order_id'] ?? '';
        $channel   = $params['channel'] ?? 'wechat';
        $tradeType = $params['trade_type'] ?? 'NATIVE';
        $openid    = $params['openid'] ?? '';

        // 校验 token
        $cached = Cache::get('payment_prepare_' . $token);
        if (!$cached) return self::err('结算已过期，请重新结算');
        if ($cached['order_id'] !== $orderId) return self::err('订单不匹配');
        if ($cached['expires_at'] < time()) return self::err('结算锁价已过期，请重新结算');

        $amount = $cached['amount'];

        // 金额校验（容差 0.01）
        if (isset($params['amount']) && abs((float)$params['amount'] - $amount) > 0.01) {
            return self::err('支付金额与结算金额不一致');
        }

        try {
            $wechatPay = new \app\common\service\pay\WechatPaymentService();
            $subMchId = self::getStoreSubMchId($storeId);
            if (empty($subMchId)) {
                return self::err('门店未完成微信进件，无法发起支付');
            }
            // 商户订单号 ≤32 字符：orderId 截取后 20 位 + 时分秒 (6 位) = 26 字符
            $outTradeNo = substr($orderId, -20) . date('His');
            // 微信支付金额单位：分（元 × 100）
            $amountInFen = intval(round($amount * 100));
            $result = $wechatPay->native(
                $outTradeNo,
                $amountInFen,
                $params['description'] ?? '台球消费',
                $subMchId
            );

            if (empty($result['code_url'])) {
                $errMsg = $result['error_msg'] ?? '支付网关无响应';
                Log::error('[PaymentLogic] NATIVE 创建失败: ' . json_encode($result));
                return self::err($errMsg);
            }

            $payUrl = $result['code_url'];
            $channelTradeNo = $result['prepay_id'] ?? '';
            $requestId = $orderId . '_' . date('YmdHis') . '_' . bin2hex(random_bytes(4));

            // 清理同订单旧的非 PAID 记录（重试支付场景）
            PaymentRecord::where('order_id', $orderId)
                ->whereNotIn('status', [PaymentRecord::STATUS_PAID, PaymentRecord::STATUS_REFUNDED])
                ->delete();

            // 存本地记录
            // payment_id 存 out_trade_no（用于后续轮询查单），channel_trade_no 存 prepay_id
            PaymentRecord::create([
                'id'               => 'pr_' . bin2hex(random_bytes(12)),
                'order_id'         => $orderId,
                'store_id'         => $storeId,
                'payment_id'       => $outTradeNo,
                'request_id'       => $requestId,
                'channel'          => $channel,
                'amount'           => $amount,
                'status'           => PaymentRecord::STATUS_PENDING,
                'pay_url'          => $payUrl,
                'channel_trade_no' => $channelTradeNo,
                'created_at'       => date('Y-m-d H:i:s'),
                'updated_at'       => date('Y-m-d H:i:s'),
            ]);

            // 消费 token
            Cache::delete('payment_prepare_' . $token);

            return [
                'payment_id' => $outTradeNo,
                'amount'     => $amount,
                'pay_url'    => $payUrl,
                'qr_code'    => $payUrl,
            ];

        } catch (\Exception $e) {
            Log::error('[PaymentLogic] create异常: ' . $e->getMessage());
            return self::err('创建支付失败: ' . $e->getMessage());
        }
    }

    /**
     * 扫码枪付款码支付 — MICROPAY（同步返回结果）
     */
    public static function micropay(array $params, string $storeId): array|false
    {
        $token    = $params['token'] ?? '';
        $orderId  = $params['order_id'] ?? '';
        $authCode = $params['auth_code'] ?? '';

        if (empty($authCode)) return self::err('请扫描付款码');

        // 校验 token
        $cached = Cache::get('payment_prepare_' . $token);
        if (!$cached) return self::err('结算已过期，请重新结算');
        if ($cached['order_id'] !== $orderId) return self::err('订单不匹配');
        if ($cached['expires_at'] < time()) return self::err('结算锁价已过期，请重新结算');

        $amount = $cached['amount'];

        $subMchId = self::getStoreSubMchId($storeId);
        if (empty($subMchId)) {
            return self::err('门店未完成微信进件，无法发起支付');
        }

        try {
            $wechatPay = new \app\common\service\pay\WechatPaymentService();
            // 微信支付金额单位：分（元 × 100）
            $amountInFen = intval(round($amount * 100));
            $result = $wechatPay->micropay(
                substr($orderId, -20) . date('His'),
                $authCode,
                $amountInFen,
                $params['description'] ?? 'POS收银',
                $subMchId
            );

            if ($result && ($result['success'] ?? false)) {
                self::completeOrderAfterPayment($orderId, $storeId, $amount);
                Cache::delete('payment_prepare_' . $token);
                return ['success' => true, 'payment_id' => $result['transaction_id'] ?? ''];
            }

            Log::error('[PaymentLogic] MICROPAY 失败: ' . json_encode($result));
            return self::err($result['error_msg'] ?? '支付失败，请重新扫码');

        } catch (\Exception $e) {
            Log::error('[PaymentLogic] micropay异常: ' . $e->getMessage());
            return self::err('支付异常: ' . $e->getMessage());
        }
    }

    /**
     * 查询支付状态（轮询）
     * 平板/POS 前端每 2-3 秒调用一次，直到 paid/failed
     */
    public static function query(string $orderId, string $storeId): array|false
    {
        $record = PaymentRecord::findByOrderId($orderId);
        if (!$record) return self::err('未找到支付记录');

        // 已终态直接返回
        $finalStates = [PaymentRecord::STATUS_PAID, PaymentRecord::STATUS_FAILED, PaymentRecord::STATUS_REFUNDED];
        if (in_array($record->status, $finalStates)) {
            return ['status' => $record->status, 'paid_amount' => $record->amount, 'payment_id' => $record->payment_id];
        }

        // pending → 主动向微信查单
        if ($record->status === PaymentRecord::STATUS_PENDING) {
            try {
                $subMchId = self::getStoreSubMchId($storeId);
                if (empty($subMchId)) {
                    Log::warning("[PaymentLogic] query: store={$storeId} 无子商户号");
                    return ['status' => $record->status, 'paid_amount' => $record->amount, 'payment_id' => $record->payment_id];
                }

                $wechatService = new \app\common\service\pay\WechatPaymentService();
                // payment_id 存的是 out_trade_no
                $result = $wechatService->queryByOutTradeNo($record->payment_id, $subMchId);

                if ($result && !empty($result['trade_state'])) {
                    $ts = $result['trade_state'];
                    Log::info("[PaymentLogic] 微信查单: outTradeNo={$record->payment_id} trade_state={$ts}");

                    if ($ts === 'SUCCESS') {
                        $record->status = PaymentRecord::STATUS_PAID;
                        $record->channel_trade_no = $result['transaction_id'] ?? '';
                        $record->paid_amount = $result['total_fee'] ?? $record->amount;
                        $record->save();
                        self::completeOrderAfterPayment($orderId, $storeId, $record->amount);
                    } elseif (in_array($ts, ['CLOSED', 'PAYERROR', 'REVOKED'])) {
                        $record->status = PaymentRecord::STATUS_FAILED;
                        $record->save();
                    }
                }
            } catch (\Exception $e) {
                Log::error('[PaymentLogic] 微信查单异常: ' . $e->getMessage());
            }
        }

        return ['status' => $record->status, 'paid_amount' => $record->amount, 'payment_id' => $record->payment_id];
    }

    /**
     * 支付成功后完成订单（或标记助教买断 item 为已付）
     */
    public static function completeOrderAfterPayment(string $orderId, string $storeId, float $amount): void
    {
        try {
            // 检查是否为助教买断支付（需单独标记 OrderItem）
            $record = PaymentRecord::findByOrderId($orderId);
            if ($record && !empty($record->order_item_id) && $record->item_type === 'assistant_buyout') {
                self::completeAssistantBuyoutAfterPayment($record, $orderId, $storeId, $amount);
                return;
            }

            // 正常订单支付: 完成整个结账
            CheckoutLogic::checkout($orderId, $storeId, [
                'wechat_paid'  => $amount,
                'balance_paid' => 0,
                'cash_paid'    => 0,
                'alipay_paid'  => 0,
                'card_paid'    => 0,
                'discount'     => 0,
            ]);

            // WebSocket 通知收银端 + 平板支付成功
            try {
                $order = Db::name('busi_order')->where('id', $orderId)->find();
                $tableName = '';
                if (!empty($order['table_id'])) {
                    $table = Db::name('busi_table')->where('id', $order['table_id'])->find();
                    $tableName = $table['name'] ?? '';
                }
                $wsData = json_encode([
                    'type' => 'payment_success',
                    'data' => [
                        'order_id'   => $orderId,
                        'table_id'   => $order['table_id'] ?? '',
                        'table_name' => $tableName,
                        'amount'     => $amount,
                        'paid_at'    => date('Y-m-d H:i:s'),
                    ]
                ], JSON_UNESCAPED_UNICODE);
                \app\common\lib\WebSocketNotification::init();
                \GatewayClient\Gateway::sendToGroup('store_' . $storeId, $wsData);
            } catch (\Exception $wsEx) {
                Log::warning('[PaymentLogic] WS推送失败: ' . $wsEx->getMessage());
            }

            Log::info("[PaymentLogic] 支付完成 order={$orderId} amount={$amount}");
        } catch (\Exception $e) {
            Log::error("[PaymentLogic] 订单完成失败 order={$orderId}: " . $e->getMessage());
        }
    }

    /**
     * 助教买断支付成功后：标记 OrderItem 为 delivered + is_paid
     */
    private static function completeAssistantBuyoutAfterPayment(
        PaymentRecord $record,
        string $orderId,
        string $storeId,
        float $amount
    ): void {
        Db::startTrans();
        try {
            $item = \app\common\model\merchant\OrderItem::where('id', $record->order_item_id)
                ->where('status', 'prepay_draft')
                ->lock(true)
                ->find();

            if (!$item) {
                Log::warning("[PaymentLogic] assistant_buyout OrderItem not found: {$record->order_item_id}");
                Db::rollback();
                return;
            }

            $item->is_paid = 1;
            $item->paid_at = date('Y-m-d H:i:s');
            $item->status = 'delivered';
            $item->delivered_at = date('Y-m-d H:i:s');
            $item->save();

            // 写入 order_payment
            $op = new \app\common\model\merchant\OrderPayment();
            $op->order_id = $orderId;
            $op->store_id = $storeId;
            $op->order_item_id = $record->order_item_id;
            $op->amount = $amount;
            $op->payment_method = $record->channel ?? 'wechat';
            $op->channel = $record->channel ?? 'wechat';
            $op->status = 'paid';
            $op->paid_at = date('Y-m-d H:i:s');
            $op->save();

            // 更新订单 assistant_fee
            $order = \app\common\model\merchant\Order::where('id', $orderId)->find();
            if ($order) {
                $order->assistant_fee = round(floatval($order->assistant_fee) + floatval($item->final_price), 2);
                $order->save();
            }

            Db::commit();
            Log::info("[PaymentLogic] assistant_buyout item={$record->order_item_id} marked paid amount={$amount}");
        } catch (\Exception $e) {
            Db::rollback();
            Log::error("[PaymentLogic] assistant_buyout完成失败: " . $e->getMessage());
        }
    }

    private static function err(string $msg): false { self::setError($msg); return false; }
}
