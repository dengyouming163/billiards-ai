<?php
// +----------------------------------------------------------------------
// | ThinkPHP [ WE CAN DO IT JUST THINK ]
// +----------------------------------------------------------------------
use think\facade\Console;
use think\facade\Route;

// 公开API — 微信进件图片上传（顶层路由，无需登录）
// 注意: 不能用 /api/ 前缀 (会被 app/api 模块拦截)
// 用完整类名避免 dot-notation 解析到 app\controller\ 而非 app\storeapi\controller\
Route::post('wechat-upload', '\\app\\storeapi\\controller\\setting\\WechatApplymentController@uploadImage');

// 平板端支付路由
Route::post('payment/prepare', '\\app\\storeapi\\controller\\payment\\PaymentController@prepare');
Route::post('payment/create', '\\app\\storeapi\\controller\\payment\\PaymentController@create');
Route::get('payment/query', '\\app\\storeapi\\controller\\payment\\PaymentController@query');

// 管理后台
Route::rule('admin/:any', function () {
    return view(app()->getRootPath() . 'public/admin/index.html');
})->pattern(['any' => '\w+']);

// 手机端
Route::rule('mobile/:any', function () {
    return view(app()->getRootPath() . 'public/mobile/index.html');
})->pattern(['any' => '\w+']);

// PC端
Route::rule('pc/:any', function () {
    return view(app()->getRootPath() . 'public/pc/index.html');
})->pattern(['any' => '\w+']);

//定时任务
Route::rule('crontab', function () {
    Console::call('crontab');
});

// 管理员API路由 - 使用自动路由模式
Route::group('adminapi', function () {
    // 登录认证 - 自动路由: /adminapi/auth.Auth/login
    // 商户管理 - 自动路由: /adminapi/merchant.Merchant/lists
    // 套餐管理 - 自动路由: /adminapi/package.Package/lists
    // 账单管理 - 自动路由: /adminapi/package.Bill/lists
    // 增值服务 - 自动路由: /adminapi/service.Service/lists
    // 工单管理 - 自动路由: /adminapi/ticket.Ticket/lists
    // 工单回复 - 自动路由: /adminapi/ticket.TicketReply/lists
    // 合同管理 - 自动路由: /adminapi/contract.Contract/lists
    // 公告管理 - 自动路由: /adminapi/announcement.Announcement/lists

    // 灯控设备管理 - /adminapi/light.LightDevice/unboundList 等
    Route::get('light.LightDevice/unboundList', 'light.LightDevice/unboundList');
    Route::get('light.LightDevice/boundList', 'light.LightDevice/boundList');
    Route::get('light.LightDevice/deviceInfo', 'light.LightDevice/deviceInfo');
    Route::post('light.LightDevice/bind', 'light.LightDevice/bind');
    Route::post('light.LightDevice/unbind', 'light.LightDevice/unbind');
});

// 大屏端API - 使用自动路由模式，带专用认证中间件
Route::group('storeapi/tablet', function () {
    // 大屏认证 - /storeapi/tablet.Auth/login
    // 大屏首页数据 - /storeapi/tablet.Index/index
    // 桌台状态查询 - /storeapi/tablet.Index/getTableStatus
    // 商品分类列表 - /storeapi/tablet.Index/getCategories
    // 商品列表 - /storeapi/tablet.Index/getProducts
    // 助教列表 - /storeapi/tablet.Index/getAssistants
    // 计费规则 - /storeapi/tablet.Index/getPricing
    // 开台创建订单 - /storeapi/tablet.Order/create
    // 添加订单项 - /storeapi/tablet.Order/addItem
    // 获取订单详情 - /storeapi/tablet.Order/getOrder
    // 获取桌台订单 - /storeapi/tablet.Order/getTableOrder
    // 计时更新 - /storeapi/tablet.Order/tick
    // 结账支付 - /storeapi/tablet.Order/checkout
    // 合并结账 - /storeapi/tablet.Order/mergeCheckout
    // 关台 - /storeapi/tablet.Order/close
    // 助教列表 - /storeapi/tablet.Assistant/list
    // 可用助教 - /storeapi/tablet.Assistant/getAvailable
    // 服务类型 - /storeapi/tablet.Assistant/getServices
    // 创建助教预约 - /storeapi/tablet.Assistant/createOrder
    // 预约状态查询 - /storeapi/tablet.Assistant/getOrderStatus
    // 取消预约 - /storeapi/tablet.Assistant/cancelOrder
    // 游戏类型 - /storeapi/tablet.ScoreBoard/getGameTypes
    // 创建计分板 - /storeapi/tablet.ScoreBoard/create
    // 更新分数 - /storeapi/tablet.ScoreBoard/updateScore
    // 服务类型 - /storeapi/tablet.ServiceCall/getServiceTypes
    // 呼叫服务 - /storeapi/tablet.ServiceCall/call
    // 呼叫状态查询 - /storeapi/tablet.ServiceCall/getCallStatus
    // 取消呼叫 - /storeapi/tablet.ServiceCall/cancelCall
    // 最近呼叫 - /storeapi/tablet.ServiceCall/getRecentCalls
})->middleware(\app\storeapi\http\middleware\TabletAuthMiddleware::class);

