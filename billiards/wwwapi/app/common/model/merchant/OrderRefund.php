<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class OrderRefund extends Model
{
    protected $name = 'busi_order_refund';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'order_id' => 'string',
        'refund_no' => 'string',
        'refund_amount' => 'decimal',
        'refund_type' => 'string',
        'status' => 'string',
        'transaction_no' => 'string',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}