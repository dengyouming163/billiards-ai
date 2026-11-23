<?php
namespace app\adminapi\logic\package;

use app\adminapi\lists\package\BillLists;
use app\common\logic\BaseLogic;
use app\common\model\package\Bill;
use app\common\service\JsonService;

class BillLogic extends BaseLogic
{
    public static function lists(array $params)
    {
        $lists = new BillLists($params);
        return JsonService::dataLists($lists);
    }

    public static function detail(string $id)
    {
        $bill = Bill::find($id);
        if (empty($bill)) {
            self::setError('账单不存在');
            return false;
        }
        return $bill->toArray();
    }

    public static function add(array $params)
    {
        $bill = new Bill();
        $bill->id = self::uuid();
        $bill->merchant_id = $params['merchant_id'] ?? '';
        $bill->bill_no = self::generateBillNo();
        $bill->amount = $params['amount'] ?? 0;
        $bill->base_fee = $params['base_fee'] ?? 0;
        $bill->overage_fee = $params['overage_fee'] ?? 0;
        $bill->extra_fee = $params['extra_fee'] ?? 0;
        $bill->status = Bill::STATUS_PENDING;
        $bill->due_date = $params['due_date'] ?? date('Y-m-d');
        $bill->created_at = date('Y-m-d H:i:s');

        if (!$bill->save()) {
            self::setError('添加失败');
            return false;
        }

        return $bill->toArray();
    }

    public static function statistics()
    {
        $total = Bill::sum('amount') ?? 0;
        $paid = Bill::where('status', Bill::STATUS_PAID)->sum('amount') ?? 0;
        $unpaid = Bill::where('status', Bill::STATUS_PENDING)->sum('amount') ?? 0;
        $overdue = Bill::where('status', Bill::STATUS_OVERDUE)->sum('amount') ?? 0;

        return [
            'receivable_total' => $total,
            'paid_amount' => $paid,
            'unpaid_amount' => $unpaid,
            'overdue_amount' => $overdue,
        ];
    }

    private static function uuid()
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

    private static function generateBillNo()
    {
        return 'BILL' . date('Ymd') . str_pad((string)mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
    }
}