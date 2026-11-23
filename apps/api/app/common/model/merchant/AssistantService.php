<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class AssistantService extends Model
{
    protected $name = 'busi_assistant_service';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'employee_id' => 'string',
        'store_id' => 'string',
        'icon' => 'string',
        'name' => 'string',
        'description' => 'string',
        'price' => 'decimal',
        'unit' => 'string',
        'sort_order' => 'integer',
        'status' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}
