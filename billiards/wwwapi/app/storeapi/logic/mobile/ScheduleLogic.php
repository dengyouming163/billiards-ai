<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\EmployeeSchedule;
use think\facade\Db;

class ScheduleLogic extends BaseLogic
{
    public static function getMySchedule($employeeId, $week = 0, $role = 'waiter')
    {
        $startDate = date('Y-m-d', strtotime("+" . ($week * 7) . " days", strtotime('monday this week')));
        $endDate = date('Y-m-d', strtotime('+6 days', strtotime($startDate)));

        $query = EmployeeSchedule::where('employee_id', $employeeId)
            ->whereBetween('work_date', [$startDate, $endDate])
            ->whereNull('deleted_at')
            ->order('work_date', 'asc');

        if ($role == 'assistant') {
            $query->where('employee_type', 'assistant');
        }

        $schedules = $query->select();

        $result = [];
        for ($i = 0; $i < 7; $i++) {
            $date = date('Y-m-d', strtotime("+{$i} days", strtotime($startDate)));
            $schedule = null;
            foreach ($schedules as $s) {
                if ($s['work_date'] == $date) {
                    $schedule = $s;
                    break;
                }
            }
            
            $shiftType = $schedule ? $schedule['shift_type'] : 'off';
            $result[] = [
                'id' => $schedule ? $schedule['id'] : 0,
                'employee_id' => $employeeId,
                'date' => $date,
                'shift_type' => $shiftType,
                'shift_name' => self::getShiftName($shiftType),
                'start_time' => $schedule ? $schedule['start_time'] : '',
                'end_time' => $schedule ? $schedule['end_time'] : '',
            ];
        }

        return ['list' => $result];
    }

    public static function getEmployeeSchedule($employeeId, $week = 0, $role = 'waiter')
    {
        return self::getMySchedule($employeeId, $week, $role);
    }

    public static function adjustSchedule($params, $operatorId, $storeId)
    {
        $employeeId = $params['employee_id'];
        $date = $params['date'];
        $shiftType = $params['shift_type'];

        $schedule = EmployeeSchedule::where('employee_id', $employeeId)
            ->where('work_date', $date)
            ->find();

        if ($schedule) {
            $schedule->shift_type = $shiftType;
            $schedule->update_time = time();
            $schedule->save();
        } else {
            EmployeeSchedule::create([
                'employee_id' => $employeeId,
                'store_id' => $storeId,
                'work_date' => $date,
                'shift_type' => $shiftType,
                'start_time' => self::getShiftTime($shiftType, 'start'),
                'end_time' => self::getShiftTime($shiftType, 'end'),
                'created_at' => date('Y-m-d H:i:s'),
                'updated_at' => date('Y-m-d H:i:s'),
            ]);
        }

        return true;
    }

    private static function getShiftName($shiftType)
    {
        $names = [
            'morning' => '早班',
            'afternoon' => '中班',
            'evening' => '晚班',
            'full' => '全天',
            'off' => '休息',
            'shift_386070_4070' => '早班',
            'shift_388248_6211' => '晚班',
        ];
        return $names[$shiftType] ?? $shiftType;
    }

    private static function getShiftTime($shiftType, $type)
    {
        $times = [
            'morning' => ['start' => '09:00', 'end' => '17:00'],
            'afternoon' => ['start' => '14:00', 'end' => '22:00'],
            'evening' => ['start' => '18:00', 'end' => '02:00'],
            'full' => ['start' => '09:00', 'end' => '22:00'],
            'off' => ['start' => '', 'end' => ''],
        ];
        return $times[$shiftType][$type] ?? '';
    }
}