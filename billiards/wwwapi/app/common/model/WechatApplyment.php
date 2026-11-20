<?php

namespace app\common\model;

use think\Model;

/**
 * 微信特约商户进件表模型
 * 一店一户：每个 store 仅保留一条有效进件记录
 */
class WechatApplyment extends Model
{
    protected $name = 'wechat_applyment';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    /** 状态常量 — 全项目单一来源 */
    const STATE_EDITTING     = 'APPLYMENT_STATE_EDITTING';
    const STATE_AUDITING     = 'APPLYMENT_STATE_AUDITING';
    const STATE_REJECTED     = 'APPLYMENT_STATE_REJECTED';
    const STATE_TO_BE_SIGNED = 'APPLYMENT_STATE_TO_BE_SIGNED';
    const STATE_SIGNING      = 'APPLYMENT_STATE_SIGNING';
    const STATE_FINISHED     = 'APPLYMENT_STATE_FINISHED';
    const STATE_CANCELED     = 'APPLYMENT_STATE_CANCELED';

    /**
     * 有效申请（排除已取消/已驳回 — 用于检测是否存在进行中的申请）
     */
    public function scopeActive($query)
    {
        return $query->whereNotIn('applyment_state', [
            self::STATE_CANCELED,
            self::STATE_REJECTED,
        ]);
    }

    /**
     * 按门店查询 — 最新在前
     */
    public function scopeStore($query, string $storeId)
    {
        return $query->where('store_id', $storeId)->order('id', 'desc');
    }

    /**
     * 检查门店是否可以提交新申请
     */
    public static function canSubmit(string $storeId): bool
    {
        return !self::where('store_id', $storeId)
            ->whereNotIn('applyment_state', [self::STATE_CANCELED, self::STATE_REJECTED])
            ->find();
    }

    /**
     * 获取门店最新进件记录
     */
    public static function latestOf(string $storeId): ?self
    {
        return self::where('store_id', $storeId)->order('id', 'desc')->find();
    }
}
