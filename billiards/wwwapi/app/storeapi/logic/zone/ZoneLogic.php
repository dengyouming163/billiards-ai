<?php

declare (strict_types=1);

namespace app\storeapi\logic\zone;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Zone;
use think\facade\Log;

class ZoneLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId): array
    {
        try {
            $query = Zone::where('store_id', $storeId)->where('deleted_at', null);

            if (!empty($params['status'])) {
                $query->where('status', $params['status']);
            }

            return $query->order('sort_order', 'asc')->order('created_at', 'desc')->select()->toArray();
        } catch (\Exception $e) {
            Log::error('ZoneLogic::getList: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取分区列表失败，请稍后重试');
        }
    }

    public static function getAll(array $params, string $storeId): array
    {
        try {
            return Zone::where('store_id', $storeId)->where('deleted_at', null)->where('status', 1)->order('sort_order', 'asc')->select()->toArray();
        } catch (\Exception $e) {
            Log::error('ZoneLogic::getAll: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取分区列表失败，请稍后重试');
        }
    }

    public static function getDetail(string $id, string $storeId)
    {
        try {
            $zone = Zone::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$zone) {
                return self::setError('分区不存在');
            }
            return $zone->toArray();
        } catch (\Exception $e) {
            Log::error('ZoneLogic::getDetail: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取分区详情失败，请稍后重试');
        }
    }

    public static function create(array $params, string $storeId)
    {
        try {
            $required = ['name'];
            foreach ($required as $field) {
                if (empty($params[$field])) {
                    return self::setError($field . '不能为空');
                }
            }

            $zone = new Zone();
            $zone->id = 'zone_' . uniqid();
            $zone->store_id = $storeId;
            $zone->name = $params['name'];
            $zone->code = $params['code'] ?? '';
            $zone->color = $params['color'] ?? '#00D4AA';
            $zone->description = $params['description'] ?? '';
            $zone->sort_order = $params['sort_order'] ?? 0;
            $zone->status = $params['status'] ?? 1;

            $zone->save();

            return $zone->toArray();
        } catch (\Exception $e) {
            Log::error('ZoneLogic::create: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('创建分区失败，请稍后重试');
        }
    }

    public static function update(string $id, array $params, string $storeId)
    {
        try {
            $zone = Zone::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$zone) {
                return self::setError('分区不存在');
            }

            $updatable = ['name', 'code', 'color', 'description', 'sort_order', 'status'];
            foreach ($updatable as $field) {
                if (isset($params[$field])) {
                    $zone->$field = $params[$field];
                }
            }

            $zone->save();

            return $zone->toArray();
        } catch (\Exception $e) {
            Log::error('ZoneLogic::update: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('更新分区失败，请稍后重试');
        }
    }

    public static function delete(string $id, string $storeId)
    {
        try {
            $zone = Zone::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$zone) {
                return self::setError('分区不存在');
            }

            $zone->deleted_at = date('Y-m-d H:i:s');
            $zone->save();

            return true;
        } catch (\Exception $e) {
            Log::error('ZoneLogic::delete: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('删除分区失败，请稍后重试');
        }
    }

    public static function toggle(string $id, string $storeId)
    {
        try {
            $zone = Zone::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$zone) {
                return self::setError('分区不存在');
            }

            $zone->status = $zone->status == 1 ? 0 : 1;
            $zone->save();

            return $zone->toArray();
        } catch (\Exception $e) {
            Log::error('ZoneLogic::toggle: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('操作失败，请稍后重试');
        }
    }
}