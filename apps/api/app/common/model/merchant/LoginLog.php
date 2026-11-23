<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class LoginLog extends Model
{
    protected $name = 'busi_login_log';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'user_type' => 'string',
        'user_id' => 'string',
        'user_name' => 'string',
        'store_id' => 'string',
        'login_type' => 'string',
        'ip_address' => 'string',
        'user_agent' => 'string',
        'device' => 'string',
        'location' => 'string',
        'status' => 'integer',
        'fail_reason' => 'string',
        'created_at' => 'datetime',
    ];
}