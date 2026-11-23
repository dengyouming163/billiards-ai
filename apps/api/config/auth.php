<?php
return [
    'merchant' => [
        'title' => '商户管理',
        'auth' => [
            ['uri' => 'merchant.Merchant/lists', 'title' => '球房列表'],
            ['uri' => 'merchant.Merchant/detail', 'title' => '查看详情'],
            ['uri' => 'merchant.Merchant/add', 'title' => '添加球房'],
            ['uri' => 'merchant.Merchant/edit', 'title' => '编辑球房'],
            ['uri' => 'merchant.Merchant/delete', 'title' => '删除球房'],
            ['uri' => 'merchant.Merchant/apply', 'title' => '入驻申请'],
        ]
    ],
    'package' => [
        'title' => '套餐管理',
        'auth' => [
            ['uri' => 'package.Package/lists', 'title' => '套餐列表'],
            ['uri' => 'package.Package/add', 'title' => '添加套餐'],
            ['uri' => 'package.Package/edit', 'title' => '编辑套餐'],
            ['uri' => 'package.Package/delete', 'title' => '删除套餐'],
            ['uri' => 'package.Bill/lists', 'title' => '计费规则'],
        ]
    ],
    'service' => [
        'title' => '增值服务',
        'auth' => [
            ['uri' => 'service.Service/lists', 'title' => '服务列表'],
            ['uri' => 'service.Service/add', 'title' => '添加服务'],
            ['uri' => 'service.Service/edit', 'title' => '编辑服务'],
            ['uri' => 'service.Service/delete', 'title' => '删除服务'],
            ['uri' => 'service.Service/orderLists', 'title' => '服务订单'],
            ['uri' => 'service.Service/statistics', 'title' => '收入统计'],
        ]
    ],
    'ticket' => [
        'title' => '工单管理',
        'auth' => [
            ['uri' => 'ticket.Ticket/lists', 'title' => '工单列表'],
            ['uri' => 'ticket.Ticket/detail', 'title' => '工单详情'],
            ['uri' => 'ticket.Ticket/add', 'title' => '新建工单'],
            ['uri' => 'ticket.Ticket/edit', 'title' => '编辑工单'],
            ['uri' => 'ticket.Ticket/statistics', 'title' => '工单统计'],
        ]
    ],
    'announcement' => [
        'title' => '公告管理',
        'auth' => [
            ['uri' => 'announcement.Announcement/lists', 'title' => '公告列表'],
            ['uri' => 'announcement.Announcement/add', 'title' => '添加公告'],
            ['uri' => 'announcement.Announcement/edit', 'title' => '编辑公告'],
            ['uri' => 'announcement.Announcement/delete', 'title' => '删除公告'],
            ['uri' => 'announcement.Announcement/publish', 'title' => '发布公告'],
        ]
    ],
    'system' => [
        'title' => '系统管理',
        'auth' => [
            ['uri' => 'system.System/userLists', 'title' => '账号列表'],
            ['uri' => 'system.System/userAdd', 'title' => '添加账号'],
            ['uri' => 'system.System/userEdit', 'title' => '编辑账号'],
            ['uri' => 'system.System/userDelete', 'title' => '删除账号'],
            ['uri' => 'system.System/userToggleStatus', 'title' => '账号状态'],
            ['uri' => 'system.System/roleLists', 'title' => '角色列表'],
            ['uri' => 'system.System/roleAdd', 'title' => '添加角色'],
            ['uri' => 'system.System/roleEdit', 'title' => '编辑角色'],
            ['uri' => 'system.System/roleDelete', 'title' => '删除角色'],
            ['uri' => 'system.System/getPermissions', 'title' => '权限配置'],
            ['uri' => 'system.System/logLists', 'title' => '操作日志'],
            ['uri' => 'system.System/logDetail', 'title' => '日志详情'],
        ]
    ],
    'help' => [
        'title' => '帮助文档',
        'auth' => [
            ['uri' => 'help.Article/lists', 'title' => '文档列表'],
            ['uri' => 'help.Article/add', 'title' => '添加文档'],
            ['uri' => 'help.Article/edit', 'title' => '编辑文档'],
            ['uri' => 'help.Article/delete', 'title' => '删除文档'],
        ]
    ],
    'dashboard' => [
        'title' => '数据分析',
        'auth' => [
            ['uri' => 'dashboard.Dashboard/overview', 'title' => '数据概览'],
        ]
    ],
];
