<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CouponVerify extends Model
{
    protected $name = 'busi_coupon_verify';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'platform' => 'string',
        'coupon_code' => 'string',
        'platform_order_id' => 'string',
        'package_id' => 'string',
        'package_name' => 'string',
        'verify_price' => 'decimal',
        'duration_minutes' => 'integer',
        'order_id' => 'string',
        'table_id' => 'string',
        'status' => 'string',
        'verify_token' => 'string',
        'verified_at' => 'datetime',
        'verified_by' => 'string',
        'revoked_at' => 'datetime',
        'raw_response' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
