<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Permission extends Model
{
    protected $name = 'busi_permission';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'parent_id' => 'string',
        'name' => 'string',
        'code' => 'string',
        'module' => 'string',
        'uri' => 'string',
        'icon' => 'string',
        'sort_order' => 'integer',
        'type' => 'string',
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}