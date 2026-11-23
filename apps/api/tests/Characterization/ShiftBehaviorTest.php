<?php

declare(strict_types=1);

namespace Tests\Characterization;

require_once dirname(__DIR__) . '/Support/DatabaseTestCase.php';

use app\storeapi\logic\member\MemberLogic;
use app\storeapi\logic\shift\ShiftLogic;
use Tests\Support\DatabaseTestCase;
use think\facade\Db;

final class ShiftBehaviorTest extends DatabaseTestCase
{
    public function testCurrentSummaryIgnoresHistoricalCheckedOutShift(): void
    {
        $this->makeShift('t4-history-shift', 't4-history-emp', 't4-history-store', 'checked_out');
        $result = ShiftLogic::shiftSummary('t4-history-emp', 't4-history-store');
        self::assertFalse($result['isOnShift']);
    }

    public function testCurrentSummaryLoadsTodaysShiftButOmitsIsOnShiftFlag(): void
    {
        $this->makeShift('t4-current-shift', 't4-current-emp', 't4-current-store');

        $result = ShiftLogic::shiftSummary('t4-current-emp', 't4-current-store');

        self::assertArrayNotHasKey('isOnShift', $result);
        self::assertSame('t4-current-emp', $result['employeeId']);
    }

    public function testSummaryScopesCompletedOrdersAndCountsOpenTablesSeparately(): void
    {
        $employeeId = 't4-scope-emp';
        $storeId = 't4-scope-store';
        $checkInTime = date('Y-m-d H:i:s', strtotime('-4 hours'));
        $insideWindow = date('Y-m-d H:i:s', strtotime('-3 hours'));
        $this->makeShift('t4-scope-shift', $employeeId, $storeId, 'checked_in', [
            'check_in_time' => $checkInTime,
        ]);

        $this->makeOrder('t4-scope-in', $employeeId, $storeId, $insideWindow, [
            'final_amount' => 100,
            'table_fee' => 60,
            'product_fee' => 30,
            'assistant_fee' => 10,
            'wechat_paid' => 40,
            'alipay_paid' => 20,
            'cash_paid' => 10,
            'card_paid' => 5,
            'balance_paid' => 25,
        ]);
        $this->makeOrder('t4-scope-open', $employeeId, $storeId, null, [
            'status' => 'in_progress',
            'final_amount' => 999,
            'cash_paid' => 999,
        ]);
        $this->makeOrder('t4-scope-store', $employeeId, 't4-other-store', $insideWindow, [
            'final_amount' => 800,
        ]);
        $this->makeOrder('t4-scope-operator', 't4-other-emp', $storeId, $insideWindow, [
            'final_amount' => 700,
        ]);
        $this->makeOrder('t4-scope-status', $employeeId, $storeId, $insideWindow, [
            'status' => 'cancelled',
            'final_amount' => 600,
        ]);
        $this->makeOrder(
            't4-scope-before',
            $employeeId,
            $storeId,
            date('Y-m-d H:i:s', strtotime($checkInTime) - 1),
            ['final_amount' => 500]
        );
        $this->makeOrder(
            't4-scope-after',
            $employeeId,
            $storeId,
            date('Y-m-d H:i:s', strtotime('+1 hour')),
            ['final_amount' => 400]
        );

        $result = ShiftLogic::shiftSummary($employeeId, $storeId);

        self::assertSame(100.0, $result['totalRevenue']);
        self::assertSame(60.0, $result['tableRevenue']);
        self::assertSame(30.0, $result['productRevenue']);
        self::assertSame(10.0, $result['assistantRevenue']);
        self::assertSame(40.0, $result['wechatPaid']);
        self::assertSame(20.0, $result['alipayPaid']);
        self::assertSame(10.0, $result['cashPaid']);
        self::assertSame(5.0, $result['cardPaid']);
        self::assertSame(25.0, $result['balancePaid']);
        self::assertSame(1, $result['orderCount']);
        self::assertSame(1, $result['openTableCount']);
    }

    public function testCheckOutLeavesUnsnapshottedPaymentAndRechargeFieldsMissing(): void
    {
        $employeeId = 't4-checkout-emp';
        $storeId = 't4-checkout-store';
        $checkInTime = date('Y-m-d H:i:s', strtotime('-2 hours'));
        $insideWindow = date('Y-m-d H:i:s', strtotime('-1 hour'));
        $this->makeShift('t4-checkout-shift', $employeeId, $storeId, 'checked_in', [
            'check_in_time' => $checkInTime,
        ]);
        $this->makeOrder('t4-checkout-order', $employeeId, $storeId, $insideWindow, [
            'final_amount' => 80,
            'table_fee' => 50,
            'product_fee' => 30,
            'cash_paid' => 10,
            'alipay_paid' => 20,
            'card_paid' => 30,
        ]);
        $this->makeRecharge('t4-checkout-recharge', $employeeId, $storeId, $insideWindow, [
            'amount' => 200,
            'gift_amount' => 20,
            'balance_before' => 100,
            'balance_after' => 320,
        ]);

        $result = ShiftLogic::checkOut($employeeId, $storeId);

        self::assertSame('checked_out', $result['status']);
        self::assertSame(80.0, $result['total_revenue']);
        self::assertSame(1, $result['order_count']);
        self::assertSame(10.0, $result['cash_paid']);
        self::assertSame(200.0, $result['recharge_total']);
        self::assertArrayNotHasKey('alipay_paid', $result);
        self::assertArrayNotHasKey('card_paid', $result);
        self::assertArrayNotHasKey('recharge_count', $result);
    }

