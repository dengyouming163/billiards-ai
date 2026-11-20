<?php

namespace app\storeapi\logic\setting;

use app\common\logic\BaseLogic;
use app\common\model\WechatApplyment;
use app\common\service\pay\WechatPayService;

class WechatApplymentLogic extends BaseLogic
{

    /** 查询进件状态 */
    public static function getStatus(string $storeId): array
    {
        $record = WechatApplyment::latestOf($storeId);
        if (!$record) return ['has_applyment' => false, 'applyment' => null];
        return ['has_applyment' => true, 'applyment' => $record->toArray()];
    }

    /** 提交进件申请 */
    public static function submitApply(array $params, string $storeId)
    {
        $required = ['contact_info', 'subject_info', 'business_info', 'settlement_info', 'bank_account_info'];
        foreach ($required as $f) { if (empty($params[$f])) return self::err("缺少必填参数: {$f}"); }

        if (!WechatApplyment::canSubmit($storeId)) {
            return self::err('已存在进行中的进件申请');
        }

        // 如果是驳回后重提：将旧记录标记为 CANCELED
        $oldRecord = WechatApplyment::latestOf($storeId);
        $relatedId = null;
        if ($oldRecord && in_array($oldRecord->applyment_state, [
            WechatApplyment::STATE_REJECTED,
            WechatApplyment::STATE_CANCELED,
        ])) {
            $relatedId = $oldRecord->id;
            $oldRecord->save([
                'applyment_state'     => WechatApplyment::STATE_CANCELED,
                'applyment_state_msg' => '已重新提交',
                'updated_at'          => date('Y-m-d H:i:s'),
            ]);
        }

        $businessCode = 'MCH_' . $storeId . '_' . date('YmdHis');

        try {
            $wxData = self::buildApplymentData(array_merge($params, ['business_code' => $businessCode]));
            $service = WechatPayService::getInstance();
            $result = $service->submitApplyment($wxData);

            if ($result['code'] !== 0) return self::err($result['message']);

            $data = [
                'id' => 'wa_' . bin2hex(random_bytes(16)), 'store_id' => $storeId, 'business_code' => $businessCode,
                'sub_mchname' => $params['bank_account_info']['account_name'] ?? '',
                'applyment_id' => $result['data']['applyment_id'] ?? '',
                'applyment_state' => WechatApplyment::STATE_AUDITING, 'applyment_state_msg' => '审核中',
                'related_applyment_id' => $relatedId,
                'request_data' => json_encode($params, JSON_UNESCAPED_UNICODE),
                'created_at' => date('Y-m-d H:i:s'), 'updated_at' => date('Y-m-d H:i:s'),
            ];
            WechatApplyment::create($data);

            return ['applyment_id' => $result['data']['applyment_id'] ?? '', 'business_code' => $businessCode];
        } catch (\Exception $e) {
            \think\facade\Log::error('[WechatApply] 提交失败: ' . $e->getMessage());
            return self::err('提交失败: ' . $e->getMessage());
        }
    }

    /** 同步进件状态 */
    public static function syncStatus(string $storeId)
    {
        $record = WechatApplyment::latestOf($storeId);
        if (!$record || empty($record->applyment_id)) return self::err('未找到进件记录');
        \think\facade\Log::info('[WechatApply] 同步状态 store=' . $storeId . ' applyment_id=' . $record->applyment_id);
        try {
            $service = WechatPayService::getInstance();
            $result = $service->queryApplyment($record->applyment_id);
            if ($result['code'] !== 0) return self::err($result['message']);

            $update = [
                'applyment_state' => $result['data']['applyment_state'] ?? $record->applyment_state,
                'applyment_state_msg' => $result['data']['applyment_state_msg'] ?? '',
                'sub_mchid' => $result['data']['sub_mchid'] ?? $record->sub_mchid,
                'sign_url' => $result['data']['sign_url'] ?? '',
                'updated_at' => date('Y-m-d H:i:s'),
            ];
            if (isset($result['data']['audit_detail'])) $update['audit_detail'] = json_encode($result['data']['audit_detail'], JSON_UNESCAPED_UNICODE);
            $record->save($update);
            return ['applyment_state' => $update['applyment_state'], 'state_msg' => $update['applyment_state_msg'], 'sub_mchid' => $update['sub_mchid'], 'sign_url' => $update['sign_url']];
        } catch (\Exception $e) { return self::err('同步失败: ' . $e->getMessage()); }
    }

    /** 获取签约链接 */
    public static function getSignUrl(string $storeId)
    {
        $record = WechatApplyment::where('store_id', $storeId)->where('applyment_state', WechatApplyment::STATE_TO_BE_SIGNED)->order('id', 'desc')->find();
        if (!$record) return self::err('当前状态无需签约');
        if (!empty($record->sign_url)) return ['sign_url' => $record->sign_url];
        try {
            $service = WechatPayService::getInstance();
            $result = $service->queryApplyment($record->applyment_id);
            $signUrl = $result['data']['sign_url'] ?? '';
            if ($signUrl) $record->save(['sign_url' => $signUrl, 'updated_at' => date('Y-m-d H:i:s')]);
            return ['sign_url' => $signUrl];
        } catch (\Exception $e) { return self::err('获取失败: ' . $e->getMessage()); }
    }

