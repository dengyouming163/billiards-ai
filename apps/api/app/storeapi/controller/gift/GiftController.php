<?php

namespace app\storeapi\controller\gift;

use app\storeapi\controller\BaseStoreController;
use app\common\annotation\Permission;
use app\common\service\JsonService;
use think\facade\Db;

/**
 * 助教礼物管理 + 送礼记录
 */
class GiftController extends BaseStoreController
{
    /** 礼物类型列表（管理后台） */
    #[Permission('gift:manage', '礼物管理', 'store', '营销', ['boss', 'manager'])]
    public function types()
    {
        $list = Db::name('gift_type')->where('store_id', $this->storeId)
            ->where('status', 1)->order('sort', 'asc')->select()->toArray();
        return JsonService::data($list);
    }

    /** 创建礼物类型 */
    #[Permission('gift:manage', '礼物管理', 'store', '营销', ['boss', 'manager'])]
    public function createType()
    {
        $params = $this->request->post();
        if (empty($params['name'])) return JsonService::fail('礼物名称不能为空');
        $id = 'gft_' . bin2hex(random_bytes(10));
        Db::name('gift_type')->insert([
            'id' => $id, 'store_id' => $this->storeId,
            'name' => $params['name'], 'icon' => $params['icon'] ?? '🎁',
            'price' => (float)($params['price'] ?? 0), 'sort' => (int)($params['sort'] ?? 0),
        ]);
        return JsonService::success('创建成功', ['id' => $id]);
    }

    /** 更新礼物类型 */
    #[Permission('gift:manage', '礼物管理', 'store', '营销', ['boss', 'manager'])]
    public function updateType()
    {
        $params = $this->request->put();
        $id = $params['id'] ?? '';
        if (empty($id)) return JsonService::fail('缺少礼物ID');
        $data = [];
        foreach (['name','icon','price','sort','status'] as $f) {
            if (isset($params[$f])) $data[$f] = $params[$f];
        }
        Db::name('gift_type')->where('id', $id)->where('store_id', $this->storeId)->update($data);
        return JsonService::success('更新成功');
    }

    /** 删除礼物类型 */
    #[Permission('gift:manage', '礼物管理', 'store', '营销', ['boss', 'manager'])]
    public function deleteType()
    {
        $id = $this->request->param('id', '');
        Db::name('gift_type')->where('id', $id)->where('store_id', $this->storeId)->update(['status' => 0]);
        return JsonService::success('已删除');
    }

    /** 助教收礼排行（大屏端） */
    public function giftRanking()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $ranking = Db::name('assistant_gift_record')
            ->field('assistant_id, SUM(amount) as total_amount, COUNT(*) as gift_count')
            ->where('store_id', $storeId)
            ->group('assistant_id')
            ->order('total_amount', 'desc')
            ->limit(10)
            ->select()->toArray();
        return JsonService::data($ranking);
    }
}
