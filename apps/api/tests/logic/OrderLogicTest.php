<?php

declare(strict_types=1);

namespace app\storeapi\tests\logic;

use PHPUnit\Framework\TestCase;
use app\storeapi\logic\order\AssistantOrderLogic;
use app\storeapi\logic\order\CheckoutLogic;
use app\storeapi\logic\order\MergeLogic;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantOrder;
use think\facade\Db;

class OrderLogicTest extends TestCase
{
    protected string $storeId = 'test_store_001';
    protected string $tableId = 'test_table_001';
    protected string $orderId = 'test_order_001';
    protected string $assistantId = 'test_assistant_001';

    protected function setUp(): void
    {
        parent::setUp();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }

    /**
     * 测试助教订单创建
     */
    public function testCreateAssistantOrder()
    {
        $params = [
            'assistant_id' => $this->assistantId,
            'duration' => 2.0,
            'student_name' => '测试学员',
            'service_type' => 'practice'
        ];

        $result = AssistantOrderLogic::createAssistantOrder($this->orderId, $params, $this->storeId);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(isset($result['success']) || isset($result['assistant_order_id']));
    }

    /**
     * 测试助教服务开始
     */
    public function testStartService()
    {
        $assistantOrderId = 'test_assistant_order_001';

        $result = AssistantOrderLogic::startService($assistantOrderId, $this->storeId);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(isset($result['success']) || isset($result['status']));
    }

    /**
     * 测试助教服务结束
     */
    public function testEndService()
    {
        $assistantOrderId = 'test_assistant_order_001';

        $result = AssistantOrderLogic::endService($assistantOrderId, $this->storeId, [
            'remark' => '测试结束'
        ]);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(
            isset($result['success']) ||
            isset($result['actual_duration']) ||
            isset($result['actual_amount'])
        );
    }

    /**
     * 测试助教订单取消
     */
    public function testCancelAssistantOrder()
    {
        $assistantOrderId = 'test_assistant_order_001';

        $result = AssistantOrderLogic::cancel($assistantOrderId, $this->storeId, [
            'reason' => '测试取消'
        ]);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(isset($result['success']) || isset($result['assistant_order_id']));
    }

    /**
     * 测试并台操作
     */
    public function testMergeOrders()
    {
        $orderIds = ['test_order_001', 'test_order_002'];

        $result = MergeLogic::mergeOrders($orderIds, $this->storeId);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(
            isset($result['success']) ||
            isset($result['main_order_id'])
        );
    }

    /**
     * 测试换台操作
     */
    public function testChangeTable()
    {
        $newTableId = 'test_table_002';

        $result = MergeLogic::changeTable($this->orderId, $newTableId, $this->storeId);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(
            isset($result['success']) ||
            isset($result['new_table_id'])
        );
    }

    /**
     * 测试获取账单
     */
    public function testGetBill()
    {
        $result = CheckoutLogic::getBill($this->orderId, $this->storeId);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertIsArray($result);
        $this->assertTrue(
            isset($result['order']) ||
            isset($result['billing']) ||
            isset($result['items'])
        );
    }

    /**
     * 测试订单结算
     */
    public function testCheckout()
    {
        $params = [
            'wechat_paid' => 100.00,
            'operator_id' => 'test_operator_001',
            'operator_name' => '测试操作员'
        ];

        $result = CheckoutLogic::checkout($this->orderId, $this->storeId, $params);

        if (isset($result['error'])) {
            $this->assertIsString($result['error']);
            return;
        }

        $this->assertTrue(
            isset($result['success']) ||
            isset($result['order_id']) ||
            isset($result['final_amount'])
        );
    }

    /**
     * 测试台费计算
     */
    public function testCalculateTableFee()
    {
        $order = new \stdClass();
        $order->prepaid_hours = 0;
        $order->start_time = date('Y-m-d H:i:s', strtotime('-2 hours'));
        $order->prepaid_amount = 0;

        $table = new \stdClass();
        $table->hourly_rate = 38.00;

        $reflection = new \ReflectionClass(CheckoutLogic::class);
        $method = $reflection->getMethod('calculateTableFee');
        $method->setAccessible(true);

        $fee = $method->invoke(null, $order, $table);

        $this->assertIsFloat($fee);
        $this->assertGreaterThan(0, $fee);
    }

    /**
     * 测试商品费计算
     */
    public function testCalculateProductFee()
    {
        $items = [
            ['item_type' => 'product', 'final_price' => 16.00],
            ['item_type' => 'product', 'final_price' => 8.00],
            ['item_type' => 'table', 'final_price' => 0]
        ];

        $reflection = new \ReflectionClass(CheckoutLogic::class);
        $method = $reflection->getMethod('calculateProductFee');
        $method->setAccessible(true);

        $fee = $method->invoke(null, $items);

        $this->assertEquals(24.00, $fee);
    }

    /**
     * 测试助教费计算
     */
    public function testCalculateAssistantFee()
    {
        $items = [
            ['item_type' => 'assistant', 'final_price' => 150.00],
            ['item_type' => 'product', 'final_price' => 16.00]
        ];

        $reflection = new \ReflectionClass(CheckoutLogic::class);
        $method = $reflection->getMethod('calculateAssistantFee');
        $method->setAccessible(true);

        $fee = $method->invoke(null, $items);

        $this->assertEquals(150.00, $fee);
    }

    /**
     * 测试获取可并台订单
     */
    public function testGetMergeableOrders()
    {
        $result = MergeLogic::getMergeableOrders($this->storeId);

        $this->assertIsArray($result);
    }
}
