<?php

declare (strict_types=1);

namespace app\storeapi\logic\store;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Store;
use think\facade\Db;

use app\common\model\merchant\EmployeeStore;

class StoreLogic extends BaseLogic
{
    public static function getList(array $params, string $employeeId = '')
    {
        $status = $params['status'] ?? '';

        $query = Store::where('deleted_at', null);

        // 按员工分配的门店过滤：查询 busi_employee_store 获取该员工可管理的门店
        if (!empty($employeeId)) {
            $assignedStoreIds = EmployeeStore::where('employee_id', $employeeId)
                ->column('store_id');
            if (!empty($assignedStoreIds)) {
                $query->whereIn('id', $assignedStoreIds);
            }
            // 如果员工没有分配记录（admin），则不做过滤，返回所有门店
        }
        
        if ($status !== '') {
            $query->where('status', $status);
        }
        
        $data = $query->select()->toArray();
        
        return [
            'data' => $data,
            'pagination' => [
                'page' => 1,
                'page_size' => count($data),
                'total' => count($data),
                'total_pages' => 1,
            ],
        ];
    }

    public static function getDetail(string $id)
    {
        $store = Store::find($id);
        if (!$store) {
            return self::setError('门店不存在');
        }
        return $store->toArray();
    }

    public static function create(array $params)
    {
        if (empty($params['name'])) {
            return self::setError('门店名称不能为空');
        }

        $merchantId = $params['merchant_id'] ?? '';
        // 如果前端未传 merchant_id，从当前员工的 store_id 自动推导
        if (empty($merchantId)) {
            $employeeStoreId = $params['store_id'] ?? '';
            if ($employeeStoreId) {
                $currentStore = Store::where('id', $employeeStoreId)->field('merchant_id')->find();
                $merchantId = $currentStore['merchant_id'] ?? '';
            }
        }
        $store = new Store();
        $store->id = 'store_' . uniqid();
        $store->name = $params['name'];
        $store->code = $params['code'] ?? '';
        $store->address = $params['address'] ?? '';
        $store->phone = $params['phone'] ?? '';
        $store->business_hours_start = $params['business_hours_start'] ?? '09:00:00';
        $store->business_hours_end = $params['business_hours_end'] ?? '23:00:00';
        $store->description = $params['description'] ?? '';
        $store->status = 1;

        // 套餐限制校验
        if (!empty($merchantId)) {
            $store->merchant_id = $merchantId;
            $pkg = Db::name('merchant_packages')->alias('mp')
                ->leftJoin('packages p', 'mp.package_id = p.id')
                ->where('mp.merchant_id', $merchantId)->where('mp.status', 'active')
                ->field('p.store_limit')->find();

            if ($pkg) {
                $currentCount = Store::where('merchant_id', $merchantId)->count();
                if ($currentCount >= (int)$pkg['store_limit']) {
                    return self::setError("门店数已达套餐上限({$pkg['store_limit']})，请联系平台升级套餐");
                }
            }
            // 更新商户门店计数
            Db::name('merchants')->where('id', $merchantId)->inc('store_count')->update();
        }

        $store->save();
        return $store->toArray();
    }

    public static function update(string $id, array $params)
    {
        $store = Store::find($id);
        if (!$store) {
            return self::setError('门店不存在');
        }
        
        // 验证门店属于当前商户
        $employeeStoreId = $params['store_id'] ?? '';
        if ($employeeStoreId && !empty($store['merchant_id'])) {
            $currentStore = Store::where('id', $employeeStoreId)->field('merchant_id')->find();
            $currentMerchantId = $currentStore['merchant_id'] ?? '';
            if ($currentMerchantId && $store['merchant_id'] !== $currentMerchantId) {
                return self::setError('无权操作该门店');
            }
        }

        $updatable = ['name', 'code', 'address', 'phone', 'business_hours_start', 'business_hours_end', 'description', 'status', 'open_table_confirm', 'open_table_confirm_timeout', 'product_order_timeout', 'assistant_booking_timeout', 'charging_rate'];
        foreach ($updatable as $field) {
            if (isset($params[$field])) {
                $store->$field = $params[$field];
            }
        }

        $store->save();

        // 同步充电费率到 charging_config 表
        if (isset($params['charging_rate'])) {
            $rate = (float)$params['charging_rate'];
            $exists = \think\facade\Db::name('charging_config')->where('store_id', $store->id)->find();
            if ($exists) {
                \think\facade\Db::name('charging_config')->where('store_id', $store->id)->update([
                    'rate_per_hour' => round($rate * 2, 2),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            } else {
                \think\facade\Db::name('charging_config')->insert([
                    'id' => 'cfg_' . $store->id,
                    'store_id' => $store->id,
                    'rate_per_hour' => round($rate * 2, 2),
                    'billing_unit' => 'hour',
                    'status' => 1,
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);
            }
        }

        return $store->toArray();
    }

    public static function delete(string $id)
    {
        $store = Store::find($id);
        if (!$store) {
            return self::setError('门店不存在');
        }

        $store->deleted_at = date('Y-m-d H:i:s');
        $store->save();
        return true;
    }

    public static function switchStore(array $params, array $employeeInfo)
    {
        $storeId = $params['store_id'] ?? '';
        
        if (empty($storeId)) {
            return self::setError('门店ID不能为空');
        }

        $store = Store::find($storeId);
        if (!$store) {
            return self::setError('门店不存在');
        }

        $employeeInfo['store_id'] = $storeId;
        $employeeInfo['store_name'] = $store['name'];
        
        $tokenInfo = \app\storeapi\service\EmployeeTokenService::setToken($employeeInfo['id'], $storeId);

        return [
            'token' => $tokenInfo['token'],
            'store' => [
                'id' => $store['id'],
                'name' => $store['name'],
            ],
            'user' => $employeeInfo,
        ];
    }
}