<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CommissionConfig extends Model
{
    protected $name = 'busi_commission_config';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'assistant_id' => 'string',
        'commission_type' => 'string',
        'commission_rate' => 'decimal',
        'commission_mode' => 'string',
        'guarantee_hours' => 'float',
        'guarantee_amount' => 'float',
        'base_salary' => 'decimal',
        'status' => 'integer',
        'remark' => 'string',
        'settlement_period' => 'string',
        'effective_date' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    public function assistant()
    {
        return $this->hasOne(Assistant::class, 'id', 'assistant_id');
    }
}
