<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Approval;
use app\common\model\merchant\ApprovalConfig;
use app\common\model\merchant\Employee;
use app\common\model\merchant\Notification;

class ApprovalLogic extends BaseLogic
{
    public static function getLists($storeId, $status = '', $page = 1, $pageSize = 20)
    {
        $where = [['store_id', '=', $storeId], ['type', 'in', ['checkin', 'leave']]];

        if ($status) {
            $where[] = ['status', '=', $status];
        }

        $list = Approval::where($where)
            ->order('created_at', 'desc')
            ->paginate($pageSize, false, ['page' => $page]);

        $items = [];
        foreach ($list->items() as $item) {
            $items[] = [
                'id' => $item['id'],
                'type' => $item['type'],
                'type_name' => $item['type_name'] ?? '',
                'title' => $item['type'] == 'checkin' ? '补卡申请' : '请假申请',
                'applicant_name' => $item['employee_name'] ?? '',
                'employee_id' => $item['employee_id'],
                'employee_name' => $item['employee_name'] ?? '',
                'status' => $item['status'],
                'reason' => $item['reason'] ?? '',
                'start_date' => $item['start_date'] ?? '',
                'end_date' => $item['end_date'] ?? '',
                'duration' => $item['duration'] ?? 0,
                'remark' => $item['remark'] ?? '',
                'approver_id' => $item['approver_id'] ?? '',
                'approver_name' => $item['approver_name'] ?? '',
                'approve_time' => $item['approve_time'] ?? '',
                'approve_remark' => $item['approve_remark'] ?? '',
                'created_at' => $item['created_at'],
                'approval_type_text' => $item['type_name'] ?? ($item['type'] == 'checkin' ? '补卡申请' : '请假申请'),
                'status_text' => self::getStatusText($item['status']),
                'create_time_text' => date('Y-m-d H:i', strtotime($item['created_at'])),
            ];
        }

        return [
            'list' => $items,
            'total' => $list->total(),
            'page_no' => $page,
            'page_size' => $pageSize,
        ];
    }

    public static function getMyList($employeeId, $status = '', $page = 1, $pageSize = 20)
    {
        $where = [['employee_id', '=', $employeeId]];

        if ($status && $status != 'all') {
            $where[] = ['status', '=', $status];
        }

        $list = Approval::where($where)
            ->order('created_at', 'desc')
            ->paginate($pageSize, false, ['page' => $page]);

        $items = [];
        foreach ($list->items() as $item) {
            $items[] = [
                'id' => $item['id'],
                'type' => $item['type'],
                'type_name' => $item['type_name'] ?? '',
                'status' => $item['status'],
                'status_text' => self::getStatusText($item['status']),
                'reason' => $item['reason'] ?? '',
                'created_at' => $item['created_at'],
                'approver_name' => $item['approver_name'] ?? '',
                'approve_remark' => $item['approve_remark'] ?? '',
            ];
        }

        return [
            'list' => $items,
            'total' => $list->total(),
            'page' => $page,
            'page_size' => $pageSize,
        ];
    }

    public static function getPendingList($approverId, $page = 1, $pageSize = 20)
    {
        $configs = ApprovalConfig::where('status', 'enabled')->select();

        $types = [];
        foreach ($configs as $config) {
            $approverIds = $config->approver_ids;
            if (is_array($approverIds) && in_array($approverId, $approverIds)) {
                $types[] = $config['type'];
            }
        }

        if (empty($types)) {
            return [
                'list' => [],
                'total' => 0,
                'page' => $page,
                'page_size' => $pageSize,
            ];
        }

        $where = [['type', 'in', $types], ['status', '=', 'pending']];

        $list = Approval::where($where)
            ->order('created_at', 'asc')
            ->paginate($pageSize, false, ['page' => $page]);

        $items = [];
        foreach ($list->items() as $item) {
            $extraData = $item['extra_data'] ? json_decode($item['extra_data'], true) : [];
            $items[] = [
                'id' => $item['id'],
                'type' => $item['type'],
                'type_name' => $item['type_name'] ?? '',
                'employee_name' => $item['employee_name'] ?? '',
                'reason' => $item['reason'] ?? '',
                'created_at' => $item['created_at'],
                'extra_data' => $extraData,
            ];
        }

        return [
            'list' => $items,
            'total' => $list->total(),
            'page' => $page,
            'page_size' => $pageSize,
        ];
    }

