<?php
namespace app\adminapi\lists\service;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\service\ValueAddedService;

class ServiceLists extends BaseAdminDataLists implements ListsSearchInterface
{
    protected $alias = 's';

    public function setSearch(): array
    {
        return [
            '%like%' => ['name'],
            '=' => ['type', 'status'],
        ];
    }

    public function lists(): array
    {
        $list = ValueAddedService::alias($this->alias)
            ->field('*')
            ->where($this->searchWhere)
            ->order($this->sortOrder)
            ->limit($this->limitOffset, $this->limitLength)
            ->select()
            ->toArray();

        return $list;
    }

    public function count(): int
    {
        return ValueAddedService::alias($this->alias)
            ->where($this->searchWhere)
            ->count();
    }
}