    /** 构建进件请求数据（参考WechatMerchantApplyment） */
    private static function buildApplymentData(array $data): array
    {
        $service = WechatPayService::getInstance();

        $applymentData = [
            'business_code' => $data['business_code'],
            'contact_info'  => self::encryptFields($data['contact_info'], ['contact_name', 'contact_id_number', 'mobile_phone', 'contact_email']),
            'subject_info'  => self::buildSubjectInfo($data['subject_info']),
            'business_info' => self::buildBusinessInfo($data['business_info']),
            'settlement_info' => $data['settlement_info'],
            'bank_account_info' => self::buildBankAccountInfo($data['bank_account_info']),
        ];
        if (!empty($data['addition_info'])) $applymentData['addition_info'] = $data['addition_info'];
        return $applymentData;
    }

    /** 构建 bank_account_info — 只保留 WeChat API 需要的字段 */
    private static function buildBankAccountInfo(array $info): array
    {
        $result = [
            'bank_account_type' => $info['bank_account_type'] ?? '',
            'account_bank'      => $info['account_bank'] ?? '',
        ];
        if (!empty($info['bank_branch_id'])) {
            $result['bank_branch_id'] = $info['bank_branch_id'];
        }
        // 加密敏感字段
        return self::encryptFields($result + [
            'account_name'   => $info['account_name'] ?? '',
            'account_number' => $info['account_number'] ?? '',
        ], ['account_name', 'account_number']);
    }

    /** 加密指定字段 */
    private static function encryptFields(array $info, array $fields): array
    {
        $service = WechatPayService::getInstance();
        foreach ($fields as $f) {
            if (!empty($info[$f])) $info[$f] = $service->encrypt($info[$f]);
        }
        return $info;
    }

    /** 构建 subject_info */
    private static function buildSubjectInfo(array $info): array
    {
        $result = ['subject_type' => $info['subject_type'] ?? ''];
        if (isset($info['identity_info'])) $result['identity_info'] = self::encryptIdentityInfo($info['identity_info']);
        if (isset($info['business_license_info']) && !empty($info['business_license_info']['license_number'])) {
            $bl = $info['business_license_info'];
            // 清理空字符串字段（license_copy 和 period_begin 必填不清理）
            if (empty($bl['license_address'])) unset($bl['license_address']);
            $result['business_license_info'] = $bl;
        }
        return $result;
    }

    /** 加密身份证信息 */
    private static function encryptIdentityInfo(array $info): array
    {
        if (isset($info['id_card_info'])) {
            $card = &$info['id_card_info'];
            // 加密敏感字段
            $card = self::encryptFields($card, ['id_card_name', 'id_card_number', 'id_card_address']);
        }
        return $info;
    }

    /** 构建 business_info */
    private static function buildBusinessInfo(array $info): array
    {
        $result = ['merchant_shortname' => $info['merchant_shortname'] ?? ''];
        if (!empty($info['service_phone'])) $result['service_phone'] = $info['service_phone'];

        $sales = $info['sales_info'] ?? [];
        if (empty($sales['sales_scenes_type'])) $sales['sales_scenes_type'] = ['SALES_SCENES_MINI_PROGRAM'];
        $result['sales_info'] = $sales;
        return $result;
    }

    /**
     * 处理微信支付进件审核结果回调
     * @param array $headers 微信回调 HTTP 头
     * @param string $body   原始 HTTP body（JSON）
     * @return array|false   成功返回更新后的记录，失败返回 false
     */
    public static function handleNotify(array $headers, string $body)
    {
        $service = WechatPayService::getInstance();

        // 1. 验签
        if (!$service->verifyCallback($headers, $body)) {
            return self::err('回调签名验证失败');
        }

        // 2. 解密回调体
        $bodyData = json_decode($body, true);
        if (empty($bodyData['resource'])) {
            return self::err('回调格式错误：缺少 resource');
        }

        $decrypted = $service->decryptCallbackResource($bodyData['resource']);
        if (!$decrypted) {
            return self::err('回调解密失败');
        }

        $event = json_decode($decrypted, true);
        \think\facade\Log::info('[WechatApply] 回调解密后: ' . json_encode($event, JSON_UNESCAPED_UNICODE));

        if (empty($event['applyment_id'])) {
            return self::err('回调数据缺少 applyment_id');
        }

        // 3. 从微信同步最新状态
        $result = $service->queryApplyment($event['applyment_id']);
        if ($result['code'] !== 0) {
            return self::err('查询微信状态失败: ' . ($result['message'] ?? ''));
        }

        // 4. 更新本地记录
        $wxData = $result['data'];
        $record = WechatApplyment::where('applyment_id', $event['applyment_id'])->find();
        if (!$record) {
            \think\facade\Log::warning('[WechatApply] 回调 applyment_id 在本地未找到: ' . $event['applyment_id']);
            return self::err('未找到对应进件记录');
        }

        $update = [
            'applyment_state' => $wxData['applyment_state'] ?? $record->applyment_state,
            'applyment_state_msg' => $wxData['applyment_state_msg'] ?? '',
            'sub_mchid' => $wxData['sub_mchid'] ?? $record->sub_mchid,
            'sign_url' => $wxData['sign_url'] ?? '',
            'updated_at' => date('Y-m-d H:i:s'),
        ];
        if (isset($wxData['audit_detail'])) {
            $update['audit_detail'] = json_encode($wxData['audit_detail'], JSON_UNESCAPED_UNICODE);
        }

        $record->save($update);

        \think\facade\Log::info('[WechatApply] 回调处理完成 store=' . $record->store_id . ' state=' . $update['applyment_state']);

        return $update;
    }

    private static function err(string $msg) { self::setError($msg); return false; }
}
