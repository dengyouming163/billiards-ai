<?php
/**
 * 微信支付服务商配置
 * 所有敏感值从环境变量读取，生产环境通过 .env 或服务器环境变量设置
 */
return [
    // 服务商商户号
    'mchid'       => env('WECHATPAY_MCHID', '1745254303'),

    // 商户API证书序列号
    'serial_no'   => env('WECHATPAY_SERIAL_NO', '1BC83EBB394DDEFBB40424D1A792517CCA0A16CD'),

    // 商户API私钥（PEM格式路径）
    'private_key' => env('WECHATPAY_PRIVATE_KEY_PATH', '/www/server/wechat-cert/apiclient_key.pem'),

    // API v3密钥（32位）— 生产环境必须设环境变量
    'apiv3_key'   => env('WECHATPAY_APIV3_KEY', 'H5jK8Lp0Qw3Er6Ty9Ui2Op1As4Df7Gh5Jk9'),

    // 微信支付公钥（PEM格式路径）
    'wechatpay_public_key'    => env('WECHATPAY_PUBLIC_KEY_PATH', '/www/server/wechat-cert/pub_key.pem'),

    // 微信支付公钥ID
    'wechatpay_public_key_id' => env('WECHATPAY_PUBLIC_KEY_ID', 'PUB_KEY_ID_0117452543032026052600292342000803'),

    // 服务商AppID
    'appid' => env('WECHATPAY_APPID', 'wx30caf8631a252bd4'),

    // v2 密钥（用于 MICROPAY / orderquery 等旧版 API）
    'v2_secret_key' => env('WECHATPAY_V2_SECRET_KEY', 'Cu8Fx3MzWb6Yn2KpAj5Ve1Lq9Hs4Rt7G'),

    // 支付结果通知地址（留空则使用默认回调地址）
    'notify_url' => env('WECHATPAY_NOTIFY_URL', 'https://poolapi.kyyp.cn/api/v1/webhooks/wechat'),
];
