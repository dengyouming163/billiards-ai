<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Product;
use app\common\model\merchant\ProductCategory;

class ProductController extends BaseTabletController
{
    public array $notNeedLogin = ['list', 'detail', 'categories'];
    
    
    public function categories()
    {
        $storeId = $this->getStoreId();

        if (!$storeId) {
            return $this->success('获取成功', []);
        }

        $categories = ProductCategory::where('store_id', $storeId)
            ->where('status', 1)
            ->order('sort_order', 'asc')
            ->select()->toArray();

        return $this->success('获取成功', $categories);
    }
    
    public function list()
    {
        $storeId = $this->getStoreId();
        $categoryId = $this->request->get('category_id', '');
        $keyword = $this->request->get('keyword', '');

        if (!$storeId) {
            return $this->success('获取成功', []);
        }

        $products = Product::where('store_id', $storeId)
            ->where('status', 1);

        if ($categoryId) {
            $products->where('category_id', $categoryId);
        }

        if ($keyword) {
            $products->where('name', 'like', '%' . $keyword . '%');
        }

        $products = $products->order('created_at', 'desc')
            ->select()->toArray();

        foreach ($products as &$product) {
            $product['desc'] = $product['description'] ?? '';
            $product['detail'] = $product['description'] ?? '';
            $product['price'] = isset($product['price']) ? (float)$product['price'] : 0;
            $product['unit'] = $product['unit'] ?? '件';
        }

        return $this->success('获取成功', $products);
    }

    public function detail()
    {
        $productId = $this->request->get('product_id');
        
        if (!$productId) {
            return $this->fail('商品ID不能为空');
        }
        
        $product = Product::where('id', $productId)
            ->where('status', 1)
            ->find();
            
        if (!$product) {
            return $this->fail('商品不存在');
        }
        
        return $this->success('获取成功', $product->toArray());
    }
}