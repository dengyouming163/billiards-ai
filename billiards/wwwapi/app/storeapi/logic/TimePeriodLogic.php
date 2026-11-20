<?php

declare(strict_types=1);

namespace app\storeapi\logic;

use app\common\logic\TimePeriodValidator;
use app\common\model\merchant\TimePeriod;
use think\facade\Db;

/**
 * 时段配置 Logic
 */
class TimePeriodLogic
{
    /**
     * 获取门店时段列表
     */
    public static function getList(string $storeId): array
    {
        $periods = TimePeriod::where('store_id', $storeId)
            ->order('priority', 'desc')
            ->order('start_time', 'asc')
            ->select()
            ->toArray();

        return array_map(function ($period) {
            return self::formatPeriod($period);
        }, $periods);
    }

    /**
     * 获取单个时段详情
     */
    public static function getDetail(string $id): ?array
    {
        $period = TimePeriod::find($id);
        if (!$period) {
            return null;
        }

        return self::formatPeriod($period->toArray());
    }

    /**
     * 创建时段
     */
    public static function create(array $data): array
    {
        $validation = TimePeriodValidator::validatePeriodData($data);
        if (!$validation['valid']) {
            return ['code' => 400, 'msg' => implode(', ', $validation['errors'])];
        }

        $existingPeriods = TimePeriod::where('store_id', $data['store_id'])
            ->where('status', 1)
            ->select()
            ->toArray();

        $validation = TimePeriodValidator::validateSingle($data, $existingPeriods);
        if (!$validation['valid']) {
            return ['code' => 400, 'msg' => implode(', ', $validation['errors'])];
        }

        $period = TimePeriod::create([
            'id' => uniqid('tp_'),
            'store_id' => $data['store_id'],
            'name' => $data['name'],
            'color' => $data['color'] ?? '#22c55e',
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'coefficient' => (float) ($data['coefficient'] ?? 1.0),
            'priority' => (int) ($data['priority'] ?? 0),
            'status' => 1,
        ]);

        return [
            'code' => 0,
            'msg' => '创建成功',
            'data' => self::formatPeriod($period->toArray()),
        ];
    }

    /**
     * 更新时段
     */
    public static function update(string $id, array $data): array
    {
        $period = TimePeriod::find($id);
        if (!$period) {
            return ['code' => 404, 'msg' => '时段不存在'];
        }

        $validation = TimePeriodValidator::validatePeriodData($data);
        if (!$validation['valid']) {
            return ['code' => 400, 'msg' => implode(', ', $validation['errors'])];
        }

        $existingPeriods = TimePeriod::where('store_id', $period->store_id)
            ->where('id', '<>', $id)
            ->where('status', 1)
            ->select()
            ->toArray();

        $validation = TimePeriodValidator::validateSingle($data, $existingPeriods);
        if (!$validation['valid']) {
            return ['code' => 400, 'msg' => implode(', ', $validation['errors'])];
        }

        $period->save([
            'name' => $data['name'],
            'color' => $data['color'] ?? $period->color,
            'start_time' => $data['start_time'],
            'end_time' => $data['end_time'],
            'coefficient' => (float) ($data['coefficient'] ?? $period->coefficient),
            'priority' => (int) ($data['priority'] ?? $period->priority),
        ]);

        return [
            'code' => 0,
            'msg' => '更新成功',
            'data' => self::formatPeriod($period->toArray()),
        ];
    }

    /**
     * 删除时段
     */
    public static function delete(string $id): array
    {
        $period = TimePeriod::find($id);
        if (!$period) {
            return ['code' => 404, 'msg' => '时段不存在'];
        }

        $period->save(['status' => 0]);

        return [
            'code' => 0,
            'msg' => '删除成功',
        ];
    }

    /**
     * 切换时段状态
     */
    public static function toggleStatus(string $id): array
    {
        $period = TimePeriod::find($id);
        if (!$period) {
            return ['code' => 404, 'msg' => '时段不存在'];
        }

        $newStatus = $period->status === 1 ? 0 : 1;
        $period->save(['status' => $newStatus]);

        return [
            'code' => 0,
            'msg' => $newStatus === 1 ? '启用成功' : '禁用成功',
            'data' => [
                'status' => $newStatus,
            ],
        ];
    }

    /**
     * 校验时段重叠
     */
    public static function validateOverlap(string $storeId, array $data): array
    {
        $existingPeriods = TimePeriod::where('store_id', $storeId)
            ->where('status', 1)
            ->select()
            ->toArray();

        $excludeId = $data['exclude_id'] ?? null;
        $validation = TimePeriodValidator::validateSingle($data, $existingPeriods, $excludeId);

        return [
            'code' => 0,
            'data' => [
                'valid' => $validation['valid'],
                'errors' => $validation['errors'],
            ],
        ];
    }

    /**
     * 格式化时段数据
     */
    protected static function formatPeriod(array $period): array
    {
        return [
            'id' => $period['id'],
            'store_id' => $period['store_id'],
            'name' => $period['name'],
            'color' => $period['color'],
            'start_time' => substr($period['start_time'], 0, 5),
            'end_time' => substr($period['end_time'], 0, 5),
            'coefficient' => (float) $period['coefficient'],
            'priority' => (int) $period['priority'],
            'status' => (int) $period['status'],
            'status_text' => $period['status'] === 1 ? '启用' : '禁用',
            'is_cross_day' => TimePeriodValidator::isCrossDay($period),
            'time_range' => TimePeriodValidator::getTimeRangeText($period),
            'created_at' => $period['created_at'],
            'updated_at' => $period['updated_at'],
        ];
    }
}
