<?php
namespace app\common\model\merchant;

use app\common\model\BaseModel;

class Contract extends BaseModel
{
    protected $name = 'contract';

    protected $schema = [
        'id' => 'string',
        'merchant_id' => 'string',
        'contract_no' => 'string',
        'template_id' => 'string',
        'start_date' => 'date',
        'end_date' => 'date',
        'file_url' => 'string',
        'status' => 'string',
        'created_at' => 'datetime',
    ];

    const STATUS_ACTIVE = 'active';
    const STATUS_EXPIRED = 'expired';
    const STATUS_TERMINATED = 'terminated';
}