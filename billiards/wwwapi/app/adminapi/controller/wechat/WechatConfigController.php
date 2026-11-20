<?php

namespace app\adminapi\controller\wechat;

use app\adminapi\controller\BaseAdminController;
use app\common\service\JsonService;
use app\common\service\ConfigService;
use app\common\service\PayHubClient;
use think\facade\Db;

/**
 * 微信服务商全局配置（平台管理后台）
 *
 * 数据流：
 *   wwwplatform → adminapi → bi_wechat_config（本地）
 *                          → pay-hub channel_configs（支付网关同步）
 *   门店进件时通过 WeChatConfigService 读取本地配置 → 传给微信支付 API
 */
class WechatConfigController extends BaseAdminController
{
    /**
     * 将 DB 中的 snake_case 字段映射为前端期望的 camelCase
     */
    private function formatConfig(?array $config): array
    {
        if (empty($config)) return [];
        return [
            'appId'       => $config['app_id'] ?? '',
            'mchId'       => $config['mch_id'] ?? '',
            // 敏感字段掩码：有值时返回 "***"，空时返回 ""
            'apiV3Key'    => empty($config['api_v3_key']) ? '' : '***',
            'serialNo'    => $config['serial_no'] ?? '',
            'privateKey'  => empty($config['private_key']) ? '' : '***',
            'certContent' => $config['cert_content'] ?? '',
        ];
    }

    /** GET 获取服务商配置 */
    public function info()
    {
        $config = Db::name('wechat_config')->where('type', 'partner')->find();
        return JsonService::data($this->formatConfig($config ?: null));
    }

    /** POST 保存服务商配置（同步到本地DB + pay-hub） */
    public function save()
    {
        $params = $this->request->post();
        if (empty($params['mchId']) && empty($params['mch_id'])) {
            return JsonService::fail('服务商商户号不能为空');
        }

        // 查询已有配置，敏感字段为空时保留旧值
        $existing = Db::name('wechat_config')->where('type', 'partner')->find();

        // 提取字段值（兼容 camelCase 和 snake_case 两种入参）
        // 敏感字段 apiV3Key/privateKey: 如果请求为空则保留数据库旧值
        $appId       = $params['appId'] ?? $params['app_id'] ?? ($existing['app_id'] ?? '');
        $mchId       = $params['mchId'] ?? $params['mch_id'] ?? ($existing['mch_id'] ?? '');
        $apiV3Key    = !empty($params['apiV3Key'])   ? $params['apiV3Key']
                     : (!empty($params['api_v3_key']) ? $params['api_v3_key']
                     : ($existing['api_v3_key'] ?? ''));
        $serialNo    = $params['serialNo'] ?? $params['serial_no'] ?? ($existing['serial_no'] ?? '');
        $privateKey  = !empty($params['privateKey'])   ? $params['privateKey']
                     : (!empty($params['private_key']) ? $params['private_key']
                     : ($existing['private_key'] ?? ''));
        $certContent = $params['certContent'] ?? $params['cert_content'] ?? ($existing['cert_content'] ?? '');

        // 1. 保存到本地 bi_wechat_config 表
        $data = [
            'type'         => 'partner',
            'app_id'       => $appId,
            'mch_id'       => $mchId,
            'api_v3_key'   => $apiV3Key,
            'serial_no'    => $serialNo,
            'private_key'  => $privateKey,
            'cert_content' => $certContent,
        ];

        if ($existing) {
            Db::name('wechat_config')->where('id', $existing['id'])->update($data);
        } else {
            $data['id'] = 'wc_' . bin2hex(random_bytes(8));
            Db::name('wechat_config')->insert($data);
        }

        // 2. 同步到 pay-hub 支付网关（平台级服务商配置）
        try {
            $payHub = new PayHubClient();
            $payHub->saveChannelConfig([
                'clientId'    => 'platform',           // 平台级配置标识
                'tenantId'    => 'platform',
                'channel'     => 'wechat',
                'env'         => $params['env'] ?? 'production',
                'description' => '平台微信服务商全局配置',
                'config'      => [
                    'mode'       => 'partner',
                    'mchId'      => $mchId,
                    'appId'      => $appId,
                    'subMchId'   => '',                // 子商户号由进件后填入
                    'subAppId'   => '',
                    'apiV3Key'   => $apiV3Key,
                    'serialNo'   => $serialNo,
                    'privateKey' => $privateKey,
                    'merchantSerialNumber' => $serialNo,
                    'notifyUrl'  => 'https://poolapi.kyyp.cn/api/pay-hub/callback',
                ],
            ]);
        } catch (\Throwable $e) {
            // pay-hub 同步失败不阻塞本地保存（pay-hub 可能尚未部署或网络不通）
            // 仅记录日志，下次保存时会重新同步
            $log = app('log');
            if ($log) {
                $log->error('[WechatConfig] pay-hub 同步失败: ' . $e->getMessage());
            }
        }

        return JsonService::success('服务商配置已保存');
    }

    /** GET 获取小程序配置 */
    public function mnpInfo()
    {
        $appId = ConfigService::get('mnp_setting', 'app_id', '');
        $appSecret = ConfigService::get('mnp_setting', 'app_secret', '');
        return JsonService::data([
            'appId'     => $appId,
            'appSecret' => empty($appSecret) ? '' : '***',
        ]);
    }

    /** POST 保存小程序配置 */
    public function mnpSave()
    {
        $params = $this->request->post();
        $appId = $params['appId'] ?? $params['app_id'] ?? '';
        $appSecret = $params['appSecret'] ?? $params['app_secret'] ?? '';

        if (empty($appId)) {
            return JsonService::fail('小程序AppID不能为空');
        }

        ConfigService::set('mnp_setting', 'app_id', $appId);
        ConfigService::set('mnp_setting', 'app_secret', $appSecret);

        return JsonService::success('小程序配置已保存');
    }
}
