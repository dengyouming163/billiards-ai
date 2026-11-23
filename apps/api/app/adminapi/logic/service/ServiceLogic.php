<?php
namespace app\adminapi\logic\service;

use app\adminapi\lists\service\ServiceLists;
use app\common\logic\BaseLogic;
use app\common\model\service\ValueAddedService;
use app\common\service\JsonService;

class ServiceLogic extends BaseLogic
{
    public static function lists(array $params = [])
    {
        $lists = new ServiceLists($params);
        return JsonService::dataLists($lists);
    }

    public static function detail(string $id)
    {
        $service = ValueAddedService::find($id);
        if (empty($service)) {
            self::setError('服务不存在');
            return false;
        }
        return $service->toArray();
    }

    public static function add(array $params)
    {
        $service = new ValueAddedService();
        $service->id = self::uuid();
        $service->name = $params['name'] ?? '';
        $service->type = $params['type'] ?? '';
        $service->description = $params['description'] ?? '';
        $service->unit_price = $params['unit_price'] ?? 0;
        $service->status = ValueAddedService::STATUS_ACTIVE;
        $service->created_at = date('Y-m-d H:i:s');

        if (!$service->save()) {
            self::setError('添加失败');
            return false;
        }

        return $service->toArray();
    }

    public static function edit(string $id, array $params)
    {
        $service = ValueAddedService::find($id);
        if (empty($service)) {
            self::setError('服务不存在');
            return false;
        }

        if (isset($params['name'])) $service->name = $params['name'];
        if (isset($params['type'])) $service->type = $params['type'];
        if (isset($params['description'])) $service->description = $params['description'];
        if (isset($params['unit_price'])) $service->unit_price = $params['unit_price'];
        if (isset($params['status'])) $service->status = $params['status'];

        if (!$service->save()) {
            self::setError('修改失败');
            return false;
        }

        return $service->toArray();
    }

    public static function toggleStatus(string $id)
    {
        $service = ValueAddedService::find($id);
        if (empty($service)) {
            self::setError('服务不存在');
            return false;
        }

        $service->status = $service->status == ValueAddedService::STATUS_ACTIVE
            ? ValueAddedService::STATUS_INACTIVE
            : ValueAddedService::STATUS_ACTIVE;

        if (!$service->save()) {
            self::setError('状态切换失败');
            return false;
        }

        return $service->toArray();
    }

    public static function delete(string $id)
    {
        $service = ValueAddedService::find($id);
        if (empty($service)) {
            self::setError('服务不存在');
            return false;
        }

        if (!$service->delete()) {
            self::setError('删除失败');
            return false;
        }

        return true;
    }

    public static function statistics()
    {
        $total = ValueAddedService::count();
        $active = ValueAddedService::where('status', ValueAddedService::STATUS_ACTIVE)->count();

        return [
            'total' => $total,
            'active' => $active,
        ];
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