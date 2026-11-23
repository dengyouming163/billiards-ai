<?php

namespace app\common\model\merchant;

use app\common\model\BaseModel;

class Reservation extends BaseModel
{
    protected $table = 'bi_busi_reservation';

    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
}
