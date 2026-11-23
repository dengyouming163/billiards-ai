<?php

declare(strict_types=1);

namespace app\common\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use app\common\model\merchant\Order;
use app\storeapi\logic\order\CheckoutLogic;
use app\common\lib\WebSocketNotification;
use think\facade\Log;

/**
 * 预付套餐到期自动结账
 * 每分钟执行 — 逾期5分钟后自动调用 CheckoutLogic::checkout
 */
class AutoCheckoutPrepaidOrders extends Command
{
    const GRACE_SECONDS = 300;

    protected function configure()
    {
        $this->setName('prepaid:auto-checkout')
            ->setDescription('预付套餐到期自动结账');
    }

    protected function execute(Input $input, Output $output)
    {
        $now = time();
        $count = 0;

        try {
            $orders = Order::where('prepaid_hours', '>', 0)
                ->where('status', 'in_progress')
                ->whereNotNull('start_time')
                ->select();

            foreach ($orders as $order) {
                $expireTime = strtotime($order->start_time) + ((int)$order->prepaid_hours * 3600);
                $overdue = $now - $expireTime;
                if ($overdue < self::GRACE_SECONDS) continue;

                $storeId  = $order->store_id;
                $orderId  = $order->id;
                $tableId  = $order->table_id;

                try {
                    $balancePaid = floatval($order->final_amount ?? 0);
                    $result = CheckoutLogic::checkout($orderId, $storeId, [
                        'cash_paid'      => 0,
                        'wechat_paid'    => 0,
                        'balance_paid'   => $balancePaid,
                        'pay_type'       => 'prepaid',
                        'pay_amount'     => $balancePaid,
                        'channel'        => 'prepaid_auto',
                        'remark'         => '预付到期自动结账(超时' . ceil($overdue / 60) . '分)',
                        'operator_id'    => '',
                        'operator_name'  => '系统自动',
                        'discount'       => 0,
                    ]);

                    if ($result !== false) {
                        try {
                            WebSocketNotification::sendToGroup("store_{$storeId}", [
                                'type' => 'checkout_completed',
                                'data' => [
                                    'order_id'   => $orderId,
                                    'table_id'   => $tableId,
                                    'table_name' => $order->table_name ?? '',
                                    'message'    => '预付到期,已自动结账',
                                    'auto'       => true,
                                ]
                            ]);
                        } catch (\Exception $e) {
                            Log::warning("[AutoCheckout] WS failed: {$e->getMessage()}");
                        }
                        $count++;
                        $output->info("  ✅ Auto-checkout: {$orderId} overdue {$overdue}s");
                    } else {
                        $output->warning("  ❌ Failed: {$orderId} - " . (CheckoutLogic::getError() ?: 'unknown'));
                    }
                } catch (\Exception $e) {
                    Log::error("[AutoCheckout] Error: {$e->getMessage()}");
                    $output->error("  ⚠️ {$orderId}: {$e->getMessage()}");
                }
            }

            if ($count > 0) {
                $output->info("[AutoCheckout] Done: {$count} orders");
            }
        } catch (\Exception $e) {
            $output->error("[AutoCheckout] Fatal: {$e->getMessage()}");
        }
    }
}
