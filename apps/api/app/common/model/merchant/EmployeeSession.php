<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeSession extends Model
{
    protected $name = 'busi_employee_session';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'employee_id' => 'string',
        'token' => 'string',
        'terminal' => 'string',
        'login_ip' => 'string',
        'expire_time' => 'integer',
        'update_time' => 'integer',
        'created_at' => 'datetime',
    ];
}