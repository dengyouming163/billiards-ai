<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class CashFlow extends Model
{
    protected $name = 'busi_cash_flow';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';

    // 业务类型常量
    const TYPE_INCOME = 'income';              // 收入
    const TYPE_EXPENSE = 'expense';            // 支出
    const TYPE_ADJUSTMENT = 'adjustment';      // 调整

    // 业务分类常量
    const CATEGORY_MEMBER_RECHARGE = 'member_recharge';       // 会员充值
    const CATEGORY_BALANCE_ADJUSTMENT = 'balance_adjustment'; // 余额调整

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'order_id' => 'string',
        'order_no' => 'string',
        'type' => 'string',
        'category' => 'string',
        'amount' => 'decimal',
        'payment_method' => 'string',
        'balance_before' => 'decimal',
        'balance_after' => 'decimal',
        'description' => 'string',
        'operator_id' => 'string',
        'operator_name' => 'string',
        'created_at' => 'datetime',
    ];
}