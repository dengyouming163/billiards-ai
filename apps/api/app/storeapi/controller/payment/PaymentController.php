<?php
namespace app\storeapi\controller\payment;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\payment\PaymentLogic;
use app\common\service\JsonService;

class PaymentController extends BaseStoreController
{
    /** POST 准备结算 — 获取锁价 token */
    public function prepare()
    {
        try {
            $orderId = $this->request->post('order_id', '');
            if (empty($orderId)) return JsonService::fail('缺少订单ID');
            $result = PaymentLogic::prepare($orderId, $this->storeId);
            if ($result === false) return JsonService::fail(PaymentLogic::getError());
            return JsonService::success('success', $result);
        } catch (\Exception $e) {
            \think\facade\Log::error('[Payment] prepare异常: ' . $e->getMessage());
            return JsonService::fail('结算异常');
        }
    }

    /** POST 创建支付 — NATIVE / JSAPI */
    public function create()
    {
        try {
            $params = $this->request->post();
            $result = PaymentLogic::create($params, $this->storeId);
            if ($result === false) return JsonService::fail(PaymentLogic::getError());
            return JsonService::success('success', $result);
        } catch (\Exception $e) {
            \think\facade\Log::error('[Payment] create异常: ' . $e->getMessage());
            return JsonService::fail('创建支付失败');
        }
    }

    /** POST 扫码枪付款 — MICROPAY */
    public function micropay()
    {
        try {
            $params = $this->request->post();
            $result = PaymentLogic::micropay($params, $this->storeId);
            if ($result === false) return JsonService::fail(PaymentLogic::getError());
            return JsonService::success('支付成功', $result);
        } catch (\Exception $e) {
            \think\facade\Log::error('[Payment] micropay异常: ' . $e->getMessage());
            return JsonService::fail('支付异常');
        }
    }

    /** GET 查询支付状态 */
    public function query()
    {
        try {
            $orderId = $this->request->get('order_id', '');
            if (empty($orderId)) return JsonService::fail('缺少订单ID');
            $result = PaymentLogic::query($orderId, $this->storeId);
            if ($result === false) return JsonService::fail(PaymentLogic::getError());
            return JsonService::data($result);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败');
        }
    }
}
