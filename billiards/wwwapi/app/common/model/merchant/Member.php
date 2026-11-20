<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Member extends Model
{
    protected $name = 'busi_member';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'level_id' => 'string',
        'name' => 'string',
        'phone' => 'string',
        'gender' => 'string',
        'avatar' => 'string',
        'birthday' => 'date',
        'card_number' => 'string',
        'balance' => 'decimal',
        'points' => 'integer',
        'total_consume' => 'decimal',
        'total_recharge' => 'decimal',
        'status' => 'integer',
        'last_consume_time' => 'datetime',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function level()
    {
        return $this->belongsTo(MemberLevel::class, 'level_id', 'id');
    }

    public function recharges()
    {
        return $this->hasMany(MemberRecharge::class, 'member_id', 'id');
    }

    public function consumes()
    {
        return $this->hasMany(MemberConsume::class, 'member_id', 'id');
    }
}