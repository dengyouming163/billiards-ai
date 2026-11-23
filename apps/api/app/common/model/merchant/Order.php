<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Order extends Model
{
    protected $name = 'busi_order';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'order_no' => 'string',
        'order_type' => 'string',
        'type' => 'string',
        'status' => 'string',
        'member_id' => 'string',
        'member_name' => 'string',
        'table_id' => 'string',
        'table_paused_at' => 'datetime',
        'table_fee_paused' => 'boolean',
        'table_fee_paused_duration' => 'integer',
        'assistant_id' => 'string',
        'assistant_paused_at' => 'datetime',
        'table_fee' => 'decimal',
        'product_fee' => 'decimal',
        'assistant_fee' => 'decimal',
        'charging_fee' => 'decimal',
        'discount_fee' => 'decimal',
        'discount_type' => 'string',
        'discount_value' => 'float',
        'total_fee' => 'decimal',
        'original_amount' => 'decimal',
        'discount_amount' => 'decimal',
        'final_amount' => 'decimal',
        'balance_paid' => 'decimal',
        'cash_paid' => 'decimal',
        'wechat_paid' => 'decimal',
        'alipay_paid' => 'decimal',
        'card_paid' => 'decimal',
        'points_deduct' => 'integer',
        'points_gained' => 'integer',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'duration_minutes' => 'integer',
        'prepaid_hours' => 'integer',
        'remaining_minutes' => 'integer',
        'payment_status' => 'string',
        'prepaid_amount' => 'decimal',
        'merged_to_order_id' => 'string',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'remark' => 'string',
        'cancel_time' => 'datetime',
        'cancel_reason' => 'string',
        'refund_amount' => 'decimal',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}