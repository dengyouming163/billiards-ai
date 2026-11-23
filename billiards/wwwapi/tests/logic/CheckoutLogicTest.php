<?php

declare(strict_types=1);

namespace app\storeapi\tests\logic;

use PHPUnit\Framework\TestCase;
use app\storeapi\logic\order\CheckoutLogic;

class CheckoutLogicTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }

    /**
     * Test rounding to whole yuan — floors to nearest integer
     */
    public function testApplyRoundingYuan()
    {
        $result = CheckoutLogic::applyRounding(58.50, 'yuan');
        $this->assertEquals(58.0, $result);
    }

    /**
     * Test rounding to jiao — floors to one decimal place
     */
    public function testApplyRoundingJiao()
    {
        $result = CheckoutLogic::applyRounding(58.58, 'jiao');
        $this->assertEquals(58.5, $result);
    }

    /**
     * Test rounding to half yuan — rounds to nearest 0.5
     */
    public function testApplyRoundingHalfYuan()
    {
        // 58.70 → round(58.70 * 2) / 2 = round(117.4) / 2 = 117 / 2 = 58.5
        $result1 = CheckoutLogic::applyRounding(58.70, 'half_yuan');
        $this->assertEquals(58.5, $result1);

        // 58.80 → round(58.80 * 2) / 2 = round(117.6) / 2 = 118 / 2 = 59.0
        $result2 = CheckoutLogic::applyRounding(58.80, 'half_yuan');
        $this->assertEquals(59.0, $result2);

        // 58.74 → round(117.48) / 2 = 117 / 2 = 58.5
        $result3 = CheckoutLogic::applyRounding(58.74, 'half_yuan');
        $this->assertEquals(58.5, $result3);

        // 58.76 → round(117.52) / 2 = 118 / 2 = 59.0
        $result4 = CheckoutLogic::applyRounding(58.76, 'half_yuan');
        $this->assertEquals(59.0, $result4);
    }

    /**
     * Test rounding disabled — amount passes through unchanged
     */
    public function testApplyRoundingNone()
    {
        $result = CheckoutLogic::applyRounding(58.50, 'none');
        $this->assertEquals(58.50, $result);
    }

    /**
     * Test rounding with unknown mode defaults to no rounding
     */
    public function testApplyRoundingUnknownMode()
    {
        $result = CheckoutLogic::applyRounding(58.50, 'arbitrary_unknown_mode');
        $this->assertEquals(58.50, $result);
    }

    /**
     * Test rounding yuan with zero amount
     */
    public function testApplyRoundingYuanZero()
    {
        $result = CheckoutLogic::applyRounding(0.0, 'yuan');
        $this->assertEquals(0.0, $result);
    }

    /**
     * Test rounding half_yuan boundary: exactly .25 rounds down
     */
    public function testApplyRoundingHalfYuanBoundaryDown()
    {
        // round(100.25 * 2) / 2 = round(200.5) / 2 = 201 / 2 = 100.5
        // PHP's round() uses "round half up" — 0.5 rounds to 1
        $result = CheckoutLogic::applyRounding(100.25, 'half_yuan');
        $this->assertEquals(100.5, $result);
    }

    /**
     * Test rounding half_yuan boundary: exactly .75 rounds up
     */
    public function testApplyRoundingHalfYuanBoundaryUp()
    {
        // round(100.75 * 2) / 2 = round(201.5) / 2 = 202 / 2 = 101.0
        $result = CheckoutLogic::applyRounding(100.75, 'half_yuan');
        $this->assertEquals(101.0, $result);
    }
}