    public function testProductionRechargeWritesReceivedGiftAndTotalCashFlow(): void
    {
        $employeeId = 't4-recharge-emp';
        $storeId = 't4-recharge-store';
        $memberId = 't4-recharge-member';
        reconciliation_make_member($memberId, $storeId, ['balance' => 100]);

        $rechargeResult = MemberLogic::rechargeCash($memberId, [
            'amount' => 200,
            'gift_amount' => 20,
            'gift_points' => 0,
            'operator_id' => $employeeId,
            'operator_name' => 'Synthetic Operator',
            'remark' => 'synthetic production recharge',
        ], $storeId);

        self::assertNotFalse($rechargeResult, MemberLogic::getError());

        $rechargeId = $rechargeResult['record']['id'];
        $stored = Db::name('busi_member_recharge')->where('id', $rechargeId)->find();
        $cashFlow = Db::name('busi_cash_flow')->where('order_id', $rechargeId)->find();
        $member = Db::name('busi_member')->where('id', $memberId)->find();

        self::assertNotNull($stored);
        self::assertNotNull($cashFlow);
        self::assertSame($memberId, $stored['member_id']);
        self::assertSame(200.0, (float)$stored['amount']);
        self::assertSame(20.0, (float)$stored['gift_amount']);
        self::assertSame(220.0, (float)$stored['amount'] + (float)$stored['gift_amount']);
        self::assertSame(220.0, (float)$stored['balance_after'] - (float)$stored['balance_before']);
        self::assertSame(220.0, (float)$cashFlow['amount']);
        self::assertSame(320.0, (float)$member['balance']);
    }

    public function testLegacySummaryCountsControlledRechargeInsideShiftWindow(): void
    {
        $employeeId = 't4-recharge-summary-emp';
        $storeId = 't4-recharge-summary-store';
        $checkInTime = date('Y-m-d H:i:s', strtotime('-2 hours'));
        $insideWindow = date('Y-m-d H:i:s', strtotime('-30 minutes'));
        $this->makeShift('t4-recharge-summary-shift', $employeeId, $storeId, 'checked_in', [
            'check_in_time' => $checkInTime,
        ]);
        $this->makeRecharge('t4-recharge-summary-row', $employeeId, $storeId, $insideWindow, [
            'amount' => 200,
            'gift_amount' => 20,
            'balance_before' => 100,
            'balance_after' => 320,
        ]);

        $result = ShiftLogic::shiftSummary($employeeId, $storeId);

        self::assertSame(200.0, $result['rechargeTotal']);
        self::assertSame(1, $result['rechargeCount']);
    }

    public function testOrderAndItemPaymentsAreListedSeparatelyFromLegacyOrderTotals(): void
    {
        $employeeId = 't4-payment-emp';
        $storeId = 't4-payment-store';
        $insideWindow = date('Y-m-d H:i:s', strtotime('-30 minutes'));
        $this->makeShift('t4-payment-shift', $employeeId, $storeId);
        $this->makeOrder('t4-payment-order', $employeeId, $storeId, $insideWindow, [
            'final_amount' => 40,
            'cash_paid' => 40,
        ]);
        $this->makeOrderItem('t4-payment-item', 't4-payment-order', [
            'final_price' => 40,
        ]);
        $this->makePayment('t4-payment-order-pay', 't4-payment-order', null, [
            'store_id' => $storeId,
            'amount' => 40,
            'paid_at' => $insideWindow,
        ]);
        $this->makePayment('t4-payment-item-pay', 't4-payment-order', 't4-payment-item', [
            'store_id' => $storeId,
            'amount' => 40,
            'paid_at' => $insideWindow,
        ]);

        $payments = Db::name('busi_order_payment')
            ->where('order_id', 't4-payment-order')
            ->order('id')
            ->select()
            ->toArray();
        $orderPayment = Db::name('busi_order_payment')
            ->where('order_id', 't4-payment-order')
            ->whereNull('order_item_id')
            ->find();
        $itemPayment = Db::name('busi_order_payment')
            ->where('order_id', 't4-payment-order')
            ->where('order_item_id', 't4-payment-item')
            ->find();
        $naivePaymentSum = (float)Db::name('busi_order_payment')
            ->where('order_id', 't4-payment-order')
            ->sum('amount');
        $result = ShiftLogic::shiftSummary($employeeId, $storeId);

        self::assertCount(2, $payments);
        self::assertNull($orderPayment['order_item_id']);
        self::assertSame('t4-payment-item', $itemPayment['order_item_id']);
        self::assertSame(80.0, $naivePaymentSum);
        self::assertSame(40.0, $result['totalRevenue']);
        self::assertSame(40.0, $result['cashPaid']);
    }

