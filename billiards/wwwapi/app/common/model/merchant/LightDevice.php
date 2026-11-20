<?php

declare(strict_types=1);

namespace app\common\model\merchant;

use app\common\model\BaseModel;

class LightDevice extends BaseModel
{
    protected $name = 'busi_light_device';
    protected $pk = 'id';
    protected $autoWriteTimestamp = false;

    const STATUS_OFFLINE = 0;
    const STATUS_ONLINE = 1;

    const BIND_UNBOUND = 0;
    const BIND_BOUND   = 1;

    // 未绑定设备
    public function scopeUnbound($query)
    {
        return $query->where('bind_status', self::BIND_UNBOUND);
    }

    // 已绑定设备
    public function scopeBound($query)
    {
        return $query->where('bind_status', self::BIND_BOUND);
    }

    // 在线设备
    public function scopeOnline($query)
    {
        return $query->where('status', self::STATUS_ONLINE);
    }

    // 某门店的设备
    public function scopeOfStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function findByDeviceSn(string $deviceSn)
    {
        return $this->where('device_sn', $deviceSn)->find();
    }

    public function channels()
    {
        return $this->hasMany(LightChannel::class, 'device_id', 'id');
    }
}
