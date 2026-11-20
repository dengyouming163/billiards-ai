<?php

declare(strict_types=1);

namespace app\cron;

use app\common\model\merchant\Notification;
use think\facade\Log;

/**
 * 通知自动清理 — 每天凌晨 3:00 执行
 * 删除 7 天前的通知
 */
class CleanNotifications
{
    public function run(): void
    {
        $cutoff = date('Y-m-d H:i:s', strtotime('-7 days'));

        try {
            $deleted = Notification::where('created_at', '<', $cutoff)
                ->delete();

            Log::info("[CleanNotifications] Deleted {$deleted} old notifications before {$cutoff}");
        } catch (\Exception $e) {
            Log::error("[CleanNotifications] Error: " . $e->getMessage());
        }
    }
}
