<?php

declare (strict_types=1);

namespace app\miniappapi\controller\auth;

use app\common\model\merchant\WxUser;
use app\common\model\merchant\Member;
use app\common\service\JsonService;
use app\common\service\wechat\WeChatMnpService;
use think\facade\Cache;
use think\Request;

class IndexController
{
    /**
     * 微信登录 + 手机号绑定（一步完成）
     * POST /miniappapi/auth.Index/loginByWechat
     */
    public function loginByWechat(Request $request)
    {
        $code = $request->param('code', '');
        $encryptedData = $request->param('encrypted_data', '');
        $iv = $request->param('iv', '');
        $storeId = $request->param('store_id', '');

        if (empty($code)) {
            return JsonService::fail('缺少 code 参数');
        }

        // 1. 用 code 换取 openid + session_key
        try {
            $mnpService = new WeChatMnpService();
            $wxRes = $mnpService->getMnpResByCode($code);
        } catch (\Exception $e) {
            return JsonService::fail('微信登录失败: ' . $e->getMessage());
        }

        $openid = $wxRes['openid'];
        $sessionKey = $wxRes['session_key'] ?? '';
        $unionid = $wxRes['unionid'] ?? '';

        // 2. 解密手机号
        $phone = '';
        if (!empty($encryptedData) && !empty($iv) && !empty($sessionKey)) {
            try {
                $decrypted = $mnpService->decryptData($sessionKey, $encryptedData, $iv);
                $phone = $decrypted['purePhoneNumber'] ?? $decrypted['phoneNumber'] ?? '';
            } catch (\Exception $e) {
                return JsonService::fail('手机号解密失败: ' . $e->getMessage());
            }
        }

        if (empty($phone)) {
            return JsonService::fail('未能获取手机号');
        }

        // 3. 查或创建 wx_user
        $wxUser = WxUser::where('openid', $openid)->find();
        if ($wxUser) {
            $wxUser->phone = $phone;
            $wxUser->last_login_at = date('Y-m-d H:i:s');
            $wxUser->save();
        } else {
            $wxUser = WxUser::create([
                'id' => 'wxu_' . uniqid(),
                'openid' => $openid,
                'unionid' => $unionid,
                'phone' => $phone,
                'store_id' => $storeId ?: 0,
                'status' => 1,
                'last_login_at' => date('Y-m-d H:i:s'),
            ]);
        }

        // 4. 在指定门店查或创建会员
        $member = null;
        if (!empty($storeId)) {
            $member = Member::where('phone', $phone)
                ->where('store_id', $storeId)
                ->find();
        }
        if (!$member) {
            $member = Member::where('phone', $phone)->find();
        }

        if (!$member) {
            // 自动注册会员
            $member = Member::create([
                'id' => 'mem-' . date('YmdHis') . rand(1000, 9999),
                'name' => '微信用户',
                'phone' => $phone,
                'store_id' => $storeId ?: 0,
                'balance' => 0,
                'points' => 0,
                'card_number' => '',
            ]);
        }

        // 5. 关联 wx_user 和 member
        $wxUser->member_id = $member->id;
        $wxUser->store_id = $member->store_id;
        $wxUser->save();

        // 6. 生成 token
        $token = md5($openid . uniqid() . time());
        Cache::set('mini_token:' . $token, [
            'openid' => $openid,
            'session_key' => $sessionKey,
            'member_id' => $member->id,
            'store_id' => $member->store_id,
        ], 86400 * 7);

        $memberInfo = [
            'id' => $member->id,
            'name' => $member->name,
            'phone' => $member->phone,
            'card_number' => $member->card_number,
            'balance' => (float)$member->balance,
            'points' => (int)$member->points,
        ];

        return JsonService::data([
            'token' => $token,
            'member_id' => $member->id,
            'member_info' => $memberInfo,
            'phone' => $phone,
        ]);
    }
}
