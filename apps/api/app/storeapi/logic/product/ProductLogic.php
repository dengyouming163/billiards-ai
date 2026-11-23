<?php

declare (strict_types=1);

namespace app\storeapi\logic\product;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Product;
use app\common\model\merchant\ProductCategory;

class ProductLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $query = Product::where('store_id', $storeId)->whereNull('deleted_at');

        if (!empty($params['keyword'])) {
            $keyword = strtolower($params['keyword']);
            $query->where('name', 'like', "%{$keyword}%");
        }
        if (!empty($params['category_id'])) {
            $query->where('category_id', $params['category_id']);
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
            $item = self::formatProduct($item);
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
        $query = Product::where('store_id', $storeId)->whereNull('deleted_at');
        
        if (isset($params['status'])) {
            $query->where('status', $params['status']);
        }
        if (!empty($params['category_id'])) {
            $query->where('category_id', $params['category_id']);
        }
        
        $list = $query->order('created_at', 'desc')->select()->toArray();
        
        foreach ($list as &$item) {
            $item = self::formatProduct($item);
        }
        
        return $list;
    }

    public static function getDetail(string $id, string $storeId)
    {
        $product = Product::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$product) {
            return self::setError('商品不存在');
        }
        
        $data = $product->toArray();
        return self::formatProduct($data);
    }

    public static function create(array $params, string $storeId)
    {
        if (empty($params['name'])) {
            return self::setError('商品名称不能为空');
        }

        $product = new Product();
        $product->id = 'prod_' . uniqid();
        $product->store_id = $storeId;
        $product->category_id = $params['category_id'] ?? '';
        $product->name = $params['name'];
        $product->code = !empty($params['code']) ? $params['code'] : 'prod_' . bin2hex(random_bytes(4));
        $product->barcode = $params['barcode'] ?? '';
        $product->unit = $params['unit'] ?? '件';
        $product->price = $params['price'] ?? $params['sale_price'] ?? 0;
        $product->cost_price = $params['cost_price'] ?? $params['purchase_price'] ?? 0;
        $product->stock = $params['stock'] ?? 0;
        $product->min_stock = $params['min_stock'] ?? $params['low_stock_threshold'] ?? 10;
        $product->image = $params['image'] ?? '';
        $product->description = $params['description'] ?? '';
        $product->status = 1;
        $product->total_sales = 0;
        $product->total_amount = 0;

        $product->save();
        
        $result = $product->toArray();
        return self::formatProduct($result);
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $product = Product::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$product) {
            return self::setError('商品不存在');
        }

        if (isset($params['name'])) {
            $product->name = $params['name'];
        }
        if (isset($params['category_id'])) {
            $product->category_id = $params['category_id'];
        }
        if (isset($params['code'])) {
            $product->code = $params['code'];
        }
        if (isset($params['barcode'])) {
            $product->barcode = $params['barcode'];
        }
        if (isset($params['unit'])) {
            $product->unit = $params['unit'];
        }
        if (isset($params['price'])) {
            $product->price = $params['price'];
        } elseif (isset($params['sale_price'])) {
            $product->price = $params['sale_price'];
        }
        if (isset($params['cost_price'])) {
            $product->cost_price = $params['cost_price'];
        } elseif (isset($params['purchase_price'])) {
            $product->cost_price = $params['purchase_price'];
        }
        if (isset($params['min_stock'])) {
            $product->min_stock = $params['min_stock'];
        } elseif (isset($params['low_stock_threshold'])) {
            $product->min_stock = $params['low_stock_threshold'];
        }
        if (isset($params['image'])) {
            $product->image = $params['image'];
        }
        if (isset($params['description'])) {
            $product->description = $params['description'];
        }
        if (isset($params['status'])) {
            $product->status = $params['status'] === 'active' ? 1 : 0;
        }

        $result = $product->save();
        if (!$result) {
            return self::setError('保存失败');
        }
        
        $result = $product->toArray();
        return self::formatProduct($result);
    }

    public static function delete(string $id, string $storeId)
    {
        $product = Product::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$product) {
            return self::setError('商品不存在');
        }

        $result = $product->delete();
        if (!$result) {
            return self::setError('删除失败');
        }
        
        return true;
    }

    public static function toggle(string $id, string $storeId)
    {
        $product = Product::where('id', $id)->where('store_id', $storeId)->whereNull('deleted_at')->find();
        if (!$product) {
            return self::setError('商品不存在');
        }

        $product->status = $product['status'] == 1 ? 0 : 1;
        $product->save();
        
        return [
            'id' => $product['id'],
            'status' => $product['status'] == 1 ? 'active' : 'inactive',
        ];
    }

    public static function getCategories(string $storeId)
    {
        $categories = ProductCategory::where('store_id', $storeId)->whereNull('deleted_at')
            ->order('sort_order', 'asc')->select()->toArray();
        
        foreach ($categories as &$category) {
            $category = self::formatCategory($category);
        }
        
        return $categories;
    }

    public static function getStats(string $storeId)
    {
        $totalProducts = Product::where('store_id', $storeId)->whereNull('deleted_at')->count();
        $activeProducts = Product::where('store_id', $storeId)->where('status', 1)->whereNull('deleted_at')->count();
        
        $allProducts = Product::where('store_id', $storeId)->whereNull('deleted_at')->select();
        $totalValue = 0;
        $totalSalesValue = 0;
        $lowStock = 0;
        $outOfStock = 0;
        
        foreach ($allProducts as $product) {
            $totalValue += $product->stock * $product->cost_price;
            $totalSalesValue += $product->stock * $product->price;
            if ($product->stock <= $product->min_stock && $product->stock > 0) {
                $lowStock++;
            }
            if ($product->stock == 0) {
                $outOfStock++;
            }
        }
        
        return [
            'total' => $totalProducts,
            'active' => $activeProducts,
            'inactive' => $totalProducts - $activeProducts,
            'total_value' => $totalValue,
            'total_sales_value' => $totalSalesValue,
            'potential_profit' => $totalSalesValue - $totalValue,
            'low_stock' => $lowStock,
            'out_of_stock' => $outOfStock,
        ];
    }

    private static function formatProduct(array $data): array
    {
        $price = (float)($data['price'] ?? 0);
        $costPrice = (float)($data['cost_price'] ?? 0);

        return [
            'id' => $data['id'],
            'store_id' => $data['store_id'],
            'storeId' => $data['store_id'],
            'category_id' => $data['category_id'],
            'categoryId' => $data['category_id'],
            'name' => $data['name'],
            'code' => $data['code'] ?? '',
            'barcode' => $data['barcode'] ?? '',
            'unit' => $data['unit'] ?? '件',
            'price' => $price,
            'sale_price' => $price,
            'cost_price' => $costPrice,
            'purchase_price' => $costPrice,
            'purchasePrice' => $costPrice,
            'stock' => (int)($data['stock'] ?? 0),
            'low_stock_threshold' => (int)($data['min_stock'] ?? 10),
            'min_stock' => (int)($data['min_stock'] ?? 10),
            'image' => $data['image'] ?? '',
            'status' => ($data['status'] ?? 1) == 1 ? 'active' : 'inactive',
            'available' => (bool)($data['status'] ?? 1),
            'description' => $data['description'] ?? '',
        ];
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