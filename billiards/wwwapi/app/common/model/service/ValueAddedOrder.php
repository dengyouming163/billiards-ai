<?php
namespace app\common\model\service;

use app\common\model\BaseModel;

class ValueAddedOrder extends BaseModel
{
    protected $name = 'value_added_orders';

    protected $schema = [
        'id' => 'string',
        'order_no' => 'string',
        'merchant_id' => 'string',
        'service_id' => 'string',
        'quantity' => 'integer',
        'unit_price' => 'decimal',
        'total_amount' => 'decimal',
        'status' => 'string',
        'paid_at' => 'datetime',
        'created_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_PAID = 'paid';
    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';

    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_PENDING => '待支付',
            self::STATUS_PAID => '已支付',
            self::STATUS_ACTIVE => '已开通',
            self::STATUS_EXPIRED => '已到期',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }
}