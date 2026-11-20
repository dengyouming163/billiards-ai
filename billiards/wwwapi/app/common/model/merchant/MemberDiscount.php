<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class MemberDiscount extends Model
{
    protected $name = 'busi_member_discount';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'level' => 'string',
        'discount_rate' => 'float',
        'enabled' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const LEVEL_NORMAL = 'normal';
    const LEVEL_SILVER = 'silver';
    const LEVEL_GOLD = 'gold';
    const LEVEL_DIAMOND = 'diamond';

    const LEVEL_LABELS = [
        self::LEVEL_NORMAL => '普通会员',
        self::LEVEL_SILVER => '银卡会员',
        self::LEVEL_GOLD => '金卡会员',
        self::LEVEL_DIAMOND => '钻石会员',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function getLevelTextAttr(): string
    {
        return self::LEVEL_LABELS[$this->level] ?? $this->level;
    }

    public function getEnabledTextAttr(): string
    {
        return $this->enabled === 1 ? '启用' : '禁用';
    }

    public function scopeEnabled($query)
    {
        return $query->where('enabled', 1);
    }

    public function scopeByStore($query, string $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeByLevel($query, string $level)
    {
        return $query->where('level', $level);
    }

    public static function getDiscountRateByLevel(string $storeId, string $level): float
    {
        $discount = self::where('store_id', $storeId)
            ->where('level', $level)
            ->where('enabled', 1)
            ->find();

        return $discount ? (float) $discount->discount_rate : 1.0;
    }
}
