<?php
namespace app\common\model\service;

use app\common\model\BaseModel;

class ValueAddedService extends BaseModel
{
    protected $name = 'value_added_services';

    protected $schema = [
        'id' => 'string',
        'name' => 'string',
        'type' => 'string',
        'description' => 'string',
        'unit_price' => 'decimal',
        'status' => 'string',
        'created_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_INACTIVE = 'inactive';
}