    public function testLegacySummaryCountsMergedParentAndChildIncludingAggregatedAmount(): void
    {
        $employeeId = 't4-merge-emp';
        $storeId = 't4-merge-store';
        $insideWindow = date('Y-m-d H:i:s', strtotime('-30 minutes'));
        $this->makeShift('t4-merge-shift', $employeeId, $storeId);
        $parent = $this->makeOrder('t4-merge-parent', $employeeId, $storeId, $insideWindow, [
            'final_amount' => 100,
            'table_fee' => 60,
            'product_fee' => 40,
            'cash_paid' => 100,
        ]);
        $this->makeOrder('t4-merge-child', $employeeId, $storeId, $insideWindow, [
            'final_amount' => 40,
            'product_fee' => 40,
            'merged_to_order_id' => 't4-merge-parent',
        ]);
        $this->makePayment('t4-merge-payment', 't4-merge-parent', null, [
            'store_id' => $storeId,
            'amount' => 100,
            'paid_at' => $insideWindow,
        ]);

        $paymentTotal = (float)Db::name('busi_order_payment')
            ->where('order_id', 't4-merge-parent')
            ->whereNull('order_item_id')
            ->sum('amount');
        $result = ShiftLogic::shiftSummary($employeeId, $storeId);

        self::assertSame(100.0, $paymentTotal);
        self::assertSame(140.0, $result['totalRevenue']);
        self::assertSame(40.0, $result['totalRevenue'] - (float)$parent['final_amount']);
        self::assertSame(100.0, $result['cashPaid']);
        self::assertSame(2, $result['orderCount']);
    }

    public function testCheckOutIncludesOrderExactlyAtPersistedEndBoundary(): void
    {
        $employeeId = 't4-boundary-emp';
        $storeId = 't4-boundary-store';
        $checkInTime = date('Y-m-d H:i:s', strtotime('-2 hours'));
        $this->makeShift('t4-boundary-shift', $employeeId, $storeId, 'checked_in', [
            'check_in_time' => $checkInTime,
        ]);
        $this->makeOrder('t4-boundary-start', $employeeId, $storeId, $checkInTime, [
            'final_amount' => 30,
        ]);
        $this->makeOrder(
            't4-boundary-before',
            $employeeId,
            $storeId,
            date('Y-m-d H:i:s', strtotime($checkInTime) - 1),
            ['final_amount' => 999]
        );

        $anchor = time();
        $boundaryOrders = [];
        for ($offset = -10; $offset <= 10; $offset++) {
            $endTime = date('Y-m-d H:i:s', $anchor + $offset);
            $amount = (float)(100 + $offset);
            $boundaryOrders[$endTime] = $amount;
            $this->makeOrder(
                't4-boundary-second-' . $offset,
                $employeeId,
                $storeId,
                $endTime,
                ['final_amount' => $amount]
            );
        }

        $result = ShiftLogic::checkOut($employeeId, $storeId);

        self::assertNotFalse($result);
        $persisted = Db::name('busi_employee_attendance')->where('id', 't4-boundary-shift')->find();
        $actualCheckOutTime = $persisted['check_out_time'];
        $afterCheckOutTime = date('Y-m-d H:i:s', strtotime($actualCheckOutTime) + 1);
        self::assertArrayHasKey($actualCheckOutTime, $boundaryOrders);
        self::assertArrayHasKey($afterCheckOutTime, $boundaryOrders);

        $expectedTotal = 30.0;
        $expectedBeforeEndTotal = 30.0;
        $expectedCount = 1;
        foreach ($boundaryOrders as $endTime => $amount) {
            if ($endTime < $actualCheckOutTime) {
                $expectedBeforeEndTotal += $amount;
            }
            if ($endTime <= $actualCheckOutTime) {
                $expectedTotal += $amount;
                $expectedCount++;
            }
        }

        self::assertSame($expectedTotal, (float)$persisted['total_revenue']);
        self::assertSame($expectedCount, (int)$persisted['order_count']);
        self::assertSame(
            $expectedBeforeEndTotal + $boundaryOrders[$actualCheckOutTime],
            (float)$persisted['total_revenue']
        );
    }
}
