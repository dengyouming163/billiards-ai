<?php
namespace app\adminapi\lists\package;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\package\Package;

class PackageLists extends BaseAdminDataLists implements ListsSearchInterface
{
    protected $alias = 'p';

    public function setSearch(): array
    {
        return [
            '%like%' => ['name'],
            '=' => ['status'],
        ];
    }

    public function lists(): array
    {
        $list = Package::alias($this->alias)
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
        return Package::alias($this->alias)
            ->where($this->searchWhere)
            ->count();
    }
}