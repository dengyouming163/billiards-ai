<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\common\model\merchant\Assistant;
use app\common\service\JsonService;

class AssistantController extends BaseStoreController
{
    /**
     * 助教上岗（开始接单）
     * POST /mobile.Assistant/goOnline
     */
    public function goOnline()
    {
        $assistant = Assistant::where('employee_id', $this->employeeId)
            ->where('store_id', $this->storeId)
            ->find();

        if (!$assistant) {
            return JsonService::fail('未找到助教信息');
        }

        $assistant->status = 1;
        $assistant->save();

        return JsonService::success('已上线，开始接单', ['status' => 1]);
    }

    /**
     * 助教下岗（停止接单，不影响进行中的服务）
     * POST /mobile.Assistant/goOffline
     */
    public function goOffline()
    {
        $assistant = Assistant::where('employee_id', $this->employeeId)
            ->where('store_id', $this->storeId)
            ->find();

        if (!$assistant) {
            return JsonService::fail('未找到助教信息');
        }

        $assistant->status = 0;
        $assistant->save();

        return JsonService::success('已下线，不再接收新订单', ['status' => 0]);
    }

    /**
     * 获取当前助教状态
     * GET /mobile.Assistant/status
     */
    public function status()
    {
        $assistant = Assistant::where('employee_id', $this->employeeId)
            ->where('store_id', $this->storeId)
            ->find();

        if (!$assistant) {
            return JsonService::success('success', ['status' => 0]);
        }

        return JsonService::success('success', ['status' => (int)$assistant->status]);
    }

    /**
     * 助教列表（仅在线助教 status=1 或服务中 status=2）
     */
    public function list()
    {
        $storeId = $this->request->get('store_id', $this->storeId);

        $assistants = Assistant::where('store_id', $storeId)
            ->whereIn('status', [1, 2])
            ->field('id, name, phone, level_id, hourly_rate, status, employee_id')
            ->select();

        // 查等级名称
        $levelIds = [];
        foreach ($assistants as $a) { if (!empty($a['level_id'])) $levelIds[] = $a['level_id']; }
        $levelMap = [];
        if (!empty($levelIds)) {
            $levels = \think\facade\Db::name('busi_assistant_level')
                ->whereIn('id', array_unique($levelIds))
                ->column('name', 'id');
            $levelMap = $levels ?: [];
        }

        // 查忙碌状态（正在进行中的订单中正在服务的助教）
        $busyMap = [];
        $busyItems = \think\facade\Db::name('busi_order_item')->alias('oi')
            ->join('busi_order o', 'oi.order_id = o.id')
            ->where('o.store_id', $storeId)
            ->where('o.status', 'in_progress')
            ->where('oi.item_type', 'assistant')
            ->whereIn('oi.status', ['pending', 'processing', 'serving', 'prepay_draft'])
            ->whereNotNull('oi.assistant_id')
            ->group('oi.assistant_id')
            ->column('oi.assistant_id');
        foreach ($busyItems as $bid) { $busyMap[$bid] = true; }

        $result = [];
        foreach ($assistants as $assistant) {
            $result[] = [
                'id'          => $assistant['id'],
                'name'        => $assistant['name'],
                'phone'       => $assistant['phone'],
                'level_id'    => $assistant['level_id'],
                'level_name'  => $levelMap[$assistant['level_id']] ?? '',
                'hourly_rate' => (float)($assistant['hourly_rate'] ?? 0),
                'status'      => (int)$assistant['status'],
                'is_busy'     => !empty($busyMap[$assistant['id']]),
            ];
        }

        return JsonService::success('success', ['list' => $result]);
    }
}
