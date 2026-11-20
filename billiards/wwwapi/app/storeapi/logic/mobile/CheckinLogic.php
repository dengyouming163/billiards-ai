<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\EmployeeAttendance;
use think\facade\Db;

class CheckinLogic extends BaseLogic
{
    public static function signIn($params)
    {
        $today = date('Y-m-d');
        $now = date('Y-m-d H:i:s');

        $existing = EmployeeAttendance::where('employee_id', $params['employee_id'])
            ->where('work_date', $today)
            ->where('type', 'sign_in')
            ->find();

        if ($existing) {
            self::setError('今日已签到，请勿重复签到');
            return false;
        }

        $record = EmployeeAttendance::create([
            'id' => 'att-' . uniqid(),
            'employee_id' => $params['employee_id'],
            'store_id' => $params['store_id'],
            'type' => 'sign_in',
            'latitude' => $params['latitude'] ?? 0,
            'longitude' => $params['longitude'] ?? 0,
            'distance' => $params['distance'] ?? 0,
            'location_address' => $params['address'] ?? '',
            'work_date' => $today,
            'created_at' => $now,
            'status' => 'normal',
        ]);

        return $record;
    }

    public static function signOut($params)
    {
        $today = date('Y-m-d');
        $now = date('Y-m-d H:i:s');

        $signIn = EmployeeAttendance::where('employee_id', $params['employee_id'])
            ->where('work_date', $today)
            ->where('type', 'sign_in')
            ->order('created_at', 'desc')
            ->find();

        if (!$signIn) {
            self::setError('今日未签到，无法签退');
            return false;
        }

        $existing = EmployeeAttendance::where('employee_id', $params['employee_id'])
            ->where('work_date', $today)
            ->where('type', 'sign_out')
            ->find();

        if ($existing) {
            self::setError('今日已签退，请勿重复签退');
            return false;
        }

        $record = EmployeeAttendance::create([
            'id' => 'att-' . uniqid(),
            'employee_id' => $params['employee_id'],
            'store_id' => $params['store_id'],
            'type' => 'sign_out',
            'latitude' => $params['latitude'] ?? 0,
            'longitude' => $params['longitude'] ?? 0,
            'distance' => $params['distance'] ?? 0,
            'location_address' => $params['address'] ?? '',
            'work_date' => $today,
            'created_at' => $now,
            'status' => 'normal',
        ]);

        return $record;
    }

    public static function getRecords($employeeId, $page = 1, $pageSize = 20)
    {
        $where = [['employee_id', '=', $employeeId]];

        $list = EmployeeAttendance::where($where)
            ->order('created_at', 'desc')
            ->paginate($pageSize, false, ['page' => $page]);

        return [
            'lists' => $list->items(),
            'count' => $list->total(),
            'page_no' => $page,
            'page_size' => $pageSize,
        ];
    }

    public static function getTodayStatus($employeeId)
    {
        $today = date('Y-m-d');

        $signIn = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('work_date', $today)
            ->where('type', 'sign_in')
            ->order('created_at', 'desc')
            ->find();

        $signOut = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('work_date', $today)
            ->where('type', 'sign_out')
            ->order('created_at', 'desc')
            ->find();

        return [
            'sign_in' => $signIn,
            'sign_out' => $signOut,
            'is_signed_in' => !empty($signIn),
            'is_signed_out' => !empty($signOut),
        ];
    }

    public static function applyOutwork($params)
    {
        $today = date('Y-m-d');
        $now = date('Y-m-d H:i:s');

        $record = EmployeeAttendance::create([
            'id' => 'att-' . uniqid(),
            'employee_id' => $params['employee_id'],
            'store_id' => $params['store_id'],
            'type' => 'outwork',
            'latitude' => $params['latitude'] ?? 0,
            'longitude' => $params['longitude'] ?? 0,
            'location_address' => $params['address'] ?? '',
            'work_date' => $today,
            'created_at' => $now,
            'status' => 'normal',
            'remark' => $params['reason'] ?? '',
        ]);

        return $record;
    }

