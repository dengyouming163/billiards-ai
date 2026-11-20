<?php

namespace app\common\service\pay;

use think\facade\Db;

/**
 * 微信支付 v3 API 客户端
 * 直接调用微信 v3 接口（EasyWeChat v6 无 ecommerce 模块）
 * 支持签名认证、图片上传、特约商户进件提交/查询
 */
class WechatV3Client
{
    protected array $config;
    protected string $baseUrl = 'https://api.mch.weixin.qq.com';

    public function __construct(?array $config = null)
    {
        $this->config = $config ?? $this->loadConfig();
    }

    /** 从 bi_wechat_config 加载服务商配置 */
    private function loadConfig(): array
    {
        $row = Db::name('wechat_config')->where('type', 'partner')->find();
        if (!$row || empty($row['mch_id'])) {
            throw new \Exception('微信服务商配置未设置');
        }
        return $row;
    }

    /** 生成微信 v3 签名头 */
    public function sign(string $method, string $path, string $body = ''): array
    {
        $timestamp = (string)time();
        $nonce     = bin2hex(random_bytes(16));
        $message   = "{$method}\n{$path}\n{$timestamp}\n{$nonce}\n{$body}\n";

        $privateKey = openssl_pkey_get_private($this->config['private_key']);
        if (!$privateKey) {
            throw new \Exception('私钥加载失败，请检查服务商配置中的 private_key');
        }

        openssl_sign($message, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $sign = base64_encode($signature);

        return [
            'Wechatpay-Serial: ' . $this->config['serial_no'],
            'Authorization: WECHATPAY2-SHA256-RSA2048 '
                . 'mchid="' . $this->config['mch_id'] . '",'
                . 'nonce_str="' . $nonce . '",'
                . 'timestamp="' . $timestamp . '",'
                . 'serial_no="' . $this->config['serial_no'] . '",'
                . 'signature="' . $sign . '"',
            'Content-Type: application/json',
            'Accept: application/json',
            'User-Agent: wwwapi/1.0',
        ];
    }

    /** 发送 v3 API 请求 */
    public function request(string $method, string $path, array $body = []): array
    {
        $bodyJson = '';
        $headers  = $this->sign($method, $path, $bodyJson);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $this->baseUrl . $path,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER     => $headers,
            CURLOPT_TIMEOUT        => 30,
        ]);

        if ($method === 'POST') {
            $bodyJson = json_encode($body, JSON_UNESCAPED_UNICODE);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, $bodyJson);
            // 重新签名（body 变了）
            $headers = $this->sign('POST', $path, $bodyJson);
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        } elseif ($method === 'GET' && !empty($body)) {
            $queryStr = http_build_query($body);
            curl_setopt($ch, CURLOPT_URL, $this->baseUrl . $path . '?' . $queryStr);
        }

        $respBody = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlErr  = curl_error($ch);
        curl_close($ch);

        if ($curlErr) {
            throw new \Exception('网络请求失败: ' . $curlErr);
        }

        $data = json_decode($respBody, true) ?: [];

        if ($httpCode >= 400) {
            $msg = $data['message'] ?? ($data['code'] ?? '未知错误');
            \think\facade\Log::error('[WechatV3] HTTP=' . $httpCode . ' ' . json_encode($data, JSON_UNESCAPED_UNICODE));
            throw new \Exception('微信API错误: ' . $msg);
        }

        return $data;
    }

    /** 上传图片 — POST /v3/merchant/media/upload */
    public function uploadMedia(string $filePath, string $fileName = 'upload.jpg'): array
    {
        if (!file_exists($filePath)) {
            throw new \Exception('文件不存在: ' . $filePath);
        }

        $fileContent = file_get_contents($filePath);
        $fileHash    = hash('sha256', $fileContent);
        $meta        = json_encode(['filename' => $fileName, 'sha256' => $fileHash], JSON_UNESCAPED_UNICODE);

        $boundary = '----WebKitFormBoundary' . bin2hex(random_bytes(16));
        $body = "--{$boundary}\r\n"
            . "Content-Disposition: form-data; name=\"meta\"\r\n"
            . "Content-Type: application/json\r\n\r\n"
            . "{$meta}\r\n"
            . "--{$boundary}\r\n"
            . "Content-Disposition: form-data; name=\"file\"; filename=\"{$fileName}\"\r\n"
            . "Content-Type: image/jpeg\r\n\r\n"
            . $fileContent . "\r\n"
            . "--{$boundary}--\r\n";

        $path      = '/v3/merchant/media/upload';
        $timestamp = (string)time();
        $nonce     = bin2hex(random_bytes(16));
        $message   = "POST\n{$path}\n{$timestamp}\n{$nonce}\n{$body}\n";

        $privateKey = openssl_pkey_get_private($this->config['private_key']);
        openssl_sign($message, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $sign = base64_encode($signature);

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL            => $this->baseUrl . $path,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => $body,
            CURLOPT_HTTPHEADER     => [
                'Authorization: WECHATPAY2-SHA256-RSA2048 '
                    . 'mchid="' . $this->config['mch_id'] . '",'
                    . 'nonce_str="' . $nonce . '",'
                    . 'timestamp="' . $timestamp . '",'
                    . 'serial_no="' . $this->config['serial_no'] . '",'
                    . 'signature="' . $sign . '"',
                'Content-Type: multipart/form-data; boundary=' . $boundary,
                'Accept: application/json',
                'User-Agent: wwwapi/1.0',
            ],
            CURLOPT_TIMEOUT => 30,
        ]);

        $respBody = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $data = json_decode($respBody, true) ?: [];
        if ($httpCode >= 400) {
            throw new \Exception('图片上传失败: ' . ($data['message'] ?? '未知错误'));
        }

        return $data; // { media_id: "..." }
    }

    /** 提交进件申请 — POST /v3/ecommerce/applyments/ */
    public function submitApplyment(array $data): array
    {
        return $this->request('POST', '/v3/ecommerce/applyments/', $data);
    }

    /** 查询进件 — GET /v3/ecommerce/applyments/{applyment_id} */
    public function queryApplyment(string $applymentId): array
    {
        return $this->request('GET', '/v3/ecommerce/applyments/' . $applymentId);
    }

    /** 通过业务编号查询 — GET /v3/ecommerce/applyments/out-applyment-id/{business_code} */
    public function queryApplymentByBusinessCode(string $businessCode): array
    {
        return $this->request('GET', '/v3/ecommerce/applyments/out-applyment-id/' . $businessCode);
    }
}
