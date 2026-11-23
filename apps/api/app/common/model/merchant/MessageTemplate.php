<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class MessageTemplate extends Model
{
    protected $name = 'busi_message_template';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'type' => 'string',
        'name' => 'string',
        'code' => 'string',
        'title' => 'string',
        'content' => 'text',
        'variables' => 'string',
        'enabled' => 'integer',
        'description' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}