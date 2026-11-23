<?php

declare (strict_types=1);

namespace app\miniappapi\controller\member;

use app\common\model\merchant\Member as MemberModel;
use app\common\service\JsonService;
use think\Request;

class MemberController
{
    /**
     * 检查当前用户是否是指定门店的会员
     * GET /miniappapi/member.Member/checkStore
     */
    public function checkStore(Request $request)
    {
        $storeId = $request->param('store_id', '');
        $memberId = $request->memberId;

        if (empty($storeId)) {
            return JsonService::data([
                'is_member' => false,
                'message' => '缺少门店信息',
            ]);
        }

        // 如果有 memberId，直接查当前门店
        if (!empty($memberId)) {
            $member = MemberModel::find($memberId);
            if ($member && $member->store_id == $storeId) {
                return JsonService::data([
                    'is_member' => true,
                    'member_id' => $member->id,
                    'member_name' => $member->name,
                    'phone' => $member->phone,
                    'balance' => (float)$member->balance,
                    'points' => (int)$member->points,
                    'card_number' => $member->card_number,
                ]);
            }

            // 同一手机号在目标门店的会员
            if ($member && !empty($member->phone)) {
                $storeMember = MemberModel::where('phone', $member->phone)
                    ->where('store_id', $storeId)
                    ->find();
                if ($storeMember) {
                    return JsonService::data([
                        'is_member' => true,
                        'member_id' => $storeMember->id,
                        'member_name' => $storeMember->name,
                        'phone' => $storeMember->phone,
                        'balance' => (float)$storeMember->balance,
                        'points' => (int)$storeMember->points,
                        'card_number' => $storeMember->card_number,
                    ]);
                }
            }
        }

        return JsonService::data([
            'is_member' => false,
            'message' => '非门店会员',
        ]);
    }
}
