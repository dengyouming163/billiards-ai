<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeOperateLog extends Model
{
    protected $name = 'busi_employee_operate_log';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'employee_id' => 'string',
        'employee_name' => 'string',
        'module' => 'string',
        'action' => 'string',
        'target_type' => 'string',
        'target_id' => 'string',
        'target_name' => 'string',
        'content' => 'text',
        'ip_address' => 'string',
        'user_agent' => 'string',
        'status' => 'integer',
        'created_at' => 'datetime',
    ];
}