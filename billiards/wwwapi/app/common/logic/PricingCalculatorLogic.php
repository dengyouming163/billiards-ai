<?php

declare(strict_types=1);

namespace app\common\logic;

use app\common\model\merchant\Pricing;
use app\common\model\merchant\TimePeriod;
use app\common\model\merchant\MemberDiscount;

class PricingCalculatorLogic extends BaseLogic
{
    const ROUNDING_PER_MINUTE = 'per_minute';
    const ROUNDING_MIN_30 = 'min_30';
    const ROUNDING_PER_HOUR = 'per_hour';

    const TYPE_TIME = 'time';
    const TYPE_HOURLY = 'hourly';
    const TYPE_PERIOD = 'period';

    private $pricing;
    private $timePeriods = [];
    private $memberDiscounts = [];
    private $storeId;

    private function __construct(string $storeId, ?Pricing $pricing = null)
    {
        $this->storeId = $storeId;
        $this->pricing = $pricing;
        $this->loadTimePeriods();
        $this->loadMemberDiscounts();
    }

    private function loadTimePeriods(): void
    {
        $this->timePeriods = TimePeriod::where('store_id', $this->storeId)
            ->where('status', 1)
            ->order('priority', 'asc')
            ->order('start_time', 'asc')
            ->select()
            ->toArray();
    }

    private function loadMemberDiscounts(): void
    {
        $discounts = MemberDiscount::where('store_id', $this->storeId)->find();
        if ($discounts && !empty($discounts['discounts'])) {
            $this->memberDiscounts = is_string($discounts['discounts']) 
                ? json_decode($discounts['discounts'], true) 
                : $discounts['discounts'];
        }
    }

    public function calculate(
        string $startTime,
        string $endTime,
        ?string $memberLevel = null
    ): array {
        if (empty($this->pricing)) {
            return [
                'total_amount' => 0,
                'duration_minutes' => 0,
                'billed_minutes' => 0,
                'details' => [],
                'discount_amount' => 0,
                'original_amount' => 0,
                'success' => false,
                'msg' => '未配置计费规则',
            ];
        }

        $startTimestamp = strtotime($startTime);
        $endTimestamp = strtotime($endTime);

        if ($startTimestamp === false || $endTimestamp === false) {
            return [
                'total_amount' => 0,
                'duration_minutes' => 0,
                'billed_minutes' => 0,
                'details' => [],
                'discount_amount' => 0,
                'original_amount' => 0,
                'success' => false,
                'msg' => '时间格式错误',
            ];
        }

        if ($startTimestamp >= $endTimestamp) {
            return [
                'total_amount' => 0,
                'duration_minutes' => 0,
                'billed_minutes' => 0,
                'details' => [],
                'discount_amount' => 0,
                'original_amount' => 0,
                'success' => false,
                'msg' => '结束时间必须大于开始时间',
            ];
        }

        $durationMinutes = (int)floor(($endTimestamp - $startTimestamp) / 60);
        $config = $this->getConfig();
        
        $minimumMinutes = (int)($config['minimumMinutes'] ?? 0);
        $minimumCharge = (float)($config['minimumCharge'] ?? 0);
        $roundingMode = $config['roundingMode'] ?? self::ROUNDING_PER_MINUTE;

        $calculation = $this->calculateByType($startTime, $endTime, $durationMinutes);
        $originalAmount = $calculation['total_amount'];
        $billedMinutes = $durationMinutes;

        if ($this->pricing->type === self::TYPE_HOURLY) {
            $billedMinutes = $calculation['details'][0]['billed_minutes'] ?? $durationMinutes;
        } elseif ($this->pricing->type === self::TYPE_TIME) {
            $billedMinutes = array_sum(array_column($calculation['details'], 'billed_minutes'));
        } else {
            $billedMinutes = $durationMinutes;
            foreach ($calculation['details'] as $detail) {
                if ($detail['type'] === 'extra') {
                    $billedMinutes += ($detail['billed_minutes'] ?? $detail['duration_minutes']) - $detail['duration_minutes'];
                }
            }
        }

        if ($minimumMinutes > 0 && $billedMinutes < $minimumMinutes) {
            $billedMinutes = $minimumMinutes;
            $recalculated = $this->calculateByTypeWithMinutes($startTime, $billedMinutes);
            $originalAmount = $recalculated['total_amount'];
            $calculation = $recalculated;
        }

        $discountAmount = 0;
        $discountRate = 1;
        $finalAmount = $originalAmount;
        
        if ($memberLevel && !empty($this->memberDiscounts)) {
            $discountRate = $this->getMemberDiscountRate($memberLevel);
            if ($discountRate < 1) {
                $discountAmount = $originalAmount * (1 - $discountRate);
                $finalAmount = $originalAmount * $discountRate;
            }
        }

        if ($minimumCharge > 0 && $finalAmount < $minimumCharge) {
            $finalAmount = $minimumCharge;
            if ($discountRate < 1) {
                $discountAmount = $originalAmount - ($finalAmount / $discountRate);
            }
        }

        return [
            'total_amount' => round($finalAmount, 2),
            'duration_minutes' => $durationMinutes,
            'billed_minutes' => $billedMinutes,
            'details' => $calculation['details'],
            'discount_amount' => round($discountAmount, 2),
            'original_amount' => round($originalAmount, 2),
            'member_level' => $memberLevel,
            'discount_rate' => $discountRate,
            'success' => true,
            'msg' => '计算成功',
        ];
    }

