<?php

declare (strict_types=1);

namespace app\miniappapi\middleware;

use app\common\service\JsonService;
use think\facade\Cache;

class WxAuth
{
    // 无需登录的白名单
    private array $notNeedLogin = [
        'auth.Auth/login',
    ];

    public function handle($request, \Closure $next)
    {
        // 白名单检查
        $isNotNeedLogin = $this->checkNotNeedLogin($request);
        if ($isNotNeedLogin) {
            return $next($request);
        }

        // 读取 token
        $token = $request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        if (empty($token)) {
            return JsonService::fail('请先登录', [], 2002);
        }

        // 从缓存获取登录信息
        $cacheKey = 'mini_token:' . $token;
        $loginInfo = Cache::get($cacheKey);

        if (empty($loginInfo)) {
            return JsonService::fail('登录超时，请重新登录', [], 2002);
        }

        // 刷新 token 有效期（7天）
        Cache::set($cacheKey, $loginInfo, 86400 * 7);

        // 注入到 request
        $request->memberId = $loginInfo['member_id'] ?? '';
        $request->openid = $loginInfo['openid'] ?? '';
        $request->storeId = $loginInfo['store_id'] ?? '';

        return $next($request);
    }

    private function checkNotNeedLogin($request): bool
    {
        $path = $request->pathinfo();

        // 匹配白名单中的路由模式
        // $path 在 route group 内部已去掉 miniappapi 前缀，格式: auth.Auth/login
        foreach ($this->notNeedLogin as $pattern) {
            if (str_contains($path, $pattern)) {
                return true;
            }
        }
        return false;
    }
}
