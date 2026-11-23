<?php
namespace app\common\model\ticket;

use app\common\model\BaseModel;

class Ticket extends BaseModel
{
    protected $name = 'tickets';

    protected $schema = [
        'id' => 'string',
        'ticket_no' => 'string',
        'merchant_id' => 'string',
        'type' => 'string',
        'priority' => 'string',
        'title' => 'string',
        'content' => 'string',
        'attachments' => 'json',
        'status' => 'string',
        'assigned_to' => 'string',
        'internal_notes' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const TYPE_CONSULTATION = 'consultation';
    const TYPE_FAULT = 'fault';
    const TYPE_COMPLAINT = 'complaint';
    const TYPE_FEATURE = 'feature';

    const PRIORITY_LOW = 'low';
    const PRIORITY_NORMAL = 'normal';
    const PRIORITY_HIGH = 'high';
    const PRIORITY_URGENT = 'urgent';

    const STATUS_SUBMITTED = 'submitted';
    const STATUS_ACCEPTED = 'accepted';
    const STATUS_PROCESSING = 'processing';
    const STATUS_CONFIRMED = 'confirmed';
    const STATUS_CLOSED = 'closed';

    public function getTypeTextAttr($value, $data)
    {
        $typeMap = [
            self::TYPE_CONSULTATION => '咨询类',
            self::TYPE_FAULT => '故障类',
            self::TYPE_COMPLAINT => '投诉类',
            self::TYPE_FEATURE => '需求类',
        ];
        return $typeMap[$data['type']] ?? '未知';
    }

    public function getPriorityTextAttr($value, $data)
    {
        $priorityMap = [
            self::PRIORITY_LOW => '低',
            self::PRIORITY_NORMAL => '普通',
            self::PRIORITY_HIGH => '高',
            self::PRIORITY_URGENT => '紧急',
        ];
        return $priorityMap[$data['priority']] ?? '未知';
    }

    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_SUBMITTED => '待受理',
            self::STATUS_ACCEPTED => '已受理',
            self::STATUS_PROCESSING => '处理中',
            self::STATUS_CONFIRMED => '已确认',
            self::STATUS_CLOSED => '已关闭',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }
}