<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class MemberConsume extends Model
{
    protected $name = 'busi_member_consume';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = null;
    protected $deleteTime = null;
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'member_id' => 'string',
        'store_id' => 'string',
        'order_id' => 'string',
        'order_no' => 'string',
        'amount' => 'decimal',
        'points_gained' => 'integer',
        'points_deduct' => 'integer',
        'balance_deduct' => 'decimal',
        'discount_amount' => 'decimal',
        'consume_type' => 'string',
        'balance_before' => 'decimal',
        'balance_after' => 'decimal',
        'points_before' => 'integer',
        'points_after' => 'integer',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'remark' => 'string',
        'created_at' => 'datetime',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'id');
    }
}