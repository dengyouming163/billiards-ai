<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class AssistantOrder extends Model
{
    protected $name = 'busi_assistant_order';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'order_no' => 'string',
        'store_id' => 'string',
        'table_id' => 'string',
        'assistant_id' => 'string',
        'member_id' => 'string',
        'student_name' => 'string',
        'student_phone' => 'string',
        'type' => 'string',
        'duration' => 'decimal',
        'actual_duration' => 'decimal',
        'unit_price' => 'decimal',
        'total_amount' => 'decimal',
        'actual_amount' => 'decimal',
        'status' => 'string',
        'rating' => 'integer',
        'review' => 'text',
        'start_time' => 'datetime',
        'end_time' => 'datetime',
        'accepted_at' => 'datetime',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'remark' => 'string',
        'order_id' => 'string',
        'created_at' => 'datetime',
        'completed_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}