<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Assistant extends Model
{
    protected $name = 'busi_assistant';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'employee_id' => 'string',
        'store_id' => 'string',
        'level_id' => 'string',
        'name' => 'string',
        'phone' => 'string',
        'gender' => 'string',
        'avatar' => 'string',
        'skills' => 'string',
        'hourly_rate' => 'decimal',
        'billing_rule' => 'string',
        'status' => 'integer',
        'total_orders' => 'integer',
        'total_hours' => 'decimal',
        'total_amount' => 'decimal',
        'rating' => 'decimal',
        'description' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function employee()
    {
        return $this->hasOne(Employee::class, 'id', 'employee_id');
    }
}