<?php
namespace Billiards\Models;

class LightDevice extends BaseModel
{
    protected $table = 'bi_busi_light_device';

    public function findByDeviceSn($deviceSn)
    {
        return $this->findOne(['device_sn' => $deviceSn]);
    }

    public function findOnlineDevices($storeId = null)
    {
        $conditions = ['status' => 1];
        if ($storeId) {
            $conditions['store_id'] = $storeId;
        }
        return $this->findAll($conditions);
    }

    public function registerDevice($deviceSn, $addr, $channelCount, $storeId = null)
    {
        $uuid = self::generateUuid();
        $now = date('Y-m-d H:i:s');

        $data = [
            'id'             => $uuid,
            'store_id'       => $storeId ?? '',
            'device_sn'      => $deviceSn,
            'addr'           => $addr,
            'device_name'    => '灯控设备-' . $deviceSn,
            'channel_count'  => $channelCount,
            'status'         => 1,
            'last_heartbeat' => $now,
            'last_online'    => $now,
            'created_at'     => $now,
            'updated_at'     => $now,
        ];

        $this->insert($data);

        return $uuid;
    }

    public function updateHeartbeat($deviceSn)
    {
        return $this->update(
            [
                'status'         => 1,
                'last_heartbeat' => date('Y-m-d H:i:s'),
                'updated_at'     => date('Y-m-d H:i:s'),
            ],
            ['device_sn' => $deviceSn]
        );
    }

    public function setOffline($deviceSn)
    {
        return $this->update(
            [
                'status'     => 0,
                'updated_at' => date('Y-m-d H:i:s'),
            ],
            ['device_sn' => $deviceSn]
        );
    }

    private static function generateUuid()
    {
        $data = random_bytes(16);

        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
