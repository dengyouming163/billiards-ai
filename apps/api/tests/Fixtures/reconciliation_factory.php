<?php

declare(strict_types=1);

use think\facade\Db;

function reconciliation_make_shift(
    string $id,
    string $employeeId,
    string $storeId,
    string $status = 'checked_in',
    array $overrides = []
): array {
    $workDate = $status === 'checked_out'
        ? date('Y-m-d', strtotime('-1 day'))
        : date('Y-m-d');
    $checkInTime = $status === 'checked_out'
        ? $workDate . ' 09:00:00'
        : date('Y-m-d H:i:s', strtotime('-1 hour'));

    $row = array_merge([
        'id' => $id,
        'employee_id' => $employeeId,
        'store_id' => $storeId,
        'work_date' => $workDate,
        'type' => 'full',
        'status' => $status,
        'check_in_time' => $checkInTime,
        'check_out_time' => $status === 'checked_out' ? $workDate . ' 18:00:00' : null,
    ], $overrides);

    Db::name('busi_employee_attendance')->insert($row);

    return $row;
}

function reconciliation_make_order(
    string $id,
    string $employeeId,
    string $storeId,
    ?string $endTime,
    array $overrides = []
): array {
    $row = array_merge([
        'id' => $id,
        'store_id' => $storeId,
        'order_no' => 'T4-' . $id,
        'type' => 'table',
        'status' => 'completed',
        'original_amount' => 0,
        'discount_amount' => 0,
        'final_amount' => 0,
        'balance_paid' => 0,
        'cash_paid' => 0,
        'wechat_paid' => 0,
        'alipay_paid' => 0,
        'card_paid' => 0,
        'points_deduct' => 0,
        'points_gained' => 0,
        'start_time' => null,
        'end_time' => $endTime,
        'operator_id' => $employeeId,
        'table_fee' => 0,
        'product_fee' => 0,
        'assistant_fee' => 0,
    ], $overrides);

    Db::name('busi_order')->insert($row);

    return $row;
}

function reconciliation_make_member(string $id, string $storeId, array $overrides = []): array
{
    $row = array_merge([
        'id' => $id,
        'store_id' => $storeId,
        'level_id' => null,
        'name' => 'Synthetic Member',
        'phone' => '13000000001',
        'gender' => 'unknown',
        'card_number' => 'T4CARD-' . $id,
        'balance' => 0,
        'points' => 0,
        'total_consume' => 0,
        'total_recharge' => 0,
        'status' => 1,
        'remark' => 'synthetic member',
        'deleted_at' => null,
    ], $overrides);

    Db::name('busi_member')->insert($row);

    return $row;
}

function reconciliation_make_recharge(
    string $id,
    string $employeeId,
    string $storeId,
    string $createdAt,
    array $overrides = []
): array {
    $amount = (float)($overrides['amount'] ?? 0);
    $giftAmount = (float)($overrides['gift_amount'] ?? 0);
    $balanceBefore = (float)($overrides['balance_before'] ?? 0);

    $row = array_merge([
        'id' => $id,
        'member_id' => 'member-' . $id,
        'store_id' => $storeId,
        'order_no' => 'T4RE-' . $id,
        'amount' => 0,
        'gift_amount' => 0,
        'payment_method' => 'cash',
        'balance_before' => 0,
        'balance_after' => $balanceBefore + $amount + $giftAmount,
        'points_before' => 0,
        'points_after' => 0,
        'gift_points' => 0,
        'operator_id' => $employeeId,
        'remark' => 'synthetic recharge',
        'created_at' => $createdAt,
        'status' => 1,
    ], $overrides);

    Db::name('busi_member_recharge')->insert($row);

    return $row;
}

function reconciliation_make_order_item(string $id, string $orderId, array $overrides = []): array
{
    $row = array_merge([
        'id' => $id,
        'order_id' => $orderId,
        'item_type' => 'product',
        'item_name' => 'synthetic item',
        'quantity' => 1,
        'unit_price' => 0,
        'total_price' => 0,
        'final_price' => 0,
        'status' => 'completed',
    ], $overrides);

    Db::name('busi_order_item')->insert($row);

    return $row;
}

function reconciliation_make_payment(
    string $id,
    string $orderId,
    ?string $orderItemId = null,
    array $overrides = []
): array {
    $row = array_merge([
        'id' => $id,
        'order_id' => $orderId,
        'payment_method' => 'cash',
        'amount' => 0,
        'status' => 'paid',
        'paid_at' => date('Y-m-d H:i:s'),
        'channel' => 'cash',
        'order_item_id' => $orderItemId,
    ], $overrides);

    Db::name('busi_order_payment')->insert($row);

    return $row;
}
