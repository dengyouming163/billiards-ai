<?php

declare(strict_types=1);

namespace app\storeapi\logic;

use app\common\model\merchant\MemberDiscount;
use think\facade\Log;

/**
 * 会员折扣 Logic
 */
class MemberDiscountLogic
{
    /**
     * 获取会员折扣列表
     */
    public static function getList(string $storeId): array
    {
        $discounts = MemberDiscount::where('store_id', $storeId)
            ->orderRaw("FIELD(level, 'normal', 'silver', 'gold', 'diamond')")
            ->select()
            ->toArray();

        return array_map(function ($discount) {
            return self::formatDiscount($discount);
        }, $discounts);
    }

    /**
     * 获取单个会员折扣详情
     */
    public static function getDetail(string $id): ?array
    {
        $discount = MemberDiscount::find($id);
        if (!$discount) {
            return null;
        }

        return self::formatDiscount($discount->toArray());
    }

    /**
     * 更新会员折扣
     */
    public static function update(string $storeId, array $data): array
    {
        if (empty($data['discounts']) || !is_array($data['discounts'])) {
            return ['code' => 400, 'msg' => '参数错误：discounts不能为空'];
        }

        Db::startTrans();
        try {
            foreach ($data['discounts'] as $discountData) {
                $level = $discountData['level'] ?? '';
                if (empty($level)) {
                    continue;
                }

                $discount = MemberDiscount::where('store_id', $storeId)
                    ->where('level', $level)
                    ->find();

                if ($discount) {
                    $discount->save([
                        'discount_rate' => (float) ($discountData['discount_rate'] ?? $discount->discount_rate),
                        'enabled' => isset($discountData['enabled']) ? (int) $discountData['enabled'] : $discount->enabled,
                    ]);
                } else {
                    MemberDiscount::create([
                        'id' => uniqid('md_'),
                        'store_id' => $storeId,
                        'level' => $level,
                        'discount_rate' => (float) ($discountData['discount_rate'] ?? 1.0),
                        'enabled' => isset($discountData['enabled']) ? (int) $discountData['enabled'] : 0,
                    ]);
                }
            }

            Db::commit();

            return [
                'code' => 0,
                'msg' => '更新成功',
                'data' => self::getList($storeId),
            ];
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('MemberDiscountLogic::update: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return ['code' => 500, 'msg' => '更新失败，请稍后重试'];
        }
    }

    /**
     * 获取会员折扣率
     */
    public static function getDiscountRate(string $storeId, string $level): float
    {
        return MemberDiscount::getDiscountRateByLevel($storeId, $level);
    }

    /**
     * 格式化折扣数据
     */
    protected static function formatDiscount(array $discount): array
    {
        return [
            'id' => $discount['id'],
            'store_id' => $discount['store_id'],
            'level' => $discount['level'],
            'level_text' => MemberDiscount::LEVEL_LABELS[$discount['level']] ?? $discount['level'],
            'discount_rate' => (float) $discount['discount_rate'],
            'discount_text' => sprintf('%.0f折', (float) $discount['discount_rate'] * 10),
            'enabled' => (int) $discount['enabled'],
            'enabled_text' => $discount['enabled'] === 1 ? '启用' : '禁用',
            'created_at' => $discount['created_at'],
            'updated_at' => $discount['updated_at'],
        ];
    }
}
