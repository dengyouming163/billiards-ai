<?php

namespace app\storeapi\controller\setting;

use app\storeapi\controller\BaseStoreController;
use app\common\service\PayHubClient;
use app\common\service\JsonService;

/**
 * 微信支付配置 API
 * 管理后台 → pay-hub channel_configs
 */
class WechatConfigController extends BaseStoreController
{
    /**
     * 保存微信支付配置
     * POST /storeapi/setting.WechatConfig/save
     */
    public function save()
    {
        $params = $this->request->post();
        $required = ['mchId', 'appId', 'apiV3Key', 'serialNo', 'privateKey'];
        foreach ($required as $f) {
            if (empty($params[$f])) {
                return JsonService::fail("缺少必填字段: {$f}");
            }
        }

        $client = new PayHubClient();
        $result = $client->saveChannelConfig([
            'clientId'   => $this->storeId,
            'tenantId'   => $this->storeId,
            'channel'    => 'wechat',
            'env'        => $params['env'] ?? 'production',
            'description' => $params['description'] ?? '',
            'config'     => [
                'mode'       => 'partner',
                'mchId'      => $params['mchId'],
                'appId'      => $params['appId'],
                'subMchId'   => $params['subMchId'] ?? '',
                'subAppId'   => $params['subAppId'] ?? '',
                'apiV3Key'   => $params['apiV3Key'],
                'serialNo'   => $params['serialNo'],
                'privateKey' => $params['privateKey'],
                'notifyUrl'  => 'https://api.tpzl88.com/api/pay-hub/callback',
            ],
        ]);

        if ($result['success'] ?? false) {
            return JsonService::success('微信支付配置已保存');
        }
        return JsonService::fail($result['error'] ?? '保存失败');
    }

    /**
     * 查询微信支付配置
     * GET /storeapi/setting.WechatConfig/info
     */
    public function info()
    {
        $client = new PayHubClient();
        $result = $client->queryChannelConfig($this->storeId, 'wechat');

        // 掩码敏感字段
        if (!empty($result['config'])) {
            $result['config']['apiV3Key'] = '***';
            $result['config']['privateKey'] = '***';
        }

        return JsonService::data($result ?: []);
    }
}
