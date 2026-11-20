<?php

declare (strict_types=1);

namespace app\storeapi\http\middleware;

class CorsMiddleware
{
    public function handle($request, \Closure $next)
    {
        // CORS 统一由 LikeAdminAllowMiddleware 处理
        // header('Access-Control-Allow-Origin: *');
        // header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        // header('Access-Control-Allow-Headers: Content-Type, token, table_id, X-Requested-With');
        // header('Access-Control-Expose-Headers: Content-Disposition');

        if ($request->isOptions()) {
            return response()->code(200);
        }
        
        return $next($request);
    }
}
