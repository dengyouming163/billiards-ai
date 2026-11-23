<?php

declare(strict_types=1);

/**
 * 微信支付进件图片上传入口
 * URL: https://api.tpzl88.com/wechat-upload.php
 *
 * 轻薄自举，不实例化完整 MVC 链路。
 * 接收前端文件上传 → 调用 WechatPayService 上传到微信 → 返回 media_id
 */

require __DIR__ . '/../vendor/autoload.php';

// ---- CORS 跨域支持 ----
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// OPTIONS 预检请求直接返回
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ---- 频率限制 ----
$clientIp = $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rateLimitKey = 'wechat_upload_rate_' . $clientIp;

// 手动初始化 ThinkPHP app 容器（使 cache() 可用）
$app = new \think\App();
$app->initialize();
\think\facade\App::setInstance($app);

$count = (int) \think\facade\Cache::get($rateLimitKey, 0);
if ($count >= 20) {
    http_response_code(429);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '上传过于频繁，请稍后再试', 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}
\think\facade\Cache::set($rateLimitKey, $count + 1, 60);

// ---- 文件接收与校验 ----
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '仅支持 POST 请求', 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

$file = $_FILES['file'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '请上传图片文件', 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

// 格式校验
$allowedExts = ['jpg', 'jpeg', 'png', 'bmp'];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if (!in_array($ext, $allowedExts)) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '图片格式不支持，仅支持 JPG、BMP、PNG 格式', 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

// 大小校验（5MB）
if ($file['size'] > 5 * 1024 * 1024) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '图片大小不能超过 5M', 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

// 真实图片校验（防 PHP 文件伪装）
$imageInfo = @getimagesize($file['tmp_name']);
if ($imageInfo === false) {
    http_response_code(400);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '文件不是有效的图片', 'data' => null], JSON_UNESCAPED_UNICODE);
    exit;
}

// ---- 加载微信支付配置 ----
$config = include __DIR__ . '/../config/wechatpay.php';
if (!empty($config['private_key']) && file_exists($config['private_key'])) {
    $config['private_key'] = file_get_contents($config['private_key']);
}
if (!empty($config['wechatpay_public_key']) && file_exists($config['wechatpay_public_key'])) {
    $config['wechatpay_public_key'] = file_get_contents($config['wechatpay_public_key']);
}

// ---- 上传到微信 ----
try {
    $service = \app\common\service\pay\WechatPayService::getInstance($config);
    $result = $service->uploadImage($file['tmp_name'], $file['name']);

    if ($result['code'] === 0) {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['code' => 1, 'msg' => '上传成功', 'data' => $result['data']], JSON_UNESCAPED_UNICODE);
    } else {
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['code' => 0, 'msg' => $result['message'] ?? '上传失败', 'data' => null], JSON_UNESCAPED_UNICODE);
    }
} catch (\Exception $e) {
    \think\facade\Log::error('[wechat-upload] 异常: ' . $e->getMessage());
    http_response_code(500);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode(['code' => 0, 'msg' => '上传服务异常，请稍后重试', 'data' => null], JSON_UNESCAPED_UNICODE);
}
