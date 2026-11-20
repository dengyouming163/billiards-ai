<?php

namespace app\storeapi\controller\channel;

use app\storeapi\controller\BaseStoreController;
use app\common\service\MockChannelService;
use app\common\service\JsonService;

class ChannelController extends BaseStoreController
{
    /**
     * Verify a channel coupon code
     * POST /storeapi/channel.Channel/verifyCoupon
     */
    public function verifyCoupon()
    {
        $channel = $this->request->post('channel', '');
        $code = $this->request->post('code', '');
        $amount = $this->request->post('amount', 0);

        if (empty($code)) {
            return JsonService::fail('请输入券码');
        }

        $service = new MockChannelService();
        $result = $service->verify($code, (float)$amount);

        if (!$result['valid']) {
            return JsonService::fail($result['message']);
        }

        return JsonService::success($result['message'], $result);
    }
}
