<?php

declare(strict_types=1);

namespace Tests\Integration;

require_once __DIR__ . '/AgentAccessTest.php';

use think\facade\Db;

final class ReconciliationEvidenceTest extends AgentAccessTestCase
{
    private const CHECK_IN = '2026-01-01 09:00:00';
    private const CHECK_OUT = '2026-01-01 18:00:00';
    private const INSIDE = '2026-01-01 12:00:00';

    public function testHistoricalShiftReturnsCompleteRawEvidenceWithoutSensitiveFields(): void
    {
        $this->actingAs('emp-evidence', 'store-a', ['finance:cashflow']);
        $this->makeHistoricalShift('shift-1', 'emp-evidence', 'store-a');
        $this->makeOrder('order-inside', 'emp-evidence', 'store-a', self::INSIDE, [
            'order_no' => 'T5-ORDER-INSIDE',
            'member_id' => 'member-evidence',
            'member_name' => 'Synthetic Private Member Name',
            'remark' => 'synthetic-private-order-remark',
            'start_time' => '2026-01-01 10:00:00',
            'final_amount' => 80,
            'cash_paid' => 80,
        ]);
        $this->makeOrderItem('item-inside', 'order-inside', ['final_price' => 40]);
        $this->makePayment('payment-order', 'order-inside', null, [
            'store_id' => 'store-a',
            'order_no' => 'T5-ORDER-INSIDE',
            'amount' => 40,
            'paid_at' => self::INSIDE,
            'transaction_no' => 'synthetic-private-transaction-key',
            'description' => 'synthetic-private-payment-description',
            'remark' => 'synthetic-private-payment-remark',
        ]);
        $this->makePayment('payment-item', 'order-inside', 'item-inside', [
            'store_id' => 'store-a',
            'order_no' => 'T5-ORDER-INSIDE',
            'amount' => 40,
            'paid_at' => self::INSIDE,
            'transaction_no' => 'synthetic-private-transaction-key-2',
        ]);
        $this->makeRecharge('recharge-inside', 'emp-evidence', 'store-a', self::INSIDE, [
            'member_id' => 'member-evidence',
            'amount' => 100,
            'gift_amount' => 10,
            'remark' => 'synthetic-private-member-recharge-remark',
        ]);
        $this->makeCashFlow('cash-flow-inside', 'emp-evidence', 'store-a', self::INSIDE, [
            'order_id' => 'order-inside',
            'order_no' => 'T5-ORDER-INSIDE',
            'amount' => 80,
        ]);

        $this->makeOrder('order-before', 'emp-evidence', 'store-a', '2026-01-01 08:59:59');
        $this->makeOrder('order-other-operator', 'emp-other', 'store-a', self::INSIDE);
        $this->makeOrder('order-cancelled', 'emp-evidence', 'store-a', self::INSIDE, ['status' => 'cancelled']);
        $this->makeRecharge('recharge-after', 'emp-evidence', 'store-a', '2026-01-01 18:00:01');
        $this->makeRecharge('recharge-other-operator', 'emp-other', 'store-a', self::INSIDE);
        $this->makeCashFlow('cash-flow-before', 'emp-evidence', 'store-a', '2026-01-01 08:59:59');
        $this->makeCashFlow('cash-flow-other-operator', 'emp-other', 'store-a', self::INSIDE);

        $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-1&store_id=store-a');

        self::assertSame(200, $response->getCode(), $response->getContent());
        $data = $this->responseData($response);
        self::assertSame([
            'schema_version',
            'shift',
            'orders',
            'payments',
            'recharges',
            'cash_flows',
            'exclusions',
            'meta',
        ], array_keys($data));
        self::assertSame('reconciliation-evidence/v1', $data['schema_version']);
        self::assertSame([
            'id' => 'shift-1',
            'store_id' => 'store-a',
            'employee_id' => 'emp-evidence',
            'status' => 'checked_out',
            'check_in_time' => self::CHECK_IN,
            'check_out_time' => self::CHECK_OUT,
            'snapshot' => [],
            'snapshot_fields_present' => [],
        ], $data['shift']);
        self::assertStringContainsString('"snapshot":{}', $response->getContent());

        self::assertCount(1, $data['orders']);
        self::assertSame('order-inside', $data['orders'][0]['id']);
        self::assertSame([
            'id', 'store_id', 'order_no', 'type', 'status', 'member_id', 'table_id', 'assistant_id',
            'original_amount', 'discount_amount', 'final_amount', 'balance_paid', 'cash_paid',
            'wechat_paid', 'alipay_paid', 'card_paid', 'points_deduct', 'points_gained',
            'start_time', 'end_time', 'duration_minutes', 'operator_id', 'merged_to_order_id',
            'created_at', 'table_fee', 'product_fee', 'assistant_fee', 'merge',
        ], array_keys($data['orders'][0]));

        self::assertCount(2, $data['payments']);
        self::assertSame('order', $data['payments'][0]['classification']);
        self::assertNull($data['payments'][0]['order_item_id']);
        self::assertSame('item', $data['payments'][1]['classification']);
        self::assertSame('item-inside', $data['payments'][1]['order_item_id']);
        self::assertSame('40.00', $data['payments'][0]['amount']);
        self::assertSame('40.00', $data['payments'][1]['amount']);
        self::assertSame([
            'id', 'order_id', 'store_id', 'order_no', 'payment_method', 'channel', 'order_item_id',
            'amount', 'status', 'paid_at', 'operator_id', 'created_at', 'classification', 'merge',
        ], array_keys($data['payments'][0]));
        self::assertArrayHasKey('merge', $data['payments'][1]);

        self::assertCount(1, $data['recharges']);
        self::assertSame('recharge-inside', $data['recharges'][0]['id']);
        self::assertSame([
            'id', 'member_id', 'store_id', 'order_no', 'amount', 'gift_amount', 'payment_method',
            'balance_before', 'balance_after', 'points_before', 'points_after', 'gift_points',
            'operator_id', 'created_at', 'status',
        ], array_keys($data['recharges'][0]));

        self::assertCount(1, $data['cash_flows']);
        self::assertSame('cash-flow-inside', $data['cash_flows'][0]['id']);
        self::assertSame([
            'id', 'store_id', 'order_id', 'order_no', 'type', 'category', 'amount', 'payment_method',
            'balance_before', 'balance_after', 'operator_id', 'created_at',
        ], array_keys($data['cash_flows'][0]));
        self::assertSame([], $data['exclusions']);

        self::assertSame(['generated_at', 'limits', 'truncated', 'code_version'], array_keys($data['meta']));
        self::assertSame(1000, $data['meta']['limits']);
        self::assertFalse($data['meta']['truncated']);
        self::assertNotSame('', $data['meta']['code_version']);
        self::assertMatchesRegularExpression('/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', $data['meta']['generated_at']);

        $this->assertSensitiveFieldsAbsent($data);
        self::assertStringNotContainsString('synthetic-private', $response->getContent());
    }

