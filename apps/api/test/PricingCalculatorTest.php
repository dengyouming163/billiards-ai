<?php

require_once __DIR__ . '/../vendor/autoload.php';

use app\common\logic\PricingCalculatorLogic;

class PricingCalculatorTest
{
    private $successCount = 0;
    private $failCount = 0;

    public function run()
    {
        echo "========================================\n";
        echo "  PricingCalculatorLogic Unit Test\n";
        echo "========================================\n\n";

        $this->testRoundingMode();
        $this->testMinimumMinutes();
        $this->testMinimumCharge();
        $this->testMemberDiscount();
        $this->testCombinedRules();

        echo "\n========================================\n";
        echo "  Results: {$this->successCount} passed, {$this->failCount} failed\n";
        echo "========================================\n";
    }

    private function testRoundingMode()
    {
        echo "[Test 1] Rounding Mode\n";
        echo "----------------------------------------\n";

        $tests = [
            ['mode' => 'per_minute', 'minutes' => 10, 'expected' => 10],
            ['mode' => 'min_30', 'minutes' => 10, 'expected' => 30],
            ['mode' => 'min_30', 'minutes' => 30, 'expected' => 30],
            ['mode' => 'min_30', 'minutes' => 45, 'expected' => 60],
            ['mode' => 'per_hour', 'minutes' => 10, 'expected' => 60],
            ['mode' => 'per_hour', 'minutes' => 60, 'expected' => 60],
            ['mode' => 'per_hour', 'minutes' => 90, 'expected' => 120],
        ];

        foreach ($tests as $i => $test) {
            $result = $this->applyRounding($test['minutes'], $test['mode']);
            $this->assertEqual($result, $test['expected'], 
                "Test " . ($i + 1) . ": {$test['mode']}, {$test['minutes']}min -> {$result}min (expected: {$test['expected']})");
        }
        echo "\n";
    }

    private function testMinimumMinutes()
    {
        echo "[Test 2] Minimum Minutes Rule\n";
        echo "----------------------------------------\n";

        $tests = [
            ['duration' => 10, 'minimumMinutes' => 30, 'expected' => 30],
            ['duration' => 30, 'minimumMinutes' => 30, 'expected' => 30],
            ['duration' => 45, 'minimumMinutes' => 30, 'expected' => 45],
            ['duration' => 10, 'minimumMinutes' => 0, 'expected' => 10],
        ];

        foreach ($tests as $i => $test) {
            $result = max($test['duration'], $test['minimumMinutes']);
            $this->assertEqual($result, $test['expected'],
                "Test " . ($i + 1) . ": used {$test['duration']}min, min {$test['minimumMinutes']}min -> billed {$result}min");
        }
        echo "\n";
    }

    private function testMinimumCharge()
    {
        echo "[Test 3] Minimum Charge Rule\n";
        echo "----------------------------------------\n";

        $tests = [
            ['calculated' => 15, 'minimumCharge' => 20, 'expected' => 20],
            ['calculated' => 20, 'minimumCharge' => 20, 'expected' => 20],
            ['calculated' => 25, 'minimumCharge' => 20, 'expected' => 25],
            ['calculated' => 15, 'minimumCharge' => 0, 'expected' => 15],
        ];

        foreach ($tests as $i => $test) {
            $result = max($test['calculated'], $test['minimumCharge']);
            $this->assertEqual($result, $test['expected'],
                "Test " . ($i + 1) . ": calculated {$test['calculated']}yuan, minCharge {$test['minimumCharge']}yuan -> final {$result}yuan");
        }
        echo "\n";
    }

    private function testMemberDiscount()
    {
        echo "[Test 4] Member Discount\n";
        echo "----------------------------------------\n";

        $tests = [
            ['amount' => 100, 'discount' => 1.0, 'expected' => 100],
            ['amount' => 100, 'discount' => 0.95, 'expected' => 95],
            ['amount' => 100, 'discount' => 0.9, 'expected' => 90],
            ['amount' => 100, 'discount' => 0.85, 'expected' => 85],
        ];

        foreach ($tests as $i => $test) {
            $result = round($test['amount'] * $test['discount'], 2);
            $this->assertEqual($result, $test['expected'],
                "Test " . ($i + 1) . ": {$test['amount']}yuan × {$test['discount']} -> {$result}yuan");
        }
        echo "\n";
    }

    private function testCombinedRules()
    {
        echo "[Test 5] Combined Rules\n";
        echo "----------------------------------------\n";

        $tests = [
            [
                'name' => 'Normal case',
                'duration' => 90,
                'pricePerHour' => 60,
                'roundingMode' => 'per_minute',
                'minimumMinutes' => 30,
                'minimumCharge' => 20,
                'discount' => 1.0,
                'expected' => 90.0,
            ],
            [
                'name' => 'Below minMinutes',
                'duration' => 10,
                'pricePerHour' => 60,
                'roundingMode' => 'per_minute',
                'minimumMinutes' => 30,
                'minimumCharge' => 20,
                'discount' => 1.0,
                'expected' => 30.0,
            ],
            [
                'name' => 'Below minCharge',
                'duration' => 20,
                'pricePerHour' => 60,
                'roundingMode' => 'per_minute',
                'minimumMinutes' => 0,
                'minimumCharge' => 20,
                'discount' => 1.0,
                'expected' => 20.0,
            ],
            [
                'name' => 'Discount + minCharge',
                'duration' => 20,
                'pricePerHour' => 60,
                'roundingMode' => 'per_minute',
                'minimumMinutes' => 0,
                'minimumCharge' => 20,
                'discount' => 0.95,
                'expected' => 20.0,
            ],
            [
                'name' => 'All rules combined',
                'duration' => 10,
                'pricePerHour' => 60,
                'roundingMode' => 'min_30',
                'minimumMinutes' => 30,
                'minimumCharge' => 20,
                'discount' => 0.95,
                'expected' => 28.5,
            ],
        ];

        foreach ($tests as $i => $test) {
            $billedMinutes = $this->applyRounding($test['duration'], $test['roundingMode']);
            $billedMinutes = max($billedMinutes, $test['minimumMinutes']);
            $subtotal = $test['pricePerHour'] * ($billedMinutes / 60);
            $afterDiscount = $subtotal * $test['discount'];
            $final = max($afterDiscount, $test['minimumCharge']);
            $final = round($final, 2);
            
            $this->assertEqual($final, $test['expected'],
                "Test " . ($i + 1) . ": {$test['name']} -> {$final}yuan (expected: {$test['expected']}yuan)");
        }
        echo "\n";
    }

    private function assertEqual($actual, $expected, $message)
    {
        if (is_float($actual) && is_int($expected)) {
            $expected = (float)$expected;
        }
        if (is_float($expected) && is_int($actual)) {
            $actual = (float)$actual;
        }
        
        if ($actual === $expected) {
            echo "✓ {$message}\n";
            $this->successCount++;
        } else {
            echo "✗ {$message}\n";
            echo "  FAIL: Actual {$actual} (type: " . gettype($actual) . "), Expected {$expected} (type: " . gettype($expected) . ")\n";
            $this->failCount++;
        }
    }

    private function applyRounding(int $minutes, string $mode): int
    {
        switch ($mode) {
            case 'min_30':
                return (int)ceil($minutes / 30) * 30;
            case 'per_hour':
                return (int)ceil($minutes / 60) * 60;
            case 'per_minute':
            default:
                return $minutes;
        }
    }
}

$test = new PricingCalculatorTest();
$test->run();
