<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Product extends Model
{
    protected $name = 'busi_product';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'category_id' => 'string',
        'name' => 'string',
        'code' => 'string',
        'barcode' => 'string',
        'unit' => 'string',
        'price' => 'decimal',
        'cost_price' => 'decimal',
        'stock' => 'integer',
        'min_stock' => 'integer',
        'image' => 'string',
        'description' => 'string',
        'status' => 'integer',
        'total_sales' => 'integer',
        'total_amount' => 'decimal',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}