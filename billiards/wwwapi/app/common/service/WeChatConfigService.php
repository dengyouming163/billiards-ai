<?php

namespace app\common\service;

use think\facade\Db;

/**
 * 微信支付配置服务
 * 读取平台管理后台配置的服务商参数
 */
class WeChatConfigService
{
    /**
     * 获取微信支付配置（服务商模式）
     * 从 bi_wechat_config 表或环境变量读取服务商参数
     */
    public static function getWechatConfig(): array
    {
        // 优先从数据库读取平台全局配置
        $config = Db::name('wechat_config')->where('type', 'partner')->find();

        if ($config && !empty($config['mch_id'])) {
            return [
                'app_id'             => $config['app_id'] ?? '',
                'mch_id'             => $config['mch_id'],
                'sub_mch_id'         => $config['sub_mch_id'] ?? '',
                'key'                => $config['api_v3_key'] ?? '',
                'cert_path'          => $config['cert_path'] ?? '',
                'key_path'           => $config['key_path'] ?? '',
                'secret_key'         => $config['api_v3_key'] ?? '',
                'certificate'        => $config['cert_content'] ?? '',
                'private_key'        => $config['private_key'] ?? '',
                'serial_no'          => $config['serial_no'] ?? '',
                'response_type'      => 'array',
                'wechatpay_certificate_path' => $config['platform_cert_path'] ?? '',
            ];
        }

        // 回退：从环境变量读取
        return [
            'app_id'       => env('WECHAT_APP_ID', ''),
            'mch_id'       => env('WECHAT_MCH_ID', ''),
            'secret_key'   => env('WECHAT_API_V3_KEY', ''),
            'private_key'  => env('WECHAT_PRIVATE_KEY', ''),
            'serial_no'    => env('WECHAT_SERIAL_NO', ''),
            'certificate'  => env('WECHAT_CERTIFICATE', ''),
            'response_type'=> 'array',
        ];
    }
}