    public static function dailyAttendance($storeId, $date)
    {
        $employees = \app\common\model\merchant\Employee::where('store_id', $storeId)
            ->where('status', 1)
            ->field('id, name, avatar, role')
            ->select()
            ->toArray();

        if (empty($employees)) {
            return [
                'date' => $date,
                'summary' => ['total' => 0, 'checked_in' => 0, 'not_checked' => 0, 'off' => 0],
                'list' => [],
            ];
        }

        $employeeIds = array_column($employees, 'id');

        $schedules = \app\common\model\merchant\EmployeeSchedule::whereIn('employee_id', $employeeIds)
            ->where('work_date', $date)
            ->select()
            ->toArray();
        $scheduleMap = [];
        foreach ($schedules as $s) {
            $scheduleMap[$s['employee_id']] = $s;
        }

        $signIns = \app\common\model\merchant\EmployeeAttendance::whereIn('employee_id', $employeeIds)
            ->where('work_date', $date)
            ->where('type', 'sign_in')
            ->select()
            ->toArray();
        $signInMap = [];
        foreach ($signIns as $si) {
            $signInMap[$si['employee_id']] = $si;
        }

        $signOuts = \app\common\model\merchant\EmployeeAttendance::whereIn('employee_id', $employeeIds)
            ->where('work_date', $date)
            ->where('type', 'sign_out')
            ->select()
            ->toArray();
        $signOutMap = [];
        foreach ($signOuts as $so) {
            $signOutMap[$so['employee_id']] = $so;
        }

        $attendanceIds = array_merge(
            array_column($signIns, 'id'),
            array_column($signOuts, 'id')
        );

        $photoMap = [];
        if (!empty($attendanceIds)) {
            $photos = \app\common\model\merchant\CheckinPhoto::whereIn('attendance_id', $attendanceIds)
                ->order('sort_order', 'asc')
                ->select()
                ->toArray();
            foreach ($photos as $p) {
                $photoMap[$p['attendance_id']][] = $p['photo_url'];
            }
        }

        $ROLE_LABEL = [
            'boss' => '老板', 'manager' => '经理', 'finance' => '财务',
            'coach' => '教练', 'cashier' => '收银员', 'assistant' => '助教',
            'waiter' => '服务员', 'employee' => '员工', 'admin' => '管理员', 'owner' => '老板',
        ];

        $SHIFT_LABEL = [
            'morning' => '早班', 'afternoon' => '中班',
            'evening' => '晚班', 'full' => '全天',
        ];

        $list = [];
        $checkedInCount = 0;
        $notCheckedCount = 0;
        $offCount = 0;

        foreach ($employees as $emp) {
            $eid = $emp['id'];
            $scheduled = isset($scheduleMap[$eid]);
            $hasSignIn = isset($signInMap[$eid]);
            $hasSignOut = isset($signOutMap[$eid]);

            if ($hasSignIn) {
                $status = 'checked_in';
                $checkedInCount++;
            } elseif (!$scheduled || ($scheduleMap[$eid]['shift_type'] ?? '') === 'off') {
                $status = 'off';
                $offCount++;
            } else {
                $status = 'not_checked';
                $notCheckedCount++;
            }

            $shift = null;
            if ($scheduled && ($scheduleMap[$eid]['shift_type'] ?? '') !== 'off') {
                $shiftType = $scheduleMap[$eid]['shift_type'] ?? '';
                $shift = [
                    'type' => $shiftType,
                    'label' => $SHIFT_LABEL[$shiftType] ?? $shiftType,
                    'start' => substr($scheduleMap[$eid]['start_time'] ?? '09:00', 0, 5),
                    'end' => substr($scheduleMap[$eid]['end_time'] ?? '17:00', 0, 5),
                ];
            }

            $signIn = null;
            if ($hasSignIn) {
                $si = $signInMap[$eid];
                $lateMinutes = 0;
                if ($shift && !empty($si['created_at'])) {
                    $actualTime = substr($si['created_at'], 11, 5);
                    if ($actualTime > $shift['start']) {
                        $lateMinutes = (strtotime($actualTime) - strtotime($shift['start'])) / 60;
                    }
                }
                $signIn = [
                    'time' => !empty($si['check_in_time']) ? substr($si['check_in_time'], 11, 5) : substr($si['created_at'] ?? '', 11, 5),
                    'photos' => $photoMap[$si['id']] ?? [],
                    'late_minutes' => (int)$lateMinutes,
                    'location' => $si['location_address'] ?? '',
                ];
            }

            $signOut = null;
            if ($hasSignOut) {
                $so = $signOutMap[$eid];
                $signOut = [
                    'time' => !empty($so['check_out_time']) ? substr($so['check_out_time'], 11, 5) : substr($so['created_at'] ?? '', 11, 5),
                    'photos' => $photoMap[$so['id']] ?? [],
                    'location' => $so['location_address'] ?? '',
                ];
            }

            $list[] = [
                'employee_id' => $eid,
                'employee_name' => $emp['name'],
                'employee_type' => $emp['role'] === 'assistant' ? 'assistant' : 'employee',
                'role_name' => $ROLE_LABEL[$emp['role']] ?? $emp['role'],
                'avatar' => $emp['avatar'] ?? '',
                'shift' => $shift,
                'is_scheduled' => $scheduled && ($scheduleMap[$eid]['shift_type'] ?? '') !== 'off',
                'status' => $status,
                'sign_in' => $signIn,
                'sign_out' => $signOut,
            ];
        }

        usort($list, function ($a, $b) {
            $order = ['not_checked' => 0, 'checked_in' => 1, 'off' => 2];
            return ($order[$a['status']] ?? 3) - ($order[$b['status']] ?? 3);
        });

        return [
            'date' => $date,
            'summary' => [
                'total' => count($list),
                'checked_in' => $checkedInCount,
                'not_checked' => $notCheckedCount,
                'off' => $offCount,
            ],
            'list' => $list,
        ];
    }
}
