<?php

declare(strict_types=1);

namespace app\storeapi\logic\coupon;

use app\common\logic\BaseLogic;
use app\common\model\merchant\CouponPlatform as CouponPlatformModel;
use app\common\gateway\MeituanAdapter;
use app\common\gateway\DouyinAdapter;

class CouponPlatformLogic extends BaseLogic
{
    private static function getEncryptionKey(): string
    {
        // Use a fixed application key for encryption. In production, use env('COUPON_ENCRYPT_KEY')
        $key = env('COUPON_ENCRYPT_KEY', '');
        if (empty($key)) {
            // Fallback: derive from database config
            $key = config('database.connections.mysql.password') ?? '';
            $key = substr(hash('sha256', $key, true), 0, 32);
        } else {
            $key = substr(hash('sha256', $key, true), 0, 32);
        }
        return $key;
    }

    private static function encrypt(string $plaintext): string
    {
        if (empty($plaintext)) return '';
        $key = self::getEncryptionKey();
        $iv = random_bytes(16);
        $encrypted = openssl_encrypt($plaintext, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return 'enc:' . base64_encode($iv . $encrypted);
    }

    private static function decrypt(string $encoded): string
    {
        if (empty($encoded)) return '';
        if (!str_starts_with($encoded, 'enc:')) return $encoded; // not encrypted (legacy)
        $data = base64_decode(substr($encoded, 4));
        $iv = substr($data, 0, 16);
        $encrypted = substr($data, 16);
        $key = self::getEncryptionKey();
        $decrypted = openssl_decrypt($encrypted, 'AES-256-CBC', $key, OPENSSL_RAW_DATA, $iv);
        return $decrypted !== false ? $decrypted : '';
    }

    public static function saveConfig(string $storeId, array $params): array
    {
        $platform = $params['platform'] ?? '';
        $appId = $params['app_id'] ?? '';
        $appSecret = $params['app_secret'] ?? '';

        if (!in_array($platform, ['meituan', 'douyin'])) {
            return ['success' => false, 'message' => '平台参数无效'];
        }

        if (empty($appId) || empty($appSecret)) {
            return ['success' => false, 'message' => 'AppId和AppSecret不能为空'];
        }

        $encryptedSecret = self::encrypt($appSecret);

        $existing = CouponPlatformModel::where('store_id', $storeId)
            ->where('platform', $platform)
            ->find();

        if ($existing) {
            $existing->app_id = $appId;
            $existing->app_secret = $encryptedSecret;
            $existing->status = 1;
            $existing->save();
            return ['success' => true, 'message' => '配置已更新', 'data' => ['id' => $existing->id]];
        }

        $model = new CouponPlatformModel();
        $model->id = 'cpf_' . bin2hex(random_bytes(6));
        $model->store_id = $storeId;
        $model->platform = $platform;
        $model->app_id = $appId;
        $model->app_secret = $encryptedSecret;
        $model->status = 1;
        $model->save();

        return ['success' => true, 'message' => '配置已保存', 'data' => ['id' => $model->id]];
    }

    public static function getConfig(string $storeId, string $platform): array
    {
        $model = CouponPlatformModel::getByStoreAndPlatform($storeId, $platform);
        if (!$model) {
            return ['success' => true, 'message' => 'ok', 'data' => null];
        }

        return [
            'success' => true,
            'message' => 'ok',
            'data' => [
                'id' => $model->id,
                'platform' => $model->platform,
                'app_id' => $model->app_id,
                'app_secret' => substr($model->app_secret, 0, 10) . '****',
                'status' => $model->status,
                'token_expires_at' => $model->token_expires_at,
            ],
        ];
    }

    public static function checkStatus(string $storeId, string $platform): array
    {
        $model = CouponPlatformModel::getByStoreAndPlatform($storeId, $platform);
        if (!$model) {
            return ['success' => true, 'message' => 'ok', 'data' => ['configured' => false, 'connected' => false]];
        }

        $config = [
            'store_id' => $storeId,
            'app_id' => $model->app_id,
            'app_secret' => self::decrypt($model->app_secret),
            'auth_token' => $model->auth_token,
            'token_expires_at' => $model->token_expires_at,
        ];

        try {
            $adapter = $platform === 'meituan' ? new MeituanAdapter() : new DouyinAdapter();
            $result = $adapter->getPackages($config);
            return [
                'success' => true,
                'message' => 'ok',
                'data' => [
                    'configured' => true,
                    'connected' => $result['success'],
                    'message' => $result['success'] ? '连接正常' : $result['message'],
                ],
            ];
        } catch (\Exception $e) {
            return [
                'success' => true,
                'message' => 'ok',
                'data' => ['configured' => true, 'connected' => false, 'message' => $e->getMessage()],
            ];
        }
    }

    public static function getAdapterConfig(string $storeId, string $platform): ?array
    {
        $model = CouponPlatformModel::getByStoreAndPlatform($storeId, $platform);
        if (!$model) {
            return null;
        }
        return [
            'store_id' => $storeId,
            'app_id' => $model->app_id,
            'app_secret' => self::decrypt($model->app_secret),
            'auth_token' => $model->auth_token,
            'token_expires_at' => $model->token_expires_at,
        ];
    }
}
