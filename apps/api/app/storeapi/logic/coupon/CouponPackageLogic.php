<?php

declare(strict_types=1);

namespace app\storeapi\logic\coupon;

use app\common\logic\BaseLogic;
use app\common\model\merchant\CouponPackage as CouponPackageModel;
use app\common\gateway\MeituanAdapter;
use app\common\gateway\DouyinAdapter;

class CouponPackageLogic extends BaseLogic
{
    public static function sync(string $storeId, string $platform): array
    {
        $config = CouponPlatformLogic::getAdapterConfig($storeId, $platform);
        if (!$config) {
            return ['success' => false, 'message' => '请先配置' . $platform . '平台API凭证'];
        }

        $adapter = $platform === 'meituan' ? new MeituanAdapter() : new DouyinAdapter();
        $result = $adapter->getPackages($config);

        if (!$result['success']) {
            return $result;
        }

        $packages = $result['data'];
        $newCount = 0;
        $updateCount = 0;

        foreach ($packages as $pkg) {
            $existing = CouponPackageModel::where('store_id', $storeId)
                ->where('platform', $platform)
                ->where('platform_package_id', $pkg['platform_package_id'])
                ->find();

            if ($existing) {
                $existing->name = $pkg['name'];
                $existing->type = $pkg['type'];
                $existing->duration_hours = $pkg['duration_hours'];
                $existing->price = $pkg['price'];
                $existing->original_price = $pkg['original_price'];
                $existing->status = 1;
                $existing->last_synced_at = date('Y-m-d H:i:s');
                $existing->save();
                $updateCount++;
            } else {
                $model = new CouponPackageModel();
                $model->id = 'cpkg_' . bin2hex(random_bytes(6));
                $model->store_id = $storeId;
                $model->platform = $platform;
                $model->platform_package_id = $pkg['platform_package_id'];
                $model->name = $pkg['name'];
                $model->type = $pkg['type'];
                $model->duration_hours = $pkg['duration_hours'];
                $model->price = $pkg['price'];
                $model->original_price = $pkg['original_price'];
                $model->status = 1;
                $model->last_synced_at = date('Y-m-d H:i:s');
                $model->save();
                $newCount++;
            }
        }

        return [
            'success' => true,
            'message' => '同步完成',
            'data' => ['new_count' => $newCount, 'update_count' => $updateCount, 'total' => $newCount + $updateCount],
        ];
    }

    public static function getList(string $storeId, array $params): array
    {
        $platform = $params['platform'] ?? '';
        $page = intval($params['page_no'] ?? 1);
        $pageSize = intval($params['page_size'] ?? 20);

        $query = CouponPackageModel::where('store_id', $storeId);
        if (!empty($platform)) {
            $query->where('platform', $platform);
        }
        $query->where('status', 1);

        $count = $query->count();
        $lists = $query->page($page, $pageSize)->order('updated_at', 'desc')->select()->toArray();

        return ['lists' => $lists, 'count' => $count, 'page_no' => $page, 'page_size' => $pageSize];
    }
}
