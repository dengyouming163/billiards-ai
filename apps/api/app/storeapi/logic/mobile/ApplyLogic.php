<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\EmployeeAttendance;
use think\facade\Db;

class ApplyLogic extends BaseLogic
{
    public static function submitCheckin($params)
    {
        $record = EmployeeAttendance::create([
            'employee_id' => $params['employee_id'],
            'store_id' => $params['store_id'],
            'type' => 'checkin',
            'check_date' => $params['start_date'] ?? date('Y-m-d'),
            'remark' => $params['reason'] ?? '',
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return $record;
    }

    public static function submitLeave($params)
    {
        $record = EmployeeAttendance::create([
            'employee_id' => $params['employee_id'],
            'store_id' => $params['store_id'],
            'type' => 'leave',
            'check_date' => $params['start_date'] ?? date('Y-m-d'),
            'end_date' => $params['end_date'] ?? '',
            'duration' => $params['duration'] ?? 0,
            'remark' => $params['reason'] ?? '',
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return $record;
    }

    public static function getRecords($employeeId, $type = '', $page = 1, $pageSize = 20)
    {
        $where = [['employee_id', '=', $employeeId], ['type', 'in', ['checkin', 'leave']]];

        if ($type) {
            $where[] = ['type', '=', $type];
        }

        $list = EmployeeAttendance::where($where)
            ->order('created_at', 'desc')
            ->paginate($pageSize, false, ['page' => $page]);

        $items = [];
        foreach ($list->items() as $item) {
            $items[] = [
                'id' => $item['id'],
                'type' => $item['type'],
                'employee_id' => $item['employee_id'],
                'employee_name' => '',
                'employee_avatar' => '',
                'status' => $item['status'],
                'reason' => $item['remark'] ?? '',
                'start_date' => $item['check_date'] ?? '',
                'end_date' => $item['end_date'] ?? '',
                'duration' => $item['duration'] ?? 0,
                'remark' => '',
                'approver_id' => 0,
                'approver_name' => '',
                'approve_time' => $item['update_time'] ? date('Y-m-d H:i:s', $item['update_time']) : '',
                'approve_remark' => '',
                'create_time' => $item['created_at'],
                'approval_type_text' => $item['type'] == 'checkin' ? '补卡申请' : '请假申请',
                'status_text' => self::getStatusText($item['status']),
                'create_time_text' => date('Y-m-d H:i', strtotime($item['created_at'])),
            ];
        }

        return [
            'lists' => $items,
            'count' => $list->total(),
            'page_no' => $page,
            'page_size' => $pageSize,
        ];
    }

    private static function getStatusText($status)
    {
        $texts = [
            'pending' => '待处理',
            'approved' => '已通过',
            'rejected' => '已拒绝',
        ];
        return $texts[$status] ?? $status;
    }
}