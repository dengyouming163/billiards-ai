<?php
namespace app\common\model\package;

use app\common\model\BaseModel;

class Package extends BaseModel
{
    protected $name = 'packages';

    protected $schema = [
        'id' => 'string',
        'name' => 'string',
        'description' => 'string',
        'base_price' => 'decimal',
        'store_range' => 'string',
        'table_range' => 'string',
        'modules' => 'json',
        'status' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
}