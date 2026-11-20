<?php

declare(strict_types=1);

namespace app\storeapi\logic\table;

use app\common\logic\BaseLogic;
use app\common\model\merchant\TableType;
use think\facade\Log;

class TableTypeLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId): array
    {
        try {
            $query = TableType::where('store_id', $storeId)->where('deleted_at', null);
            if (!empty($params['status'])) {
                $query->where('status', $params['status']);
            }
            return $query->order('sort_order', 'asc')->order('created_at', 'desc')->select()->toArray();
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::getList: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取台型列表失败，请稍后重试');
        }
    }

    public static function getAll(array $params, string $storeId): array
    {
        try {
            return TableType::where('store_id', $storeId)->where('deleted_at', null)->where('status', 1)->order('sort_order', 'asc')->select()->toArray();
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::getAll: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取台型列表失败，请稍后重试');
        }
    }

    public static function getDetail(string $id, string $storeId)
    {
        try {
            $data = TableType::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            return $data ? $data->toArray() : false;
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::getDetail: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('获取台型详情失败，请稍后重试');
        }
    }

    public static function create(array $params, string $storeId)
    {
        try {
            if (empty($params['name'])) {
                return self::setError('台型名称不能为空');
            }
            $type = new TableType();
            $type->id = 'table_type_' . uniqid();
            $type->store_id = $storeId;
            $type->name = $params['name'];
            $type->code = $params['code'] ?? strtoupper(md5($params['name'] . time())) . substr((string)time(), -4);
            $type->description = $params['description'] ?? '';
            $type->icon = $params['icon'] ?? '';
            $type->sort_order = $params['sort_order'] ?? 0;
            $type->status = $params['status'] ?? 1;
            if (!$type->save()) {
                return self::setError('创建失败');
            }
            return $type->toArray();
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::create: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('创建台型失败，请稍后重试');
        }
    }

    public static function update(string $id, array $params, string $storeId)
    {
        try {
            $type = TableType::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$type) {
                return self::setError('台型不存在');
            }
            if (isset($params['name'])) $type->name = $params['name'];
            if (isset($params['code'])) $type->code = $params['code'];
            if (isset($params['description'])) $type->description = $params['description'];
            if (isset($params['icon'])) $type->icon = $params['icon'];
            if (isset($params['sort_order'])) $type->sort_order = $params['sort_order'];
            if (isset($params['status'])) $type->status = $params['status'];
            if (!$type->save()) {
                return self::setError('更新失败');
            }
            return $type->toArray();
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::update: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('更新台型失败，请稍后重试');
        }
    }

    public static function delete(string $id, string $storeId)
    {
        try {
            $type = TableType::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$type) {
                return self::setError('台型不存在');
            }
            $type->deleted_at = date('Y-m-d H:i:s');
            if (!$type->save()) {
                return self::setError('删除失败');
            }
            return true;
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::delete: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('删除台型失败，请稍后重试');
        }
    }

    public static function toggle(string $id, string $storeId)
    {
        try {
            $type = TableType::where('id', $id)->where('store_id', $storeId)->where('deleted_at', null)->find();
            if (!$type) {
                return self::setError('台型不存在');
            }
            $type->status = $type->status == 1 ? 0 : 1;
            if (!$type->save()) {
                return self::setError('操作失败');
            }
            return $type->toArray();
        } catch (\Exception $e) {
            Log::error('TableTypeLogic::toggle: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('操作失败，请稍后重试');
        }
    }
}
