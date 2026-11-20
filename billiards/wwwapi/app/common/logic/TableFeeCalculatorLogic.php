<?php

declare (strict_types=1);

namespace app\common\logic;

use app\common\model\merchant\Table;
use app\common\model\merchant\Order;
use app\common\model\merchant\Pricing;
use app\common\model\merchant\PricingPeriod;
use app\common\model\merchant\Member;

class TableFeeCalculatorLogic extends BaseLogic
{
    const PRICING_TYPE_HOURLY = 'hourly';
    const PRICING_TYPE_PERIOD = 'period';
    const PRICING_TYPE_MEMBER = 'member';
    const PRICING_TYPE_PACKAGE = 'package';

    private $table;
    private $order;
    private $member;
    private $pricing;
    private $periods = [];

    public function __construct(Table $table, Order $order = null, Member $member = null)
    {
        $this->table = $table;
        $this->order = $order;
        $this->member = $member;
        $this->loadPricing();
    }

    private function loadPricing(): void
    {
        if ($this->table->pricing_id) {
            $this->pricing = Pricing::where('id', $this->table->pricing_id)->find();
            if ($this->pricing) {
                $this->periods = PricingPeriod::where('pricing_id', $this->pricing->id)
                    ->order('start_time')
                    ->select()->toArray();
            }
        }
    }

    public function getCurrentPricingType(): string
    {
        if (!empty($this->periods)) {
            return self::PRICING_TYPE_PERIOD;
        }
        if ($this->member && $this->member->level_id) {
            return self::PRICING_TYPE_MEMBER;
        }
        return self::PRICING_TYPE_HOURLY;
    }

    public function getCurrentHourlyRate(float $currentTime = null): float
    {
        if ($currentTime === null) {
            $currentTime = time();
        }

        if (!empty($this->periods)) {
            return $this->getPeriodRate($currentTime);
        }

        $baseRate = (float)($this->table->hourly_rate ?? 0);
        
        if ($this->member) {
            $baseRate = $this->applyMemberDiscount($baseRate);
        }

        return $baseRate;
    }

    private function getPeriodRate(float $currentTime): float
    {
        $currentHour = date('H:i:s', $currentTime);
        $currentWeekday = date('w', $currentTime);

        foreach ($this->periods as $period) {
            if (!empty($period['weekdays'])) {
                $weekdays = explode(',', $period['weekdays']);
                if (!in_array($currentWeekday, $weekdays)) {
                    continue;
                }
            }

            $start = $period['start_time'];
            $end = $period['end_time'];

            if ($start <= $end) {
                if ($currentHour >= $start && $currentHour < $end) {
                    return $this->calculatePeriodPrice($period);
                }
            } else {
                if ($currentHour >= $start || $currentHour < $end) {
                    return $this->calculatePeriodPrice($period);
                }
            }
        }

        return (float)($this->table->hourly_rate ?? 0);
    }

    private function calculatePeriodPrice(array $period): float
    {
        $price = (float)($period['price'] ?? ($this->table->hourly_rate ?? 0));
        
        if (isset($period['coefficient']) && $period['coefficient'] != 1) {
            $price = $price * $period['coefficient'];
        }

        if ($this->member) {
            $price = $this->applyMemberDiscount($price);
        }

        return $price;
    }

    private function applyMemberDiscount(float $baseRate): float
    {
        if (!$this->member || !$this->member->level_id) {
            return $baseRate;
        }

        // 从会员等级表读取真实折扣率（discount_rate = 95 表示 95折 = 95%）
        $level = \app\common\model\merchant\MemberLevel::where('id', $this->member->level_id)->find();
        $discountRate = $level ? floatval($level->discount_rate ?? $level['discount_rate'] ?? 100) : 100;
        if ($discountRate <= 0 || $discountRate >= 100) {
            return $baseRate;
        }
        return $baseRate * ($discountRate / 100);
    }

    public function calculateFee(int $durationMinutes): float
    {
        if ($durationMinutes <= 0) {
            return 0;
        }

        if ($this->order && $this->order->prepaid_hours > 0) {
            return $this->calculatePrepaidFee($durationMinutes);
        }

        $totalFee = 0;
        $startTime = strtotime($this->order->start_time);
        
        for ($i = 0; $i < $durationMinutes; $i++) {
            $currentTime = $startTime + ($i * 60);
            $hourlyRate = $this->getCurrentHourlyRate($currentTime);
            $totalFee += $hourlyRate / 60;
        }

        return round($totalFee, 2);
    }

    private function calculatePrepaidFee(int $durationMinutes): float
    {
        $prepaidMinutes = $this->order->prepaid_hours * 60;
        
        if ($durationMinutes <= $prepaidMinutes) {
            return 0;
        }

        $extraMinutes = $durationMinutes - $prepaidMinutes;
        $extraHours = ceil($extraMinutes / 60);
        
        $rate = $this->getCurrentHourlyRate();
        return round($rate * $extraHours, 2);
    }

    public function calculateEstimatedFee(int $additionalMinutes = 0): float
    {
        if (!$this->order || !$this->order->start_time) {
            return 0;
        }

        $startTime = strtotime($this->order->start_time);
        $currentDuration = (int) floor((time() - $startTime) / 60);
        $totalDuration = $currentDuration + $additionalMinutes;

        return $this->calculateFee($totalDuration);
    }

    public function getPricingInfo(): array
    {
        return [
            'pricing_type' => $this->getCurrentPricingType(),
            'current_rate' => $this->getCurrentHourlyRate(),
            'base_rate' => $this->table->hourly_rate ?? 0,
            'has_pricing' => !empty($this->pricing),
            'periods' => $this->periods,
            'is_member_discount' => !empty($this->member),
        ];
    }

    public static function calculateOrderFee(Order $order): float
    {
        $table = Table::where('id', $order->table_id)->find();
        if (!$table) {
            return 0;
        }

        $member = null;
        if ($order->member_id) {
            $member = Member::where('id', $order->member_id)->find();
        }

        $calculator = new self($table, $order, $member);
        return $calculator->calculateFee($order->duration_minutes ?? 0);
    }

    public static function getTableCurrentRate(string $tableId, string $memberId = null): float
    {
        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return 0;
        }

        $member = null;
        if ($memberId) {
            $member = Member::where('id', $memberId)->find();
        }

        $calculator = new self($table, null, $member);
        return $calculator->getCurrentHourlyRate();
    }

    public static function estimateOrderFee(string $tableId, string $startTime, string $memberId = null): float
    {
        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return 0;
        }

        $member = null;
        if ($memberId) {
            $member = Member::where('id', $memberId)->find();
        }

        $durationMinutes = (int) floor((time() - strtotime($startTime)) / 60);
        $calculator = new self($table, null, $member);
        return $calculator->calculateFee($durationMinutes);
    }
}