    public function testShiftFromAnotherStoreIsNotFoundInsideAuthorizedStore(): void
    {
        $this->actingAs('emp-404', 'store-a', ['finance:cashflow']);
        $this->makeStore('store-b');
        $this->makeHistoricalShift('shift-foreign', 'emp-foreign', 'store-b');

        $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-foreign&store_id=store-a');

        self::assertSame(404, $response->getCode());
    }

    public function testMergeEvidenceAllowsOnlySameShiftAttributionAndMarksCrossDomainUnknown(): void
    {
        $this->actingAs('emp-merge', 'store-a', ['finance:cashflow']);
        $this->makeStore('store-b');
        $this->makeHistoricalShift('shift-merge', 'emp-merge', 'store-a');

        $this->makeOrder('parent-same', 'emp-merge', 'store-a', self::INSIDE);
        $this->makeOrder('child-same', 'emp-merge', 'store-a', self::INSIDE, ['merged_to_order_id' => 'parent-same']);
        $this->makeOrder('parent-other-operator', 'emp-other', 'store-a', self::INSIDE);
        $this->makeOrder('child-other-operator', 'emp-merge', 'store-a', self::INSIDE, ['merged_to_order_id' => 'parent-other-operator']);
        $this->makeOrder('parent-other-store', 'emp-merge', 'store-b', self::INSIDE);
        $this->makeOrder('child-other-store', 'emp-merge', 'store-a', self::INSIDE, ['merged_to_order_id' => 'parent-other-store']);
        $this->makeOrder('parent-other-shift', 'emp-merge', 'store-a', '2026-01-01 08:00:00');
        $this->makeOrder('child-other-shift', 'emp-merge', 'store-a', self::INSIDE, ['merged_to_order_id' => 'parent-other-shift']);

        foreach (['child-same', 'child-other-operator', 'child-other-store', 'child-other-shift'] as $orderId) {
            $this->makePayment('payment-' . $orderId, $orderId, null, [
                'store_id' => 'store-a',
                'amount' => 1,
                'paid_at' => self::INSIDE,
            ]);
        }

        $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-merge&store_id=store-a');

        self::assertSame(200, $response->getCode(), $response->getContent());
        $data = $this->responseData($response);
        $payments = [];
        foreach ($data['payments'] as $payment) {
            $payments[$payment['order_id']] = $payment;
        }
        self::assertSame([
            'state' => 'same_shift',
            'parent_order_id' => 'parent-same',
            'attribution' => 'parent',
        ], $payments['child-same']['merge']);
        foreach (['child-other-operator', 'child-other-store', 'child-other-shift'] as $orderId) {
            self::assertSame('unknown', $payments[$orderId]['merge']['state']);
            self::assertSame('unknown', $payments[$orderId]['merge']['attribution']);
        }

        $reasons = array_column($data['exclusions'], 'reason');
        sort($reasons);
        self::assertSame(['cross_operator_merge', 'cross_shift_merge', 'cross_store_merge'], $reasons);
        foreach ($data['exclusions'] as $exclusion) {
            self::assertSame('unknown', $exclusion['attribution']);
            self::assertSame('merge_excluded', $exclusion['type']);
        }
    }