// POS 路由 — ThinkPHP 8 只认点号格式 storeapi/pos.XXX/action
$P = '\app\storeapi\http\middleware\PosLoginMiddleware';
// 通知中心
Route::get('storeapi/pos.Notification/lists',       '\app\storeapi\controller\pos\NotificationController@lists')->middleware($P);
Route::get('storeapi/pos.Notification/detail',      '\app\storeapi\controller\pos\NotificationController@detail')->middleware($P);
Route::get('storeapi/pos.Notification/unreadCount', '\app\storeapi\controller\pos\NotificationController@unreadCount')->middleware($P);
Route::post('storeapi/pos.Notification/read',       '\app\storeapi\controller\pos\NotificationController@read')->middleware($P);
Route::post('storeapi/pos.Notification/readAll',    '\app\storeapi\controller\pos\NotificationController@readAll')->middleware($P);
Route::post('storeapi/pos.Notification/delete',     '\app\storeapi\controller\pos\NotificationController@delete')->middleware($P);
// 订单扩展
Route::get('storeapi/pos.Order/getCurrentOrder', '\app\storeapi\controller\pos\OrderController@getCurrentOrder')->middleware($P);
Route::get('storeapi/pos.Order/bill',           '\app\storeapi\controller\pos\OrderController@bill')->middleware($P);
Route::post('storeapi/pos.Order/confirmOpen',             '\app\storeapi\controller\pos\OrderController@confirmOpen')->middleware($P);
Route::get('storeapi/pos.Order/pendingConfirmRequests', '\app\storeapi\controller\pos\OrderController@pendingConfirmRequests')->middleware($P);
// 班次
Route::get('storeapi/pos.Shift/employees',  '\app\storeapi\controller\pos\ShiftController@employees')->middleware($P);
Route::post('storeapi/pos.Shift/startWork', '\app\storeapi\controller\pos\ShiftController@startWork')->middleware($P);
Route::post('storeapi/pos.Shift/handover',  '\app\storeapi\controller\pos\ShiftController@handover')->middleware($P);
Route::get('storeapi/pos.Shift/current',    '\app\storeapi\controller\pos\ShiftController@current')->middleware($P);
Route::post('storeapi/pos.Shift/checkIn',   '\app\storeapi\controller\pos\ShiftController@checkIn')->middleware($P);
Route::post('storeapi/pos.Shift/checkOut',  '\app\storeapi\controller\pos\ShiftController@checkOut')->middleware($P);
// 提醒
Route::get('storeapi/pos.Order/pendingDeliveries',          '\app\storeapi\controller\pos\OrderController@pendingDeliveries')->middleware($P);
Route::get('storeapi/pos.Order/pendingAssistantBookings',   '\app\storeapi\controller\pos\OrderController@pendingAssistantBookings')->middleware($P);

// 公开API - 图片上传到微信
Route::rule('storeapi/setting.WechatApplyment/uploadImage', 'storeapi.setting.WechatApplyment/uploadImage', 'POST');

