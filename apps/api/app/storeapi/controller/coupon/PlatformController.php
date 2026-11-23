<?php

declare(strict_types=1);

namespace app\storeapi\controller\coupon;

use app\common\controller\BaseLikeAdminController;
use app\storeapi\logic\coupon\CouponPlatformLogic;

class PlatformController extends BaseLikeAdminController
{
    public function saveConfig()
    {
        $storeId = $this->request->post('store_id', '');
        $result = CouponPlatformLogic::saveConfig($storeId, $this->request->post());
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success($result['message'], $result['data']);
    }

    public function getConfig()
    {
        $storeId = $this->request->get('store_id', '');
        $platform = $this->request->get('platform', '');
        $result = CouponPlatformLogic::getConfig($storeId, $platform);
        return $this->data($result['data']);
    }

    public function checkStatus()
    {
        $storeId = $this->request->get('store_id', '');
        $platform = $this->request->get('platform', '');
        $result = CouponPlatformLogic::checkStatus($storeId, $platform);
        return $this->data($result['data']);
    }
}
