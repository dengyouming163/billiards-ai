<?php
namespace app\adminapi\lists\system;

use app\adminapi\lists\BaseAdminDataLists;
use app\common\lists\ListsSearchInterface;
use app\common\model\OperationLog;

class OperationLogLists extends BaseAdminDataLists implements ListsSearchInterface
{
    public function setSearch(): array
    {
        return [
            '%like%' => ['admin_name', 'module', 'action', 'target'],
            '=' => ['status'],
            'between_time' => 'create_time',
        ];
    }

    public function lists(): array
    {
        $list = OperationLog::where($this->searchWhere)
            ->order('create_time', 'desc')
            ->limit($this->limitOffset, $this->limitLength)
            ->select()
            ->toArray();

        foreach ($list as &$item) {
            $item['operator'] = $item['admin_name'] ?? '系统';
            $item['status'] = $item['status'] == 1 ? 'success' : 'failed';
            $item['created_at'] = date('Y-m-d H:i:s', $item['create_time']);
        }

        return $list;
    }

    public function count(): int
    {
        return OperationLog::where($this->searchWhere)->count();
    }
}