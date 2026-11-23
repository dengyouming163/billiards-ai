<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Table;
use app\common\model\merchant\Order;
use app\common\model\merchant\Product;
use app\common\model\merchant\ProductCategory;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantOrder;
use app\common\model\merchant\Pricing;
use app\common\model\merchant\PricingPeriod;

class IndexController extends BaseTabletController
{
    public array $notNeedLogin = ['index', 'getTableStatus', 'getProducts', 'getCategories', 'getAssistants', 'getPricing', 'getActivities'];
    
    private function getTableId(): string
    {
        return $this->request->table_id ?? $this->request->get('table_id', '');
    }
    
    
    public function index()
    {
        $tableId = $this->getTableId();
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return $this->fail('桌台不存在');
        }
        
        $currentOrder = Order::where('table_id', $tableId)
            ->where('status', 'in_progress')
            ->find();
            
        return $this->success('获取成功', [
            'table' => $table,
            'has_active_order' => !empty($currentOrder),
            'order' => $currentOrder ?: null
        ]);
    }

    public function getTableStatus()
    {
        $tableId = $this->getTableId();
        
        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }
        
        $table = Table::where('id', $tableId)
            ->field('id, number, code, name, status, hourly_rate, type')
            ->find();
            
        if (!$table) {
            return $this->fail('桌台不存在');
        }
        
        return $this->success('获取成功', $table);
    }

    public function getProducts()
    {
        $storeId = $this->getStoreId();
        $categoryId = $this->request->get('category_id');

        if (!$storeId) {
            return $this->success('获取成功', []);
        }

        $query = Product::where('store_id', $storeId)
            ->where('status', 1);

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        $products = $query->select()->toArray();

        return $this->success('获取成功', $products);
    }

    public function getCategories()
    {
        $storeId = $this->getStoreId();

        if (!$storeId) {
            return $this->success('获取成功', []);
        }

        $categories = ProductCategory::where('store_id', $storeId)
            ->where('status', 1)
            ->order('sort_order')
            ->select()->toArray();

        return $this->success('获取成功', $categories);
    }

    public function getAssistants()
    {
        $storeId = $this->getStoreId();

        if (!$storeId) {
            return $this->success('获取成功', []);
        }

        $assistants = Assistant::where('store_id', $storeId)
            ->where('status', 1)
            ->where('is_online', 1)
            ->select()->toArray();

        return $this->success('获取成功', $assistants);
    }

    public function getPricing()
    {
        $tableId = $this->getTableId();

        if (!$tableId) {
            return $this->fail('桌台ID不能为空');
        }

        $table = Table::where('id', $tableId)->find();
        if (!$table) {
            return $this->fail('桌台不存在');
        }
        
        $pricing = Pricing::where('id', $table->pricing_id)->find();
        
        $periods = [];
        if ($pricing) {
            $periods = PricingPeriod::where('pricing_id', $pricing->id)
                ->order('start_time')
                ->select()->toArray();
        }
        
        return $this->success('获取成功', [
            'pricing' => $pricing,
            'periods' => $periods,
            'hourly_rate' => $table->hourly_rate
        ]);
    }

    public function getActivities()
    {
        // 活动数据后续从数据库加载，当前返回空列表
        return $this->success('获取成功', [
            'featured' => null,
            'list' => []
        ]);
    }
}
