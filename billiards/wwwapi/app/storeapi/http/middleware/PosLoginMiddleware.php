<?php

declare (strict_types=1);

namespace app\storeapi\http\middleware;

use app\storeapi\service\PosEmployeeTokenService;
use app\common\service\JsonService;
use think\facade\App;
use think\facade\Log;

class PosLoginMiddleware
{
    public function handle($request, \Closure $next)
    {
        $path = $request->pathinfo();
        Log::info('PosLoginMiddleware Request path: ' . $path);

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
            Log::info('PosLoginMiddleware Getting employee info for token');
            $employeeInfo = PosEmployeeTokenService::getEmployeeInfo($token);
            Log::info('PosLoginMiddleware Employee info result: ' . ($employeeInfo ? 'Found' : 'Not found'));
        }
        
        if (empty($employeeInfo) && !$isNotNeedLogin) {
            Log::info('PosLoginMiddleware Employee info is empty and login is required');
            return JsonService::fail('登录超时，请重新登录', [], 2002);
        }

        if ($employeeInfo) {
            PosEmployeeTokenService::refreshToken($token);
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
                if ($index === 0 && strtolower($part) === 'pos') {
                    $controllerName .= 'pos';
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
