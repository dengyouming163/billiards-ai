<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Store extends Model
{
    protected $name = 'busi_store';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'name' => 'string',
        'code' => 'string',
        'address' => 'string',
        'phone' => 'string',
        'business_hours_start' => 'time',
        'business_hours_end' => 'time',
        'status' => 'integer',
        'logo' => 'string',
        'description' => 'text',
        'owner_id' => 'string',
        'merchant_id' => 'string',
        'hourly_rate' => 'float',
        'open_table_confirm' => 'integer',
        'open_table_confirm_timeout' => 'integer',
        'product_order_timeout' => 'integer',
        'assistant_booking_timeout' => 'integer',
        'charging_rate' => 'decimal',
        'total_usage_count' => 'integer',
        'total_usage_hours' => 'float',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}