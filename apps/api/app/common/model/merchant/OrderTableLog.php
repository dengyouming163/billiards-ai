<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class OrderTableLog extends Model
{
    protected $name = 'busi_order_table_log';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'operated_at';
    protected $updateTime = false;

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'order_id' => 'string',
        'table_id' => 'string',
        'action' => 'string',
        'related_order_id' => 'string',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'operated_at' => 'datetime',
        'remark' => 'string',
    ];
}
