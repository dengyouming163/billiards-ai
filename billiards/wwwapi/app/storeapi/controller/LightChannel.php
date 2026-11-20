<?php

declare(strict_types=1);

namespace app\storeapi\controller;

use app\common\model\merchant\LightChannel as LightChannelModel;
use app\common\model\merchant\LightDevice;
use app\common\model\merchant\Table;
use app\common\service\JsonService;
use app\common\lib\WebSocketNotification;

class LightChannel extends BaseStoreController
{
    /**
     * 获取设备的所有通道（含台桌绑定信息）
     * GET /storeapi/light.Channel/listByDevice
     */
    public function listByDevice()
    {
        $deviceId = $this->request->get('device_id', '');

        if (empty($deviceId)) {
            return JsonService::fail('参数不完整：缺少device_id');
        }

        // 验证设备属于当前门店
        $device = LightDevice::ofStore($this->storeId)->find($deviceId);
        if (!$device) {
            return JsonService::fail('设备不存在或不属于当前门店');
        }

        // 获取该设备的所有通道，按通道号排序
        $channels = LightChannelModel::ofDevice($deviceId)->select()->toArray();

        // 收集所有已绑定的台桌ID
        $tableIds = [];
        foreach ($channels as $channel) {
            if (!empty($channel['table_id'])) {
                $tableIds[] = $channel['table_id'];
            }
        }

        // 批量查询台桌信息
        $tables = [];
        if (!empty($tableIds)) {
            $tableList = Table::whereIn('id', array_unique($tableIds))->column('*', 'id');
            foreach ($tableList as $table) {
                $tables[$table['id']] = $table;
            }
        }

        // 组装返回数据：通道 + 台桌信息
        foreach ($channels as &$channel) {
            if (!empty($channel['table_id']) && isset($tables[$channel['table_id']])) {
                $table = $tables[$channel['table_id']];
                $channel['table_name'] = $table['name'] ?? '';
                $channel['table_number'] = $table['number'] ?? '';
            } else {
                $channel['table_name'] = '';
                $channel['table_number'] = '';
            }
        }
        unset($channel);

        return JsonService::data([
            'device' => $device->toArray(),
            'channels' => $channels,
        ]);
    }

    /**
     * 将通道绑定到台桌
     * POST /storeapi/light.Channel/bindTable
     */
    public function bindTable()
    {
        $channelId = $this->request->post('channel_id', '');
        $tableId = $this->request->post('table_id', '');

        if (empty($channelId) || empty($tableId)) {
            return JsonService::fail('参数不完整：缺少channel_id或table_id');
        }

        // 查找通道
        $channel = LightChannelModel::find($channelId);
        if (!$channel) {
            return JsonService::fail('通道不存在');
        }

        // 验证通道所属设备属于当前门店
        $device = LightDevice::ofStore($this->storeId)->find($channel->device_id);
        if (!$device) {
            return JsonService::fail('设备不存在或不属于当前门店');
        }

        // 验证通道未被绑定
        if (!empty($channel->table_id)) {
            return JsonService::fail('该通道已绑定台桌，请先解绑');
        }

        // 验证台桌属于当前门店
        $table = Table::where('store_id', $this->storeId)->find($tableId);
        if (!$table) {
            return JsonService::fail('台桌不存在或不属于当前门店');
        }

        // 执行绑定
        $channel->save(['table_id' => $tableId]);

        return JsonService::success('绑定成功', [
            'channel_id' => $channelId,
            'table_id' => $tableId,
            'table_name' => $table->name ?? '',
            'table_number' => $table->number ?? '',
        ]);
    }

    /**
     * 解绑通道与台桌
     * POST /storeapi/light.Channel/unbindTable
     */
    public function unbindTable()
    {
        $channelId = $this->request->post('channel_id', '');

        if (empty($channelId)) {
            return JsonService::fail('参数不完整：缺少channel_id');
        }

        // 查找通道
        $channel = LightChannelModel::find($channelId);
        if (!$channel) {
            return JsonService::fail('通道不存在');
        }

        // 验证通道所属设备属于当前门店
        $device = LightDevice::ofStore($this->storeId)->find($channel->device_id);
        if (!$device) {
            return JsonService::fail('设备不存在或不属于当前门店');
        }

        // 执行解绑
        $channel->save(['table_id' => '']);

        return JsonService::success('解绑成功', [
            'channel_id' => $channelId,
        ]);
    }

