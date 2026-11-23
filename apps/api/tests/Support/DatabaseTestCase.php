<?php

declare(strict_types=1);

namespace Tests\Support;

use PHPUnit\Framework\TestCase;
use think\facade\Db;

require_once __DIR__ . '/../Fixtures/reconciliation_factory.php';

abstract class DatabaseTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        if (getenv('DATABASE_DATABASE') !== 'billiards_test') {
            self::fail('Characterization tests may only use the isolated billiards_test database.');
        }

        Db::startTrans();
    }

    protected function tearDown(): void
    {
        Db::rollback();
        parent::tearDown();
    }

    protected function makeShift(
        string $id,
        string $employeeId,
        string $storeId,
        string $status = 'checked_in',
        array $overrides = []
    ): array {
        return reconciliation_make_shift($id, $employeeId, $storeId, $status, $overrides);
    }

    protected function makeOrder(
        string $id,
        string $employeeId,
        string $storeId,
        ?string $endTime,
        array $overrides = []
    ): array {
        return reconciliation_make_order($id, $employeeId, $storeId, $endTime, $overrides);
    }

    protected function makeRecharge(
        string $id,
        string $employeeId,
        string $storeId,
        string $createdAt,
        array $overrides = []
    ): array {
        return reconciliation_make_recharge($id, $employeeId, $storeId, $createdAt, $overrides);
    }

    protected function makeOrderItem(string $id, string $orderId, array $overrides = []): array
    {
        return reconciliation_make_order_item($id, $orderId, $overrides);
    }

    protected function makePayment(
        string $id,
        string $orderId,
        ?string $orderItemId = null,
        array $overrides = []
    ): array {
        return reconciliation_make_payment($id, $orderId, $orderItemId, $overrides);
    }
}
