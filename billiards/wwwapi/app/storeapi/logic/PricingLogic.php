<?php

declare(strict_types=1);

namespace app\storeapi\logic;

use app\common\logic\PricingCalculator;
use app\common\model\merchant\Pricing;
use app\common\model\merchant\TimePeriod;
use app\common\model\merchant\Table;
use think\facade\Db;

/**
 * 计费规则 Logic
 */
class PricingLogic
{
    /**
     * 获取计费规则列表
     */
    public static function getList(string $storeId): array
    {
        $rules = Pricing::where('store_id', $storeId)
            ->order('sort_order', 'asc')
            ->order('priority', 'desc')
            ->select()
            ->toArray();

        return array_map(function ($rule) {
            return self::formatRule($rule);
        }, $rules);
    }

    /**
     * 获取单个计费规则详情
     */
    public static function getDetail(string $id): ?array
    {
        $rule = Pricing::find($id);
        if (!$rule) {
            return null;
        }

        return self::formatRule($rule->toArray());
    }

    /**
     * 创建计费规则
     */
    public static function create(array $data): array
    {
        if (empty($data['name'])) {
            return ['code' => 400, 'msg' => '规则名称不能为空'];
        }

        if (empty($data['type'])) {
            return ['code' => 400, 'msg' => '计费类型不能为空'];
        }

        $validTypes = [Pricing::TYPE_TIME, Pricing::TYPE_HOURLY, Pricing::TYPE_PERIOD];
        if (!in_array($data['type'], $validTypes)) {
            return ['code' => 400, 'msg' => '不支持的计费类型'];
        }

        $config = self::buildConfig($data);

        $rule = Pricing::create([
            'id' => uniqid('pr_'),
            'store_id' => $data['store_id'],
            'name' => $data['name'],
            'type' => $data['type'],
            'description' => $data['description'] ?? '',
            'boundary_strategy' => $data['boundary_strategy'] ?? Pricing::BOUNDARY_PER_MINUTE,
            'config' => $config,
            'weekday_types' => json_encode($data['weekday_types'] ?? ['all']),
            'status' => 1,
            'sort_order' => (int) ($data['sort_order'] ?? 0),
            'priority' => (int) ($data['priority'] ?? 1),
        ]);

        return [
            'code' => 0,
            'msg' => '创建成功',
            'data' => self::formatRule($rule->toArray()),
        ];
    }

    /**
     * 更新计费规则
     */
    public static function update(string $id, array $data): array
    {
        $rule = Pricing::find($id);
        if (!$rule) {
            return ['code' => 404, 'msg' => '计费规则不存在'];
        }

        $updateData = [];

        if (isset($data['name'])) {
            $updateData['name'] = $data['name'];
        }

        if (isset($data['description'])) {
            $updateData['description'] = $data['description'];
        }

        if (isset($data['boundary_strategy'])) {
            $updateData['boundary_strategy'] = $data['boundary_strategy'];
        }

        if (isset($data['config'])) {
            $updateData['config'] = self::buildConfig($data);
        }

        if (isset($data['weekday_types'])) {
            $updateData['weekday_types'] = json_encode($data['weekday_types']);
        }

        if (isset($data['sort_order'])) {
            $updateData['sort_order'] = (int) $data['sort_order'];
        }

        if (isset($data['priority'])) {
            $updateData['priority'] = (int) $data['priority'];
        }

        $rule->save($updateData);

        return [
            'code' => 0,
            'msg' => '更新成功',
            'data' => self::formatRule($rule->toArray()),
        ];
    }

    /**
     * 删除计费规则
     */
    public static function delete(string $id): array
    {
        $rule = Pricing::find($id);
        if (!$rule) {
            return ['code' => 404, 'msg' => '计费规则不存在'];
        }

        $tableUsing = Table::where('pricing_id', $id)->count();
        if ($tableUsing > 0) {
            return ['code' => 400, 'msg' => "该规则正被{$tableUsing}个桌台使用，无法删除"];
        }

        $rule->save(['status' => 0]);

        return [
            'code' => 0,
            'msg' => '删除成功',
        ];
    }

    /**
     * 切换计费规则状态
     */
    public static function toggleStatus(string $id): array
    {
        $rule = Pricing::find($id);
        if (!$rule) {
            return ['code' => 404, 'msg' => '计费规则不存在'];
        }

        $newStatus = $rule->status === 1 ? 0 : 1;
        $rule->save(['status' => $newStatus]);

        return [
            'code' => 0,
            'msg' => $newStatus === 1 ? '启用成功' : '禁用成功',
            'data' => [
                'status' => $newStatus,
            ],
        ];
    }

