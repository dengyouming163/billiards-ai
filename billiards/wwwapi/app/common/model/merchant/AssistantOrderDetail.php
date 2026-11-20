<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class AssistantOrderDetail extends Model
{
    protected $name = 'busi_assistant_order_detail';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'order_id' => 'string',
        'store_id' => 'string',
        'assistant_id' => 'string',
        'member_id' => 'string',
        'student_name' => 'string',
        'student_phone' => 'string',
        'service_type' => 'string',
        'duration' => 'decimal',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'rating' => 'integer',
        'review' => 'text',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}