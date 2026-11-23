<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class AssistantSchedule extends Model
{
    protected $name = 'busi_assistant_schedule';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'assistant_id' => 'string',
        'store_id' => 'string',
        'date' => 'date',
        'shift' => 'string',
        'start_time' => 'time',
        'end_time' => 'time',
        'status' => 'string',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}