<?php
namespace app\common\model\help;

use think\Model;

class Article extends Model
{
    protected $name = 'busi_help';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
}