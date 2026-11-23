<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeSchedule extends Model
{
    protected $name = 'busi_employee_schedule';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'employee_id' => 'string',
        'employee_type' => 'string',
        'store_id' => 'string',
        'work_date' => 'date',
        'shift_type' => 'string',
        'start_time' => 'time',
        'end_time' => 'time',
        'status' => 'string',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'description' => 'string',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}