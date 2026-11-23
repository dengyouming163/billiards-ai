<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Pricing extends Model
{
    protected $name = 'busi_pricing';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'name' => 'string',
        'type' => 'string',
        'price' => 'decimal',
        'cost_price' => 'decimal',
        'unit' => 'string',
        'min_duration' => 'integer',
        'description' => 'text',
        'boundary_strategy' => 'string',
        'config' => 'text',
        'priority' => 'integer',
        'applicable_tables' => 'text',
        'weekday_types' => 'text',
        'member_levels' => 'text',
        'status' => 'integer',
        'sort_order' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    protected $json = ['config', 'applicable_tables', 'weekday_types', 'member_levels'];

    const BOUNDARY_PER_MINUTE = 'per_minute';
    const BOUNDARY_START_TIME = 'start_time';

    const TYPE_TIME = 'time';
    const TYPE_HOURLY = 'hourly';
    const TYPE_PERIOD = 'period';

    const ROUNDING_EXACT = 'exact';
    const ROUNDING_MIN_30 = 'min_30';
    const ROUNDING_PER_HOUR = 'per_hour';

    const STATUS_INACTIVE = 0;
    const STATUS_ACTIVE = 1;

    const TYPE_LABELS = [
        self::TYPE_TIME => '按时段计费',
        self::TYPE_HOURLY => '按小时计费',
        self::TYPE_PERIOD => '包时段预付',
    ];

    const BOUNDARY_LABELS = [
        self::BOUNDARY_PER_MINUTE => '逐分钟精确计算',
        self::BOUNDARY_START_TIME => '按开始时间归属',
    ];

    const ROUNDING_LABELS = [
        self::ROUNDING_EXACT => '精确到分钟',
        self::ROUNDING_MIN_30 => '不足30分钟按30分钟',
        self::ROUNDING_PER_HOUR => '不足1小时按1小时',
    ];

    public function getTypeTextAttr(): string
    {
        return self::TYPE_LABELS[$this->type] ?? $this->type;
    }

    public function getBoundaryStrategyTextAttr(): string
    {
        return self::BOUNDARY_LABELS[$this->boundary_strategy] ?? $this->boundary_strategy;
    }

    public function scopeActive($query)
    {
        return $query->where('status', self::STATUS_ACTIVE);
    }

    public function scopeByStore($query, string $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeByType($query, string $type)
    {
        return $query->where('type', $type);
    }
}