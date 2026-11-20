<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Config extends Model
{
    protected $name = 'busi_config';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'category' => 'string',
        'key' => 'string',
        'value' => 'text',
        'type' => 'string',
        'description' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}