<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CouponPlatform extends Model
{
    protected $name = 'busi_coupon_platform';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'platform' => 'string',
        'app_id' => 'string',
        'app_secret' => 'string',
        'auth_token' => 'string',
        'token_expires_at' => 'datetime',
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function getByStoreAndPlatform(string $storeId, string $platform): ?self
    {
        return self::where('store_id', $storeId)
            ->where('platform', $platform)
            ->where('status', 1)
            ->find();
    }
}
