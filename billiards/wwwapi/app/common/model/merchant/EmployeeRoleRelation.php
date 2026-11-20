<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeRoleRelation extends Model
{
    protected $name = 'busi_employee_role_relation';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'employee_id' => 'string',
        'role_id' => 'string',
        'created_at' => 'datetime',
    ];
}