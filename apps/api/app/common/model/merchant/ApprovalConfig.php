<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class ApprovalConfig extends Model
{
    protected $name = 'busi_approval_config';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'type' => 'string',
        'type_name' => 'string',
        'approver_ids' => 'string',
        'approver_names' => 'string',
        'status' => 'string',
        'remark' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];
    
    public function getApproverIdsAttr($value)
    {
        return $value ? json_decode($value, true) : [];
    }
    
    public function setApproverIdsAttr($value)
    {
        return is_array($value) ? json_encode($value) : $value;
    }
    
    public function getApproverNamesAttr($value)
    {
        return $value ? json_decode($value, true) : [];
    }
    
    public function setApproverNamesAttr($value)
    {
        return is_array($value) ? json_encode($value) : $value;
    }
}