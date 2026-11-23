<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Table;
use think\facade\Cache;

class ServiceCallController extends BaseTabletController
{
    public array $notNeedLogin = ['getServiceTypes', 'call', 'getCallStatus', 'cancelCall', 'getRecentCalls'];
    
    private $serviceTypes = [
        'refill' => ['name' => '加时续费', 'icon' => 'clock', 'description' => '延长当前桌台使用时间'],
        'checkout' => ['name' => '结账买单', 'icon' => 'payment', 'description' => '结算当前消费账单'],
        'clean' => ['name' => '清理台面', 'icon' => 'clean', 'description' => '清理台球桌面'],
        'complaint' => ['name' => '投诉建议', 'icon' => 'alert', 'description' => '反馈意见或投诉'],
        'help' => ['name' => '呼叫服务员', 'icon' => 'help', 'description' => '需要服务员协助'],
        'maintenance' => ['name' => '设备维修', 'icon' => 'wrench', 'description' => '设备故障需要维修']
    ];
    

    public function getServiceTypes()
    {
        $result = [];
        foreach ($this->serviceTypes as $code => $info) {
            $result[] = [
                'code' => $code,
                'name' => $info['name'],
                'icon' => $info['icon'],
                'description' => $info['description']
            ];
        }
        return $this->success('获取成功', $result);
    }

    public function create()
    {
        $data = $this->request->post();
        
        $tableId = $data['table_id'] ?? '';
        $serviceType = $data['service_type'] ?? '';
        $remark = $data['remark'] ?? '';
        $storeId = $this->getStoreId();
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        if (!isset($this->serviceTypes[$serviceType])) {
            return $this->fail('无效的服务类型');
        }
        
        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return $this->fail('桌台不存在');
        }
        
        $callRecord = [
            'id' => $this->uuid(),
            'table_id' => $tableId,
            'table_number' => $table->number,
            'service_type' => $serviceType,
            'service_name' => $this->serviceTypes[$serviceType]['name'],
            'remark' => $remark,
            'status' => 'pending',
            'created_at' => date('Y-m-d H:i:s'),
            'store_id' => $storeId
        ];
        
        $callList = Cache::get('service_calls_' . $storeId, []);
        $callList[] = $callRecord;
        Cache::set('service_calls_' . $storeId, $callList, 3600);

        // WS 推送服务呼叫给门店
        try {
            \app\common\lib\WebSocketNotification::sendServiceCall(
                $storeId, $tableId,
                $callRecord['service_type'] ?? '',
                $table->number ?? $table->name ?? '',
                $remark
            );
        } catch (\Exception $e) {
            \think\facade\Log::warning('[ServiceCall] WS推送失败: ' . $e->getMessage());
        }

        return $this->success('呼叫成功', [
            'call_id' => $callRecord['id'],
            'service_name' => $callRecord['service_name'],
            'status' => 'pending',
            'created_at' => $callRecord['created_at']
        ]);
    }

    public function getCallStatus()
    {
        $tableId = $this->request->get('table_id');
        $storeId = $this->getStoreId();
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $callList = Cache::get('service_calls_' . $storeId, []);
        
        $recentCall = null;
        foreach (array_reverse($callList) as $call) {
            if ($call['table_id'] == $tableId && $call['status'] == 'pending') {
                $recentCall = $call;
                break;
            }
        }
        
        return $this->success('获取成功', $recentCall);
    }

    public function cancelCall()
    {
        $callId = $this->request->post('call_id');
        $storeId = $this->getStoreId();
        
        if (!$callId) {
            return $this->fail('呼叫ID不能为空');
        }
        
        $callList = Cache::get('service_calls_' . $storeId, []);
        
        foreach ($callList as &$call) {
            if ($call['id'] == $callId && $call['status'] == 'pending') {
                $call['status'] = 'cancelled';
                Cache::set('service_calls_' . $storeId, $callList, 3600);
                return $this->success('取消成功');
            }
        }
        
        return $this->fail('未找到待处理的呼叫');
    }

    public function getRecentCalls()
    {
        $storeId = $this->getStoreId();
        $callList = Cache::get('service_calls_' . $storeId, []);
        $recentCalls = array_slice(array_reverse($callList), 0, 5);
        return $this->success('获取成功', $recentCalls);
    }

    protected function uuid(): string
    {
        return md5(uniqid('sc', true));
    }
}
