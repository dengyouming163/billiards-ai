<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class OrderItem extends Model
{
    protected $name = 'busi_order_item';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    protected $deleteTime = false;

    protected $schema = [
        'id' => 'string',
        'order_id' => 'string',
        'product_id' => 'string',
        'assistant_id' => 'string',
        'item_type' => 'string',
        'item_name' => 'string',
        'quantity' => 'decimal',
        'unit' => 'string',
        'unit_price' => 'decimal',
        'total_price' => 'decimal',
        'discount_rate' => 'decimal',
        'final_price' => 'decimal',
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'actual_quantity' => 'decimal',
        'gift_hours' => 'decimal',
        'billing_mode' => 'string',
        'pay_mode' => 'string',
        'is_paid' => 'boolean',
        'paid_at' => 'datetime',
        'status' => 'string',
        'is_paused' => 'boolean',
        'paused_at' => 'datetime',
        'total_paused_seconds' => 'integer',
        'accepted_by' => 'string',
        'accepted_at' => 'datetime',
        'rejected_at' => 'datetime',
        'reject_reason' => 'string',
        'delivered_at' => 'datetime',
        'expires_at' => 'datetime',
        'preorder_group_id' => 'string',
        'description' => 'string',
        'created_at' => 'datetime',
    ];
}