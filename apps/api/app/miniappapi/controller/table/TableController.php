<?php

declare (strict_types=1);

namespace app\miniappapi\controller\table;

use app\common\model\merchant\Table as TableModel;
use app\common\model\merchant\Order as OrderModel;
use app\common\model\merchant\Pricing as PricingModel;
use app\common\model\merchant\WxUser;
use app\common\model\merchant\Member as MemberModel;
use app\common\service\JsonService;
use app\common\logic\PricingCalculatorLogic;
use think\facade\Cache;
use think\Request;

class TableController
{
    /**
     * 根据 openid + store_id 获取或创建该门店下的会员
     * 同一个手机号在不同门店有独立的会员账户
     */
    private function resolveMember(string $openid, string $storeId): ?string
    {
        $wxUser = WxUser::where('openid', $openid)->find();
        if (!$wxUser || empty($wxUser->phone)) {
            return null;
        }

        // 在该门店下查会员（phone + store_id）
        $member = MemberModel::where('phone', $wxUser->phone)
            ->where('store_id', $storeId)
            ->find();

        if ($member) {
            return $member->id;
        }

        // 该门店下没有会员，自动创建
        $member = MemberModel::create([
            'id' => 'mem-' . date('YmdHis') . rand(1000, 9999),
            'name' => $wxUser->phone,
            'phone' => $wxUser->phone,
            'store_id' => $storeId,
            'balance' => 0,
            'points' => 0,
            'card_number' => '',
        ]);

        return $member->id;
    }

    /**
     * 扫码确认 - 判断桌台状态，返回开台或账单模式
     * GET /miniappapi/table.Table/scan
     */
    public function scan(Request $request)
    {
        $tableId = $request->param('table_id', '');
        $openid = $request->openid;
        if (empty($tableId)) {
            return JsonService::fail('缺少 table_id 参数');
        }

        // 查台桌信息
        $table = TableModel::find($tableId);
        if (!$table) {
            return JsonService::fail('台桌不存在');
        }

        // 按门店解析会员，并更新 token 缓存中的 member_id + store_id
        $storeId = $table->store_id;
        $memberId = $this->resolveMember($openid, $storeId);
        if ($memberId) {
            $token = substr($request->header('Authorization'), 7);
            $loginInfo = Cache::get('mini_token:' . $token);
            if ($loginInfo) {
                $loginInfo['member_id'] = $memberId;
                $loginInfo['store_id'] = $storeId;
                Cache::set('mini_token:' . $token, $loginInfo, 86400 * 7);
            }
        }

        // 查计费规则
        $pricing = PricingModel::find($table->pricing_id);

        $tableData = [
            'id' => $table->id,
            'name' => $table->name,
            'type' => $table->type ?? '',
            'zone_name' => '',
            'status' => $table->status,
            'store_id' => $storeId,
        ];

        $pricingData = [
            'name' => $pricing->name ?? '标准计费',
            'type' => $pricing->type ?? '',
            'rate_per_hour' => $pricing->rate_per_hour ?? 0,
            'description' => $pricing->description ?? '',
        ];

        // 查是否有进行中的订单（该台桌 + 该门店）
        $activeOrder = OrderModel::where('table_id', $tableId)
            ->where('store_id', $storeId)
            ->whereIn('status', ['playing', 'paused'])
            ->find();

        if (!$activeOrder) {
            // 无活跃订单 → 开台模式
            return JsonService::data([
                'table' => $tableData,
                'pricing' => $pricingData,
                'mode' => 'open',
                'order' => null,
                'member_id' => $memberId,
            ]);
        }

        // 有活跃订单，检查是否属于当前会员
        if ($memberId && $activeOrder->member_id == $memberId) {
            // 账单模式
            $startTime = strtotime($activeOrder->start_time);
            $durationMinutes = max(0, (time() - $startTime) / 60);
            $currentFee = 0;

            if ($pricing) {
                $startTime2 = $activeOrder->start_time;
                $endTime2 = date('Y-m-d H:i:s');
                $calcResult = PricingCalculatorLogic::calculateByTableId($tableId, $startTime2, $endTime2);
                $currentFee = $calcResult['total_amount'] ?? 0;
            }

            return JsonService::data([
                'table' => $tableData,
                'pricing' => $pricingData,
                'mode' => 'bill',
                'order' => [
                    'id' => $activeOrder->id,
                    'start_time' => $activeOrder->start_time,
                    'duration_minutes' => round($durationMinutes, 1),
                    'current_fee' => round($currentFee, 2),
                ],
                'member_id' => $memberId,
            ]);
        }

        // 有活跃订单但不属于当前会员
        return JsonService::fail('该台桌已被其他顾客使用');
    }

    /**
     * 台桌信息
     * GET /miniappapi/table.Table/info
     */
    public function info(Request $request)
    {
        $tableId = $request->param('table_id', '');
        if (empty($tableId)) {
            return JsonService::fail('缺少 table_id 参数');
        }

        $table = TableModel::find($tableId);
        if (!$table) {
            return JsonService::fail('台桌不存在');
        }

        $pricing = PricingModel::find($table->pricing_id);

        return JsonService::data([
            'id' => $table->id,
            'name' => $table->name,
            'type' => $table->type ?? '',
            'zone_name' => '',
            'status' => $table->status,
            'pricing_summary' => $pricing ? ($pricing->name . ' ¥' . ($pricing->rate_per_hour ?? 0) . '/小时') : '未设置',
        ]);
    }
}