// 微信支付进件回调 — 微信支付平台主动通知，无需登录
Route::rule('storeapi/setting.WechatApplyment/notify', 'storeapi.setting.WechatApplyment/notify', 'POST');

// 商家管理平台API路由 - 使用自动路由模式
Route::group('storeapi', function () {
    // 认证模块 - /storeapi/auth.Auth/login
    // 台桌管理 - /storeapi/table.Table/lists
    // 分区管理 - /storeapi/zone.Zone/lists
    // 计费规则 - /storeapi/pricing.Pricing/lists
    // 套餐管理 - /storeapi/package.Package/lists
    // 商品管理 - /storeapi/product.Product/lists
    // 库存管理 - /storeapi/inventory.Inventory/inbound
    // 会员管理 - /storeapi/member.Member/lists
    // 员工管理 - /storeapi/employee.Employee/lists
    // 订单管理 - /storeapi/order.Order/lists
    // 助教管理 - /storeapi/assistant.Assistant/getList
    // 角色管理 - /storeapi/role.Role/lists
    // 权限管理 - /storeapi/permission.Permission/lists
    // 财务对账 - /storeapi/cashFlow.CashFlow/lists
    // 经营报表 - /storeapi/report.Report/overview
    // 系统设置 - /storeapi/setting.Setting/get
    // 通知管理 - /storeapi/notification.Notification/lists
    // 帮助中心 - /storeapi/help.Help/lists
    // 个人设置 - /storeapi/profile.Profile/detail
    // 账号设置 - /storeapi/account.Account/password

    // 移动端API - 使用自动路由模式
    // 移动端数据看板 - /storeapi/mobile.Mobile/dashboardStats
    // 移动端签到打卡 - /storeapi/mobile.Checkin/signIn
    // 移动端排班查询 - /storeapi/mobile.Schedule/mySchedule
    // 移动端助教接单 - /storeapi/mobile.AssistantOrder/pending
    // 移动端业绩统计 - /storeapi/mobile.Performance/index
    // 移动端审批管理 - /storeapi/mobile.Approval/lists
    // 移动端申请提交 - /storeapi/mobile.Apply/checkin
    // 移动端个人资料 - /storeapi/mobile.Profile/detail

    // Light Channel routes
    Route::get('light.Channel/listByDevice', 'storeapi.LightChannel/listByDevice');
    Route::post('light.Channel/bindTable', 'storeapi.LightChannel/bindTable');
    Route::post('light.Channel/unbindTable', 'storeapi.LightChannel/unbindTable');
    Route::post('light.Channel/rename', 'storeapi.LightChannel/rename');
    Route::post('light.Channel/toggle', 'storeapi.LightChannel/toggle');
    Route::post('light.Channel/toggleAll', 'storeapi.LightChannel/toggleAll');

})->middleware(\app\storeapi\http\middleware\LoginMiddleware::class);

// 小程序端API - 使用自动路由模式，带微信认证中间件
Route::group('miniappapi', function () {
    // 微信登录 - /miniappapi/auth.Auth/login
    // 手机号绑定 - /miniappapi/auth.Auth/bindPhone
    // 会员信息 - /miniappapi/auth.Auth/memberInfo
    // 台桌扫码 - /miniappapi/table.Table/scan
    // 台桌信息 - /miniappapi/table.Table/info
    // 开台 - /miniappapi/order.Order/open
    // 活动订单 - /miniappapi/order.Order/active
    // 账单详情 - /miniappapi/order.Order/bill
    // 结算支付 - /miniappapi/order.Order/checkout
    // 个人中心 - /miniappapi/profile.Profile/index
    // 历史账单 - /miniappapi/profile.Profile/history
    // 账户余额 - /miniappapi/profile.Profile/balance
})->middleware(\app\miniappapi\middleware\WxAuth::class);

// 微信支付回调 — 兼容新旧两种 URL 格式
Route::rule('api/pay-hub/callback', 'api.PayHubCallback/receive', 'POST');
Route::rule('api/v1/webhooks/wechat', 'api.PayHubCallback/receive', 'POST');