    public static function getDetail($id, $storeId)
    {
        $item = Approval::where('id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$item) {
            self::setError('记录不存在');
            return false;
        }

        $extraData = $item['extra_data'] ? json_decode($item['extra_data'], true) : [];

        return [
            'id' => $item['id'],
            'type' => $item['type'],
            'type_name' => $item['type_name'] ?? '',
            'employee_id' => $item['employee_id'],
            'employee_name' => $item['employee_name'] ?? '',
            'status' => $item['status'],
            'status_text' => self::getStatusText($item['status']),
            'reason' => $item['reason'] ?? '',
            'start_date' => $item['start_date'] ?? '',
            'end_date' => $item['end_date'] ?? '',
            'duration' => $item['duration'] ?? 0,
            'remark' => $item['remark'] ?? '',
            'approver_id' => $item['approver_id'] ?? '',
            'approver_name' => $item['approver_name'] ?? '',
            'approve_time' => $item['approve_time'] ?? '',
            'approve_remark' => $item['approve_remark'] ?? '',
            'extra_data' => $extraData,
            'create_time' => $item['created_at'],
            'approval_type_text' => $item['type_name'] ?? '',
            'create_time_text' => date('Y-m-d H:i', strtotime($item['created_at'])),
        ];
    }

    public static function create($params, $employeeId, $storeId)
    {
        $type = $params['type'];
        $reason = $params['reason'];
        $extraData = $params['extra_data'] ?? [];

        $config = self::getConfig($storeId, $type);
        if (!$config) {
            return false;
        }

        $employee = Employee::find($employeeId);
        if (!$employee) {
            self::setError('员工信息不存在');
            return false;
        }

        $approval = Approval::create([
            'id' => 'approval_' . date('YmdHis') . mt_rand(1000, 9999),
            'store_id' => $storeId,
            'employee_id' => $employeeId,
            'employee_name' => $employee['name'],
            'type' => $type,
            'type_name' => $config['type_name'],
            'status' => 'pending',
            'reason' => $reason,
            'extra_data' => json_encode($extraData),
        ]);

        self::notifyApprovers($approval, $config);

        return ['id' => $approval['id'], 'status' => 'pending'];
    }

    public static function approve($id, $approverId, $approverName, $remark = '')
    {
        $approval = Approval::find($id);
        if (!$approval) {
            self::setError('审批记录不存在');
            return false;
        }

        if ($approval['status'] != 'pending') {
            self::setError('该申请已被审批');
            return false;
        }

        $approval->status = 'approved';
        $approval->approver_id = $approverId;
        $approval->approver_name = $approverName;
        $approval->approve_time = date('Y-m-d H:i:s');
        $approval->approve_remark = $remark;
        $approval->save();

        self::notifyApplicant($approval);

        return true;
    }

    public static function reject($id, $approverId, $approverName, $remark = '')
    {
        $approval = Approval::find($id);
        if (!$approval) {
            self::setError('审批记录不存在');
            return false;
        }

        if ($approval['status'] != 'pending') {
            self::setError('该申请已被审批');
            return false;
        }

        $approval->status = 'rejected';
        $approval->approver_id = $approverId;
        $approval->approver_name = $approverName;
        $approval->approve_time = date('Y-m-d H:i:s');
        $approval->approve_remark = $remark;
        $approval->save();

        self::notifyApplicant($approval);

        return true;
    }

    public static function getConfig($storeId, $type)
    {
        $config = ApprovalConfig::where('store_id', $storeId)
            ->where('type', $type)
            ->where('status', 'enabled')
            ->find();

        if (!$config) {
            $config = ApprovalConfig::where('type', $type)
                ->where('status', 'enabled')
                ->find();
        }

        if (!$config) {
            self::setError('该审批类型未配置审批人');
            return false;
        }

        return $config;
    }

    public static function getConfigList($storeId)
    {
        $list = ApprovalConfig::where('store_id', $storeId)
            ->order('created_at', 'desc')
            ->select();

        if ($list->isEmpty()) {
            $list = ApprovalConfig::order('created_at', 'desc')->select();
        }

        $result = [];
        foreach ($list as $item) {
            $result[] = [
                'id' => $item['id'],
                'type' => $item['type'],
                'type_name' => $item['type_name'],
                'approver_ids' => $item['approver_ids'],
                'approver_names' => $item['approver_names'],
                'status' => $item['status'],
            ];
        }

        return $result;
    }

