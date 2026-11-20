<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Employee extends Model
{
    protected $name = 'busi_employee';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'name' => 'string',
        'phone' => 'string',
        'gender' => 'string',
        'avatar' => 'string',
        'id_card' => 'string',
        'store_id' => 'string',
        'merchant_id' => 'string',
        'role' => 'string',
        'position' => 'string',
        'salary' => 'decimal',
        'password' => 'string',
        'status' => 'integer',
        'hire_date' => 'date',
        'leave_date' => 'date',
        'description' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}