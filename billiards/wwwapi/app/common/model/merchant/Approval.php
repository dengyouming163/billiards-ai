<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Approval extends Model
{
    protected $name = 'busi_approval';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'employee_id' => 'string',
        'employee_name' => 'string',
        'type' => 'string',
        'type_name' => 'string',
        'status' => 'string',
        'reason' => 'string',
        'start_date' => 'date',
        'end_date' => 'date',
        'duration' => 'decimal',
        'remark' => 'string',
        'approver_id' => 'string',
        'approver_name' => 'string',
        'approve_time' => 'datetime',
        'approve_remark' => 'string',
        'extra_data' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}