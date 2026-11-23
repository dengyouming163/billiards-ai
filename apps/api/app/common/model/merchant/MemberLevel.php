<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class MemberLevel extends Model
{
    protected $name = 'busi_member_level';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'name' => 'string',
        'code' => 'string',
        'color' => 'string',
        'discount_rate' => 'decimal',
        'points_multiplier' => 'decimal',
        'min_amount' => 'decimal',
        'min_points' => 'integer',
        'sort_order' => 'integer',
        'status' => 'integer',
        'description' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function members()
    {
        return $this->hasMany(Member::class, 'level_id', 'id');
    }
}