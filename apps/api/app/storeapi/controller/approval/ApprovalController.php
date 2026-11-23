<?php

namespace app\storeapi\controller\approval;

use app\storeapi\controller\BaseStoreController;
use app\common\service\JsonService;

/**
 * 审批类型控制器
 * 对应前端 GET /approval.Approval/types
 */
class ApprovalController extends BaseStoreController
{
    /**
     * 获取可用的审批类型列表
     * GET /approval.Approval/types
     */
    public function types()
    {
        $types = [
            [
                'type' => 'leave',
                'name' => '请假申请',
                'description' => '事假、病假、年假等',
                'fields' => ['leave_type', 'start_date', 'end_date', 'reason'],
            ],
            [
                'type' => 'checkin',
                'name' => '补卡申请',
                'description' => '漏打卡补签申请',
                'fields' => ['check_date', 'check_time', 'reason'],
            ],
            [
                'type' => 'outwork',
                'name' => '外勤申请',
                'description' => '外出工作申请',
                'fields' => ['location', 'start_date', 'end_date', 'reason'],
            ],
            [
                'type' => 'exchange',
                'name' => '换班申请',
                'description' => '与其他员工调换班次',
                'fields' => ['target_employee_id', 'source_date', 'target_date', 'reason'],
            ],
            [
                'type' => 'overtime',
                'name' => '加班申请',
                'description' => '加班工作申请',
                'fields' => ['start_date', 'end_date', 'reason'],
            ],
        ];

        return JsonService::data($types);
    }
}
