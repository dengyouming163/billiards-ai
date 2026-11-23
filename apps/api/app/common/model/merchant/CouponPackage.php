<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CouponPackage extends Model
{
    protected $name = 'busi_coupon_package';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'platform' => 'string',
        'platform_package_id' => 'string',
        'name' => 'string',
        'type' => 'string',
        'duration_hours' => 'decimal',
        'price' => 'decimal',
        'original_price' => 'decimal',
        'status' => 'integer',
        'last_synced_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}
