<?php
namespace app\common\model\announcement;

use think\Model;

class Announcement extends Model
{
    protected $name = 'announcements';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
}
