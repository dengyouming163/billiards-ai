<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Table;
use app\common\service\JsonService;
use think\Request;

class BaseTabletController
{
    protected $request;
    private $cachedStoreId = null;

    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    protected function success(string $msg = 'success', array $data = [], int $code = 1, int $show = 0)
    {
        return JsonService::success($msg, $data, $code, $show);
    }

    protected function fail(string $msg = 'fail', array $data = [], int $code = 0, int $show = 1)
    {
        return JsonService::fail($msg, $data, $code, $show);
    }

    /**
     * 从 table_id 查出所属门店 store_id
     * 优先级: busi_table.store_id > 请求参数 store_id
     */
    protected function getStoreId(): string
    {
        if ($this->cachedStoreId !== null) {
            return $this->cachedStoreId;
        }

        $tableId = $this->request->param('table_id', '');
        if (!empty($tableId)) {
            $table = Table::where('id', $tableId)->find();
            if ($table && !empty($table->store_id)) {
                $this->cachedStoreId = $table->store_id;
                return $this->cachedStoreId;
            }
        }

        $storeId = $this->request->param('store_id', '');
        $this->cachedStoreId = (is_string($storeId) && $storeId !== '') ? $storeId : '';
        return $this->cachedStoreId;
    }

    protected function uuid(): string
    {
        return md5(uniqid((string)mt_rand(), true));
    }
}