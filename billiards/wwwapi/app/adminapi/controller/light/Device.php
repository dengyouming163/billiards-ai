<?php
declare(strict_types=1);

namespace app\adminapi\controller\light;

use app\adminapi\controller\BaseAdminController;
use app\common\model\merchant\LightDevice as LightDeviceModel;
use app\common\model\merchant\LightChannel;
use app\common\service\JsonService;

class DeviceController extends BaseAdminController
{
    public function unboundList()
    {
        $keyword = $this->request->get('keyword', '');
        $query = LightDeviceModel::unbound();
        if ($keyword) {
            $query->where('device_sn|device_name', 'like', "%{$keyword}%");
        }
        $list = $query->order('last_heartbeat', 'desc')->select();
        return JsonService::data($list->toArray());
    }

    public function boundList()
    {
        $storeId = $this->request->get('store_id', '');
        $query = LightDeviceModel::bound();
        if ($storeId) {
            $storeIds = array_filter(array_map('trim', explode(',', $storeId)));
            if (!empty($storeIds)) {
                $query->whereIn('store_id', $storeIds);
            }
        }
        $list = $query->order('bound_at', 'desc')->select();
        return JsonService::data($list->toArray());
    }

    public function bind()
    {
        $deviceId = $this->request->post('device_id', '');
        $storeId  = $this->request->post('store_id', '');
        if (!$deviceId || !$storeId) return JsonService::fail('参数不完整');

        $device = LightDeviceModel::find($deviceId);
        if (!$device) return JsonService::fail('设备不存在');
        if ($device->bind_status == LightDeviceModel::BIND_BOUND) return JsonService::fail('设备已绑定');

        $device->save([
            'store_id'    => $storeId,
            'bind_status' => LightDeviceModel::BIND_BOUND,
            'bound_at'    => date('Y-m-d H:i:s'),
        ]);
        return JsonService::success('绑定成功');
    }

    public function unbind()
    {
        $deviceId = $this->request->post('device_id', '');
        if (!$deviceId) return JsonService::fail('参数不完整');

        $device = LightDeviceModel::find($deviceId);
        if (!$device) return JsonService::fail('设备不存在');

        $device->save([
            'store_id'    => '',
            'bind_status' => LightDeviceModel::BIND_UNBOUND,
            'bound_at'    => null,
        ]);
        LightChannel::where('device_id', $deviceId)->update(['table_id' => '']);
        return JsonService::success('解绑成功');
    }

    public function deviceInfo()
    {
        $deviceId = $this->request->get('device_id', '');
        $device = LightDeviceModel::with('channels')->find($deviceId);
        if (!$device) return JsonService::fail('设备不存在');
        return JsonService::data($device->toArray());
    }
}
