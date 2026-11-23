export interface MenuItem {
  path: string
  icon: string
  text: string
  badge?: number | (() => number)
}

// Mobile permission codes for each role
// Backend assigns these via /permission.Permission/myPermissions?module=mobile
export const ROLE_PERMISSIONS: Record<string, string[]> = {
  boss: [
    'mobile:dashboard', 'mobile:orders', 'mobile:checkin', 'mobile:apply',
    'mobile:approval', 'mobile:employee', 'mobile:schedule', 'mobile:performance',
    'mobile:notification', 'mobile:profile', 'mobile:settings', 'mobile:work',
    'mobile:device', 'mobile:recharge',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
    'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:checkout',
    'mobile:table:member', 'mobile:table:log',
  ],
  manager: [
    'mobile:dashboard', 'mobile:orders', 'mobile:checkin', 'mobile:apply',
    'mobile:approval', 'mobile:employee', 'mobile:schedule', 'mobile:performance',
    'mobile:notification', 'mobile:profile', 'mobile:settings', 'mobile:work',
    'mobile:device', 'mobile:recharge',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
    'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:checkout',
    'mobile:table:member', 'mobile:table:log',
  ],
  coach: [
    'mobile:checkin', 'mobile:schedule', 'mobile:performance',
    'mobile:notification', 'mobile:profile', 'mobile:settings',
  ],
  assistant: [
    'mobile:orders', 'mobile:checkin', 'mobile:schedule',
    'mobile:performance', 'mobile:notification', 'mobile:profile', 'mobile:settings',
  ],
  employee: [
    'mobile:checkin', 'mobile:apply', 'mobile:schedule',
    'mobile:notification', 'mobile:profile', 'mobile:settings',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
  ],
  cashier: [
    'mobile:checkin', 'mobile:apply', 'mobile:schedule',
    'mobile:notification', 'mobile:profile', 'mobile:settings',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
  ],
  waiter: [
    'mobile:checkin', 'mobile:apply', 'mobile:schedule',
    'mobile:notification', 'mobile:profile', 'mobile:settings',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
  ],
  // legacy compat — 后端实际返回的权限（与 admin 相同），缺 checkin/performance
  owner: [
    'mobile:dashboard', 'mobile:orders', 'mobile:checkin', 'mobile:apply',
    'mobile:approval', 'mobile:employee', 'mobile:schedule', 'mobile:performance',
    'mobile:notification', 'mobile:profile', 'mobile:settings', 'mobile:work',
    'mobile:assistant', 'mobile:order', 'mobile:report', 'mobile:recharge', 'mobile:device',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
    'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:checkout',
    'mobile:table:member', 'mobile:table:log',
  ],
  // 超管 — 2026-06-30 对齐后端 /permission.Permission/myPermissions 实际返回值
  // 注：mobile:checkin / mobile:performance 后端未返回，需后端补充
  admin: [
    'mobile:dashboard', 'mobile:orders', 'mobile:checkin', 'mobile:apply',
    'mobile:approval', 'mobile:employee', 'mobile:schedule', 'mobile:performance',
    'mobile:notification', 'mobile:profile', 'mobile:settings', 'mobile:work',
    'mobile:assistant', 'mobile:order', 'mobile:report', 'mobile:recharge', 'mobile:device',
    'mobile:table', 'mobile:table:open', 'mobile:table:order',
    'mobile:table:assistant', 'mobile:table:transfer', 'mobile:table:checkout',
    'mobile:table:member', 'mobile:table:log',
  ],
}


export const PAGE_TITLE: Record<string, string> = {
  '/pages/index/index': '数据看板',
  '/pages/notification/index': '预警通知',
  '/pages/notification/detail': '通知详情',
  '/pages/approval/index': '审批中心',
  '/pages/approval/detail': '审批详情',
  '/pages/employee/list': '员工列表',
  '/pages/employee/detail': '员工详情',
  '/pages/orders/index': '接单中心',
  '/pages/orders/active': '进行中订单',
  '/pages/performance/index': '我的业绩',
  '/pages/checkin/index': '打卡签到',
  '/pages/checkin/record': '打卡记录',
  '/pages/schedule/index': '排班查询',
  '/pages/approval/my-records': '申请记录',
  '/pages/profile/index': '个人资料',
  '/pages/settings/index': '设置',
  '/pages/settings/about': '关于',
  '/pages/table/index': '台桌管理',
  '/pages/table/detail': '台桌详情',
  '/pages/table/log': '操作日志',
  '/pages/checkin/report': '考勤报表',
}
