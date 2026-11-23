<?php

declare (strict_types=1);

namespace app\storeapi\http\middleware;

use app\storeapi\controller\tablet\AuthController;
use think\facade\Cache;

class TabletAuthMiddleware
{
    public function handle($request, \Closure $next)
    {
        $controller = $request->controller();
        $action = $request->action();
        
        $controllerClass = 'app\\storeapi\\controller\\tablet\\' . $controller . 'Controller';
        
        if (class_exists($controllerClass)) {
            $reflection = new \ReflectionClass($controllerClass);
            if ($reflection->hasProperty('notNeedLogin')) {
                $property = $reflection->getProperty('notNeedLogin');
                $property->setAccessible(true);
                $notNeedLogin = $property->getValue() ?? [];
                
                if (in_array($action, $notNeedLogin)) {
                    return $next($request);
                }
            }
        }
        
        $token = $request->header('Authorization');
        
        if (empty($token)) {
            return json(['code' => 401, 'msg' => '未登录，请先登录', 'data' => null]);
        }
        
        $token = str_replace('Bearer ', '', $token);
        
        $tableInfo = Cache::get('tablet_token:' . $token);
        
        if (!$tableInfo) {
            return json(['code' => 401, 'msg' => '登录失效，请重新登录', 'data' => null]);
        }
        
        $request->table_id = $tableInfo['table_id'];
        $request->store_id = $tableInfo['store_id'];
        $request->table_code = $tableInfo['table_code'];
        $request->table_name = $tableInfo['table_name'];
        
        return $next($request);
    }
}