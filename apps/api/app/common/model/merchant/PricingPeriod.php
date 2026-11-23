<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class PricingPeriod extends Model
{
    protected $name = 'busi_pricing_period';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'pricing_id' => 'string',
        'store_id' => 'string',
        'name' => 'string',
        'type' => 'string',
        'start_time' => 'string',
        'end_time' => 'string',
        'price' => 'decimal',
        'coefficient' => 'decimal',
        'color' => 'string',
        'priority' => 'integer',
        'description' => 'string',
        'weekdays' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeByStore($query, string $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeByPricing($query, string $pricingId)
    {
        return $query->where('pricing_id', $pricingId);
    }

    public function scopeOrderByPriority($query)
    {
        return $query->order('priority', 'desc');
    }
}