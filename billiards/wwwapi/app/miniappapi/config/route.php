<?php
// miniappapi 路由中间件配置
return [
    'middleware' => [
        \app\miniappapi\middleware\WxAuth::class,
    ],
];
