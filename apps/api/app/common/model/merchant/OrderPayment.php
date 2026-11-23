<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class OrderPayment extends Model
{
    protected $name = 'busi_order_payment';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'order_id' => 'string',
        'store_id' => 'string',
        'order_no' => 'string',
        'payment_method' => 'string',
        'channel' => 'string',
        'order_item_id' => 'string',
        'amount' => 'decimal',
        'transaction_no' => 'string',
        'status' => 'string',
        'paid_at' => 'datetime',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'description' => 'string',
        'created_at' => 'datetime',
    ];
}