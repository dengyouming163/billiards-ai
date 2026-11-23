<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class PackageItem extends Model
{
    protected $name = 'busi_package_item';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    
    protected $schema = [
        'id' => 'string',
        'package_id' => 'string',
        'item_type' => 'string',
        'item_id' => 'string',
        'item_name' => 'string',
        'quantity' => 'decimal',
        'unit' => 'string',
        'price' => 'decimal',
        'description' => 'string',
        'created_at' => 'datetime',
    ];
}