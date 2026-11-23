<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeRole extends Model
{
    protected $name = 'busi_employee_role';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'merchant_id' => 'string',
        'store_id' => 'string',
        'name' => 'string',
        'code' => 'string',
        'description' => 'string',
        'sort_order' => 'integer',
        'status' => 'integer',
        'is_system' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}