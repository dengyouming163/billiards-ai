<?php

declare(strict_types=1);

namespace app\storeapi\controller\coupon;

use app\common\controller\BaseLikeAdminController;
use app\storeapi\logic\coupon\CouponVerifyLogic;

class VerifyController extends BaseLikeAdminController
{
    public function prepare()
    {
        $storeId = $this->request->post('store_id', '');
        $platform = $this->request->post('platform', '');
        $couponCode = $this->request->post('coupon_code', '');

        if (empty($couponCode)) {
            return $this->fail('券码不能为空');
        }

        $result = CouponVerifyLogic::prepare($storeId, $platform, $couponCode);
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success('ok', $result['data']);
    }

    public function confirm()
    {
        $storeId = $this->request->post('store_id', '');
        $result = CouponVerifyLogic::confirm($storeId, $this->request->post());
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success($result['message'], $result['data']);
    }

    public function revoke()
    {
        $verifyId = $this->request->post('verify_id', '');
        $storeId = $this->request->post('store_id', '');
        $employeeId = $this->request->post('employee_id', '');

        $result = CouponVerifyLogic::revoke($verifyId, $storeId, $employeeId);
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success($result['message']);
    }

    public function records()
    {
        $storeId = $this->request->get('store_id', '');
        $result = CouponVerifyLogic::getRecords($storeId, $this->request->get());
        return $this->data($result['lists'], [
            'count' => $result['count'],
            'page_no' => $result['page_no'],
            'page_size' => $result['page_size'],
        ]);
    }
}