    /**
     * 计算费用
     */
    public static function calculate(array $data): array
    {
        $tableId = $data['table_id'] ?? '';
        $startTime = $data['start_time'] ?? '';
        $durationMinutes = (int) ($data['duration_minutes'] ?? 0);
        $memberLevel = $data['member_level'] ?? null;

        if (empty($tableId)) {
            return ['code' => 400, 'msg' => '桌台ID不能为空'];
        }

        if (empty($startTime)) {
            return ['code' => 400, 'msg' => '开始时间不能为空'];
        }

        if ($durationMinutes <= 0) {
            return ['code' => 400, 'msg' => '时长必须大于0'];
        }

        $table = Table::find($tableId);
        if (!$table) {
            return ['code' => 404, 'msg' => '桌台不存在'];
        }

        $rule = Pricing::find($table->pricing_id);
        if (!$rule) {
            return ['code' => 404, 'msg' => '桌台未绑定计费规则'];
        }

        try {
            $startDateTime = new \DateTime($startTime);
            $result = PricingCalculator::calculateFee(
                $rule,
                $startDateTime,
                $durationMinutes,
                (float) $table->hourly_rate,
                $memberLevel
            );

            return [
                'code' => 0,
                'msg' => 'success',
                'data' => $result,
            ];
        } catch (\Exception $e) {
            return ['code' => 500, 'msg' => '计算失败：' . $e->getMessage()];
        }
    }

    /**
     * 构建计费配置
     */
    protected static function buildConfig(array $data): array
    {
        $type = $data['type'] ?? Pricing::TYPE_HOURLY;

        switch ($type) {
            case Pricing::TYPE_TIME:
                return [
                    'type' => 'time',
                    'boundaryStrategy' => $data['boundary_strategy'] ?? Pricing::BOUNDARY_PER_MINUTE,
                    'timePeriodIds' => $data['time_period_ids'] ?? [],
                ];

            case Pricing::TYPE_HOURLY:
                return [
                    'type' => 'hourly',
                    'baseRate' => (float) ($data['base_rate'] ?? 40.0),
                    'roundingMode' => $data['rounding_mode'] ?? Pricing::ROUNDING_EXACT,
                    'minimumMinutes' => (int) ($data['minimum_minutes'] ?? 0),
                ];

            case Pricing::TYPE_PERIOD:
                $packages = [];
                foreach (($data['packages'] ?? []) as $index => $package) {
                    $packages[] = [
                        'id' => $package['id'] ?? uniqid('pkg_'),
                        'name' => $package['name'] ?? "套餐" . ($index + 1),
                        'duration' => (int) ($package['duration'] ?? 120),
                        'price' => (float) ($package['price'] ?? 0),
                        'description' => $package['description'] ?? '',
                        'status' => 'active',
                    ];
                }

                return [
                    'type' => 'period',
                    'packages' => $packages,
                    'overtimeRate' => (float) ($data['overtime_rate'] ?? 35.0),
                ];

            default:
                return [];
        }
    }

    /**
     * 格式化计费规则
     */
    protected static function formatRule(array $rule): array
    {
        $config = is_string($rule['config']) ? json_decode($rule['config'], true) : ($rule['config'] ?? []);
        $weekdayTypes = is_string($rule['weekday_types']) ? json_decode($rule['weekday_types'], true) : ($rule['weekday_types'] ?? []);

        $formatted = [
            'id' => $rule['id'],
            'store_id' => $rule['store_id'],
            'name' => $rule['name'],
            'type' => $rule['type'],
            'type_text' => Pricing::TYPE_LABELS[$rule['type']] ?? $rule['type'],
            'description' => $rule['description'] ?? '',
            'boundary_strategy' => $rule['boundary_strategy'] ?? Pricing::BOUNDARY_PER_MINUTE,
            'boundary_strategy_text' => Pricing::BOUNDARY_LABELS[$rule['boundary_strategy']] ?? '逐分钟精确计算',
            'config' => $config,
            'weekday_types' => $weekdayTypes,
            'status' => (int) $rule['status'],
            'status_text' => $rule['status'] === 1 ? '启用' : '禁用',
            'sort_order' => (int) $rule['sort_order'],
            'priority' => (int) $rule['priority'],
            'created_at' => $rule['created_at'],
            'updated_at' => $rule['updated_at'],
        ];

        switch ($rule['type']) {
            case Pricing::TYPE_TIME:
                $formatted['time_period_ids'] = $config['timePeriodIds'] ?? [];
                $formatted['time_periods'] = self::getTimePeriodsDetail($config['timePeriodIds'] ?? []);
                break;

            case Pricing::TYPE_HOURLY:
                $formatted['base_rate'] = $config['baseRate'] ?? 40.0;
                $formatted['rounding_mode'] = $config['roundingMode'] ?? Pricing::ROUNDING_EXACT;
                $formatted['rounding_mode_text'] = Pricing::ROUNDING_LABELS[$config['roundingMode']] ?? '精确到分钟';
                $formatted['minimum_minutes'] = $config['minimumMinutes'] ?? 0;
                break;

            case Pricing::TYPE_PERIOD:
                $formatted['packages'] = $config['packages'] ?? [];
                $formatted['overtime_rate'] = $config['overtimeRate'] ?? 35.0;
                break;
        }

        return $formatted;
    }

    /**
     * 获取时段详情
     */
    protected static function getTimePeriodsDetail(array $periodIds): array
    {
        if (empty($periodIds)) {
            return [];
        }

        $periods = TimePeriod::whereIn('id', $periodIds)
            ->where('status', 1)
            ->order('priority', 'desc')
            ->select()
            ->toArray();

        return array_map(function ($period) {
            return [
                'id' => $period['id'],
                'name' => $period['name'],
                'color' => $period['color'],
                'start_time' => substr($period['start_time'], 0, 5),
                'end_time' => substr($period['end_time'], 0, 5),
                'coefficient' => (float) $period['coefficient'],
                'priority' => (int) $period['priority'],
            ];
        }, $periods);
    }
}
