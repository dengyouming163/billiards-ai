<?php

declare(strict_types=1);

namespace app\common\service;

use app\common\model\merchant\ChannelVerifyRecord;

class MockChannelService implements ChannelServiceInterface
{
    /**
     * Verify a channel coupon code (mock implementation)
     */
    public function verify(string $code, float $amount): array
    {
        $channel = $this->detectChannel($code);

        if (!$channel) {
            return [
                'valid'      => false,
                'channel'    => '',
                'amount'     => 0,
                'verify_id'  => '',
                'message'    => '无效券码格式',
            ];
        }

        $mockAmount = min(mt_rand(10, 200), $amount);

        return [
            'valid'      => true,
            'channel'    => $channel,
            'amount'     => (float) $mockAmount,
            'verify_id'  => self::uuidV4(),
            'message'    => '核销成功(Mock)',
        ];
    }

    /**
     * Record a successful verification
     */
    public function recordVerify(string $orderId, string $code, string $channel, float $amount): void
    {
        ChannelVerifyRecord::create([
            'id'            => self::uuidV4(),
            'store_id'      => request()->store_id ?? '',
            'order_id'      => $orderId,
            'channel'       => $channel,
            'verify_code'   => $code,
            'verify_amount' => $amount,
            'status'        => 'success',
        ]);
    }

    /**
     * Detect the channel from coupon code format
     */
    private function detectChannel(string $code): ?string
    {
        // Meituan: 12-digit numeric code
        if (preg_match('/^\d{12}$/', $code)) {
            return 'meituan';
        }

        // Douyin: "DY" prefix + 14 alphanumeric chars
        if (preg_match('/^DY[a-zA-Z0-9]{14}$/', $code)) {
            return 'douyin';
        }

        // Internal coupon: 8-digit numeric code
        if (preg_match('/^\d{8}$/', $code)) {
            return 'coupon';
        }

        return null;
    }

    /**
     * Generate a UUID v4 string
     */
    private static function uuidV4(): string
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}
