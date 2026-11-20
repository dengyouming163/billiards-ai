<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class OrderPauseLog extends Model
{
    protected $name = 'busi_order_pause_log';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'order_id' => 'string',
        'pause_type' => 'string',
        'start_time' => 'string',
        'end_time' => 'string',
        'duration_seconds' => 'int',
        'fee' => 'float',
        'rate_coefficient' => 'float',
        'created_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class, 'order_id', 'id');
    }
}
