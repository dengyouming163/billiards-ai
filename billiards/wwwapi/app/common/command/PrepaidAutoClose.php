<?php

declare(strict_types=1);

namespace app\common\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;
use app\common\constants\TableStatus;
use app\common\lib\WebSocketNotification;

/**
 * 预付订单时长耗尽自动处理
 * 每分钟执行一次
 * - 无额外消费 → 自动关台结算（0元）
 * - 有额外消费 → WebSocket推送到POS提醒结账
 */
class PrepaidAutoClose extends Command
{
    protected function configure()
    {
        $this->setName('prepaid:auto-close')
            ->setDescription('预付套餐时长耗尽时自动关台或推送提醒');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->info('[PrepaidAutoClose] 开始扫描预付到期订单...');

        try {
            // 查找预付订单：prepaid_hours>0, status=in_progress
            // 基于 start_time + prepaid_hours 判断是否到期（不依赖 remaining_minutes tick 机制）
            $now = time();
            $allPrepaid = Db::name('busi_order')
                ->where('prepaid_hours', '>', 0)
                ->where('status', 'in_progress')
                ->whereNull('deleted_at')
                ->select()
                ->toArray();

            $orders = [];
            foreach ($allPrepaid as $o) {
                $startTime = strtotime($o['start_time'] ?? '2000-01-01');
                $prepaidSeconds = intval(floatval($o['prepaid_hours']) * 3600);
                $expireTime = $startTime + $prepaidSeconds;
                if ($now >= $expireTime) {
                    $orders[] = $o;
                }
            }

            if (empty($orders)) {
                $output->info('[PrepaidAutoClose] 无预付到期订单');
                return;
            }

            $autoClosedCount = 0;
            $notifiedCount = 0;

            foreach ($orders as $order) {
                // 检查是否有额外消费（商品/助教 OrderItem）
                $extraItems = Db::name('busi_order_item')
                    ->where('order_id', $order['id'])
                    ->whereIn('item_type', ['product', 'assistant'])
                    ->where('status', '<>', 'cancelled')
                    ->select()
                    ->toArray();

                if (empty($extraItems)) {
                    // 无额外消费 → 自动关台
                    $this->autoClose($order, $output);
                    $autoClosedCount++;
                } else {
                    // 有额外消费 → 推送POS提醒
                    $this->notifyPos($order, $output);
                    $notifiedCount++;
                }
            }

            $output->info("[PrepaidAutoClose] 完成 — 自动关台 {$autoClosedCount} 单, 推送提醒 {$notifiedCount} 单");
        } catch (\Exception $e) {
            $output->error('[PrepaidAutoClose] 异常: ' . $e->getMessage());
        }
    }

    /**
     * 自动关台（无额外消费）
     */
    private function autoClose(array $order, Output $output): void
    {
        Db::startTrans();
        try {
            $now = date('Y-m-d H:i:s');

            // 更新订单状态
            Db::name('busi_order')
                ->where('id', $order['id'])
                ->update([
                    'status' => 'completed',
                    'payment_status' => 'paid',
                    'end_time' => $now,
                    'final_amount' => floatval($order['prepaid_amount'] ?? 0),
                ]);

            // 释放台桌
            if (!empty($order['table_id'])) {
                Db::name('busi_table')
                    ->where('id', $order['table_id'])
                    ->update(['status' => TableStatus::IDLE]);
            }

            Db::commit();

            // WebSocket通知平板清空界面
            try {
                WebSocketNotification::init();
                WebSocketNotification::sendToGroup("table_{$order['table_id']}", [
                    'type' => 'table_released',
                    'data' => [
                        'table_id' => $order['table_id'],
                        'order_id' => $order['id'],
                        'reason' => 'prepaid_expired',
                        'timestamp' => time(),
                    ]
                ]);
            } catch (\Exception $e) {
                // WS失败不影响主流程
            }

            $output->info("[PrepaidAutoClose] 自动关台: order={$order['id']} table={$order['table_id']}");
        } catch (\Exception $e) {
            Db::rollback();
            $output->error("[PrepaidAutoClose] 自动关台失败: {$order['id']} — {$e->getMessage()}");
        }
    }

    /**
     * 推送POS提醒（有额外消费需结账）
     */
    private function notifyPos(array $order, Output $output): void
    {
        try {
            WebSocketNotification::init();
            WebSocketNotification::sendToGroup("store_{$order['store_id']}", [
                'type' => 'prepaid_expired',
                'data' => [
                    'order_id' => $order['id'],
                    'table_id' => $order['table_id'],
                    'message' => '套餐时长已耗尽，客户有额外消费需结账',
                    'timestamp' => time(),
                ]
            ]);
            $output->info("[PrepaidAutoClose] 推送提醒: order={$order['id']} table={$order['table_id']}");
        } catch (\Exception $e) {
            $output->error("[PrepaidAutoClose] 推送失败: {$order['id']} — {$e->getMessage()}");
        }
    }
}
