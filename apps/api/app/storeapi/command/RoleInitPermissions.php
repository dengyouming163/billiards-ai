<?php

declare(strict_types=1);

namespace app\storeapi\command;

use app\common\annotation\Permission;
use app\common\model\merchant\Permission as PermissionModel;
use app\common\model\merchant\EmployeeRole;
use think\console\Command;
use think\console\Input;
use think\console\Output;
use think\facade\Db;

class RoleInitPermissions extends Command
{
    protected function configure()
    {
        $this->setName('role:init-permissions')
            ->setDescription('扫描 #[Permission] 注解的 defaultRoles，自动分配权限给系统预设角色');
    }

    protected function execute(Input $input, Output $output)
    {
        $controllerDir = app_path('storeapi') . 'controller';
        $files = $this->scanControllerFiles($controllerDir);

        $annotatedPermissions = [];
        foreach ($files as $file) {
            $className = $this->fileToClass($file);
            try {
                if (!class_exists($className)) continue;
            } catch (\Throwable $e) {
                continue;
            }

            try {
                $reflection = new \ReflectionClass($className);
                foreach ($reflection->getMethods(\ReflectionMethod::IS_PUBLIC) as $method) {
                    $attrs = $method->getAttributes(Permission::class);
                    foreach ($attrs as $attr) {
                        $perm = $attr->newInstance();
                        $code = $perm->code;
                        if (!isset($annotatedPermissions[$code])) {
                            $annotatedPermissions[$code] = $perm;
                        }
                    }
                }
            } catch (\Throwable $e) {
                continue;
            }
        }

        $output->info('扫描到 ' . count($annotatedPermissions) . ' 个权限码');

        $assigned = 0;
        $skipped = 0;

        foreach ($annotatedPermissions as $code => $perm) {
            if (empty($perm->defaultRoles)) {
                continue;
            }

            $permission = PermissionModel::where('code', $code)
                ->where('status', 1)
                ->find();

            if (!$permission) {
                $output->warning("权限码 {$code} 在数据库中不存在，跳过");
                continue;
            }

            foreach ($perm->defaultRoles as $roleCode) {
                $role = EmployeeRole::where('code', $roleCode)
                    ->where('is_system', 1)
                    ->where('status', 1)
                    ->where(function ($q) {
                        $q->where('store_id', '')->whereOr('store_id', '__system__');
                    })
                    ->find();

                if (!$role) {
                    $output->warning("系统角色 {$roleCode} 不存在，跳过权限 {$code}");
                    continue;
                }

                $exists = Db::name('busi_role_permission')
                    ->where('role_id', $role['id'])
                    ->where('permission_id', $permission['id'])
                    ->where(function ($q) {
                        $q->where('store_id', '')->whereOr('store_id', '__system__');
                    })
                    ->find();

                if ($exists) {
                    $skipped++;
                    continue;
                }

                Db::name('busi_role_permission')->insert([
                    'id' => 'sys_rp_' . uniqid('', true),
                    'role_id' => $role['id'],
                    'permission_id' => $permission['id'],
                    'store_id' => '',
                    'created_at' => date('Y-m-d H:i:s'),
                ]);
                $assigned++;
            }
        }

        $output->info("新增角色权限分配: {$assigned}, 已存在跳过: {$skipped}");
        return 0;
    }

    private function scanControllerFiles(string $dir): array
    {
        $files = [];
        $iterator = new \RecursiveIteratorIterator(
            new \RecursiveDirectoryIterator($dir, \RecursiveDirectoryIterator::SKIP_DOTS)
        );
        foreach ($iterator as $file) {
            if ($file->isFile() && $file->getExtension() === 'php') {
                $realPath = $file->getRealPath();
                if (str_contains(str_replace('\\', '/', $realPath), '/tablet/') || str_contains(str_replace('\\', '/', $realPath), '/pos/')) {
                    continue;
                }
                $files[] = $realPath;
            }
        }
        return $files;
    }

    private function fileToClass(string $file): string
    {
        $appPath = app_path();
        $appPath = rtrim(str_replace('\\', '/', $appPath), '/');
        $file = str_replace('\\', '/', $file);
        $relative = str_replace($appPath . '/', 'app/', $file);
        $relative = str_replace('.php', '', $relative);
        $relative = str_replace('/', '\\', $relative);
        return $relative;
    }
}
