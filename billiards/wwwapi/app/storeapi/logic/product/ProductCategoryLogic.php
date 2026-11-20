<?php

declare (strict_types=1);

namespace app\storeapi\logic\product;

use app\common\logic\BaseLogic;
use app\common\model\merchant\ProductCategory;
use app\common\model\merchant\Product;

class ProductCategoryLogic extends BaseLogic
{
    public static function getList(string $storeId)
    {
        $categories = ProductCategory::where('store_id', $storeId)->whereNull('deleted_at')
            ->order('sort_order', 'asc')->select()->toArray();
        
        foreach ($categories as &$category) {
            $category = self::formatCategory($category);
        }
        
        return $categories;
    }

    public static function getDetail(string $id, string $storeId)
    {
        $category = ProductCategory::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$category) {
            return self::setError('分类不存在');
        }
        
        $data = $category->toArray();
        return self::formatCategory($data);
    }

    public static function create(array $params, string $storeId)
    {
        if (empty($params['name'])) {
            return self::setError('分类名称不能为空');
        }

        $category = new ProductCategory();
        $category->id = 'cat_' . uniqid();
        $category->store_id = $storeId;
        $category->name = $params['name'];
        $category->code = $params['code'] ?? '';
        $category->icon = $params['icon'] ?? 'box';
        $category->sort_order = $params['sort'] ?? $params['sort_order'] ?? 0;
        $category->status = 1;

        $category->save();
        
        $result = $category->toArray();
        return self::formatCategory($result);
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $category = ProductCategory::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$category) {
            return self::setError('分类不存在');
        }

        if (isset($params['name'])) {
            $category->name = $params['name'];
        }
        if (isset($params['code'])) {
            $category->code = $params['code'];
        }
        if (isset($params['icon'])) {
            $category->icon = $params['icon'];
        }
        if (isset($params['sort'])) {
            $category->sort_order = $params['sort'];
        } elseif (isset($params['sort_order'])) {
            $category->sort_order = $params['sort_order'];
        }
        if (isset($params['status'])) {
            $category->status = $params['status'] === 'active' ? 1 : 0;
        }

        $result = $category->save();
        if (!$result) {
            return self::setError('保存失败');
        }
        
        $result = $category->toArray();
        return self::formatCategory($result);
    }

    public static function delete(string $id, string $storeId)
    {
        $category = ProductCategory::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$category) {
            return self::setError('分类不存在');
        }

        $hasProducts = Product::where('category_id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->count() > 0;
        if ($hasProducts) {
            return self::setError('该分类下存在商品，无法删除');
        }

        $result = $category->delete();
        if (!$result) {
            return self::setError('删除失败');
        }
        
        return true;
    }

    private static function formatCategory(array $data): array
    {
        $productCount = Product::where('category_id', $data['id'])
            ->where('store_id', $data['store_id'])
            ->whereNull('deleted_at')
            ->count();

        return [
            'id' => $data['id'],
            'store_id' => $data['store_id'],
            'storeId' => $data['store_id'],
            'name' => $data['name'],
            'code' => $data['code'] ?? '',
            'icon' => $data['icon'] ?? 'box',
            'color' => $data['color'] ?? 'blue',
            'sort' => (int)($data['sort_order'] ?? 0),
            'sort_order' => (int)($data['sort_order'] ?? 0),
            'status' => ($data['status'] ?? 1) == 1 ? 'active' : 'inactive',
            'product_count' => $productCount,
            'productCount' => $productCount,
            'description' => $data['description'] ?? '',
        ];
    }
}
