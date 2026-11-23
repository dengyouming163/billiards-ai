<?php

declare(strict_types=1);

namespace app\cron;

use app\common\model\merchant\OrderItem;
use app\common\model\PaymentRecord;
use think\facade\Db;
use think\facade\Log;

/**
 * 清理过期的助教买断预付草稿
 * 每分钟执行 — 删除超过 6 分钟的 prepay_draft
 */
class CleanExpiredPrepayDraft
{
    public function run(): void
    {
        $cutoff = date('Y-m-d H:i:s', strtotime('-6 minutes'));

        try {
            $expiredItems = OrderItem::where('status', 'prepay_draft')
                ->where('created_at', '<', $cutoff)
                ->select();

            $count = 0;
            foreach ($expiredItems as $item) {
                Db::startTrans();
                try {
                    // 标记关联的 payment_record 为 expired
                    PaymentRecord::where('order_item_id', $item->id)
                        ->where('status', 'pending')
                        ->update(['status' => 'expired']);

                    // 删除草稿
                    $item->delete();

                    Db::commit();
                    $count++;
                } catch (\Exception $e) {
                    Db::rollback();
                    Log::error("[CleanExpiredPrepayDraft] Failed on {$item->id}: " . $e->getMessage());
                }
            }

            if ($count > 0) {
                Log::info("[CleanExpiredPrepayDraft] Cleaned {$count} expired prepay_draft items (cutoff: {$cutoff})");
            }
        } catch (\Exception $e) {
            Log::error("[CleanExpiredPrepayDraft] Error: " . $e->getMessage());
        }
    }
}
