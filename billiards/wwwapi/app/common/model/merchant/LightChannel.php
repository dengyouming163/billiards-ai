<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use app\common\model\BaseModel;

class LightChannel extends BaseModel
{
    protected $name = 'busi_light_channel';
    protected $pk = 'id';
    protected $autoWriteTimestamp = false;

    const STATUS_OFF = 0;
    const STATUS_ON = 1;

    public static function findByTableId($tableId)
    {
        return self::where('table_id', $tableId)->select()->toArray();
    }

    public function findByDeviceId(string $deviceId)
    {
        return $this->where('device_id', $deviceId)->select()->toArray();
    }

    public function scopeOfDevice($query, $deviceId)
    {
        return $query->where('device_id', $deviceId)->order('channel_no', 'asc');
    }

    public function scopeUnbound($query)
    {
        return $query->where('table_id', '');
    }

    public function device()
    {
        return $this->belongsTo(LightDevice::class, 'device_id', 'id');
    }
}
