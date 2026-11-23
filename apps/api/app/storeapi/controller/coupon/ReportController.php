<?php

declare(strict_types=1);

namespace app\storeapi\controller\coupon;

use app\common\controller\BaseLikeAdminController;
use app\storeapi\logic\coupon\CouponReportLogic;

class ReportController extends BaseLikeAdminController
{
    public function summary()
    {
        $storeId = $this->request->get('store_id', '');
        $result = CouponReportLogic::summary($storeId, $this->request->get());
        return $this->data($result['data']);
    }

    public function daily()
    {
        $storeId = $this->request->get('store_id', '');
        $result = CouponReportLogic::daily($storeId, $this->request->get());
        return $this->data($result['data']);
    }
}
