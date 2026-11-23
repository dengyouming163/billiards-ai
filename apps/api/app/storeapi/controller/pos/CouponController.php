<?php

declare(strict_types=1);

namespace app\storeapi\controller\pos;

use app\common\service\JsonService;
use app\storeapi\logic\coupon\CouponVerifyLogic;

class CouponController extends BasePosController
{
    public function prepare()
    {
        $platform = $this->request->post('platform', '');
        $couponCode = $this->request->post('coupon_code', '');

        if (empty($couponCode)) {
            return $this->fail('券码不能为空');
        }

        $result = CouponVerifyLogic::prepare($this->storeId, $platform, $couponCode);
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success('ok', $result['data']);
    }

    public function confirm()
    {
        $params = $this->request->post();
        $params['store_id'] = $this->storeId;
        $params['employee_id'] = $this->employeeId;

        $result = CouponVerifyLogic::confirm($this->storeId, $params);
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success($result['message'], $result['data']);
    }

    public function revoke()
    {
        $verifyId = $this->request->post('verify_id', '');

        $result = CouponVerifyLogic::revoke($verifyId, $this->storeId, $this->employeeId);
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success($result['message']);
    }

    public function records()
    {
        $result = CouponVerifyLogic::getRecords($this->storeId, $this->request->get());
        return $this->data($result['lists'], [
            'count' => $result['count'],
            'page_no' => $result['page_no'],
            'page_size' => $result['page_size'],
        ]);
    }

    /**
     * 内部套餐券 — 支付并开台（先付费后消费）
     * POST /pos.Coupon/payAndOpen
     * { package_id, table_id, player_count, payment_method: cash|wechat|meituan|douyin, verify_code?, cash_amount? }
     */
    public function payAndOpen()
    {
        $packageId   = $this->request->post('package_id', '');
        $tableId     = $this->request->post('table_id', '');
        $playerCount = $this->request->post('player_count', 2);
        $paymentMethod = $this->request->post('payment_method', 'cash');
        $verifyCode   = $this->request->post('verify_code', '');
        $cashAmount   = floatval($this->request->post('cash_amount', 0));

        if (empty($packageId) || empty($tableId)) {
            return JsonService::fail('缺少参数');
        }

        $storeId = $this->storeId;

        // 1. 验证套餐券
        $pkg = \app\common\model\merchant\CouponPackage::where('id', $packageId)
            ->whereIn('platform', ['internal', 'meituan', 'douyin'])
            ->where('status', 1)
            ->find();
        if (!$pkg) return JsonService::fail('套餐券不存在或已下架');

        $couponPrice = floatval($pkg->price);

        // 2. 处理支付
        $paymentOk = false;
        $verifyChannel = 'internal';

        if ($paymentMethod === 'cash') {
            // 现金支付 — 收银员确认收款
            if ($cashAmount < $couponPrice) {
                return JsonService::fail("现金不足，需支付 ¥{$couponPrice}");
            }
            $paymentOk = true;

        } elseif ($paymentMethod === 'wechat') {
            // 微信支付 — 由POS端调支付接口完成，这里仅作标记
            $paymentOk = true;

        } elseif (in_array($paymentMethod, ['meituan', 'douyin'])) {
            // 美团/抖音验券
            if (empty($verifyCode)) return JsonService::fail('请输入券码');
            $channelService = new \app\common\service\MockChannelService();
            $verifyResult = $channelService->verify($verifyCode, $couponPrice);
            if (!$verifyResult['valid']) return JsonService::fail($verifyResult['message']);
            $verifyChannel = $paymentMethod;
            $paymentOk = true;
        } else {
            return JsonService::fail('不支持的支付方式');
        }

        if (!$paymentOk) return JsonService::fail('支付未完成');

        // 3. 开台（传递来源渠道用于统计）
        $orderSource = 'coupon_' . $verifyChannel; // coupon_internal / coupon_meituan / coupon_douyin
        $result = \app\storeapi\logic\order\TableOpenLogic::prepaidOpen([
            'table_id'        => $tableId,
            'prepaid_hours'   => (int)$pkg->duration_hours,
            'player_count'    => $playerCount,
            'skip_discount'   => true,
            'coupon_price'    => $couponPrice,
            'source'          => $orderSource,
        ], $storeId, true);

        if (!$result['success']) return JsonService::fail($result['message']);

        $orderId = $result['data']['order_id'] ?? '';

        // 4. 记录验券
        \think\facade\Db::name('busi_coupon_verify')->insert([
            'id'              => 'cv_' . bin2hex(random_bytes(12)),
            'store_id'        => $storeId,
            'platform'        => $verifyChannel,
            'package_id'      => $pkg->id,
            'package_name'    => $pkg->name,
            'verify_price'    => $couponPrice,
            'duration_minutes'=> $pkg->duration_hours * 60,
            'order_id'        => $orderId,
            'table_id'        => $tableId,
            'status'          => 'verified',
            'verified_at'     => date('Y-m-d H:i:s'),
            'verified_by'     => $this->employeeId ?: '',
        ]);

        // 5. 写入支付记录（渠道报表统一数据源）
        $op = new \app\common\model\merchant\OrderPayment();
        $op->id = 'pay_' . date('YmdHis') . '_' . mt_rand(1000, 9999);
        $op->order_id = $orderId;
        $op->store_id = $storeId;
        $op->order_no = $result['data']['order_no'] ?? '';
        $op->payment_method = in_array($verifyChannel, ['meituan', 'douyin']) ? 'coupon' : $paymentMethod;
        $op->channel = 'coupon_' . $verifyChannel;
        $op->amount = $couponPrice;
        $op->status = 'paid';
        $op->paid_at = date('Y-m-d H:i:s');
        $op->operator_id = $this->employeeId ?: '';
        $op->description = $pkg->name;
        $op->save();

        // 6. 渠道核销记录（美团/抖音）
        if (in_array($paymentMethod, ['meituan', 'douyin']) && !empty($verifyCode)) {
            $channelService = new \app\common\service\MockChannelService();
            $channelService->recordVerify($orderId, $verifyCode, $paymentMethod, $couponPrice);
        }

        return JsonService::success('开台成功', $result['data'] ?? []);
    }

