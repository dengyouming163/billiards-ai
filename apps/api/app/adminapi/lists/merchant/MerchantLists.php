<?php
namespace app\adminapi\lists\merchant;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\merchant\Merchant;

class MerchantLists extends BaseAdminDataLists implements ListsSearchInterface
{
    /**
     * @notes 商户搜索条件
     * @return array
     * @author admin
     * @date 2026/05/04
     */
    public function setSearch(): array
    {
        return [
            '=' => ['status'],
            '%like%' => ['name', 'business_license_no', 'contact_name']
        ];
    }

    /**
     * @notes 获取商户列表
     * @return array
     * @throws \think\db\exception\DataNotFoundException
     * @throws \think\db\exception\DbException
     * @throws \think\db\exception\ModelNotFoundException
     * @author admin
     * @date 2026/05/04
     */
    public function lists(): array
    {
        $lists = (new Merchant())->field('*')
            ->where($this->searchWhere)
            ->order('id', 'desc')
            ->limit($this->limitOffset, $this->limitLength)
            ->select()
            ->toArray();

        return $lists;
    }

    /**
     * @notes 获取商户数量
     * @return int
     * @author admin
     * @date 2026/05/04
     */
    public function count(): int
    {
        return (new Merchant())->where($this->searchWhere)->count();
    }
}