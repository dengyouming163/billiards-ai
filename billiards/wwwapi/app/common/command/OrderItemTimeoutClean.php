<?php

declare(strict_types=1);

namespace app\common\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;
use app\common\lib\WebSocketNotification;

/**
 * 订单项超时自动取消
 * 每分钟执行一次，将过期的预下单和助教预约状态改为 cancelled
 */
class OrderItemTimeoutClean extends Command
{
    protected function configure()
    {
        $this->setName('order-item:timeout-clean')
            ->setDescription('将过期的预下单/助教预约自动取消，避免残留垃圾数据');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->info('[OrderItemTimeoutClean] 开始扫描过期订单项...');

        try {
            $now = date('Y-m-d H:i:s');

            // 查询过期的预下单和助教预约
            $items = Db::name('busi_order_item')
                ->whereIn('item_type', ['product', 'assistant'])
                ->whereIn('status', ['preorder_pending', 'pending'])
                ->where('expires_at', '<', $now)
                ->whereNotNull('expires_at')
                ->select()
                ->toArray();

            if (empty($items)) {
                $output->info('[OrderItemTimeoutClean] 无过期订单项');
                return;
            }

            $cancelledCount = 0;
            $groupedByOrder = [];

            foreach ($items as $item) {
                $itemId = $item['id'];
                $orderId = $item['order_id'];

                // 更新状态为 cancelled
                Db::name('busi_order_item')
                    ->where('id', $itemId)
                    ->update(['status' => 'cancelled']);

                $cancelledCount++;

                // 按订单分组，后续推送 WS 通知
                if (!isset($groupedByOrder[$orderId])) {
                    $groupedByOrder[$orderId] = [];
                }
                $groupedByOrder[$orderId][] = $item;

                $output->info("  ❌ cancelled: {$itemId} ({$item['item_type']}) — {$item['item_name']}");
            }

            // WS 通知相关平板和 POS
            foreach ($groupedByOrder as $orderId => $orderItems) {
                try {
                    $order = Db::name('busi_order')->where('id', $orderId)->find();
                    if ($order && !empty($order['table_id'])) {
                        // 通知平板：订单项已超时取消
                        WebSocketNotification::sendToGroup('table_' . $order['table_id'], [
                            'type' => 'order_item_timeout',
                            'data' => [
                                'order_id' => $orderId,
                                'table_id' => $order['table_id'],
                                'cancelled_count' => count($orderItems),
                            ]
                        ]);
                    }
                } catch (\Exception $e) {
                    // WS 推送失败不影响清理
                }
            }

            $output->info("[OrderItemTimeoutClean] 完成 — 取消 {$cancelledCount} 条过期记录");

        } catch (\Exception $e) {
            $output->error('[OrderItemTimeoutClean] 异常: ' . $e->getMessage());
        }
    }
}
