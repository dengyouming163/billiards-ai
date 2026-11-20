<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class MemberRecharge extends Model
{
    protected $name = 'busi_member_recharge';
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
        'order_no' => 'string',
        'amount' => 'decimal',
        'gift_amount' => 'decimal',
        'gift_points' => 'integer',
        'payment_method' => 'string',
        'transaction_no' => 'string',
        'balance_before' => 'decimal',
        'balance_after' => 'decimal',
        'points_before' => 'integer',
        'points_after' => 'integer',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'remark' => 'string',
        'status' => 'integer',
        'created_at' => 'datetime',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class, 'member_id', 'id');
    }
}