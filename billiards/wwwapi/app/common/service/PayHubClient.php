<?php

namespace app\common\service;

/**
 * pay-hub 支付网关 HTTP 客户端
 * 封装 HMAC-SHA256 签名 + Admin JWT 认证
 */
class PayHubClient
{
    private string $baseUrl;
    private string $clientId;
    private string $appSecret;

    public function __construct()
    {
        $this->baseUrl = rtrim(env('PAYHUB_BASE_URL', 'http://127.0.0.1:20003'), '/');
        $this->clientId = env('PAYHUB_CLIENT_ID', 'pms-server');
        $this->appSecret = env('PAYHUB_APP_SECRET', 'pms_test_secret_32_bytes_demo!');
    }

    /** 创建支付 */
    public function createPayment(array $params): array
    {
        return $this->request('POST', '/api/v1/payments', $params);
    }

    /** 创建被扫支付（MICROPAY） */
    public function micropay(array $params): array
    {
        return $this->request('POST', '/api/v1/payments/micropay', $params);
    }

    /** 查询支付 */
    public function queryPayment(string $paymentId): array
    {
        return $this->request('GET', "/api/v1/payments/{$paymentId}");
    }

    /** 创建退款 */
    public function createRefund(string $paymentId, array $params): array
    {
        return $this->request('POST', "/api/v1/payments/{$paymentId}/refund", $params);
    }

    /** 查询渠道配置 */
    public function queryChannelConfig(string $clientId, string $channel): array
    {
        return $this->adminRequest('GET', "/api/v1/admin/channel-configs?clientId={$clientId}&channel={$channel}");
    }

    /** 保存渠道配置 */
    public function saveChannelConfig(array $config): array
    {
        return $this->adminRequest('POST', '/api/v1/admin/channel-configs', $config);
    }

    /**
     * 业务方请求（HMAC 签名认证）
     */
    private function request(string $method, string $path, array $body = []): array
    {
        $ts = (string)(time() * 1000);
        $bodyStr = $method === 'GET' ? '' : json_encode($body, JSON_UNESCAPED_UNICODE);
        $payload = "{$method}\n{$path}\n{$ts}\n{$bodyStr}";
        $signature = hash_hmac('sha256', $payload, $this->appSecret);

        $ch = curl_init("{$this->baseUrl}{$path}");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_POSTFIELDS     => $method !== 'GET' ? $bodyStr : null,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                "X-Client-Id: {$this->clientId}",
                "X-Timestamp: {$ts}",
                "X-Signature: {$signature}",
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
        ]);

        $resp = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        if ($resp === false) {
            return ['success' => false, 'error' => 'pay-hub 连接失败'];
        }

        $data = json_decode($resp, true);
        if ($httpCode >= 400) {
            return ['success' => false, 'error' => $data['error']['message'] ?? "HTTP {$httpCode}"];
        }

        return $data;
    }

    /**
     * 管理后台请求（JWT 认证）
     */
    private function adminRequest(string $method, string $path, array $body = []): array
    {
        $bodyStr = $method === 'GET' ? '' : json_encode($body, JSON_UNESCAPED_UNICODE);

        $ch = curl_init("{$this->baseUrl}{$path}");
        curl_setopt_array($ch, [
            CURLOPT_CUSTOMREQUEST  => $method,
            CURLOPT_POSTFIELDS     => $method !== 'GET' ? $bodyStr : null,
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $this->getAdminToken(),
            ],
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 15,
        ]);

        $resp = curl_exec($ch);
        curl_close($ch);
        return json_decode($resp, true) ?: [];
    }

    /**
     * 生成 Admin JWT Token
     */
    private function getAdminToken(): string
    {
        $secret = env('PAYHUB_ADMIN_SECRET', '');
        if (!is_string($secret) || $secret === '') {
            throw new \RuntimeException('PAYHUB_ADMIN_SECRET is not configured');
        }
        $header = self::base64urlEncode(json_encode(['alg' => 'HS256', 'typ' => 'JWT']));
        $payload = self::base64urlEncode(json_encode([
            'role' => 'admin',
            'iat'  => time(),
            'exp'  => time() + 3600,
        ]));
        $signature = self::base64urlEncode(hash_hmac('sha256', "{$header}.{$payload}", $secret, true));
        return "{$header}.{$payload}.{$signature}";
    }

    private static function base64urlEncode(string $data): string
    {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}