    /**
     * @dataProvider evidenceCategoryProvider
     */
    public function testEveryEvidenceCategoryRejects1001RowsWithoutPartialPayload(string $category): void
    {
        $this->actingAs('emp-limit-' . $category, 'store-a', ['finance:cashflow']);
        $this->makeHistoricalShift('shift-limit-' . $category, 'emp-limit-' . $category, 'store-a');
        $this->makeOverflowRows($category, 'emp-limit-' . $category, 'store-a');

        $response = $this->get('/storeapi/agent.Reconciliation/shiftEvidence?shift_id=shift-limit-' . $category . '&store_id=store-a');

        self::assertSame(422, $response->getCode(), $category . ': ' . $response->getContent());
        $data = $this->responseData($response);
        self::assertSame('evidence_too_large', $data['code']);
        self::assertArrayNotHasKey('schema_version', $data);
        foreach (['shift', 'orders', 'payments', 'recharges', 'cash_flows', 'exclusions', 'meta'] as $key) {
            self::assertArrayNotHasKey($key, $data);
        }
    }

    public static function evidenceCategoryProvider(): array
    {
        return [
            'orders' => ['orders'],
            'payments' => ['payments'],
            'recharges' => ['recharges'],
            'cash flows' => ['cash_flows'],
        ];
    }

    private function makeHistoricalShift(string $id, string $employeeId, string $storeId): void
    {
        $this->makeShift($id, $employeeId, $storeId, 'checked_out', [
            'work_date' => '2026-01-01',
            'check_in_time' => self::CHECK_IN,
            'check_out_time' => self::CHECK_OUT,
            'description' => 'synthetic-private-shift-description',
            'total_revenue' => null,
            'order_count' => null,
            'cash_paid' => null,
            'wechat_paid' => null,
            'balance_paid' => null,
            'table_revenue' => null,
            'product_revenue' => null,
            'assistant_revenue' => null,
            'open_table_count' => null,
            'recharge_total' => null,
        ]);
    }

    private function assertSensitiveFieldsAbsent(array $data): void
    {
        $forbidden = ['phone', 'id_card', 'remark', 'member_name', 'description', 'transaction_no', 'password', 'token', 'secret'];
        array_walk_recursive($data, function ($value, $key) use ($forbidden): void {
            if (is_string($key)) {
                self::assertNotContains($key, $forbidden);
            }
        });
    }

    private function makeOverflowRows(string $category, string $employeeId, string $storeId): void
    {
        $rows = [];
        if ($category === 'orders') {
            $first = $this->makeOrder('overflow-order-0', $employeeId, $storeId, self::INSIDE);
            for ($index = 1; $index <= 1000; $index++) {
                $row = $first;
                $row['id'] = 'overflow-order-' . $index;
                $row['order_no'] = 'T5-OVERFLOW-ORDER-' . $index;
                $rows[] = $row;
            }
            Db::name('busi_order')->insertAll($rows);
            return;
        }

        if ($category === 'payments') {
            $this->makeOrder('overflow-payment-order', $employeeId, $storeId, self::INSIDE);
            $first = $this->makePayment('overflow-payment-0', 'overflow-payment-order', null, [
                'store_id' => $storeId,
                'amount' => 1,
                'paid_at' => self::INSIDE,
            ]);
            for ($index = 1; $index <= 1000; $index++) {
                $row = $first;
                $row['id'] = 'overflow-payment-' . $index;
                $rows[] = $row;
            }
            Db::name('busi_order_payment')->insertAll($rows);
            return;
        }

        if ($category === 'recharges') {
            $first = $this->makeRecharge('overflow-recharge-0', $employeeId, $storeId, self::INSIDE);
            for ($index = 1; $index <= 1000; $index++) {
                $row = $first;
                $row['id'] = 'overflow-recharge-' . $index;
                $row['member_id'] = 'overflow-member-' . $index;
                $row['order_no'] = 'T5-OVERFLOW-RECHARGE-' . $index;
                $rows[] = $row;
            }
            Db::name('busi_member_recharge')->insertAll($rows);
            return;
        }

        $first = $this->makeCashFlow('overflow-cash-flow-0', $employeeId, $storeId, self::INSIDE);
        for ($index = 1; $index <= 1000; $index++) {
            $row = $first;
            $row['id'] = 'overflow-cash-flow-' . $index;
            $row['order_no'] = 'T5-OVERFLOW-CASH-FLOW-' . $index;
            $rows[] = $row;
        }
        Db::name('busi_cash_flow')->insertAll($rows);
    }
}
