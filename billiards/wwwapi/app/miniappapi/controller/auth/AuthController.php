<?php

declare (strict_types=1);

namespace app\miniappapi\controller\auth;

use app\common\model\merchant\WxUser;
use app\common\model\merchant\Member;
use app\common\service\JsonService;
use app\common\service\wechat\WeChatMnpService;
use think\facade\Cache;
use think\Request;

class AuthController
{
    /**
     * 微信登录 - 用 code 换取 openid 和 token
     * POST /miniappapi/auth.Auth/login
     */
    public function login(Request $request)
    {
        $code = $request->param('code', '');
        if (empty($code)) {
            return JsonService::fail('缺少 code 参数');
        }

        try {
            $mnpService = new WeChatMnpService();
            $wxRes = $mnpService->getMnpResByCode($code);
        } catch (\Exception $e) {
            return JsonService::fail('微信登录失败: ' . $e->getMessage());
        }

        $openid = $wxRes['openid'];
        $sessionKey = $wxRes['session_key'] ?? '';
        $unionid = $wxRes['unionid'] ?? '';

        // 查或创建 wx_user 记录
        $wxUser = WxUser::where('openid', $openid)->find();
        if ($wxUser) {
            $wxUser->last_login_at = date('Y-m-d H:i:s');
            $wxUser->save();
        } else {
            $wxUser = WxUser::create([
                'id' => 'wxu_' . uniqid(),
                'openid' => $openid,
                'unionid' => $unionid,
                'store_id' => 0,
                'status' => 1,
                'last_login_at' => date('Y-m-d H:i:s'),
            ]);
        }

        // 查询会员信息
        $memberInfo = null;
        if (!empty($wxUser->member_id)) {
            $member = Member::find($wxUser->member_id);
            if ($member) {
                $memberInfo = [
                    'id' => $member->id,
                    'name' => $member->name,
                    'phone' => $member->phone,
                    'avatar' => $member->avatar,
                    'card_number' => $member->card_number,
                    'balance' => (float)$member->balance,
                    'points' => (int)$member->points,
                ];
            }
        }

        // 生成 token
        $token = md5($openid . uniqid() . time());

        // 存入缓存：mini_token:{token} -> {openid, session_key, member_id, store_id}
        Cache::set('mini_token:' . $token, [
            'openid' => $openid,
            'session_key' => $sessionKey,
            'member_id' => $wxUser->member_id ?: '',
            'store_id' => $wxUser->store_id ?: '',
        ], 86400 * 7);

        return JsonService::data([
            'token' => $token,
            'member_id' => $wxUser->member_id ?: '',
            'member_info' => $memberInfo,
            'has_bound_phone' => !empty($wxUser->phone),
        ]);
    }

    /**
     * 手机号绑定
     * POST /miniappapi/auth.Auth/bindPhone
     */
    public function bindPhone(Request $request)
    {
        $code = $request->param('code', '');
        if (empty($code)) {
            return JsonService::fail('缺少手机号授权 code');
        }

        // 从缓存获取 openid
        $token = substr($request->header('Authorization'), 7);
        $loginInfo = Cache::get('mini_token:' . $token);
        if (empty($loginInfo)) {
            return JsonService::fail('登录超时，请重新登录', [], 2002);
        }
        $openid = $loginInfo['openid'] ?? '';

        // 调用微信接口获取手机号
        try {
            $mnpService = new WeChatMnpService();
            $response = $mnpService->getUserPhoneNumber($code);
            $phoneInfo = $response->toArray();
        } catch (\Exception $e) {
            return JsonService::fail('获取手机号失败: ' . $e->getMessage());
        }

        $phone = $phoneInfo['phone_info']['purePhoneNumber'] ?? '';
        if (empty($phone)) {
            return JsonService::fail('未能获取手机号');
        }

        // 更新 wx_user 手机号
        $wxUser = WxUser::where('openid', $openid)->find();
        if (!$wxUser) {
            return JsonService::fail('用户不存在');
        }

        // 查或创建会员
        $member = Member::where('phone', $phone)->find();
        if (!$member) {
            // 自动注册会员
            $member = Member::create([
                'id' => 'mem-' . date('YmdHis') . rand(1000, 9999),
                'name' => '微信用户',
                'phone' => $phone,
                'store_id' => $wxUser->store_id ?: 0,
                'balance' => 0,
                'points' => 0,
                'card_number' => '',
            ]);
        }

        // 绑定 member_id 到 wx_user
        $wxUser->phone = $phone;
        $wxUser->member_id = $member->id;
        $wxUser->store_id = $member->store_id;
        $wxUser->save();

        // 更新缓存中的 member_id 和 store_id
        $loginInfo['member_id'] = $member->id;
        $loginInfo['store_id'] = $member->store_id;
        Cache::set('mini_token:' . $token, $loginInfo, 86400 * 7);

        return JsonService::data([
            'member_id' => $member->id,
            'member_info' => [
                'id' => $member->id,
                'name' => $member->name,
                'phone' => $member->phone,
                'card_number' => $member->card_number,
                'balance' => (float)$member->balance,
                'points' => (int)$member->points,
            ],
        ]);
    }

    /**
     * 获取当前会员信息
     * GET /miniappapi/auth.Auth/memberInfo
     */
    public function memberInfo(Request $request)
    {
        $memberId = $request->memberId;
        if (empty($memberId)) {
            return JsonService::fail('未绑定会员');
        }

        $member = Member::find($memberId);
        if (!$member) {
            return JsonService::fail('会员不存在');
        }

        return JsonService::data([
            'id' => $member->id,
            'name' => $member->name,
            'phone' => $member->phone,
            'avatar' => $member->avatar,
            'card_number' => $member->card_number,
            'balance' => (float)$member->balance,
            'points' => (int)$member->points,
        ]);
    }
}
