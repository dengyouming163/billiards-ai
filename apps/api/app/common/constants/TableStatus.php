<?php

declare (strict_types=1);

namespace app\common\constants;

/**
 * 台桌状态常量
 */
class TableStatus
{
    // 台桌状态
    public const IDLE = 'idle';               // 空闲
    public const OCCUPIED = 'occupied';       // 使用中
    public const RESERVED = 'reserved';       // 已预订
    public const MAINTENANCE = 'maintenance'; // 维护中
    
    // 状态文本映射
    public const STATUS_TEXT = [
        self::IDLE => '空闲',
        self::OCCUPIED => '使用中',
        self::RESERVED => '已预订',
        self::MAINTENANCE => '维护中',
    ];
    
    /**
     * 获取状态文本
     */
    public static function getText(string $status): string
    {
        return self::STATUS_TEXT[$status] ?? '未知';
    }
    
    /**
     * 检查台桌是否可用
     */
    public static function isAvailable(string $status): bool
    {
        return $status === self::IDLE;
    }
    
    /**
     * 检查台桌是否使用中
     */
    public static function isOccupied(string $status): bool
    {
        return $status === self::OCCUPIED;
    }
    
    /**
     * 检查台桌是否已预订
     */
    public static function isReserved(string $status): bool
    {
        return $status === self::RESERVED;
    }
    
    /**
     * 检查台桌是否维护中
     */
    public static function isMaintenance(string $status): bool
    {
        return $status === self::MAINTENANCE;
    }
    
    /**
     * 获取所有状态
     */
    public static function getAll(): array
    {
        return [
            self::IDLE,
            self::OCCUPIED,
            self::RESERVED,
            self::MAINTENANCE,
        ];
    }
}
