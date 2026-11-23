CREATE TABLE IF NOT EXISTS `bi_busi_light_device` (
    `id`               VARCHAR(36)   NOT NULL COMMENT '主键ID(UUID)',
    `store_id`         VARCHAR(36)   DEFAULT '' COMMENT '门店ID',
    `device_sn`        VARCHAR(64)   NOT NULL COMMENT '设备序列号(设备上报id)',
    `addr`             VARCHAR(50)   DEFAULT NULL COMMENT '设备地址',
    `device_name`      VARCHAR(128)  DEFAULT NULL COMMENT '设备名称',
    `channel_count`    INT(11)       DEFAULT 8 COMMENT '通道数量',
    `firmware_version` VARCHAR(32)   DEFAULT NULL COMMENT '固件版本',
    `status`           TINYINT(1)    DEFAULT 0 COMMENT '状态 0:离线 1:在线',
    `last_heartbeat`   DATETIME      DEFAULT NULL COMMENT '最后心跳时间',
    `last_online`      DATETIME      DEFAULT NULL COMMENT '最后上线时间',
    `created_at`       DATETIME      DEFAULT NULL COMMENT '创建时间',
    `updated_at`       DATETIME      DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_device_sn` (`device_sn`),
    KEY `idx_store_id` (`store_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='灯控设备表';

CREATE TABLE IF NOT EXISTS `bi_busi_light_channel` (
    `id`           VARCHAR(36)  NOT NULL COMMENT '主键ID(UUID)',
    `device_id`    VARCHAR(36)  NOT NULL COMMENT '设备ID',
    `channel_no`   INT(11)      NOT NULL COMMENT '通道编号(从1开始)',
    `channel_name` VARCHAR(64)  DEFAULT NULL COMMENT '通道名称',
    `status`       TINYINT(1)   DEFAULT 0 COMMENT '状态 0:关 1:开',
    `table_id`     VARCHAR(36)  DEFAULT '' COMMENT '绑定的桌台ID',
    `created_at`   DATETIME     DEFAULT NULL COMMENT '创建时间',
    `updated_at`   DATETIME     DEFAULT NULL COMMENT '更新时间',
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_device_channel` (`device_id`, `channel_no`),
    KEY `idx_table_id` (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='灯控通道表';
