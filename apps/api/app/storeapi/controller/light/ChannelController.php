<?php
declare(strict_types=1);

namespace app\storeapi\controller\light;

use app\storeapi\controller\BaseStoreController;
use app\common\model\merchant\LightChannel as LightChannelModel;
use app\common\model\merchant\LightDevice;
use app\common\model\merchant\Table;
use app\common\service\JsonService;
use app\common\lib\WebSocketNotification;

class ChannelController extends BaseStoreController
{
    public function listDevices()
    {
        $devices = LightDevice::bound()->ofStore($this->storeId)
            ->order('bound_at', 'desc')->select();
        return JsonService::data($devices->toArray());
    }

    public function listByDevice()
    {
        $deviceId = $this->request->get('device_id', '');
        if (empty($deviceId)) return JsonService::fail('参数不完整');

        $device = LightDevice::ofStore($this->storeId)->find($deviceId);
        if (!$device) return JsonService::fail('设备不存在或不属于当前门店');

        $channels = LightChannelModel::ofDevice($deviceId)->select()->toArray();
        foreach ($channels as &$ch) {
            if (!empty($ch['table_id'])) {
                $t = Table::find($ch['table_id']);
                $ch['table_name'] = $t ? $t->name : '';
                $ch['table_number'] = $t ? $t->number : '';
            }
        }
        return JsonService::data($channels);
    }

    public function bindTable()
    {
        $channelId = $this->request->post('channel_id', '');
        $tableId   = $this->request->post('table_id', '');
        if (!$channelId || !$tableId) return JsonService::fail('参数不完整');

        $channel = LightChannelModel::find($channelId);
        if (!$channel) return JsonService::fail('通道不存在');

        $device = LightDevice::ofStore($this->storeId)->find($channel->device_id);
        if (!$device) return JsonService::fail('设备不属于当前门店');
        if (!empty($channel->table_id)) return JsonService::fail('该通道已绑定台桌');

        $table = Table::where('id', $tableId)->where('store_id', $this->storeId)->find();
        if (!$table) return JsonService::fail('台桌不存在');
        $channel->save(['table_id' => $tableId]);
        return JsonService::success('绑定成功');
    }

    public function unbindTable()
    {
        $channelId = $this->request->post('channel_id', '');
        if (!$channelId) return JsonService::fail('参数不完整');

        $channel = LightChannelModel::find($channelId);
        if (!$channel) return JsonService::fail('通道不存在');

        $device = LightDevice::ofStore($this->storeId)->find($channel->device_id);
        if (!$device) return JsonService::fail('设备不属于当前门店');
        $channel->save(['table_id' => '']);
        return JsonService::success('解绑成功');
    }

    public function rename()
    {
        $channelId   = $this->request->post('channel_id', '');
        $channelName = $this->request->post('channel_name', '');
        if (!$channelId || !$channelName) return JsonService::fail('参数不完整');

        $channel = LightChannelModel::find($channelId);
        if (!$channel) return JsonService::fail('通道不存在');

        $device = LightDevice::ofStore($this->storeId)->find($channel->device_id);
        if (!$device) return JsonService::fail('设备不属于当前门店');
        $channel->save(['channel_name' => mb_substr($channelName, 0, 64)]);
        return JsonService::success('重命名成功');
    }

    public function toggle()
    {
        $channelId = $this->request->post('channel_id', '');
        $deviceId  = $this->request->post('device_id', '');
        $action    = $this->request->post('action', 'on');
        if (!$channelId || !$deviceId || !in_array($action, ['on', 'off']))
            return JsonService::fail('参数无效');

        $device = LightDevice::ofStore($this->storeId)->find($deviceId);
        if (!$device) return JsonService::fail('设备不存在或不属于当前门店');
        if ($device->status != 1) return JsonService::fail('设备离线');

        $channel = LightChannelModel::where('device_id', $deviceId)->where('id', $channelId)->find();
        if (!$channel) return JsonService::fail('通道不存在');

        $chCount = (int)($device->channel_count ?? 8);
        $y = array_fill(0, $chCount, 3);
        $y[(int)$channel->channel_no - 1] = ($action === 'on') ? 1 : 0;

        WebSocketNotification::sendRawToDevice(
            $device->device_sn,
            json_encode(['addr' => (int)($device->addr ?? 64), 'cmd' => 'set', 'y' => $y], JSON_UNESCAPED_UNICODE)
        );
        return JsonService::success("通道{$channel->channel_no}已发送{$action}指令");
    }

    public function toggleAll()
    {
        $deviceId = $this->request->post('device_id', '');
        $action   = $this->request->post('action', 'on');
        if (!$deviceId || !in_array($action, ['on', 'off'])) return JsonService::fail('参数无效');

        $device = LightDevice::ofStore($this->storeId)->find($deviceId);
        if (!$device) return JsonService::fail('设备不存在或不属于当前门店');
        if ($device->status != 1) return JsonService::fail('设备离线');

        $chCount = (int)($device->channel_count ?? 8);
        $y = array_fill(0, $chCount, ($action === 'on') ? 1 : 0);

        WebSocketNotification::sendRawToDevice(
            $device->device_sn,
            json_encode(['addr' => (int)($device->addr ?? 64), 'cmd' => 'set', 'y' => $y], JSON_UNESCAPED_UNICODE)
        );
        return JsonService::success("全部通道已发送{$action}指令");
    }
}
