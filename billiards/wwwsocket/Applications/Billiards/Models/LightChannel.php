<?php
namespace Billiards\Models;

class LightChannel extends BaseModel
{
    protected $table = 'bi_busi_light_channel';

    public function findByDeviceId($deviceId)
    {
        return $this->findAll(['device_id' => $deviceId], 'channel_no ASC');
    }

    public function findByTableId($tableId)
    {
        return $this->findAll(['table_id' => $tableId], 'channel_no ASC');
    }

    public function createChannelsForDevice($deviceId, $channelCount)
    {
        $now = date('Y-m-d H:i:s');

        for ($i = 1; $i <= $channelCount; $i++) {
            $this->insert([
                'id'           => self::generateUuid(),
                'device_id'    => $deviceId,
                'channel_no'   => $i,
                'channel_name' => '通道' . $i,
                'status'       => 0,
                'table_id'     => '',
                'created_at'   => $now,
                'updated_at'   => $now,
            ]);
        }
    }

    public function updateChannelStatus($deviceId, $channelNo, $status)
    {
        return $this->update(
            [
                'status'     => $status,
                'updated_at' => date('Y-m-d H:i:s'),
            ],
            [
                'device_id'  => $deviceId,
                'channel_no' => $channelNo,
            ]
        );
    }

    public function syncChannelStatuses($deviceId, $statuses)
    {
        $pdo = self::getConnection();
        $now = date('Y-m-d H:i:s');

        foreach ($statuses as $index => $value) {
            $channelNo = $index + 1;
            $status = ($value == 1) ? 1 : 0;

            $sql = "UPDATE {$this->table} SET `status` = :status, `updated_at` = :updated_at WHERE `device_id` = :device_id AND `channel_no` = :channel_no";

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':status'     => $status,
                ':updated_at' => $now,
                ':device_id'  => $deviceId,
                ':channel_no' => $channelNo,
            ]);
        }
    }

    private static function generateUuid()
    {
        $data = random_bytes(16);

        $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
        $data[8] = chr(ord($data[8]) & 0x3f | 0x80);

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
    }
}
