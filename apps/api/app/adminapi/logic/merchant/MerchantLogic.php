<?php
namespace app\adminapi\logic\merchant;

use app\common\logic\BaseLogic;
use think\facade\Db;

class MerchantLogic extends BaseLogic
{
    /** 商户列表 */
    public static function lists(array $params): array
    {
        $query = Db::name('merchants')->alias('m')
            ->leftJoin('merchant_packages mp', 'm.id = mp.merchant_id AND mp.status = \'active\'')
            ->leftJoin('packages p', 'mp.package_id = p.id')
            ->field('m.*, p.name AS package_name, p.store_limit, p.table_limit');

        if (!empty($params['keyword'])) {
            $kw = $params['keyword'];
            $query->where(function ($q) use ($kw) {
                $q->where('m.name', 'like', "%{$kw}%")
                  ->whereOr('m.contact_phone', 'like', "%{$kw}%");
            });
        }
        if (!empty($params['status'])) {
            $query->where('m.status', $params['status']);
        }

        $count = $query->count();
        $list  = $query->page($params['page_no'] ?? 1, $params['page_size'] ?? 20)
            ->order('m.created_at', 'desc')->select()->toArray();

        foreach ($list as &$row) {
            $row['package_name'] = $row['package_name'] ?? '未绑定';
        }

        return ['count' => $count, 'list' => $list];
    }

    /** 商户详情 */
    public static function detail(string $id): array
    {
        $merchant = Db::name('merchants')->where('id', $id)->find();
        if (!$merchant) throw new \Exception('商户不存在');

        $pkg = Db::name('merchant_packages')->alias('mp')
            ->leftJoin('packages p', 'mp.package_id = p.id')
            ->where('mp.merchant_id', $id)->where('mp.status', 'active')
            ->field('p.*, mp.start_date, mp.end_date')
            ->find();

        $stores = Db::name('busi_store')->where('merchant_id', $id)
            ->field('id, name, code, address, phone, status, created_at')->select()->toArray();

        // 台桌总数（汇总该商户所有门店的台桌）
        $totalTables = Db::name('busi_table')->alias('t')
            ->leftJoin('busi_store s', 't.store_id = s.id')
            ->where('s.merchant_id', $id)->count();

        // 累计收益（汇总该商户所有门店的已支付订单）
        $totalRevenue = Db::name('busi_order')->alias('o')
            ->leftJoin('busi_store s', 'o.store_id = s.id')
            ->where('s.merchant_id', $id)
            ->where('o.status', 'paid')
            ->sum('o.final_amount') ?: 0;

        return [
            'merchant'      => $merchant,
            'package'       => $pkg ?: null,
            'stores'        => $stores,
            'total_tables'  => (int)$totalTables,
            'total_revenue' => (float)$totalRevenue,
            'store_count'   => count($stores),
        ];
    }

    /** 创建商户 */
    public static function create(array $params): array
    {
        $merchantId   = 'm_' . bin2hex(random_bytes(12));
        $storeId      = 'store_' . bin2hex(random_bytes(10));
        $employeeId   = 'emp_' . bin2hex(random_bytes(10));
        $now          = date('Y-m-d H:i:s');
        $phone        = $params['contact_phone'] ?? '';
        $defaultPwd   = password_hash('888888', PASSWORD_DEFAULT);

        // 1. 创建商户
        Db::name('merchants')->insert([
            'id'           => $merchantId,
            'name'         => $params['name'],
            'business_license_no' => $params['business_license_no'] ?? '',
            'legal_person' => $params['legal_person'] ?? '',
            'contact_name' => $params['contact_name'] ?? '',
            'contact_phone'=> $phone,
            'contact_email'=> $params['contact_email'] ?? '',
            'address'      => $params['address'] ?? '',
            'status'       => 'active',
            'store_count'  => 1,
            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        // 2. 绑定套餐
        if (!empty($params['package_id'])) {
            Db::name('merchant_packages')->insert([
                'id'          => 'mp_' . bin2hex(random_bytes(10)),
                'merchant_id' => $merchantId,
                'package_id'  => $params['package_id'],
                'start_date'  => date('Y-m-d'),
                'end_date'    => date('Y-m-d', strtotime('+1 year')),
                'status'      => 'active',
                'created_at'  => $now,
            ]);
        }

        // 3. 创建默认门店
        Db::name('busi_store')->insert([
            'id'          => $storeId,
            'name'        => $params['name'] . '总店',
            'merchant_id' => $merchantId,
            'code'        => $storeId,
            'phone'       => $phone,
            'address'     => $params['address'] ?? '',
            'status'      => 1,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // 4. 创建超级管理员员工（boss）
        Db::name('busi_employee')->insert([
            'id'          => $employeeId,
            'merchant_id' => $merchantId,
            'store_id'    => $storeId,
            'name'        => $params['contact_name'] ?: $params['name'],
            'phone'       => $phone,
            'role'        => 'boss',
            'password'    => $defaultPwd,
            'status'      => 1,
            'created_at'  => $now,
            'updated_at'  => $now,
        ]);

        // 5. 关联员工→门店
        Db::name('busi_employee_store')->insert([
            'id'          => 'es_' . bin2hex(random_bytes(10)),
            'merchant_id' => $merchantId,
            'employee_id' => $employeeId,
            'store_id'    => $storeId,
            'created_at'  => $now,
        ]);

        // 6. 记录账号信息到 merchants 表
        Db::name('merchants')->where('id', $merchantId)->update([
            'admin_account'  => $phone,
            'admin_password' => $defaultPwd,
        ]);

        return [
            'id'       => $merchantId,
            'account'  => $phone,
            'password' => '888888',
        ];
    }

    /** 停用/启用商户 */
    public static function toggleStatus(string $id): string
    {
        $m = Db::name('merchants')->where('id', $id)->find();
        if (!$m) throw new \Exception('商户不存在');
        $newStatus = $m['status'] === 'active' ? 'suspended' : 'active';
        Db::name('merchants')->where('id', $id)->update(['status' => $newStatus, 'updated_at' => date('Y-m-d H:i:s')]);
        return $newStatus;
    }
}
