<?php

declare(strict_types=1);

namespace app\common\gateway;

interface CouponPlatformInterface
{
    /**
     * 验券准备（查券）
     * @return array{success: bool, message: string, data: array{coupon_code: string, package_name: string, price: float, duration_minutes: int, platform_order_id: string, verify_token: string, raw: array}|null}
     */
    public function prepare(array $config, string $code): array;

    /**
     * 执行验券（核销）
     * @return array{success: bool, message: string, data: array{platform_order_id: string}|null}
     */
    public function consume(array $config, string $code, string $verifyToken): array;

    /**
     * 撤销核销
     * @return array{success: bool, message: string}
     */
    public function reverse(array $config, string $code, string $verifyToken): array;

    /**
     * 获取商家套餐列表
     * @return array{success: bool, message: string, data: array|null}
     */
    public function getPackages(array $config): array;

    /**
     * 按日期查询核销记录（对账用）
     * @return array{success: bool, message: string, data: array|null}
     */
    public function queryByDate(array $config, string $date): array;
}
