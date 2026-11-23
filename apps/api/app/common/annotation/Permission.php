<?php

declare(strict_types=1);

namespace app\common\annotation;

use Attribute;

#[Attribute(Attribute::TARGET_METHOD | Attribute::IS_REPEATABLE)]
class Permission
{
    public function __construct(
        public readonly string $code,
        public readonly string $name = '',
        public readonly string $module = 'pc',
        public readonly string $group = '',
        public readonly array $defaultRoles = [],
    ) {}
}
