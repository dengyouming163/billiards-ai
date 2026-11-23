<?php
namespace Billiards\Protocol;

class LightDeviceProtocol
{
    const CHANNEL_ACTION_OFF    = 0;
    const CHANNEL_ACTION_ON     = 1;
    const CHANNEL_ACTION_TOGGLE = 2;
    const CHANNEL_ACTION_NOOP   = 3;

    public static function decode($rawData)
    {
        $data = json_decode(trim($rawData), true);

        if (!$data) {
            return null;
        }

        return $data;
    }

    public static function encode($data)
    {
        return json_encode($data);
    }

    public static function isUploadMessage($data)
    {
        return isset($data['cmd']) && $data['cmd'] === 'upload';
    }

    public static function buildControlCommand($addr, $channelCount, $channelNo, $action)
    {
        $y = array_fill(0, $channelCount, self::CHANNEL_ACTION_NOOP);

        $index = $channelNo - 1;

        if ($index >= 0 && $index < $channelCount) {
            $y[$index] = ($action === 'on') ? self::CHANNEL_ACTION_ON : self::CHANNEL_ACTION_OFF;
        }

        return [
            'addr' => (int)$addr,
            'cmd'  => 'set',
            'y'    => $y,
        ];
    }

    public static function buildControlCommandFull($addr, $channelCount, $action)
    {
        $value = ($action === 'on') ? self::CHANNEL_ACTION_ON : self::CHANNEL_ACTION_OFF;

        $y = array_fill(0, $channelCount, $value);

        return [
            'addr' => (int)$addr,
            'cmd'  => 'set',
            'y'    => $y,
        ];
    }
}
