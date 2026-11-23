-- 活动表
CREATE TABLE IF NOT EXISTS `bi_activity` (
    `id` varchar(64) NOT NULL,
    `store_id` varchar(64) NOT NULL,
    `title` varchar(128) NOT NULL COMMENT '活动标题',
    `description` text COMMENT '活动描述',
    `detail` text COMMENT '活动详情',
    `image` varchar(512) DEFAULT '' COMMENT '封面图',
    `icon` varchar(16) DEFAULT '🎁' COMMENT '图标',
    `tag` varchar(32) DEFAULT '' COMMENT '标签',
    `discount` varchar(64) DEFAULT '' COMMENT '优惠信息',
    `start_time` datetime DEFAULT NULL,
    `end_time` datetime DEFAULT NULL,
    `status` tinyint DEFAULT 1 COMMENT '1=启用 0=禁用',
    `sort` int DEFAULT 0,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_store_status` (`store_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='营销活动表';

-- 礼物类型表
CREATE TABLE IF NOT EXISTS `bi_gift_type` (
    `id` varchar(64) NOT NULL,
    `store_id` varchar(64) NOT NULL,
    `name` varchar(64) NOT NULL COMMENT '礼物名称',
    `icon` varchar(16) DEFAULT '🎁' COMMENT '图标',
    `price` decimal(10,2) DEFAULT 0 COMMENT '价格',
    `status` tinyint DEFAULT 1 COMMENT '1=启用 0=禁用',
    `sort` int DEFAULT 0,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_store_status` (`store_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='礼物类型表';

-- 助教收礼记录表
CREATE TABLE IF NOT EXISTS `bi_assistant_gift_record` (
    `id` varchar(64) NOT NULL,
    `store_id` varchar(64) NOT NULL,
    `assistant_id` varchar(64) NOT NULL COMMENT '助教ID',
    `order_id` varchar(64) DEFAULT '' COMMENT '关联订单ID',
    `gift_type_id` varchar(64) DEFAULT '' COMMENT '礼物类型ID',
    `gift_name` varchar(64) DEFAULT '' COMMENT '礼物名称',
    `gift_icon` varchar(16) DEFAULT '🎁' COMMENT '礼物图标',
    `quantity` int DEFAULT 1 COMMENT '数量',
    `amount` decimal(10,2) DEFAULT 0 COMMENT '金额',
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    KEY `idx_assistant` (`assistant_id`),
    KEY `idx_store` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='助教收礼记录表';
