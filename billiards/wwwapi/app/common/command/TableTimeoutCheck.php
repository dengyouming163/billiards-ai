<?php

declare(strict_types=1);

namespace app\common\command;

use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Cache;
use app\common\model\merchant\Order;
use app\common\model\merchant\Table;
use app\common\lib\WebSocketNotification;

/**
 * 球台超时检测 & 结账提醒
 * 每分钟执行一次，检测预付时间即将用完或已用完的台桌，
 * 通过 WebSocket 推送 table_timeout / checkout_remind 给收银端
 */
class TableTimeoutCheck extends Command
{
    // 超时预警阈值：剩余分钟数 ≤ 此值时触发（单位：分钟）
    const TIMEOUT_WARN_MINUTES = 5;

    // 结账提醒窗口：预付时间结束后 N 分钟内持续提醒（单位：分钟）
    const CHECKOUT_REMIND_WINDOW = 10;

    // 同一订单同类型通知的最小间隔（秒），防止每分钟重复推送
    const NOTIFY_COOLDOWN = 120;

    // 缓存前缀
    const CACHE_PREFIX_TIMEOUT = 'table_timeout_last:';
    const CACHE_PREFIX_CHECKOUT = 'checkout_remind_last:';

    protected function configure()
    {
        $this->setName('table:timeout-check')
            ->setDescription('检测预付时间到期和已超时的订单，向收银端推送提醒');
    }

    protected function execute(Input $input, Output $output)
    {
        $output->info('[TableTimeoutCheck] 开始检测...');

        try {
            // 只查状态为 in_progress 且有预付时长的订单
            $orders = Order::where('status', 'in_progress')
                ->where('prepaid_hours', '>', 0)
                ->select()
                ->toArray();

            if (empty($orders)) {
                $output->info('[TableTimeoutCheck] 无预付订单，跳过');
                return;
            }

            $now = time();
            $timeoutCount = 0;
            $checkoutCount = 0;

            // 预加载 table_id → name 映射（busi_order 不存 table_name）
            $tableIds = array_unique(array_column($orders, 'table_id'));
            $tableMap = [];
            if (!empty($tableIds)) {
                $tables = Table::whereIn('id', $tableIds)->column('name,number', 'id');
                foreach ($tables as $tid => $row) {
                    $tableMap[$tid] = $row['name'] ?? $row['number'] ?? '';
                }
            }

            foreach ($orders as $order) {
                // 计算剩余分钟数
                $startTime = strtotime($order['start_time']);
                if (!$startTime || $startTime <= 0) {
                    continue; // start_time 异常，跳过
                }

                $prepaidSeconds = (int)$order['prepaid_hours'] * 3600;
                $elapsedSeconds = $now - $startTime;
                $remainingSeconds = $prepaidSeconds - $elapsedSeconds;
                $remainingMinutes = (int)ceil($remainingSeconds / 60);

                $storeId = $order['store_id'];
                $orderId = $order['id'];
                $tableId = $order['table_id'] ?? '';
                $tableName = $tableMap[$tableId] ?? '';

                $data = [
                    'order_id' => $orderId,
                    'table_id' => $tableId,
                    'table_name' => $tableName,
                    'remaining_minutes' => $remainingMinutes,
                    'prepaid_hours' => (int)$order['prepaid_hours'],
                    'player_count' => 0,
                ];

                // 场景 1：剩余时间 ≤ 5 分钟且 > 0 → 超时预警
                if ($remainingMinutes <= self::TIMEOUT_WARN_MINUTES && $remainingMinutes > 0) {
                    if ($this->shouldNotify(self::CACHE_PREFIX_TIMEOUT . $orderId)) {
                        WebSocketNotification::sendTableTimeout($storeId, $data);
                        $this->markNotified(self::CACHE_PREFIX_TIMEOUT . $orderId);
                        $timeoutCount++;
                        $output->info("  ⏰ table_timeout → {$tableName}({$orderId}) 剩余{$remainingMinutes}分钟");
                    }
                }

                // 场景 2：已超时但还在提醒窗口内 → 结账提醒
                if ($remainingMinutes <= 0 && $remainingMinutes > -self::CHECKOUT_REMIND_WINDOW) {
                    if ($this->shouldNotify(self::CACHE_PREFIX_CHECKOUT . $orderId)) {
                        WebSocketNotification::sendCheckoutRemind($storeId, $data);
                        $this->markNotified(self::CACHE_PREFIX_CHECKOUT . $orderId);
                        $checkoutCount++;
                        $output->info("  💰 checkout_remind → {$tableName}({$orderId}) 已超时" . abs($remainingMinutes) . "分钟");
                    }
                }
            }

            $output->info("[TableTimeoutCheck] 完成 — 超时预警 {$timeoutCount} 条, 结账提醒 {$checkoutCount} 条");

        } catch (\Exception $e) {
            $output->error('[TableTimeoutCheck] 异常: ' . $e->getMessage());
        }
    }

    /**
     * 判断是否应该发送通知（冷却时间内不重复发送）
     */
    private function shouldNotify(string $cacheKey): bool
    {
        $lastTime = Cache::get($cacheKey);
        if (!$lastTime) {
            return true;
        }
        return (time() - (int)$lastTime) >= self::NOTIFY_COOLDOWN;
    }

    /**
     * 记录通知发送时间
     */
    private function markNotified(string $cacheKey): void
    {
        Cache::set($cacheKey, time(), 600); // 缓存10分钟，足够覆盖检查周期
    }
}
