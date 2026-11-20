<?php
namespace app\adminapi\logic\package;

use app\adminapi\lists\package\PackageLists;
use app\common\logic\BaseLogic;
use app\common\model\package\Package;
use app\common\service\JsonService;

class PackageLogic extends BaseLogic
{
    public static function lists(array $params = [])
    {
        $lists = new PackageLists($params);
        return JsonService::dataLists($lists);
    }

    public static function detail(string $id)
    {
        $package = Package::find($id);
        if (empty($package)) {
            self::setError('套餐不存在');
            return false;
        }
        return $package->toArray();
    }

    public static function add(array $params)
    {
        $package = new Package();
        $package->id = self::uuid();
        $package->name = $params['name'] ?? '';
        $package->description = $params['description'] ?? '';
        $package->base_price = $params['base_price'] ?? 0;
        $package->store_range = $params['store_range'] ?? '';
        $package->table_range = $params['table_range'] ?? '';
        $package->modules = json_encode($params['modules'] ?? []);
        $package->status = Package::STATUS_ACTIVE;
        $package->created_at = date('Y-m-d H:i:s');

        if (!$package->save()) {
            self::setError('添加失败');
            return false;
        }

        return $package->toArray();
    }

    public static function edit(string $id, array $params)
    {
        $package = Package::find($id);
        if (empty($package)) {
            self::setError('套餐不存在');
            return false;
        }

        if (isset($params['name'])) $package->name = $params['name'];
        if (isset($params['description'])) $package->description = $params['description'];
        if (isset($params['base_price'])) $package->base_price = $params['base_price'];
        if (isset($params['store_range'])) $package->store_range = $params['store_range'];
        if (isset($params['table_range'])) $package->table_range = $params['table_range'];
        if (isset($params['modules'])) $package->modules = json_encode($params['modules']);
        if (isset($params['status'])) $package->status = $params['status'];
        $package->updated_at = date('Y-m-d H:i:s');

        if (!$package->save()) {
            self::setError('修改失败');
            return false;
        }

        return $package->toArray();
    }

    public static function delete(string $id)
    {
        $package = Package::find($id);
        if (empty($package)) {
            self::setError('套餐不存在');
            return false;
        }

        if (!$package->delete()) {
            self::setError('删除失败');
            return false;
        }

        return true;
    }

    private static function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }
}