<?php
// +----------------------------------------------------------------------
// | 控制台配置
// +----------------------------------------------------------------------
return [
    // 指令定义
    'commands' => [
        // 定时任务
        'crontab' => 'app\common\command\Crontab',
        // 退款查询
        'query_refund' => 'app\common\command\QueryRefund',
        // 权限码同步
        'permission:sync' => 'app\storeapi\command\PermissionSync',
        // 角色权限初始化
        'role:init-permissions' => 'app\storeapi\command\RoleInitPermissions',
        // 球台超时检测 & 结账提醒
        'table:timeout-check' => 'app\common\command\TableTimeoutCheck',
        // 预付套餐到期自动结账
        'prepaid:auto-checkout' => 'app\common\command\AutoCheckoutPrepaidOrders',
        // 订单项超时自动取消（预下单/助教预约）
        'order-item:timeout-clean' => 'app\common\command\OrderItemTimeoutClean',
    ],
];
