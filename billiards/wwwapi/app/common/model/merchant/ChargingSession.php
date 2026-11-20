<?php
declare(strict_types=1);
namespace app\common\model\merchant;
use think\Model;

class ChargingSession extends Model
{
    protected $name = 'charging_session';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    protected $schema = [
        'id' => 'string', 'order_id' => 'string', 'table_id' => 'string',
        'store_id' => 'string', 'port' => 'string', 'status' => 'string',
        'started_at' => 'datetime', 'ended_at' => 'datetime',
        'duration_seconds' => 'integer', 'rate_per_hour' => 'decimal',
        'total_fee' => 'decimal', 'created_at' => 'datetime', 'updated_at' => 'datetime',
    ];
}
