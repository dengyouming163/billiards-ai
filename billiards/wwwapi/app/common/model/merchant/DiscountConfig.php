<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class DiscountConfig extends Model
{
    protected $name = 'busi_discount_config';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'discount_name' => 'string',
        'discount_type' => 'string',
        'discount_value' => 'float',
        'rounding_mode' => 'string',
        'status' => 'int',
        'sort_order' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
}
