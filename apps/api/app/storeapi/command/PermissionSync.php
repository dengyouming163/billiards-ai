<?php

declare(strict_types=1);

namespace app\storeapi\command;

use app\common\annotation\Permission;
use app\common\model\merchant\Permission as PermissionModel;
use think\console\Command;
use think\console\Input;
use think\console\Output;

class PermissionSync extends Command
{
    protected function configure()
    {
        $this->setName('permission:sync')
            ->setDescription('扫描控制器 #[Permission] 注解，同步权限码到数据库');
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

        $output->info('扫描到 ' . count($annotatedPermissions) . ' 个权限码（注解）');

        $added = 0;
        $updated = 0;

        foreach ($annotatedPermissions as $code => $perm) {
            $existing = PermissionModel::where('code', $code)->find();
            if (!$existing) {
                $model = new PermissionModel();
                $model->id = 'perm_' . uniqid('', true);
                $model->store_id = '__system__';
                $model->name = $perm->name;
                $model->code = $perm->code;
                $model->module = $perm->module;
                $model->parent_id = '';
                $model->sort_order = $added + 100;
                $model->type = 'action';
                $model->status = 1;
                $model->save();
                $added++;
            } else {
                $needUpdate = false;
                if ($existing->name !== $perm->name) {
                    $existing->name = $perm->name;
                    $needUpdate = true;
                }
                if (($existing->module ?? 'pc') !== $perm->module) {
                    $existing->module = $perm->module;
                    $needUpdate = true;
                }
                if ($needUpdate) {
                    $existing->save();
                    $updated++;
                }
            }
        }

        $output->info("新增: {$added}, 更新: {$updated}");
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
                // 跳过 tablet 和 pos 子目录（使用独立认证体系）
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