    private function calculateByType(
        string $startTime,
        string $endTime,
        int $durationMinutes
    ): array {
        switch ($this->pricing->type) {
            case self::TYPE_TIME:
                return $this->calculateTimeBased($startTime, $endTime, $durationMinutes);
            case self::TYPE_HOURLY:
                return $this->calculateHourly($durationMinutes);
            case self::TYPE_PERIOD:
                return $this->calculatePeriod($durationMinutes);
            default:
                return $this->calculateHourly($durationMinutes);
        }
    }

    private function calculateByTypeWithMinutes(string $startTime, int $minutes): array
    {
        $endTime = date('Y-m-d H:i:s', strtotime($startTime) + ($minutes * 60));
        return $this->calculateByType($startTime, $endTime, $minutes);
    }

    private function calculateTimeBased(
        string $startTime,
        string $endTime,
        int $durationMinutes
    ): array {
        $details = [];
        $totalAmount = 0;

        $config = $this->getConfig();
        $basePricePerHour = $config['pricePerHour'] ?? 0;
        $roundingMode = $config['roundingMode'] ?? self::ROUNDING_PER_MINUTE;

        $currentTime = strtotime($startTime);
        $endTimestamp = strtotime($endTime);

        while ($currentTime < $endTimestamp) {
            $period = $this->getMatchingPeriod(date('H:i:s', $currentTime));
            
            $minutesInPeriod = $this->calculateMinutesInPeriod(
                $currentTime,
                $endTimestamp,
                $period
            );

            if ($minutesInPeriod <= 0) {
                $currentTime += 60;
                continue;
            }

            $coefficient = $period ? ($period['coefficient'] ?? 1) : 1;
            $pricePerHour = $basePricePerHour * $coefficient;
            $periodName = $period ? $period['name'] : '默认时段';

            $billedMinutes = $this->applyRounding($minutesInPeriod, $roundingMode);
            $amount = $pricePerHour * ($billedMinutes / 60);

            $details[] = [
                'period_id' => $period['id'] ?? null,
                'period_name' => $periodName,
                'start_time' => date('H:i:s', $currentTime),
                'end_time' => date('H:i:s', min($currentTime + ($minutesInPeriod * 60), $endTimestamp)),
                'duration_minutes' => $minutesInPeriod,
                'billed_minutes' => $billedMinutes,
                'price_per_hour' => $pricePerHour,
                'coefficient' => $coefficient,
                'amount' => round($amount, 2),
            ];

            $totalAmount += $amount;
            $currentTime += $minutesInPeriod * 60;
        }

        return [
            'total_amount' => round($totalAmount, 2),
            'details' => $details,
        ];
    }

    private function calculateHourly(int $durationMinutes): array
    {
        $config = $this->getConfig();
        $pricePerHour = $config['pricePerHour'] ?? 0;
        $roundingMode = $config['roundingMode'] ?? self::ROUNDING_PER_MINUTE;

        $billedMinutes = $this->applyRounding($durationMinutes, $roundingMode);
        $totalAmount = $pricePerHour * ($billedMinutes / 60);

        return [
            'total_amount' => round($totalAmount, 2),
            'details' => [
                [
                    'type' => 'hourly',
                    'duration_minutes' => $durationMinutes,
                    'billed_minutes' => $billedMinutes,
                    'price_per_hour' => $pricePerHour,
                    'amount' => round($totalAmount, 2),
                ],
            ],
        ];
    }

