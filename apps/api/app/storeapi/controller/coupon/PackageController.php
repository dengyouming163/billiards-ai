<?php

declare(strict_types=1);

namespace app\storeapi\controller\coupon;

use app\common\controller\BaseLikeAdminController;
use app\common\service\JsonService;
use app\storeapi\logic\coupon\CouponPackageLogic;

class PackageController extends BaseLikeAdminController
{
    public function sync()
    {
        $storeId = $this->request->post('store_id', '');
        $platform = $this->request->post('platform', '');
        $result = CouponPackageLogic::sync($storeId, $platform);
        if (!$result['success']) {
            return $this->fail($result['message']);
        }
        return $this->success($result['message'], $result['data']);
    }

    public function list()
    {
        $storeId = $this->request->get('store_id', '');
        $result = CouponPackageLogic::getList($storeId, $this->request->get());
        return $this->data($result['lists'], [
            'count' => $result['count'],
            'page_no' => $result['page_no'],
            'page_size' => $result['page_size'],
        ]);
    }

    /**
     * 保存内部套餐券
     * POST /coupon.Package/saveInternal
     */
    public function saveInternal()
    {
        $data = $this->request->post();
        $id = $data['id'] ?? '';
        $storeId = $data['store_id'] ?? '';

        if (empty($storeId)) {
            return JsonService::fail('缺少门店ID');
        }

        if ($id) {
            $record = \app\common\model\merchant\CouponPackage::where('id', $id)
                ->where('store_id', $storeId)
                ->find();
            if (!$record) return JsonService::fail('套餐券不存在');
        } else {
            $record = new \app\common\model\merchant\CouponPackage();
            $record->id = 'cp_' . bin2hex(random_bytes(12));
        }

        $record->store_id            = $storeId;
        $record->platform            = 'internal';
        $record->platform_package_id = $record->id;
        $record->name                = $data['name'] ?? '';
        $record->duration_hours      = (int)($data['duration_hours'] ?? 1);
        $record->price               = (float)($data['price'] ?? 0);
        $record->original_price      = (float)($data['original_price'] ?? 0);
        $record->status              = isset($data['status']) ? (int)$data['status'] : 1;
        $record->save();

        return JsonService::success('保存成功', $record->toArray());
    }

    /**
     * 删除内部套餐券
     * POST /coupon.Package/deleteInternal
     */
    public function deleteInternal()
    {
        $data = $this->request->post();
        $id = $data['id'] ?? '';
        $storeId = $data['store_id'] ?? '';

        if (empty($id)) return JsonService::fail('缺少ID');
        if (empty($storeId)) return JsonService::fail('缺少门店ID');

        $record = \app\common\model\merchant\CouponPackage::where('id', $id)
            ->where('store_id', $storeId)
            ->find();
        if (!$record) return JsonService::fail('套餐券不存在');
        $record->delete();
        return JsonService::success('删除成功');
    }
}
