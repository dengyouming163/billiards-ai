<?php
declare(strict_types=1);
namespace app\storeapi\controller\tablet;
use app\common\model\merchant\ChargingConfig;
use app\storeapi\logic\order\ChargingLogic;

class ChargingController extends BaseTabletController
{
    public array $notNeedLogin = [];

    public function config() {
        $storeId = $this->getStoreId();
        $config = ChargingConfig::getByStore($storeId);
        if (!$config) return $this->success('获取成功', ['enabled' => false]);
        return $this->success('获取成功', [
            'enabled' => true, 'rate_per_hour' => round((float)$config->rate_per_hour / 2, 2),
            'rate_per_minute' => (float)$config->rate_per_minute, 'billing_unit' => 'half_hour',
            'free_minutes' => (int)$config->free_minutes, 'auto_start' => (bool)$config->auto_start,
        ]);
    }

    public function start() {
        $orderId = $this->request->post('order_id', ''); $tableId = $this->request->post('table_id', '');
        $port = $this->request->post('port', 'left');
        if (!$orderId) return $this->fail('参数错误');
        $result = ChargingLogic::startSession($orderId, $tableId, $this->getStoreId(), $port);
        if (isset($result['error'])) return $this->fail($result['error']);
        return $this->success('充电已启动', $result);
    }

    public function stop() {
        $orderId = $this->request->post('order_id', ''); $port = $this->request->post('port', 'left');
        if (!$orderId) return $this->fail('参数错误');
        $result = ChargingLogic::stopSession($orderId, $port);
        if (isset($result['error'])) return $this->fail($result['error']);
        return $this->success('充电已停止', $result);
    }

    public function status() {
        $orderId = $this->request->get('order_id', '');
        if (!$orderId) return $this->fail('参数错误');
        return $this->success('获取成功', ChargingLogic::getActiveSessions($orderId));
    }
}
