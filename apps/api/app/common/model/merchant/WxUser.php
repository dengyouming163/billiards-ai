<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class WxUser extends Model
{
    protected $name = 'busi_wx_user';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $deleteTime = 'deleted_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    
    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'openid' => 'string',
        'unionid' => 'string',
        'member_id' => 'string',
        'nickname' => 'string',
        'avatar' => 'string',
        'gender' => 'string',
        'country' => 'string',
        'province' => 'string',
        'city' => 'string',
        'language' => 'string',
        'phone' => 'string',
        'status' => 'integer',
        'last_login_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime',
    ];
}