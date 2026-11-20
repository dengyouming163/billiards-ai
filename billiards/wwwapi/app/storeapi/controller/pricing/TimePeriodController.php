<?php

declare(strict_types=1);

namespace app\storeapi\controller\pricing;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\TimePeriodLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class TimePeriodController extends BaseStoreController
{
    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $storeId = $this->storeId;

        $data = TimePeriodLogic::getList($storeId);

        return JsonService::data($data);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function detail()
    {
        $id = input('id', '');

        if (empty($id)) {
            return JsonService::fail('参数错误：id不能为空');
        }

        $data = TimePeriodLogic::getDetail($id);

        if (!$data) {
            return JsonService::fail('时段不存在');
        }

        return JsonService::data($data);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $storeId = $this->storeId;
        $data = [
            'store_id' => $storeId,
            'name' => input('name', ''),
            'color' => input('color', '#22c55e'),
            'start_time' => input('start_time', ''),
            'end_time' => input('end_time', ''),
            'coefficient' => input('coefficient', 1.0),
            'priority' => input('priority', 0),
        ];

        $result = TimePeriodLogic::create($data);

        if ($result['code'] !== 0) {
            return JsonService::fail($result['msg']);
        }

        return JsonService::success('创建成功', $result['data'] ?? null);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function update()
    {
        $id = input('id', '');

        if (empty($id)) {
            return JsonService::fail('参数错误：id不能为空');
        }

        $data = [
            'name' => input('name', ''),
            'color' => input('color', ''),
            'start_time' => input('start_time', ''),
            'end_time' => input('end_time', ''),
            'coefficient' => input('coefficient', ''),
            'priority' => input('priority', ''),
        ];

        $result = TimePeriodLogic::update($id, $data);

        if ($result['code'] !== 0) {
            return JsonService::fail($result['msg']);
        }

        return JsonService::success('更新成功', $result['data'] ?? null);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function delete()
    {
        $id = input('id', '');

        if (empty($id)) {
            return JsonService::fail('参数错误：id不能为空');
        }

        $result = TimePeriodLogic::delete($id);

        if ($result['code'] !== 0) {
            return JsonService::fail($result['msg']);
        }

        return JsonService::success('删除成功');
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle()
    {
        $id = input('id', '');

        if (empty($id)) {
            return JsonService::fail('参数错误：id不能为空');
        }

        $result = TimePeriodLogic::toggleStatus($id);

        if ($result['code'] !== 0) {
            return JsonService::fail($result['msg']);
        }

        return JsonService::success('操作成功', $result['data'] ?? null);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function validateOverlap()
    {
        $storeId = $this->storeId;
        $data = [
            'exclude_id' => input('exclude_id', null),
            'name' => input('name', ''),
            'start_time' => input('start_time', ''),
            'end_time' => input('end_time', ''),
        ];

        $result = TimePeriodLogic::validateOverlap($storeId, $data);

        if ($result['code'] !== 0) {
            return JsonService::fail($result['msg']);
        }

        return JsonService::data($result['data']);
    }
}
