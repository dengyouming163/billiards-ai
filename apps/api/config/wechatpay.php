<?php
/**
 * 微信支付服务商配置
 * 所有敏感值从环境变量读取，生产环境通过 .env 或服务器环境变量设置
 */
return [
    // 服务商商户号
    'mchid'       => env('WECHATPAY_MCHID', ''),

    // 商户API证书序列号
    'serial_no'   => env('WECHATPAY_SERIAL_NO', ''),

    // 商户API私钥（PEM格式路径）
    'private_key' => env('WECHATPAY_PRIVATE_KEY_PATH', ''),

    // API v3密钥（32位）— 生产环境必须设环境变量
    'apiv3_key'   => env('WECHATPAY_APIV3_KEY', ''),

    // 微信支付公钥（PEM格式路径）
    'wechatpay_public_key'    => env('WECHATPAY_PUBLIC_KEY_PATH', ''),

    // 微信支付公钥ID
    'wechatpay_public_key_id' => env('WECHATPAY_PUBLIC_KEY_ID', ''),

    // 服务商AppID
    'appid' => env('WECHATPAY_APPID', ''),

    // v2 密钥（用于 MICROPAY / orderquery 等旧版 API）
    'v2_secret_key' => env('WECHATPAY_V2_SECRET_KEY', ''),

    // 支付结果通知地址（必须配置 WECHATPAY_NOTIFY_URL，无默认回调地址）
    'notify_url' => env('WECHATPAY_NOTIFY_URL', ''),
];
