<?php

declare(strict_types=1);

namespace app\storeapi\tests\logic;

use PHPUnit\Framework\TestCase;
use app\common\service\MockChannelService;

class ChannelServiceTest extends TestCase
{
    protected MockChannelService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new MockChannelService();
    }

    protected function tearDown(): void
    {
        parent::tearDown();
    }

    /**
     * Test verifying a Meituan coupon code (12-digit numeric)
     */
    public function testVerifyMeituanCode()
    {
        $result = $this->service->verify('123456789012', 100);

        $this->assertTrue($result['valid']);
        $this->assertEquals('meituan', $result['channel']);
        $this->assertGreaterThan(0, $result['amount']);
        $this->assertEquals('核销成功(Mock)', $result['message']);
        $this->assertNotEmpty($result['verify_id']);
    }

    /**
     * Test verifying a Douyin coupon code (DY prefix + 14 alphanumeric)
     */
    public function testVerifyDouyinCode()
    {
        $result = $this->service->verify('DY20260625ABCDEFGH', 100);

        $this->assertTrue($result['valid']);
        $this->assertEquals('douyin', $result['channel']);
        $this->assertGreaterThan(0, $result['amount']);
        $this->assertEquals('核销成功(Mock)', $result['message']);
        $this->assertNotEmpty($result['verify_id']);
    }

    /**
     * Test verifying an internal coupon code (8-digit numeric)
     */
    public function testVerifyCouponCode()
    {
        $result = $this->service->verify('12345678', 100);

        $this->assertTrue($result['valid']);
        $this->assertEquals('coupon', $result['channel']);
        $this->assertGreaterThan(0, $result['amount']);
        $this->assertEquals('核销成功(Mock)', $result['message']);
        $this->assertNotEmpty($result['verify_id']);
    }

    /**
     * Test verifying an invalid code format
     */
    public function testVerifyInvalidCode()
    {
        $result = $this->service->verify('abc', 100);

        $this->assertFalse($result['valid']);
        $this->assertEquals('无效券码格式', $result['message']);
        $this->assertEquals('', $result['channel']);
        $this->assertEquals(0, $result['amount']);
        $this->assertEquals('', $result['verify_id']);
    }

    /**
     * Test that mock verify amount never exceeds original amount
     */
    public function testVerifyAmountCappedAtOriginal()
    {
        for ($i = 0; $i < 20; $i++) {
            $result = $this->service->verify('123456789012', 50);

            $this->assertLessThanOrEqual(50, $result['amount']);
        }
    }

    /**
     * Test 7-digit numeric code is not recognized
     */
    public function testVerifySevenDigitCodeIsInvalid()
    {
        $result = $this->service->verify('1234567', 100);

        $this->assertFalse($result['valid']);
        $this->assertEquals('无效券码格式', $result['message']);
    }

    /**
     * Test 13-digit numeric code is not recognized
     */
    public function testVerifyThirteenDigitCodeIsInvalid()
    {
        $result = $this->service->verify('1234567890123', 100);

        $this->assertFalse($result['valid']);
        $this->assertEquals('无效券码格式', $result['message']);
    }

    /**
     * Test Douyin code with wrong prefix length is not recognized
     */
    public function testVerifyDouyinCodeWrongLengthIsInvalid()
    {
        // Only 13 chars after DY prefix (should be 14)
        $result = $this->service->verify('DY20260625ABCDEFG', 100);

        $this->assertFalse($result['valid']);
        $this->assertEquals('无效券码格式', $result['message']);
    }
}
