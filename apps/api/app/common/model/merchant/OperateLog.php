<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class OperateLog extends Model
{
    protected $name = 'busi_operate_log';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'operator_type' => 'string',
        'module' => 'string',
        'action' => 'string',
        'target_type' => 'string',
        'target_id' => 'string',
        'target_name' => 'string',
        'content' => 'text',
        'ip_address' => 'string',
        'user_agent' => 'string',
        'status' => 'integer',
        'created_at' => 'datetime',
    ];
}