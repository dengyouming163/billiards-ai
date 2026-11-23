<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class MessageLog extends Model
{
    protected $name = 'busi_message_log';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'template_id' => 'string',
        'type' => 'string',
        'recipient' => 'string',
        'recipient_type' => 'string',
        'recipient_id' => 'string',
        'title' => 'string',
        'content' => 'text',
        'status' => 'string',
        'send_time' => 'datetime',
        'complete_time' => 'datetime',
        'fail_reason' => 'string',
        'response' => 'text',
        'created_at' => 'datetime',
    ];
}