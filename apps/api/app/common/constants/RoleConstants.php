<?php

namespace app\common\constants;

class RoleConstants
{
    const ROLE_OWNER = 'owner';
    const ROLE_ADMIN = 'admin';
    const ROLE_MANAGER = 'manager';
    const ROLE_ASSISTANT = 'assistant';
    const ROLE_WAITER = 'waiter';

    public static function getAllRoles(): array
    {
        return [
            self::ROLE_OWNER,
            self::ROLE_ADMIN,
            self::ROLE_MANAGER,
            self::ROLE_ASSISTANT,
            self::ROLE_WAITER,
        ];
    }

    public static function getRoleName(string $role): string
    {
        $names = [
            self::ROLE_OWNER => '老板',
            self::ROLE_ADMIN => '管理员',
            self::ROLE_MANAGER => '店长',
            self::ROLE_ASSISTANT => '助教',
            self::ROLE_WAITER => '服务员',
        ];
        return $names[$role] ?? '未知';
    }
}