<?php

declare (strict_types=1);

namespace app\storeapi\http\middleware;

use think\facade\Config;

class InitMiddleware
{
    public function handle($request, \Closure $next)
    {
        $request->filter(['trim']);
        
        Config::set(['default_return_type' => 'json']);
        
        return $next($request);
    }
}