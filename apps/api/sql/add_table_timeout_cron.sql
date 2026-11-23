-- ============================================
-- 球台超时检测 & 结账提醒 — 定时任务注册
-- ============================================
-- 功能：每分钟检测预付时间即将用完 / 已用完的台桌
--       通过 WebSocket 推送 table_timeout / checkout_remind 给收银端
-- 依赖：app\common\command\TableTimeoutCheck (table:timeout-check)
--       app\common\lib\WebSocketNotification (sendTableTimeout / sendCheckoutRemind)
-- ============================================

INSERT INTO `la_dev_crontab` (`name`, `type`, `system`, `remark`, `command`, `params`, `status`, `expression`, `error`, `last_time`, `time`, `max_time`, `create_time`, `update_time`)
VALUES (
    '球台超时检测',
    1,   -- type: 1=定时任务
    0,   -- system: 0=否
    '每分钟检测预付时间到期的台桌，推送超时预警和结账提醒给收银端',
    'table:timeout-check',
    '',  -- params
    1,   -- status: 1=运行
    '*/1 * * * *',  -- 每分钟执行一次
    NULL,
    NULL,
    '0',
    '0',
    UNIX_TIMESTAMP(),
    UNIX_TIMESTAMP()
);
