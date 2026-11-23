<?php
declare(strict_types=1);
namespace app\common\model\merchant;
use think\Model;

class ChargingConfig extends Model
{
    protected $name = 'charging_config';
    protected $pk = 'id';
    protected $autoWriteTimestamp = true;
    protected $createTime = 'created_at';
    protected $updateTime = 'updated_at';
    protected $dateFormat = 'Y-m-d H:i:s';
    protected $schema = [
        'id' => 'string', 'store_id' => 'string', 'rate_per_hour' => 'decimal',
        'rate_per_minute' => 'decimal', 'billing_unit' => 'string',
        'free_minutes' => 'integer', 'auto_start' => 'integer', 'status' => 'integer',
        'created_at' => 'datetime', 'updated_at' => 'datetime',
    ];
    public static function getByStore(string $storeId): ?self {
        return self::where('store_id', $storeId)->where('status', 1)->find();
    }
}
