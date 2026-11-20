<?php
namespace app\common\model\contract;

use app\common\model\BaseModel;

class Contract extends BaseModel
{
    protected $name = 'contract';
    
    const STATUS_PENDING = 'pending';
    const STATUS_SIGNED = 'signed';
    const STATUS_EXPIRED = 'expired';
    
    public static function statusOptions()
    {
        return [
            self::STATUS_PENDING => '待签署',
            self::STATUS_SIGNED => '已签署',
            self::STATUS_EXPIRED => '已过期',
        ];
    }
}