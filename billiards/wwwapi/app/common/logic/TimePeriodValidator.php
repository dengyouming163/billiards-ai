<?php

declare(strict_types=1);

namespace app\common\logic;

use app\common\model\merchant\TimePeriod;

/**
 * 时段重叠检测工具类
 * 确保时段配置不存在重叠
 */
class TimePeriodValidator
{
    /**
     * 校验时段配置是否存在重叠
     * @param array $periods 时段配置数组
     * @return array 校验结果 ['valid' => bool, 'errors' => []]
     */
    public static function validate(array $periods): array
    {
        $errors = [];
        $n = count($periods);

        for ($i = 0; $i < $n; $i++) {
            for ($j = $i + 1; $j < $n; $j++) {
                if (self::areOverlapping($periods[$i], $periods[$j])) {
                    $errors[] = sprintf(
                        '时段「%s」与时段「%s」存在时间重叠',
                        $periods[$i]['name'] ?? '未知',
                        $periods[$j]['name'] ?? '未知'
                    );
                }
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * 校验单个时段与现有时段是否重叠
     * @param array $newPeriod 新时段配置
     * @param array $existingPeriods 现有时段配置数组
     * @param string|null $excludeId 排除的时段ID（用于编辑时排除自身）
     * @return array 校验结果
     */
    public static function validateSingle(array $newPeriod, array $existingPeriods, ?string $excludeId = null): array
    {
        $errors = [];

        foreach ($existingPeriods as $existing) {
            if ($excludeId && ($existing['id'] ?? null) === $excludeId) {
                continue;
            }

            if (self::areOverlapping($newPeriod, $existing)) {
                $errors[] = sprintf(
                    '时段「%s」与时段「%s」存在时间重叠',
                    $newPeriod['name'] ?? '新时段',
                    $existing['name'] ?? '现有时段'
                );
            }
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * 判断两个时段是否重叠
     */
    public static function areOverlapping(array $period1, array $period2): bool
    {
        $start1 = self::timeToMinutes($period1['start_time'] ?? '00:00:00');
        $end1 = self::timeToMinutes($period1['end_time'] ?? '00:00:00');
        $start2 = self::timeToMinutes($period2['start_time'] ?? '00:00:00');
        $end2 = self::timeToMinutes($period2['end_time'] ?? '00:00:00');

        $isCrossDay1 = $end1 < $start1;
        $isCrossDay2 = $end2 < $start2;

        if ($isCrossDay1 && $isCrossDay2) {
            return true;
        }

        if ($isCrossDay1) {
            return !(($end1 <= $start2 && $end1 !== $start2) || ($end2 <= $start1 && $end2 !== $start1));
        }

        if ($isCrossDay2) {
            return !(($end1 <= $start2 && $end1 !== $start2) || ($end2 <= $start1 && $end2 !== $start1));
        }

        return !(($end1 <= $start2) || ($end2 <= $start1));
    }

    /**
     * 将时间字符串转换为分钟数
     */
    protected static function timeToMinutes(string $time): int
    {
        $parts = explode(':', $time);
        $hours = (int) ($parts[0] ?? 0);
        $minutes = (int) ($parts[1] ?? 0);
        return $hours * 60 + $minutes;
    }

    /**
     * 检查时段是否跨天
     */
    public static function isCrossDay(array $period): bool
    {
        $start = self::timeToMinutes($period['start_time'] ?? '00:00:00');
        $end = self::timeToMinutes($period['end_time'] ?? '00:00:00');
        return $end < $start;
    }

    /**
     * 获取时段时间范围描述
     */
    public static function getTimeRangeText(array $period): string
    {
        $isCrossDay = self::isCrossDay($period);
        $start = $period['start_time'] ?? '00:00';
        $end = $period['end_time'] ?? '00:00';
        
        $start = substr($start, 0, 5);
        $end = substr($end, 0, 5);

        if ($isCrossDay) {
            return sprintf('%s - %s（跨天）', $start, $end);
        }

        return sprintf('%s - %s', $start, $end);
    }

    /**
     * 验证时段数据
     */
    public static function validatePeriodData(array $data): array
    {
        $errors = [];

        if (empty($data['name'])) {
            $errors[] = '时段名称不能为空';
        }

        if (empty($data['start_time'])) {
            $errors[] = '开始时间不能为空';
        }

        if (empty($data['end_time'])) {
            $errors[] = '结束时间不能为空';
        }

        if (!isset($data['coefficient']) || $data['coefficient'] < 0) {
            $errors[] = '价格系数必须大于等于0';
        }

        if (!isset($data['priority'])) {
            $errors[] = '优先级不能为空';
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
        ];
    }

    /**
     * 从数据库加载并验证门店时段
     */
    public static function validateFromDatabase(string $storeId): array
    {
        $periods = TimePeriod::where('store_id', $storeId)
            ->where('status', 1)
            ->order('priority', 'desc')
            ->select()
            ->toArray();

        return self::validate($periods);
    }
}
