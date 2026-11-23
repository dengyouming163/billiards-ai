<?php

namespace app\adminapi\controller\package;

use app\adminapi\controller\BaseAdminController;
use app\common\service\JsonService;
use think\facade\Db;

/**
 * SaaS 套餐管理
 */
class PackageController extends BaseAdminController
{
    /** 套餐列表 */
    public function lists()
    {
        $params = $this->request->get();
        $query = Db::name('packages')->order('sort_order', 'asc');

        if (!empty($params['status'])) $query->where('status', $params['status']);
        if (!empty($params['keyword'])) $query->where('name', 'like', "%{$params['keyword']}%");

        $count = $query->count();
        $list  = $query->page($params['page_no'] ?? 1, $params['page_size'] ?? 20)->select()->toArray();

        foreach ($list as &$row) {
            $row['merchant_count'] = Db::name('merchant_packages')
                ->where('package_id', $row['id'])->where('status', 'active')->count();
        }

        return JsonService::data(['count' => $count, 'list' => $list]);
    }

    /** 套餐详情 */
    public function detail()
    {
        $id = $this->request->param('id');
        $pkg = Db::name('packages')->where('id', $id)->find();
        if (!$pkg) return JsonService::fail('套餐不存在');
        return JsonService::data($pkg);
    }

    /** 创建/更新套餐 */
    public function save()
    {
        $params = $this->request->post();
        if (empty($params['name'])) return JsonService::fail('套餐名称不能为空');

        $data = [
            'name'        => $params['name'],
            'description' => $params['description'] ?? '',
            'base_price'  => $params['base_price'] ?? 0,
            'store_limit' => (int)($params['store_limit'] ?? 3),
            'table_limit' => (int)($params['table_limit'] ?? 50),
            'modules'     => json_encode($params['modules'] ?? []),
            'sort_order'  => (int)($params['sort_order'] ?? 0),
            'status'      => $params['status'] ?? 'active',
        ];

        if (!empty($params['id'])) {
            $data['updated_at'] = date('Y-m-d H:i:s');
            Db::name('packages')->where('id', $params['id'])->update($data);
            return JsonService::success('套餐已更新');
        } else {
            $data['id'] = 'pkg_' . bin2hex(random_bytes(10));
            $data['created_at'] = date('Y-m-d H:i:s');
            Db::name('packages')->insert($data);
            return JsonService::success('套餐已创建', ['id' => $data['id']]);
        }
    }

    /** 删除套餐 */
    public function delete()
    {
        $id = $this->request->param('id');
        $refCount = Db::name('merchant_packages')->where('package_id', $id)->count();
        if ($refCount > 0) return JsonService::fail("该套餐下有 {$refCount} 个商户，无法删除");
        Db::name('packages')->where('id', $id)->delete();
        return JsonService::success('套餐已删除');
    }
}
