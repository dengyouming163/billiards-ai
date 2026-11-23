<?php

namespace app\storeapi\controller\activity;

use app\storeapi\controller\BaseStoreController;
use app\common\annotation\Permission;
use app\common\service\JsonService;
use think\facade\Db;

/**
 * 营销活动管理 API
 * wwwstore 管理后台使用
 */
class ActivityController extends BaseStoreController
{
    /** GET /activity.Activity/lists */
    #[Permission('activity:manage', '活动管理', 'store', '营销', ['boss', 'manager'])]
    public function lists()
    {
        $page = (int)$this->request->get('page', 1);
        $pageSize = (int)$this->request->get('page_size', 20);
        $status = $this->request->get('status', '');

        $query = Db::name('activity')->where('store_id', $this->storeId);
        if ($status !== '') $query->where('status', (int)$status);

        $total = $query->count();
        $list = $query->order('sort', 'asc')->order('created_at', 'desc')
            ->page($page, $pageSize)->select()->toArray();

        return JsonService::data(['list' => $list, 'total' => $total]);
    }

    /** GET /activity.Activity/detail */
    public function detail()
    {
        $id = $this->request->get('id', '');
        $item = Db::name('activity')->where('id', $id)->where('store_id', $this->storeId)->find();
        return JsonService::data($item ?: []);
    }

    /** POST /activity.Activity/create */
    #[Permission('activity:manage', '活动管理', 'store', '营销', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        if (empty($params['title'])) return JsonService::fail('活动标题不能为空');

        $id = 'act_' . bin2hex(random_bytes(12));
        Db::name('activity')->insert([
            'id' => $id, 'store_id' => $this->storeId,
            'title' => $params['title'], 'description' => $params['description'] ?? '',
            'detail' => $params['detail'] ?? '', 'image' => $params['image'] ?? '',
            'icon' => $params['icon'] ?? '🎁', 'tag' => $params['tag'] ?? '',
            'discount' => $params['discount'] ?? '',
            'start_time' => $params['start_time'] ?? null,
            'end_time' => $params['end_time'] ?? null,
            'status' => (int)($params['status'] ?? 1),
            'sort' => (int)($params['sort'] ?? 0),
        ]);
        return JsonService::success('创建成功', ['id' => $id]);
    }

    /** PUT /activity.Activity/update */
    #[Permission('activity:manage', '活动管理', 'store', '营销', ['boss', 'manager'])]
    public function update()
    {
        $params = $this->request->put();
        $id = $params['id'] ?? $this->request->param('id', '');
        if (empty($id)) return JsonService::fail('缺少活动ID');

        $exists = Db::name('activity')->where('id', $id)->where('store_id', $this->storeId)->find();
        if (!$exists) return JsonService::fail('活动不存在');

        $data = [];
        foreach (['title','description','detail','image','icon','tag','discount','start_time','end_time','status','sort'] as $f) {
            if (isset($params[$f])) $data[$f] = $params[$f];
        }
        Db::name('activity')->where('id', $id)->update($data);
        return JsonService::success('更新成功');
    }

    /** DELETE /activity.Activity/delete */
    #[Permission('activity:manage', '活动管理', 'store', '营销', ['boss', 'manager'])]
    public function delete()
    {
        $id = $this->request->param('id', '');
        Db::name('activity')->where('id', $id)->where('store_id', $this->storeId)->delete();
        return JsonService::success('删除成功');
    }
}
