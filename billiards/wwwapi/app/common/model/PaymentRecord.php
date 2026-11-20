<?php
namespace app\common\model;
use think\Model;

class PaymentRecord extends Model
{
    protected $name = 'payment_records';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';

    const STATUS_CREATED   = 'created';
    const STATUS_PENDING   = 'pending';
    const STATUS_PAID      = 'paid';
    const STATUS_FAILED    = 'failed';
    const STATUS_EXPIRED   = 'expired';
    const STATUS_REFUNDING = 'refunding';
    const STATUS_REFUNDED  = 'refunded';

    protected $schema = [
        'id' => 'string',
        'order_id' => 'string',
        'payment_id' => 'string',
        'client_id' => 'string',
        'request_id' => 'string',
        'channel' => 'string',
        'amount' => 'int',
        'status' => 'string',
        'pay_url' => 'string',
        'channel_trade_no' => 'string',
        'paid_amount' => 'int',
        'order_item_id' => 'string',
        'item_type' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public static function findByOrderId(string $orderId): ?self
    {
        return self::where('order_id', $orderId)->order('id', 'desc')->find();
    }

    public static function findByPaymentId(string $paymentId): ?self
    {
        return self::where('payment_id', $paymentId)->find();
    }
}
