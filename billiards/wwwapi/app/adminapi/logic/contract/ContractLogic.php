<?php
namespace app\adminapi\logic\contract;

use app\common\model\contract\Contract;

class ContractLogic
{
    public static function lists($params)
    {
        $pageNo = $params['page_no'] ?? 1;
        $pageSize = $params['page_size'] ?? 10;
        $status = $params['status'] ?? '';
        $merchantId = $params['merchant_id'] ?? '';

        $query = Contract::order('created_at', 'desc');

        if (!empty($status)) {
            $query->where('status', $status);
        }

        if (!empty($merchantId)) {
            $query->where('merchant_id', $merchantId);
        }

        $list = $query->page($pageNo, $pageSize)->select()->toArray();
        $total = $query->count();

        foreach ($list as &$item) {
            $item['status_text'] = Contract::statusOptions()[$item['status']] ?? '';
        }

        return [
            'lists' => $list,
            'total' => $total,
            'page_no' => (int)$pageNo,
            'page_size' => (int)$pageSize,
        ];
    }

    public static function detail($id)
    {
        $contract = Contract::find($id);
        if (empty($contract)) {
            self::setError('合约不存在');
            return false;
        }
        $contract = $contract->toArray();
        $contract['status_text'] = Contract::statusOptions()[$contract['status']] ?? '';
        return $contract;
    }

    public static function add($params)
    {
        $contract = new Contract();
        $contract->id = self::uuid();
        $contract->merchant_id = $params['merchant_id'] ?? '';
        $contract->contract_no = $params['contract_no'] ?? '';
        $contract->sign_date = $params['sign_date'] ?? date('Y-m-d');
        $contract->start_date = $params['start_date'] ?? date('Y-m-d');
        $contract->end_date = $params['end_date'] ?? '';
        $contract->amount = $params['amount'] ?? 0;
        $contract->status = $params['status'] ?? Contract::STATUS_PENDING;
        $contract->remark = $params['remark'] ?? '';
        $contract->created_at = date('Y-m-d H:i:s');
        
        if (!$contract->save()) {
            self::setError('添加失败');
            return false;
        }
        return $contract->toArray();
    }

    public static function edit($id, $params)
    {
        $contract = Contract::find($id);
        if (empty($contract)) {
            self::setError('合约不存在');
            return false;
        }
        
        if (isset($params['contract_no'])) {
            $contract->contract_no = $params['contract_no'];
        }
        if (isset($params['sign_date'])) {
            $contract->sign_date = $params['sign_date'];
        }
        if (isset($params['start_date'])) {
            $contract->start_date = $params['start_date'];
        }
        if (isset($params['end_date'])) {
            $contract->end_date = $params['end_date'];
        }
        if (isset($params['amount'])) {
            $contract->amount = $params['amount'];
        }
        if (isset($params['status'])) {
            $contract->status = $params['status'];
        }
        if (isset($params['remark'])) {
            $contract->remark = $params['remark'];
        }
        $contract->updated_at = date('Y-m-d H:i:s');
        
        if (!$contract->save()) {
            self::setError('修改失败');
            return false;
        }
        return $contract->toArray();
    }

    public static function delete($id)
    {
        $contract = Contract::find($id);
        if (empty($contract)) {
            self::setError('合约不存在');
            return false;
        }
        if (!$contract->delete()) {
            self::setError('删除失败');
            return false;
        }
        return true;
    }

    protected static function uuid(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    protected static function setError($message)
    {
        static $error = '';
        if ($message) {
            $error = $message;
        }
        return $error;
    }

    public static function getError()
    {
        return self::setError('');
    }
}