<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeStore extends Model
{
    protected $name = 'busi_employee_store';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'merchant_id' => 'string',
        'employee_id' => 'string',
        'store_id' => 'string',
        'created_at' => 'datetime',
    ];
}
