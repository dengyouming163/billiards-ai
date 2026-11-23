<?php
namespace app\common\model\package;

use app\common\model\BaseModel;

class Bill extends BaseModel
{
    protected $name = 'bills';

    protected $schema = [
        'id' => 'string',
        'merchant_id' => 'string',
        'bill_no' => 'string',
        'amount' => 'decimal',
        'base_fee' => 'decimal',
        'overage_fee' => 'decimal',
        'extra_fee' => 'decimal',
        'status' => 'string',
        'due_date' => 'date',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_OVERDUE = 'overdue';

    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_PENDING => '待支付',
            self::STATUS_PAID => '已支付',
            self::STATUS_OVERDUE => '已逾期',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }
}