    public static function saveConfig($params, $storeId)
    {
        $type = $params['type'] ?? '';
        if (empty($type)) {
            return self::setError('审批类型不能为空');
        }

        $typeNameMap = [
            'checkin' => '补卡申请',
            'exchange' => '换班申请',
            'leave' => '请假申请',
            'outwork' => '外勤申请',
            'overtime' => '加班申请',
        ];

        $typeName = $params['type_name'] ?? ($typeNameMap[$type] ?? $type);
        $approverIds = $params['approver_ids'] ?? [];
        $status = $params['status'] ?? 'enabled';

        if (empty($approverIds)) {
            return self::setError('请选择审批人');
        }

        $approverIds = is_array($approverIds) ? $approverIds : (json_decode($approverIds, true) ?: []);

        $approvers = Employee::whereIn('id', $approverIds)->column('name', 'id');
        $approverNames = array_values($approvers);

        $existing = ApprovalConfig::where('store_id', $storeId)
            ->where('type', $type)
            ->find();

        if ($existing) {
            $existing->type_name = $typeName;
            $existing->approver_ids = json_encode($approverIds);
            $existing->approver_names = json_encode($approverNames);
            $existing->status = $status;
            $existing->save();
            return true;
        }

        ApprovalConfig::create([
            'id' => 'config_' . $type . '_' . time(),
            'store_id' => $storeId,
            'type' => $type,
            'type_name' => $typeName,
            'approver_ids' => json_encode($approverIds),
            'approver_names' => json_encode($approverNames),
            'status' => $status,
        ]);

        return true;
    }

    public static function getApprovers($storeId)
    {
        $employees = Employee::where('store_id', $storeId)
            ->whereIn('role', ['boss', 'manager', 'finance', 'coach'])
            ->where('status', 1)
            ->field('id, name, role')
            ->select();

        $result = [];
        foreach ($employees as $employee) {
            $result[] = [
                'id' => $employee['id'],
                'name' => $employee['name'],
                'role' => $employee['role'],
            ];
        }

        return $result;
    }

    public static function notifyApprovers($approval, $config)
    {
        $approverIds = $config['approver_ids'];
        $approverNames = $config['approver_names'];

        if (!is_array($approverIds)) {
            $approverIds = $config->approver_ids;
            $approverNames = $config->approver_names;
        }

        foreach ($approverIds as $index => $approverId) {
            Notification::create([
                'id' => 'notif_' . date('YmdHis') . mt_rand(1000, 9999),
                'store_id' => $approval['store_id'],
                'user_id' => $approverId,
                'type' => 'approval',
                'title' => '新的' . $approval['type_name'] . '待审批',
                'content' => sprintf(
                    "申请人：%s\n申请时间：%s\n理由：%s\n\n请及时处理。",
                    $approval['employee_name'],
                    $approval['created_at'],
                    $approval['reason']
                ),
            ]);
        }
    }

    public static function notifyApplicant($approval)
    {
        Notification::create([
            'id' => 'notif_' . date('YmdHis') . mt_rand(1000, 9999),
            'store_id' => $approval['store_id'],
            'user_id' => $approval['employee_id'],
            'type' => 'approval_result',
            'title' => '您的' . $approval['type_name'] . '已' . ($approval['status'] == 'approved' ? '通过' : '被拒绝'),
            'content' => sprintf(
                "审批人：%s\n审批时间：%s\n意见：%s",
                $approval['approver_name'] ?? '',
                $approval['approve_time'] ?? '',
                $approval['approve_remark'] ?? '无'
            ),
        ]);
    }

    public static function getCount($storeId)
    {
        try {
            $counts = Approval::where('store_id', $storeId)
                ->where('type', 'in', ['checkin', 'leave'])
                ->field('status, COUNT(id) as count')
                ->group('status')
                ->select()
                ->toArray();

            $result = [
                'total' => 0,
                'pending' => 0,
                'approved' => 0,
                'rejected' => 0,
            ];

            foreach ($counts as $item) {
                if (isset($result[$item['status']])) {
                    $result[$item['status']] = (int)$item['count'];
                }
                $result['total'] += (int)$item['count'];
            }

            return $result;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return [
                'total' => 0,
                'pending' => 0,
                'approved' => 0,
                'rejected' => 0,
            ];
        }
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