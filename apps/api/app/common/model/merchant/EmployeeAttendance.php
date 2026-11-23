<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class EmployeeAttendance extends Model
{
    protected $name = 'busi_employee_attendance';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'employee_id' => 'string',
        'store_id' => 'string',
        'work_date' => 'date',
        'type' => 'string',
        'employee_type' => 'string',
        'status' => 'string',
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'work_hours' => 'decimal',
        'late_minutes' => 'integer',
        'early_minutes' => 'integer',
        'overtime_hours' => 'decimal',
        'description' => 'string',
        'has_photos' => 'boolean',
        'total_revenue' => 'decimal',
        'order_count' => 'integer',
        'cash_paid' => 'decimal',
        'wechat_paid' => 'decimal',
        'balance_paid' => 'decimal',
        'table_revenue' => 'decimal',
        'product_revenue' => 'decimal',
        'assistant_revenue' => 'decimal',
        'open_table_count' => 'integer',
        'recharge_total' => 'decimal',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}