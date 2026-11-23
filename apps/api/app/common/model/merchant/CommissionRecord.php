<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CommissionRecord extends Model
{
    protected $name = 'busi_commission_record';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'assistant_id' => 'string',
        'order_item_id' => 'string',
        'order_amount' => 'decimal',
        'commission_type' => 'string',
        'commission_rate' => 'decimal',
        'commission_amount' => 'decimal',
        'status' => 'string',
        'paid_at' => 'datetime',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
