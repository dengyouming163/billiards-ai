<?php

declare(strict_types=1);

namespace app\common\service;

interface ChannelServiceInterface
{
    /**
     * Verify a channel coupon code
     * @param string $code  The coupon code
     * @param float  $amount The order amount for verification
     * @return array { valid: bool, channel: string, amount: float, verify_id: string, message: string }
     */
    public function verify(string $code, float $amount): array;

    /**
     * Record a successful verification
     * @param string $orderId Order ID
     * @param string $code    Coupon code
     * @param string $channel Channel name (meituan/douyin/coupon)
     * @param float  $amount  Verified amount
     */
    public function recordVerify(string $orderId, string $code, string $channel, float $amount): void;
}
