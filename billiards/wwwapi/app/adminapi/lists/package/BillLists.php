<?php
namespace app\adminapi\lists\package;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\model\package\Bill;

class BillLists extends BaseAdminDataLists
{
    protected $alias = 'b';

    public function setSearch()
    {
        $this->search = [
            ['bill_no', 'like'],
            ['merchant_id', '='],
            ['status', '='],
        ];
    }

    public function setSort()
    {
        $this->sort = [
            'id',
            'bill_no',
            'amount',
            'due_date',
            'created_at',
        ];
    }

    protected function getList()
    {
        $model = Bill::alias($this->alias)
            ->field('*');

        $model = $this->setSearchWhere($model);

        $list = $model
            ->order($this->sortField, $this->sortType)
            ->limit($this->offset, $this->limit)
            ->select()
            ->toArray();

        return $list;
    }

    protected function getCount()
    {
        $model = Bill::alias($this->alias);
        $model = $this->setSearchWhere($model);
        return $model->count();
    }
}