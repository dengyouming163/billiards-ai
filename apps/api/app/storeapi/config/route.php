<?php

use think\facade\Route;

// 时段配置 - 自动路由
// URL: /storeapi/pricing.TimePeriod/lists
// URL: /storeapi/pricing.MemberDiscount/lists  
// URL: /storeapi/pricing.Pricing/lists

// 注意：ThinkPHP 8 使用自动路由，URL格式为：
// /{应用}/{文件夹}.{控制器}/{方法}
// 例如: /storeapi/pricing.TimePeriod/lists
// 会自动映射到: app\storeapi\controller\pricing\TimePeriodController::lists()
