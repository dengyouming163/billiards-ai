<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class InventoryRecord extends Model
{
    protected $name = 'busi_inventory_record';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = false;
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'product_id' => 'string',
        'type' => 'string',
        'quantity' => 'integer',
        'price' => 'decimal',
        'total_amount' => 'decimal',
        'stock_before' => 'integer',
        'stock_after' => 'integer',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'reason' => 'string',
        'order_id' => 'string',
        'description' => 'string',
        'created_at' => 'datetime',
    ];
}