    /**
     * 重命名通道
     * POST /storeapi/light.Channel/rename
     */
    public function rename()
    {
        $channelId = $this->request->post('channel_id', '');
        $channelName = $this->request->post('channel_name', '');

        if (empty($channelId)) {
            return JsonService::fail('参数不完整：缺少channel_id');
        }

        if (empty($channelName)) {
            return JsonService::fail('参数不完整：缺少channel_name');
        }

        // 查找通道
        $channel = LightChannelModel::find($channelId);
        if (!$channel) {
            return JsonService::fail('通道不存在');
        }

        // 验证通道所属设备属于当前门店
        $device = LightDevice::ofStore($this->storeId)->find($channel->device_id);
        if (!$device) {
            return JsonService::fail('设备不存在或不属于当前门店');
        }

        // 执行重命名
        $channel->save(['channel_name' => $channelName]);

        return JsonService::success('重命名成功', [
            'channel_id' => $channelId,
            'channel_name' => $channelName,
        ]);
    }

    /**
     * 单通道开关测试
     * POST /storeapi/light.Channel/toggle
     */
    public function toggle()
    {
        $channelId = $this->request->post('channel_id', '');
        $deviceId = $this->request->post('device_id', '');
        $action = $this->request->post('action', '');

        if (empty($channelId) || empty($deviceId) || empty($action)) {
            return JsonService::fail('参数不完整：缺少channel_id、device_id或action');
        }

        if (!in_array($action, ['on', 'off'])) {
            return JsonService::fail('无效的操作类型，请使用on或off');
        }

        // 验证设备属于当前门店
        $device = LightDevice::ofStore($this->storeId)->find($deviceId);
        if (!$device) {
            return JsonService::fail('设备不存在或不属于当前门店');
        }

        // 验证设备在线
        if ((int)$device->status !== LightDevice::STATUS_ONLINE) {
            return JsonService::fail('设备不在线，无法执行操作');
        }

        // 查找通道
        $channel = LightChannelModel::find($channelId);
        if (!$channel) {
            return JsonService::fail('通道不存在');
        }

        // 验证通道属于该设备
        if ($channel->device_id !== $deviceId) {
            return JsonService::fail('通道不属于该设备');
        }

        // GE IO 通道动作常量
        $chActionOff  = 0;
        $chActionOn   = 1;
        $chActionNoop = 3;

        $targetAction = ($action === 'on') ? $chActionOn : $chActionOff;
        $channelCount = (int)($device->channel_count ?? 8);
        $addr = (int)($device->addr ?? 64);
        $deviceSn = $device->device_sn;

        // 构建 GE IO set 命令：所有通道默认 NOOP，只操作目标通道
        $y = array_fill(0, $channelCount, $chActionNoop);
        $idx = (int)$channel->channel_no - 1;
        if ($idx >= 0 && $idx < $channelCount) {
            $y[$idx] = $targetAction;
        }

        // GE IO JSON 协议格式（纯JSON，不带换行符）
        $setCmd = json_encode([
            'addr' => $addr,
            'cmd'  => 'set',
            'y'    => $y,
        ], JSON_UNESCAPED_UNICODE);

        // 直接发送到设备
        $sent = WebSocketNotification::sendRawToDevice($deviceSn, $setCmd);

        if (!$sent) {
            return JsonService::fail('发送指令失败');
        }

        return JsonService::success('操作成功', [
            'device_id' => $deviceId,
            'channel_no' => $channel->channel_no,
            'action' => $action,
        ]);
    }

    /**
     * 全部通道开关测试
     * POST /storeapi/light.Channel/toggleAll
     */
    public function toggleAll()
    {
        $deviceId = $this->request->post('device_id', '');
        $action = $this->request->post('action', '');

        if (empty($deviceId) || empty($action)) {
            return JsonService::fail('参数不完整：缺少device_id或action');
        }

        if (!in_array($action, ['on', 'off'])) {
            return JsonService::fail('无效的操作类型，请使用on或off');
        }

        // 验证设备属于当前门店
        $device = LightDevice::ofStore($this->storeId)->find($deviceId);
        if (!$device) {
            return JsonService::fail('设备不存在或不属于当前门店');
        }

        // 验证设备在线
        if ((int)$device->status !== LightDevice::STATUS_ONLINE) {
            return JsonService::fail('设备不在线，无法执行操作');
        }

        // GE IO 通道动作常量
        $chActionOff = 0;
        $chActionOn  = 1;

        $targetAction = ($action === 'on') ? $chActionOn : $chActionOff;
        $channelCount = (int)($device->channel_count ?? 8);
        $addr = (int)($device->addr ?? 64);
        $deviceSn = $device->device_sn;

        // 构建 GE IO set 命令：所有通道统一操作
        $y = array_fill(0, $channelCount, $targetAction);

        // GE IO JSON 协议格式（纯JSON，不带换行符）
        $setCmd = json_encode([
            'addr' => $addr,
            'cmd'  => 'set',
            'y'    => $y,
        ], JSON_UNESCAPED_UNICODE);

        // 直接发送到设备
        $sent = WebSocketNotification::sendRawToDevice($deviceSn, $setCmd);

        if (!$sent) {
            return JsonService::fail('发送指令失败');
        }

        return JsonService::success('操作成功', [
            'device_id' => $deviceId,
            'channel_count' => $channelCount,
            'action' => $action,
        ]);
    }
}
