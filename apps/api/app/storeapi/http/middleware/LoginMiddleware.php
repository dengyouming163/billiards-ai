<?php

declare (strict_types=1);

namespace app\storeapi\http\middleware;

use app\storeapi\service\EmployeeTokenService;
use app\common\service\JsonService;
use think\facade\App;

class LoginMiddleware
{
    public function handle($request, \Closure $next)
    {
        $path = $request->pathinfo();
        
        if (str_starts_with($path, 'tablet') || str_starts_with($path, 'pos')) {
            return $next($request);
        }

        $token = $request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }

        $isNotNeedLogin = $this->checkNotNeedLogin($request);

        if (empty($token) && !$isNotNeedLogin) {
            return JsonService::fail('请先登录', [], 2001);
        }

        $employeeInfo = null;
        if (!empty($token)) {
            $employeeInfo = EmployeeTokenService::getEmployeeInfo($token);
        }
        
        if (empty($employeeInfo) && !$isNotNeedLogin) {
            return JsonService::fail('登录超时，请重新登录', [], 2002);
        }

        if ($employeeInfo) {
            EmployeeTokenService::refreshToken($token);
        }

        $request->employeeInfo = $employeeInfo;
        $request->employeeId = $employeeInfo['id'] ?? 0;
        $request->storeId = $employeeInfo['store_id'] ?? '';
        
        return $next($request);
    }

    private function checkNotNeedLogin($request)
    {
        $path = $request->pathinfo();
        $segments = explode('/', trim($path, '/'));
        
        if (count($segments) >= 2) {
            $controllerPart = $segments[0];
            $actionPart = $segments[1];
            
            $action = strtolower($actionPart);
            
            $controllerParts = explode('.', $controllerPart);
            $controllerName = '';
            foreach ($controllerParts as $index => $part) {
                if ($controllerName) {
                    $controllerName .= '\\';
                }
                if ($index === 0 && in_array(strtolower($part), ['pos', 'tablet', 'mobile', 'employee'])) {
                    $controllerName .= strtolower($part);
                } else {
                    $controllerName .= ucfirst(strtolower($part));
                }
            }
            
            $controllerClass = 'app\\storeapi\\controller\\' . $controllerName . 'Controller';
            
            if (class_exists($controllerClass)) {
                $controllerInstance = App::make($controllerClass);
                
                if (property_exists($controllerInstance, 'notNeedLogin')) {
                    $notNeedLogin = $controllerInstance->notNeedLogin;
                    if (is_array($notNeedLogin)) {
                        $lowerNotNeedLogin = array_map('strtolower', $notNeedLogin);
                        if (in_array($action, $lowerNotNeedLogin)) {
                            return true;
                        }
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
