# 台球厅管理系统 - 单元测试

## 测试文件结构

```
wwwapi/
├── tests/
│   ├── bootstrap.php                    # 测试引导文件
│   ├── logic/
│   │   └── OrderLogicTest.php         # 订单Logic类测试
│   └── controller/
│       └── TabletControllerTest.php    # 控制器测试
├── phpunit.xml                         # PHPUnit配置文件
└── README.md                           # 本文件
```

## 运行测试

### 前置条件

需要安装 PHPUnit：

```bash
cd wwwapi
composer require --dev phpunit/phpunit:^9.5
```

### 运行所有测试

```bash
cd wwwapi
./vendor/bin/phpunit
```

### 运行特定测试

```bash
# 运行Logic测试
./vendor/bin/phpunit tests/logic/

# 运行控制器测试
./vendor/bin/phpunit tests/controller/

# 运行特定测试类
./vendor/bin/phpunit tests/logic/OrderLogicTest.php
```

### 运行带覆盖率的测试

```bash
./vendor/bin/phpunit --coverage-html coverage/
```

## 测试用例

### OrderLogicTest.php

| 测试方法 | 说明 | 状态 |
|---------|------|------|
| testCreateAssistantOrder | 测试创建助教订单 | ✅ |
| testStartService | 测试开始助教服务 | ✅ |
| testEndService | 测试结束助教服务 | ✅ |
| testCancelAssistantOrder | 测试取消助教订单 | ✅ |
| testMergeOrders | 测试并台操作 | ✅ |
| testChangeTable | 测试换台操作 | ✅ |
| testGetBill | 测试获取账单 | ✅ |
| testCheckout | 测试订单结算 | ✅ |
| testCalculateTableFee | 测试台费计算 | ✅ |
| testCalculateProductFee | 测试商品费计算 | ✅ |
| testCalculateAssistantFee | 测试助教费计算 | ✅ |
| testGetMergeableOrders | 测试获取可并台订单 | ✅ |

### TabletControllerTest.php

| 测试方法 | 说明 | 状态 |
|---------|------|------|
| testOrderControllerMethodsExist | 测试订单控制器方法存在性 | ✅ |
| testAssistantControllerMethodsExist | 测试助教控制器方法存在性 | ✅ |
| testNotNeedLoginConfig | 测试登录豁免配置 | ✅ |

## 编写新测试

### 基本结构

```php
<?php

declare(strict_types=1);

namespace app\storeapi\tests\logic;

use PHPUnit\Framework\TestCase;
use app\storeapi\logic\order\YourLogic;

class YourLogicTest extends TestCase
{
    protected string $storeId = 'test_store_001';

    protected function setUp(): void
    {
        parent::setUp();
    }

    public function testYourMethod()
    {
        $result = YourLogic::yourMethod($param1, $param2);

        $this->assertTrue($result['success'] ?? false);
    }

    public function testYourMethodWithError()
    {
        $result = YourLogic::yourMethod($invalidParam);

        $this->assertArrayHasKey('error', $result);
    }
}
```

### 测试私有方法

```php
public function testPrivateMethod()
{
    $reflection = new \ReflectionClass(YourLogic::class);
    $method = $reflection->getMethod('privateMethod');
    $method->setAccessible(true);

    $result = $method->invoke(null, $param);

    $this->assertEquals($expected, $result);
}
```

## 持续集成

建议在每次提交前运行测试：

```bash
#!/bin/bash
cd wwwapi
./vendor/bin/phpunit
if [ $? -ne 0 ]; then
    echo "Tests failed!"
    exit 1
fi
echo "All tests passed!"
```
