<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class AssistantProfile extends Model
{
    protected $name = 'busi_assistant_profile';
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
        'avatar' => 'string',
        'nickname' => 'string',
        'signature' => 'string',
        'tags' => 'json',
        'album' => 'json',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
    
    protected $json = ['tags', 'album'];
    protected $jsonAssoc = true;
}
