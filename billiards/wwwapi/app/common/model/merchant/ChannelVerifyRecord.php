<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class ChannelVerifyRecord extends Model
{
    protected $name = 'busi_channel_verify_record';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'order_id' => 'string',
        'channel' => 'string',
        'verify_code' => 'string',
        'verify_amount' => 'float',
        'status' => 'string',
        'remark' => 'string',
        'created_at' => 'datetime',
    ];
}
