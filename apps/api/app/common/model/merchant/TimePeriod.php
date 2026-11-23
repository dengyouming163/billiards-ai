<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class TimePeriod extends Model
{
    protected $name = 'busi_time_period';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'name' => 'string',
        'color' => 'string',
        'start_time' => 'string',
        'end_time' => 'string',
        'coefficient' => 'float',
        'priority' => 'integer',
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function store()
    {
        return $this->belongsTo(Store::class, 'store_id');
    }

    public function getStatusTextAttr(): string
    {
        return $this->status === 1 ? '启用' : '禁用';
    }

    public function scopeActive($query)
    {
        return $query->where('status', 1);
    }

    public function scopeByStore($query, string $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeOrderByPriority($query)
    {
        return $query->order('priority', 'desc');
    }
}