    private function calculatePeriod(int $durationMinutes): array
    {
        $config = $this->getConfig();
        $packages = $config['periodPackages'] ?? [];
        $roundingMode = $config['roundingMode'] ?? self::ROUNDING_PER_MINUTE;

        if (empty($packages)) {
            return $this->calculateHourly($durationMinutes);
        }

        usort($packages, function ($a, $b) {
            return ($a['duration'] ?? 0) - ($b['duration'] ?? 0);
        });

        $remainingMinutes = $durationMinutes;
        $totalAmount = 0;
        $details = [];

        while ($remainingMinutes > 0) {
            $bestPackage = null;
            $bestValue = 0;

            foreach ($packages as $pkg) {
                $pkgDuration = $pkg['duration'] ?? 60;
                $pkgPrice = $pkg['price'] ?? 0;
                
                if ($pkgDuration <= $remainingMinutes) {
                    $value = $pkgDuration / $pkgPrice;
                    if ($value > $bestValue) {
                        $bestValue = $value;
                        $bestPackage = $pkg;
                    }
                }
            }

            if (!$bestPackage) {
                break;
            }

            $pkgDuration = $bestPackage['duration'] ?? 60;
            $pkgPrice = $bestPackage['price'] ?? 0;

            $details[] = [
                'package_id' => $bestPackage['id'] ?? null,
                'package_name' => $bestPackage['name'] ?? '套餐',
                'duration_minutes' => $pkgDuration,
                'price' => $pkgPrice,
            ];

            $totalAmount += $pkgPrice;
            $remainingMinutes -= $pkgDuration;
        }

        if ($remainingMinutes > 0) {
            $pricePerHour = $config['pricePerHour'] ?? 0;
            $billedMinutes = $this->applyRounding($remainingMinutes, $roundingMode);
            $amount = $pricePerHour * ($billedMinutes / 60);
            
            $details[] = [
                'type' => 'extra',
                'duration_minutes' => $remainingMinutes,
                'billed_minutes' => $billedMinutes,
                'price_per_hour' => $pricePerHour,
                'amount' => round($amount, 2),
            ];
            
            $totalAmount += $amount;
        }

        return [
            'total_amount' => round($totalAmount, 2),
            'details' => $details,
        ];
    }

    private function getMatchingPeriod(string $time): ?array
    {
        foreach ($this->timePeriods as $period) {
            $start = $period['start_time'];
            $end = $period['end_time'];

            if ($start <= $end) {
                if ($time >= $start && $time < $end) {
                    return $period;
                }
            } else {
                if ($time >= $start || $time < $end) {
                    return $period;
                }
            }
        }

        return null;
    }

    private function calculateMinutesInPeriod(
        int $currentTime,
        int $endTimestamp,
        ?array $period
    ): int {
        if (!$period) {
            return 60;
        }

        $periodEnd = $this->getPeriodEndTimestamp($currentTime, $period['end_time']);
        
        $endOfCurrentPeriod = min($periodEnd, $endTimestamp);
        $minutes = (int)floor(($endOfCurrentPeriod - $currentTime) / 60);

        return max(1, $minutes);
    }

    private function getPeriodEndTimestamp(int $currentTime, string $endTime): int
    {
        $currentDate = date('Y-m-d', $currentTime);
        $periodEnd = strtotime($currentDate . ' ' . $endTime);

        if ($periodEnd <= $currentTime) {
            $periodEnd = strtotime($currentDate . ' ' . $endTime . ' +1 day');
        }

        return $periodEnd;
    }

    private function applyRounding(int $minutes, string $mode): int
    {
        switch ($mode) {
            case self::ROUNDING_MIN_30:
                return (int)ceil($minutes / 30) * 30;
            case self::ROUNDING_PER_HOUR:
                return (int)ceil($minutes / 60) * 60;
            case self::ROUNDING_PER_MINUTE:
            default:
                return $minutes;
        }
    }

    private function getMemberDiscountRate(string $memberLevel): float
    {
        foreach ($this->memberDiscounts as $discount) {
            if ($discount['level'] === $memberLevel && (!empty($discount['enabled']) || !isset($discount['enabled']))) {
                return $discount['discountRate'] ?? 1.0;
            }
        }
        return 1.0;
    }

    private function getConfig(): array
    {
        if (empty($this->pricing->config)) {
            return [];
        }
        
        if (is_string($this->pricing->config)) {
            return json_decode($this->pricing->config, true) ?? [];
        }
        
        if (is_object($this->pricing->config)) {
            return (array)$this->pricing->config;
        }
        
        return $this->pricing->config;
    }

    public static function createByPricingId(string $storeId, string $pricingId): self
    {
        $pricing = Pricing::where('id', $pricingId)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->find();

        return new self($storeId, $pricing);
    }

    public static function createByTableId(string $tableId): ?self
    {
        $table = \app\common\model\merchant\Table::where('id', $tableId)->find();
        if (!$table) {
            return null;
        }

        $pricing = null;
        if ($table->pricing_id) {
            $pricing = Pricing::where('id', $table->pricing_id)
                ->where('store_id', $table->store_id)
                ->where('status', 1)
                ->find();
        }

        return new self($table->store_id, $pricing);
    }

    public static function calculateByPricingId(
        string $storeId,
        string $pricingId,
        string $startTime,
        string $endTime,
        ?string $memberLevel = null
    ): array {
        $calculator = self::createByPricingId($storeId, $pricingId);
        return $calculator->calculate($startTime, $endTime, $memberLevel);
    }

    public static function calculateByTableId(
        string $tableId,
        string $startTime,
        string $endTime,
        ?string $memberLevel = null
    ): array {
        $calculator = self::createByTableId($tableId);
        if (!$calculator) {
            return [
                'total_amount' => 0,
                'duration_minutes' => 0,
                'billed_minutes' => 0,
                'details' => [],
                'discount_amount' => 0,
                'original_amount' => 0,
                'success' => false,
                'msg' => '台桌不存在',
            ];
        }
        return $calculator->calculate($startTime, $endTime, $memberLevel);
    }
}
