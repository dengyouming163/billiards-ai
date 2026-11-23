<?php

declare (strict_types=1);

namespace app\storeapi\logic\package;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Package;
use app\common\model\merchant\PackageItem;
use app\common\model\merchant\PackageType;
use app\common\model\merchant\Product;

class PackageLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $query = Package::where('store_id', $storeId)->whereNull('deleted_at');

        if (!empty($params['keyword'])) {
            $keyword = strtolower($params['keyword']);
            $query->where('name', 'like', "%{$keyword}%");
        }
        if (!empty($params['type'])) {
            $query->where('type', $params['type']);
        }
        if (isset($params['status'])) {
            $query->where('status', $params['status']);
        }

        $page = $params['page'] ?? 1;
        $pageSize = $params['page_size'] ?? 20;
        
        $list = $query->order('created_at', 'desc')->paginate([
            'page' => (int)$page,
            'list_rows' => (int)$pageSize,
        ]);

        $data = $list->items();
        foreach ($data as &$item) {
            $item = $item->toArray();
            $item['status'] = $item['status'] == 1 ? 'active' : 'inactive';
        }

        return [
            'data' => $data,
            'pagination' => [
                'page' => (int)$page,
                'page_size' => (int)$pageSize,
                'total' => (int)$list->total(),
                'total_pages' => (int)$list->lastPage(),
            ],
        ];
    }

    public static function getAll(array $params, string $storeId)
    {
        $query = Package::where('store_id', $storeId)->whereNull('deleted_at');
        
        if (isset($params['status'])) {
            $query->where('status', $params['status']);
        }
        
        $list = $query->order('created_at', 'desc')->select()->toArray();
        
        foreach ($list as &$item) {
            $item['status'] = $item['status'] == 1 ? 'active' : 'inactive';
        }
        
        return $list;
    }

    public static function getDetail(string $id, string $storeId)
    {
        $package = Package::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$package) {
            return self::setError('套餐不存在');
        }
        
        $data = $package->toArray();
        $data['status'] = $data['status'] == 1 ? 'active' : 'inactive';
        
        $items = PackageItem::where('package_id', $id)->select()->toArray();
        $data['items'] = $items;
        
        return $data;
    }

    public static function create(array $params, string $storeId)
    {
        $required = ['name', 'type', 'price'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return self::setError($field . '不能为空');
            }
        }

        $package = new Package();
        $package->id = 'pkg_' . uniqid();
        $package->store_id = $storeId;
        $package->name = $params['name'];
        $package->type = $params['type'];
        $package->price = $params['price'];
        $package->cost_price = $params['cost_price'] ?? 0;
        $package->validity_days = $params['validity_days'] ?? 30;
        $package->description = $params['description'] ?? '';
        $package->image = $params['image'] ?? '';
        $package->status = 1;
        $package->sales_count = 0;
        $package->total_amount = 0;

        $package->save();
        
        if (!empty($params['items']) && is_array($params['items'])) {
            foreach ($params['items'] as $itemData) {
                $item = new PackageItem();
                $item->id = 'pitem_' . uniqid();
                $item->package_id = $package->id;
                $item->item_type = $itemData['item_type'] ?? 'product';
                $item->item_id = $itemData['item_id'] ?? '';
                $item->item_name = $itemData['item_name'] ?? '';
                $item->quantity = $itemData['quantity'] ?? 1;
                $item->unit = $itemData['unit'] ?? '个';
                $item->price = $itemData['price'] ?? 0;
                $item->description = $itemData['description'] ?? '';
                $item->save();
            }
        }
        
        $result = $package->toArray();
        $result['status'] = 'active';
        return $result;
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $package = Package::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$package) {
            return self::setError('套餐不存在');
        }

        if (isset($params['name'])) {
            $package->name = $params['name'];
        }
        if (isset($params['type'])) {
            $package->type = $params['type'];
        }
        if (isset($params['price'])) {
            $package->price = $params['price'];
        }
        if (isset($params['cost_price'])) {
            $package->cost_price = $params['cost_price'];
        }
        if (isset($params['validity_days'])) {
            $package->validity_days = $params['validity_days'];
        }
        if (isset($params['description'])) {
            $package->description = $params['description'];
        }
        if (isset($params['image'])) {
            $package->image = $params['image'];
        }
        if (isset($params['status'])) {
            $package->status = $params['status'] === 'active' ? 1 : 0;
        }

        $result = $package->save();
        if (!$result) {
            return self::setError('保存失败');
        }
        
        if (!empty($params['items']) && is_array($params['items'])) {
            PackageItem::where('package_id', $id)->delete();
            
            foreach ($params['items'] as $itemData) {
                $item = new PackageItem();
                $item->id = 'pitem_' . uniqid();
                $item->package_id = $id;
                $item->item_type = $itemData['item_type'] ?? 'product';
                $item->item_id = $itemData['item_id'] ?? '';
                $item->item_name = $itemData['item_name'] ?? '';
                $item->quantity = $itemData['quantity'] ?? 1;
                $item->unit = $itemData['unit'] ?? '个';
                $item->price = $itemData['price'] ?? 0;
                $item->description = $itemData['description'] ?? '';
                $item->save();
            }
        }
        
        $result = $package->toArray();
        $result['status'] = $result['status'] == 1 ? 'active' : 'inactive';
        return $result;
    }

    public static function delete(string $id, string $storeId)
    {
        $package = Package::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$package) {
            return self::setError('套餐不存在');
        }

        $result = $package->delete();
        if (!$result) {
            return self::setError('删除失败');
        }
        
        PackageItem::where('package_id', $id)->delete();
        
        return true;
    }

    public static function toggle(string $id, string $storeId)
    {
        $package = Package::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$package) {
            return self::setError('套餐不存在');
        }

        $package->status = $package['status'] == 1 ? 0 : 1;
        $package->save();
        
        return [
            'id' => $package['id'],
            'status' => $package['status'] == 1 ? 'active' : 'inactive',
        ];
    }

    public static function getPackageTypes(string $storeId)
    {
        $types = PackageType::where('store_id', $storeId)->where('status', 1)->whereNull('deleted_at')
            ->order('sort_order', 'asc')->select()->toArray();
        return $types;
    }
}