<?php

declare(strict_types=1);

namespace app\storeapi\http\middleware;

use app\common\annotation\Permission;
use app\common\service\JsonService;
use app\storeapi\logic\role\PermissionLogic;
use think\facade\App;

class AuthMiddleware
{
    public function handle($request, \Closure $next)
    {
        $path = $request->pathinfo();

        if (str_starts_with($path, 'tablet') || str_starts_with($path, 'pos')) {
            return $next($request);
        }

        if ($this->isNotNeedLogin($request)) {
            return $next($request);
        }

        $employeeInfo = $request->employeeInfo;
        if (empty($employeeInfo)) {
            return JsonService::fail('请先登录', [], 2001);
        }

        $employeeId = $request->employeeId ?? 0;
        $storeId = $request->storeId ?? '';

        if ($request->employeeInfo['role'] === 'boss') {
            return $next($request);
        }

        $requiredPermission = $this->getRequiredPermission($request);

        if ($requiredPermission === null) {
            return $next($request);
        }

        if ($requiredPermission === '') {
            return $next($request);
        }

        if (!empty($employeeId) && !empty($storeId)) {
            $hasPermission = PermissionLogic::hasPermission(
                $employeeId,
                $requiredPermission,
                $storeId
            );

            if (!$hasPermission) {
                return JsonService::fail('无权限访问', [], 403);
            }
        }

        return $next($request);
    }

    private function getRequiredPermission($request): ?string
    {
        $path = $request->pathinfo();
        $segments = explode('/', trim($path, '/'));

        if (count($segments) < 2) {
            return null;
        }

        $controllerPart = $segments[0];
        $actionPart = $segments[1];

        $controllerClass = $this->resolveControllerClass($controllerPart);

        if (!class_exists($controllerClass)) {
            return null;
        }

        try {
            $reflection = new \ReflectionClass($controllerClass);
            $methodName = strtolower($actionPart);

            foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
                if (strtolower($method->getName()) === $methodName) {
                    $attrs = $method->getAttributes(Permission::class);
                    foreach ($attrs as $attr) {
                        $perm = $attr->newInstance();
                        return $perm->code;
                    }
                    return '';
                }
            }
        } catch (\Throwable $e) {
            return null;
        }

        return null;
    }

    private function resolveControllerClass(string $controllerPart): string
    {
        $parts = explode('.', $controllerPart);
        $ns = '';
        foreach ($parts as $index => $part) {
            if ($ns) {
                $ns .= '\\';
            }
            if ($index === 0 && in_array(strtolower($part), ['pos', 'tablet', 'mobile', 'employee'])) {
                $ns .= strtolower($part);
            } else {
                $ns .= ucfirst(strtolower($part));
            }
        }
        return 'app\\storeapi\\controller\\' . $ns . 'Controller';
    }

    private function isNotNeedLogin($request): bool
    {
        $path = $request->pathinfo();
        $segments = explode('/', trim($path, '/'));

        if (count($segments) >= 2) {
            $controllerClass = $this->resolveControllerClass($segments[0]);
            $action = strtolower($segments[1]);

            if (class_exists($controllerClass)) {
                $controllerInstance = App::make($controllerClass);

                if (property_exists($controllerInstance, 'notNeedLogin')) {
                    $notNeedLogin = $controllerInstance->notNeedLogin;
                    if (is_array($notNeedLogin) && in_array($action, $notNeedLogin)) {
                        return true;
                    }
                }

                if (method_exists($controllerInstance, 'isNotNeedLogin')) {
                    return $controllerInstance->isNotNeedLogin();
                }
            }
        }

        return false;
    }
}
