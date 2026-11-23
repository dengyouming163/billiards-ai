<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Package extends Model
{
    protected $name = 'busi_package';
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
        'validity_days' => 'integer',
        'description' => 'text',
        'image' => 'string',
        'status' => 'integer',
        'sales_count' => 'integer',
        'total_amount' => 'decimal',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}