    /**
     * 内部套餐券开台（跳过验码步骤）
     * POST /pos.Coupon/confirmInternal
     */
    public function confirmInternal()
    {
        $packageId   = $this->request->post('package_id', '');
        $tableId     = $this->request->post('table_id', '');
        $playerCount = $this->request->post('player_count', 2);

        if (empty($packageId) || empty($tableId)) {
            return JsonService::fail('缺少参数');
        }

        $pkg = \app\common\model\merchant\CouponPackage::where('id', $packageId)
            ->where('platform', 'internal')
            ->where('status', 1)
            ->find();
        if (!$pkg) return JsonService::fail('套餐券不存在或已下架');

        // 保留旧逻辑兼容
        $result = \app\storeapi\logic\order\TableOpenLogic::prepaidOpen([
            'table_id'        => $tableId,
            'prepaid_hours'   => (int)$pkg->duration_hours,
            'player_count'    => $playerCount,
            'skip_discount'   => true,
            'coupon_price'    => (float)$pkg->price,
        ], $this->storeId, true);

        if (!$result['success']) return JsonService::fail($result['message']);

        \think\facade\Db::name('busi_coupon_verify')->insert([
            'id'              => 'cv_' . bin2hex(random_bytes(12)),
            'store_id'        => $this->storeId,
            'platform'        => 'internal',
            'package_id'      => $pkg->id,
            'package_name'    => $pkg->name,
            'verify_price'    => $pkg->price,
            'duration_minutes'=> $pkg->duration_hours * 60,
            'order_id'        => $result['data']['order_id'] ?? '',
            'table_id'        => $tableId,
            'status'          => 'verified',
            'verified_at'     => date('Y-m-d H:i:s'),
            'verified_by'     => $this->employeeId ?: '',
        ]);

        return JsonService::success('开台成功', $result['data'] ?? []);
    }
}
