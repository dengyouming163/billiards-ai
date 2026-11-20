<?php
namespace app\common\model\package;

use app\common\model\BaseModel;

class MerchantPackage extends BaseModel
{
    protected $name = 'merchant_packages';

    protected $schema = [
        'id' => 'string',
        'merchant_id' => 'string',
        'package_id' => 'string',
        'start_date' => 'date',
        'end_date' => 'date',
        'status' => 'string',
        'created_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';
    const STATUS_CANCELLED = 'cancelled';
}