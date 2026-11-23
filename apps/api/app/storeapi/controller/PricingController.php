<?php

declare(strict_types=1);

namespace app\storeapi\controller;

use app\storeapi\logic\PricingLogic;
use app\common\annotation\Permission;
use think\Response;

class PricingController extends BaseStoreController
{
    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function list(): Response
    {
        $storeId = $this->storeId;

        $data = PricingLogic::getList($storeId);

        return json(['code' => 0, 'msg' => 'success', 'data' => $data]);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function detail(): Response
    {
        $id = input('id', '');

        if (empty($id)) {
            return json(['code' => 400, 'msg' => '参数错误：id不能为空']);
        }

        $data = PricingLogic::getDetail($id);

        if (!$data) {
            return json(['code' => 404, 'msg' => '计费规则不存在']);
        }

        return json(['code' => 0, 'msg' => 'success', 'data' => $data]);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function create(): Response
    {
        $storeId = $this->storeId;

        $data = [
            'store_id' => $storeId,
            'name' => input('name', ''),
            'type' => input('type', ''),
            'description' => input('description', ''),
            'boundary_strategy' => input('boundary_strategy', 'per_minute'),
            'time_period_ids' => input('time_period_ids', []),
            'base_rate' => input('base_rate', 40.0),
            'rounding_mode' => input('rounding_mode', 'exact'),
            'minimum_minutes' => input('minimum_minutes', 0),
            'packages' => input('packages', []),
            'overtime_rate' => input('overtime_rate', 35.0),
            'weekday_types' => input('weekday_types', ['all']),
            'sort_order' => input('sort_order', 0),
            'priority' => input('priority', 1),
        ];

        $packagesJson = input('packages', '[]');
        $packages = json_decode($packagesJson, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $data['packages'] = $packages;
        }

        $timePeriodIdsJson = input('time_period_ids', '[]');
        $timePeriodIds = json_decode($timePeriodIdsJson, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $data['time_period_ids'] = $timePeriodIds;
        }

        $weekdayTypesJson = input('weekday_types', '["all"]');
        $weekdayTypes = json_decode($weekdayTypesJson, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            $data['weekday_types'] = $weekdayTypes;
        }

        $result = PricingLogic::create($data);

        return json(['code' => $result['code'], 'msg' => $result['msg'], 'data' => $result['data'] ?? null]);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function update(): Response
    {
        $id = input('id', '');

        if (empty($id)) {
            return json(['code' => 400, 'msg' => '参数错误：id不能为空']);
        }

        $data = [
            'name' => input('name', ''),
            'description' => input('description', ''),
            'boundary_strategy' => input('boundary_strategy', ''),
            'time_period_ids' => input('time_period_ids', []),
            'base_rate' => input('base_rate', ''),
            'rounding_mode' => input('rounding_mode', ''),
            'minimum_minutes' => input('minimum_minutes', ''),
            'packages' => input('packages', []),
            'overtime_rate' => input('overtime_rate', ''),
            'weekday_types' => input('weekday_types', []),
            'sort_order' => input('sort_order', ''),
            'priority' => input('priority', ''),
        ];

        $packagesJson = input('packages', '');
        if (!empty($packagesJson)) {
            $packages = json_decode($packagesJson, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['packages'] = $packages;
            }
        }

        $timePeriodIdsJson = input('time_period_ids', '');
        if (!empty($timePeriodIdsJson)) {
            $timePeriodIds = json_decode($timePeriodIdsJson, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['time_period_ids'] = $timePeriodIds;
            }
        }

        $weekdayTypesJson = input('weekday_types', '');
        if (!empty($weekdayTypesJson)) {
            $weekdayTypes = json_decode($weekdayTypesJson, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $data['weekday_types'] = $weekdayTypes;
            }
        }

        $result = PricingLogic::update($id, $data);

        return json(['code' => $result['code'], 'msg' => $result['msg'], 'data' => $result['data'] ?? null]);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function delete(): Response
    {
        $id = input('id', '');

        if (empty($id)) {
            return json(['code' => 400, 'msg' => '参数错误：id不能为空']);
        }

        $result = PricingLogic::delete($id);

        return json(['code' => $result['code'], 'msg' => $result['msg']]);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle(): Response
    {
        $id = input('id', '');

        if (empty($id)) {
            return json(['code' => 400, 'msg' => '参数错误：id不能为空']);
        }

        $result = PricingLogic::toggleStatus($id);

        return json(['code' => $result['code'], 'msg' => $result['msg'], 'data' => $result['data'] ?? null]);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function calculate(): Response
    {
        $data = [
            'table_id' => input('table_id', ''),
            'start_time' => input('start_time', ''),
            'duration_minutes' => input('duration_minutes', 0),
            'member_level' => input('member_level', null),
        ];

        $result = PricingLogic::calculate($data);

        return json(['code' => $result['code'], 'msg' => $result['msg'], 'data' => $result['data'] ?? null]);
    }
}
