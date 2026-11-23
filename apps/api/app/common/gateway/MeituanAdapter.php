<?php

declare(strict_types=1);

namespace app\common\gateway;

use think\facade\Log;

class MeituanAdapter implements CouponPlatformInterface
{
    private string $baseUrl = 'https://api-open-cater.meituan.com';

    private function sign(array $params, string $secret): string
    {
        ksort($params);
        $stringToSign = '';
        foreach ($params as $key => $value) {
            if ($value !== '' && $value !== null) {
                $stringToSign .= $key . '=' . $value . '&';
            }
        }
        $stringToSign = rtrim($stringToSign, '&');
        return md5($stringToSign . $secret);
    }

    private function request(string $method, string $path, array $params, string $appId, string $secret): array
    {
        $params['appId'] = $appId;
        $params['timestamp'] = strval(time());
        $params['sign'] = $this->sign($params, $secret);

        $url = $this->baseUrl . $path;
        $ch = curl_init();

        if ($method === 'GET') {
            $url .= '?' . http_build_query($params);
        } else {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
        }

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 15,
            CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            Log::error('Meituan API error: ' . $error . ' | path=' . $path);
            return ['success' => false, 'message' => '美团API请求失败: ' . $error];
        }

        $data = json_decode($response, true);
        if (!$data) {
            return ['success' => false, 'message' => '美团API响应解析失败'];
        }

        return ['success' => true, 'message' => 'ok', 'data' => $data];
    }

    public function prepare(array $config, string $code): array
    {
        $params = [
            'receiptCode' => $code,
        ];

        $result = $this->request('POST', '/ddzh/tuangou/receipt/prepare', $params, $config['app_id'], $config['app_secret']);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];
        $status = $data['status'] ?? -1;

        if ($status !== 0) {
            $msgMap = [1 => '券码已核销', 2 => '券码已过期', 3 => '券码已退款', 4 => '券码不存在'];
            return ['success' => false, 'message' => $msgMap[$status] ?? '券码状态异常, code=' . $status];
        }

        $packageName = $data['data']['dealTitle'] ?? $data['data']['title'] ?? '';
        $price = floatval($data['data']['price'] ?? 0);
        $durationMinutes = $this->parseDuration($packageName, $data['data'] ?? []);

        return [
            'success' => true,
            'message' => 'ok',
            'data' => [
                'coupon_code' => $code,
                'package_name' => $packageName,
                'price' => $price,
                'duration_minutes' => $durationMinutes,
                'platform_order_id' => $data['data']['orderId'] ?? '',
                'verify_token' => $data['data']['verifyToken'] ?? '',
                'raw' => $data,
            ],
        ];
    }

    public function consume(array $config, string $code, string $verifyToken): array
    {
        $params = [
            'receiptCode' => $code,
            'verifyToken' => $verifyToken,
        ];

        $result = $this->request('POST', '/ddzh/tuangou/receipt/consume', $params, $config['app_id'], $config['app_secret']);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];
        $status = $data['status'] ?? -1;

        if ($status !== 0) {
            $msgMap = [1 => '重复核销', 2 => '券码已过期', 3 => '券码已退款', 4 => '核销失败'];
            return ['success' => false, 'message' => $msgMap[$status] ?? '核销失败, code=' . $status];
        }

        return [
            'success' => true,
            'message' => '核销成功',
            'data' => [
                'platform_order_id' => $data['data']['orderId'] ?? '',
            ],
        ];
    }

    public function reverse(array $config, string $code, string $verifyToken): array
    {
        $params = [
            'receiptCode' => $code,
            'verifyToken' => $verifyToken,
        ];

        $result = $this->request('POST', '/ddzh/tuangou/receipt/reverseconsume', $params, $config['app_id'], $config['app_secret']);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];
        $status = $data['status'] ?? -1;

        if ($status !== 0) {
            return ['success' => false, 'message' => '撤销失败, code=' . $status];
        }

        return ['success' => true, 'message' => '撤销成功'];
    }

    public function getPackages(array $config): array
    {
        $params = [];

        $result = $this->request('POST', '/ddzh/tuangou/deal/querylist', $params, $config['app_id'], $config['app_secret']);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];
        $deals = $data['data'] ?? [];

        $packages = [];
        foreach ($deals as $deal) {
            $packages[] = [
                'platform_package_id' => strval($deal['dealId'] ?? ''),
                'name' => $deal['title'] ?? $deal['dealTitle'] ?? '',
                'type' => 'time',
                'duration_hours' => 0,
                'price' => floatval($deal['price'] ?? 0),
                'original_price' => floatval($deal['originalPrice'] ?? $deal['value'] ?? 0),
            ];
        }

        return ['success' => true, 'message' => 'ok', 'data' => $packages];
    }

    public function queryByDate(array $config, string $date): array
    {
        $params = ['date' => $date];

        $result = $this->request('POST', '/ddzh/tuangou/receipt/querylistbydate', $params, $config['app_id'], $config['app_secret']);

        if (!$result['success']) {
            return $result;
        }

        return ['success' => true, 'message' => 'ok', 'data' => $result['data']['data'] ?? []];
    }

    private function parseDuration(string $name, array $rawData): int
    {
        // 从套餐名称解析时长: "2小时台球畅玩" → 120分钟
        if (preg_match('/(\d+)\s*小时/', $name, $m)) {
            return intval($m[1]) * 60;
        }
        if (preg_match('/(\d+)\s*分钟/', $name, $m)) {
            return intval($m[1]);
        }
        // 尝试从 rawData 获取
        $durationFromRaw = $rawData['duration'] ?? $rawData['validTime'] ?? 0;
        if ($durationFromRaw > 0) {
            return intval($durationFromRaw);
        }
        // 默认 1 小时
        return 60;
    }
}
