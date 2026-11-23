<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class RolePermission extends Model
{
    protected $name = 'busi_role_permission';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'role_id' => 'string',
        'permission_id' => 'string',
        'created_at' => 'datetime',
    ];
}