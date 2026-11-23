<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use app\common\constants\TableStatus;
use think\Model;

class Table extends Model
{
    protected $name = 'busi_table';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'zone_id' => 'string',
        'table_type_id' => 'string',
        'number' => 'string',
        'code' => 'string',
        'name' => 'string',
        'status' => 'string',
        'pricing_id' => 'string',
        'qrcode' => 'string',
        'hourly_rate' => 'decimal',
        'description' => 'string',
        'sort_order' => 'integer',
        'total_usage_count' => 'integer',
        'total_usage_hours' => 'decimal',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
    
    public function scopeByCode($query, $code)
    {
        return $query->where('code', $code);
    }
    
    public function scopeActive($query)
    {
        return $query->where('status', TableStatus::IDLE);
    }
    
    public function scopeOccupied($query)
    {
        return $query->where('status', TableStatus::OCCUPIED);
    }
    
    public function scopeReserved($query)
    {
        return $query->where('status', TableStatus::RESERVED);
    }
    
    public function scopeMaintenance($query)
    {
        return $query->where('status', TableStatus::MAINTENANCE);
    }
    
    public function getStatusTextAttr($value): string
    {
        return TableStatus::getText($value);
    }
}
