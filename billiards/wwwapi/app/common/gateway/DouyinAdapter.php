<?php

declare(strict_types=1);

namespace app\common\gateway;

use think\facade\Log;

class DouyinAdapter implements CouponPlatformInterface
{
    private string $baseUrl = 'https://open.douyin.com';

    private function getAccessToken(array &$config): string
    {
        // 检查缓存的 token 是否有效
        $tokenExpiresAt = strtotime($config['token_expires_at'] ?? '');
        if (!empty($config['auth_token']) && $tokenExpiresAt > (time() + 300)) {
            return $config['auth_token'];
        }

        // 重新获取 token
        $url = $this->baseUrl . '/oauth/client_token/';
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query([
                'client_key' => $config['app_id'],
                'client_secret' => $config['app_secret'],
                'grant_type' => 'client_credential',
            ]),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 10,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);

        $response = curl_exec($ch);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error('Douyin getAccessToken error: ' . $error);
            return '';
        }

        $data = json_decode($response, true);
        $token = $data['data']['access_token'] ?? '';
        $expiresIn = intval($data['data']['expires_in'] ?? 7200);

        if ($token) {
            $config['auth_token'] = $token;
            $config['token_expires_at'] = date('Y-m-d H:i:s', time() + $expiresIn);
            // 持久化到数据库
            \app\common\model\merchant\CouponPlatform::where('store_id', $config['store_id'] ?? '')
                ->where('platform', 'douyin')
                ->update([
                    'auth_token' => $token,
                    'token_expires_at' => $config['token_expires_at'],
                ]);
        }

        return $token;
    }

    private function request(string $method, string $path, array $params, array &$config): array
    {
        $token = $this->getAccessToken($config);
        if (empty($token)) {
            return ['success' => false, 'message' => '获取抖音access_token失败'];
        }

        $url = $this->baseUrl . $path;
        $ch = curl_init();

        if ($method === 'GET') {
            $url .= '?' . http_build_query($params);
        } else {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($params, JSON_UNESCAPED_UNICODE));
        }

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'access-token: ' . $token,
            ],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error('Douyin API error: ' . $error . ' | path=' . $path);
            return ['success' => false, 'message' => '抖音API请求失败: ' . $error];
        }

        $data = json_decode($response, true);
        if (!$data) {
            return ['success' => false, 'message' => '抖音API响应解析失败'];
        }

        $errCode = $data['data']['error_code'] ?? $data['extra']['error_code'] ?? 0;
        if ($errCode !== 0) {
            $errMsg = $data['data']['description'] ?? $data['extra']['description'] ?? '未知错误';
            return ['success' => false, 'message' => '抖音API错误[' . $errCode . ']: ' . $errMsg, 'raw' => $data];
        }

        return ['success' => true, 'message' => 'ok', 'data' => $data['data'] ?? $data];
    }

    public function prepare(array $config, string $code): array
    {
        $params = [];
        // 判断是 encrypted_data 还是明文 code
        if (strlen($code) > 20) {
            $params['encrypted_data'] = $code;
        } else {
            $params['code'] = $code;
        }
        $params['poi_id'] = $config['poi_id'] ?? '';

        $result = $this->request('GET', '/goodlife/v1/fulfilment/certificate/prepare/', $params, $config);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];
        $certificates = $data['certificates'] ?? [];

        if (empty($certificates)) {
            return ['success' => false, 'message' => '未找到可核销的券'];
        }

        $cert = $certificates[0];
        $packageName = $cert['goods_name'] ?? $cert['title'] ?? '';
        $price = floatval($cert['origin_amount'] ?? $cert['amount'] ?? 0);
        $durationMinutes = $this->parseDuration($packageName, $cert);

        return [
            'success' => true,
            'message' => 'ok',
            'data' => [
                'coupon_code' => $code,
                'package_name' => $packageName,
                'price' => $price,
                'duration_minutes' => $durationMinutes,
                'platform_order_id' => $data['order_id'] ?? '',
                'verify_token' => $data['verify_token'] ?? '',
                'raw' => $data,
            ],
        ];
    }

    public function consume(array $config, string $code, string $verifyToken): array
    {
        $params = [
            'verify_token' => $verifyToken,
            'poi_id' => $config['poi_id'] ?? '',
        ];

        // 需要传入 encrypted_codes（从 prepare 阶段获取）
        if (!empty($config['_prepared_encrypted_codes'])) {
            $params['encrypted_codes'] = $config['_prepared_encrypted_codes'];
        }

        $result = $this->request('POST', '/goodlife/v1/fulfilment/certificate/verify/', $params, $config);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];
        $verifyResults = $data['verify_results'] ?? [];

        if (empty($verifyResults)) {
            return ['success' => false, 'message' => '核销返回结果为空'];
        }

        $vr = $verifyResults[0];
        $vrCode = $vr['result'] ?? $vr['verify_result'] ?? -1;

        // 抖音码枚举: 0=成功, 2=已核销(幂等也视为成功)
        if ($vrCode === 0 || $vrCode === 2) {
            return [
                'success' => true,
                'message' => '核销成功',
                'data' => [
                    'platform_order_id' => $data['order_id'] ?? '',
                ],
            ];
        }

        $msgMap = [3 => '券码退款中', 4 => '券码已退款', 5 => '未到可用日期', 32 => '券码过期自动退'];
        return ['success' => false, 'message' => $msgMap[$vrCode] ?? '核销失败, code=' . $vrCode];
    }

    public function reverse(array $config, string $code, string $verifyToken): array
    {
        $params = [
            'order_id' => $config['_platform_order_id'] ?? '',
            'poi_id' => $config['poi_id'] ?? '',
        ];

        $result = $this->request('POST', '/goodlife/v1/fulfilment/certificate/reverse/', $params, $config);

        if (!$result['success']) {
            return ['success' => false, 'message' => $result['message']];
        }

        return ['success' => true, 'message' => '撤销成功'];
    }

    public function getPackages(array $config): array
    {
        $params = [
            'poi_id' => $config['poi_id'] ?? '',
            'status' => 1,
        ];

        $result = $this->request('GET', '/goodlife/v1/fulfilment/certificate/goods/list/', $params, $config);

        if (!$result['success']) {
            return $result;
        }

        $goodsList = $result['data']['goods_list'] ?? $result['data']['list'] ?? [];
        $packages = [];
        foreach ($goodsList as $goods) {
            $packages[] = [
                'platform_package_id' => strval($goods['goods_id'] ?? $goods['id'] ?? ''),
                'name' => $goods['name'] ?? $goods['title'] ?? '',
                'type' => 'time',
                'duration_hours' => 0,
                'price' => floatval($goods['sell_price'] ?? $goods['price'] ?? 0),
                'original_price' => floatval($goods['original_price'] ?? $goods['value'] ?? 0),
            ];
        }

        return ['success' => true, 'message' => 'ok', 'data' => $packages];
    }

    public function queryByDate(array $config, string $date): array
    {
        $params = [
            'poi_id' => $config['poi_id'] ?? '',
            'date' => $date,
        ];

        $result = $this->request('GET', '/goodlife/v1/fulfilment/certificate/verify/record/query/', $params, $config);

        if (!$result['success']) {
            return $result;
        }

        return ['success' => true, 'message' => 'ok', 'data' => $result['data']['records'] ?? $result['data']['list'] ?? []];
    }

    private function parseDuration(string $name, array $rawData): int
    {
        if (preg_match('/(\d+)\s*小时/', $name, $m)) {
            return intval($m[1]) * 60;
        }
        if (preg_match('/(\d+)\s*分钟/', $name, $m)) {
            return intval($m[1]);
        }
        $durationFromRaw = $rawData['duration'] ?? $rawData['valid_days'] ?? 0;
        if ($durationFromRaw > 0) {
            return intval($durationFromRaw) * 60;
        }
        return 60;
    }
}
