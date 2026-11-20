<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CheckinPhoto extends Model
{
    protected $name = 'busi_checkin_photo';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'attendance_id' => 'string',
        'employee_id' => 'string',
        'photo_url' => 'string',
        'sort_order' => 'int',
        'created_at' => 'datetime',
    ];

    public function attendance()
    {
        return $this->belongsTo(EmployeeAttendance::class, 'attendance_id', 'id');
    }
}
