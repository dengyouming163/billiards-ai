<?php

declare (strict_types=1);

namespace app\miniappapi\controller\profile;

use app\common\model\merchant\Member as MemberModel;
use app\common\model\merchant\Order as OrderModel;
use app\common\model\merchant\Table as TableModel;
use app\common\model\merchant\Store;
use app\common\service\JsonService;
use think\facade\Cache;
use think\Request;

class ProfileController
{
    /**
     * 获取当前用户在所有门店的会员信息
     */
    private function getAllMembers(Request $request): array
    {
        $memberId = $request->memberId;
        $members = [];

        if (!empty($memberId)) {
            $currentMember = MemberModel::find($memberId);
            if ($currentMember && !empty($currentMember->phone)) {
                // 查出该手机号在所有门店的会员
                $allMembers = MemberModel::where('phone', $currentMember->phone)
                    ->select()
                    ->toArray();

                foreach ($allMembers as $m) {
                    $store = Store::find($m['store_id'] ?? '');
                    $members[] = [
                        'member_id' => $m['id'],
                        'store_id' => $m['store_id'] ?? '',
                        'store_name' => $store->name ?? ('门店' . ($m['store_id'] ?: '未知')),
                        'name' => $m['name'] ?? '',
                        'phone' => $m['phone'] ?? '',
                        'card_number' => $m['card_number'] ?? '',
                        'balance' => (float)($m['balance'] ?? 0),
                        'points' => (int)($m['points'] ?? 0),
                    ];
                }
            }
        }

        return $members;
    }

    /**
     * 个人中心首页
     * GET /miniappapi/profile.Profile/index
     */
    public function index(Request $request)
    {
        $memberId = $request->memberId;
        $currentStoreId = $request->storeId;

        if (empty($memberId)) {
            // 未绑定会员时，尝试从 openid 查手机号
            $token = substr($request->header('Authorization'), 7);
            $loginInfo = Cache::get('mini_token:' . $token);
            $openid = $loginInfo['openid'] ?? '';
            if (empty($openid)) {
                return JsonService::fail('未登录');
            }

            $wxUser = \app\common\model\merchant\WxUser::where('openid', $openid)->find();
            if (!$wxUser || empty($wxUser->phone)) {
                return JsonService::fail('请先绑定手机号');
            }

            // 返回该手机号所有门店的会员（但无当前会员）
            $allMembers = MemberModel::where('phone', $wxUser->phone)
                ->select()
                ->toArray();

            $members = [];
            foreach ($allMembers as $m) {
                $store = Store::find($m['store_id'] ?? '');
                $members[] = [
                    'member_id' => $m['id'],
                    'store_id' => $m['store_id'] ?? '',
                    'store_name' => $store->name ?? ('门店' . ($m['store_id'] ?: '未知')),
                    'name' => $m['name'] ?? '',
                    'phone' => $m['phone'] ?? '',
                    'card_number' => $m['card_number'] ?? '',
                    'balance' => (float)($m['balance'] ?? 0),
                    'points' => (int)($m['points'] ?? 0),
                ];
            }

            return JsonService::data([
                'current_member' => null,
                'current_store_id' => $currentStoreId,
                'all_members' => $members,
                'recent_orders' => [],
                'total_orders' => 0,
                'total_spent' => 0,
            ]);
        }

        $member = MemberModel::find($memberId);
        if (!$member) {
            return JsonService::fail('会员不存在');
        }

        // 获取所有门店的会员信息
        $allMembers = $this->getAllMembers($request);

        // 全门店累计统计
        $totalOrders = 0;
        $totalSpent = 0.0;
        $allMemberIds = array_column($allMembers, 'member_id');
        if (!empty($allMemberIds)) {
            $totalOrders = OrderModel::whereIn('member_id', $allMemberIds)
                ->where('status', 'closed')
                ->count();
            $totalSpent = (float)OrderModel::whereIn('member_id', $allMemberIds)
                ->where('status', 'closed')
                ->sum('final_amount');
        }

        // 当前门店最近5条订单
        $recentOrders = OrderModel::where('member_id', $memberId)
            ->where('status', 'closed')
            ->order('created_at', 'desc')
            ->limit(5)
            ->select();

        $orderList = [];
        foreach ($recentOrders as $order) {
            $table = TableModel::find($order->table_id);
            $orderList[] = [
                'id' => $order->id,
                'table_name' => $table->name ?? '',
                'start_time' => $order->start_time,
                'end_time' => $order->end_time,
                'final_amount' => (float)$order->final_amount,
                'status' => $order->status,
                'store_id' => $order->store_id,
            ];
        }

        return JsonService::data([
            'current_member' => [
                'member_id' => $member->id,
                'store_id' => $member->store_id,
                'name' => $member->name,
                'phone' => $member->phone,
                'card_number' => $member->card_number,
                'balance' => (float)$member->balance,
                'points' => (int)$member->points,
            ],
            'current_store_id' => $currentStoreId,
            'all_members' => $allMembers,
            'total_orders' => $totalOrders,
            'total_spent' => $totalSpent,
            'recent_orders' => $orderList,
        ]);
    }

    /**
     * 历史账单分页（支持按门店筛选）
     * GET /miniappapi/profile.Profile/history
     */
    public function history(Request $request)
    {
        $memberId = $request->memberId;
        $storeId = $request->param('store_id', '');
        $page = (int)$request->param('page', 1);
        $pageSize = (int)$request->param('page_size', 10);

        if (empty($memberId)) {
            return JsonService::fail('未绑定会员');
        }

        // 如果指定了store_id，切换到该门店的会员来查
        $queryMemberId = $memberId;
        if (!empty($storeId)) {
            $member = MemberModel::find($memberId);
            if ($member && !empty($member->phone)) {
                $storeMember = MemberModel::where('phone', $member->phone)
                    ->where('store_id', $storeId)
                    ->find();
                if ($storeMember) {
                    $queryMemberId = $storeMember->id;
                }
            }
        }

        $query = OrderModel::where('member_id', $queryMemberId)
            ->where('status', 'closed')
            ->order('created_at', 'desc');

        $total = $query->count();
        $orders = $query->page($page, $pageSize)->select();

        $list = [];
        foreach ($orders as $order) {
            $table = TableModel::find($order->table_id);
            $startTime = strtotime($order->start_time);
            $endTime = strtotime($order->end_time);
            $duration = max(0, ($endTime - $startTime) / 60);
            $list[] = [
                'id' => $order->id,
                'table_name' => $table->name ?? '',
                'store_id' => $order->store_id,
                'start_time' => $order->start_time,
                'end_time' => $order->end_time,
                'duration' => round($duration, 0),
                'final_amount' => (float)$order->final_amount,
                'status' => $order->status,
            ];
        }

        return JsonService::data([
            'list' => $list,
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
        ]);
    }

    /**
     * 所有门店的账户余额汇总
     * GET /miniappapi/profile.Profile/balance
     */
    public function balance(Request $request)
    {
        $allMembers = $this->getAllMembers($request);
        $totalBalance = 0.0;
        $totalPoints = 0;

        foreach ($allMembers as $m) {
            $totalBalance += $m['balance'];
            $totalPoints += $m['points'];
        }

        return JsonService::data([
            'total_balance' => round($totalBalance, 2),
            'total_points' => $totalPoints,
            'stores' => $allMembers,
        ]);
    }
}
