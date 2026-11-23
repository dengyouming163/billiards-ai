<?php
namespace app\adminapi\lists\ticket;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\ticket\Ticket;

class TicketLists extends BaseAdminDataLists implements ListsSearchInterface
{
    protected $alias = 't';

    public function setSearch(): array
    {
        return [
            '%like%' => ['title', 'ticket_no'],
            '=' => ['merchant_id', 'type', 'priority', 'status'],
        ];
    }

    public function lists(): array
    {
        $list = Ticket::alias($this->alias)
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
        return Ticket::alias($this->alias)
            ->where($this->searchWhere)
            ->count();
    }
}