<?php

declare (strict_types=1);

namespace app\storeapi\logic\inventory;

use app\common\logic\BaseLogic;
use app\common\model\merchant\InventoryRecord;
use app\common\model\merchant\Product;
use think\facade\Db;
use think\facade\Log;

class InventoryLogic extends BaseLogic
{
    public static function inbound(array $params, string $storeId)
    {
        if (empty($params['product_id'])) {
            return self::setError('商品ID不能为空');
        }
        if (!isset($params['quantity']) || $params['quantity'] <= 0) {
            return self::setError('入库数量必须大于0');
        }
        $quantity = (int)$params['quantity'];

        Db::startTrans();
        try {
            $product = Product::where('id', $params['product_id'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->lock(true)
                ->find();
            
            if (!$product) {
                Db::rollback();
                return self::setError('商品不存在');
            }

            $beforeStock = $product->stock;
            $afterStock = $beforeStock + $quantity;
            
            $product->stock = $afterStock;
            if ($product->save() === false) {
                throw new \Exception('Failed to save product');
            }

            $record = new InventoryRecord();
            $record->id = 'inv_' . bin2hex(random_bytes(8));
            $record->store_id = $storeId;
            $record->product_id = $params['product_id'];
            $record->type = 'inbound';
            $record->quantity = $quantity;
            $record->stock_before = $beforeStock;
            $record->stock_after = $afterStock;
            $record->description = $params['remark'] ?? '';
            if ($record->save() === false) {
                throw new \Exception('Failed to save record');
            }

            Db::commit();
            return self::formatRecord($record->toArray(), $product);
        } catch (\Exception $e) {
            if (Db::getInstance()->inTransaction()) {
                Db::rollback();
            }
            Log::error('入库操作失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('入库操作失败，请稍后重试');
        }
    }

    public static function outbound(array $params, string $storeId)
    {
        if (empty($params['product_id'])) {
            return self::setError('商品ID不能为空');
        }
        if (!isset($params['quantity']) || $params['quantity'] <= 0) {
            return self::setError('出库数量必须大于0');
        }
        $quantity = (int)$params['quantity'];

        Db::startTrans();
        try {
            $product = Product::where('id', $params['product_id'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->lock(true)
                ->find();
            
            if (!$product) {
                Db::rollback();
                return self::setError('商品不存在');
            }

            if ($product->stock < $quantity) {
                Db::rollback();
                return self::setError('库存不足');
            }

            $beforeStock = $product->stock;
            $afterStock = $beforeStock - $quantity;
            
            $product->stock = $afterStock;
            if ($product->save() === false) {
                throw new \Exception('Failed to save product');
            }

            $record = new InventoryRecord();
            $record->id = 'inv_' . bin2hex(random_bytes(8));
            $record->store_id = $storeId;
            $record->product_id = $params['product_id'];
            $record->type = 'outbound';
            $record->quantity = $quantity;
            $record->stock_before = $beforeStock;
            $record->stock_after = $afterStock;
            $record->description = $params['remark'] ?? '';
            if ($record->save() === false) {
                throw new \Exception('Failed to save record');
            }

            Db::commit();
            return self::formatRecord($record->toArray(), $product);
        } catch (\Exception $e) {
            if (Db::getInstance()->inTransaction()) {
                Db::rollback();
            }
            Log::error('出库操作失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('出库操作失败，请稍后重试');
        }
    }

    public static function getRecords(array $params, string $storeId)
    {
        $query = InventoryRecord::where('store_id', $storeId);

        if (!empty($params['product_id'])) {
            $query->where('product_id', $params['product_id']);
        }
        if (!empty($params['type'])) {
            $query->where('type', $params['type']);
        }

        $page = $params['page'] ?? 1;
        $pageSize = $params['page_size'] ?? 20;

        $list = $query->order('created_at', 'desc')->paginate([
            'page' => (int)$page,
            'list_rows' => (int)$pageSize,
        ]);

        $data = $list->items();

        $productIds = [];
        foreach ($data as $item) {
            $productIds[] = $item['product_id'];
        }
        $productIds = array_unique($productIds);

        $products = [];
        if (!empty($productIds)) {
            $productList = Product::whereIn('id', $productIds)->select()->toArray();
            foreach ($productList as $p) {
                $products[$p['id']] = $p;
            }
        }

        foreach ($data as &$item) {
            $item = $item->toArray();
            $product = $products[$item['product_id']] ?? null;
            $item = self::formatRecord($item, $product);
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

    public static function getProductInventory(string $productId, string $storeId)
    {
        $product = Product::where('id', $productId)
            ->where('store_id', $storeId)
            ->whereNull('deleted_at')
            ->find();
        
        if (!$product) {
            return self::setError('商品不存在');
        }

        $productData = $product->toArray();
        
        $inboundTotal = InventoryRecord::where('store_id', $storeId)
            ->where('product_id', $productId)
            ->where('type', 'inbound')
            ->sum('quantity');
        
        $outboundTotal = InventoryRecord::where('store_id', $storeId)
            ->where('product_id', $productId)
            ->where('type', 'outbound')
            ->sum('quantity');

        $lastInbound = InventoryRecord::where('store_id', $storeId)
            ->where('product_id', $productId)
            ->where('type', 'inbound')
            ->order('created_at', 'desc')
            ->find();

        $lastOutbound = InventoryRecord::where('store_id', $storeId)
            ->where('product_id', $productId)
            ->where('type', 'outbound')
            ->order('created_at', 'desc')
            ->find();

        return [
            'productId' => $productId,
            'productName' => $productData['name'],
            'quantity' => $productData['stock'],
            'minStock' => $productData['min_stock'],
            'totalInbound' => $inboundTotal ?? 0,
            'totalOutbound' => $outboundTotal ?? 0,
            'lastInbound' => $lastInbound ? $lastInbound->created_at : null,
            'lastOutbound' => $lastOutbound ? $lastOutbound->created_at : null,
        ];
    }

    public static function adjustStock(array $params, string $storeId)
    {
        if (empty($params['product_id'])) {
            return self::setError('商品ID不能为空');
        }

        // 支持设为目标值模式：传 target_stock 时自动计算调整量
        $isTargetMode = isset($params['target_stock']) && $params['target_stock'] !== '';
        if ($isTargetMode) {
            if (!isset($params['quantity']) || $params['quantity'] === '' || $params['quantity'] === null) {
                $params['quantity'] = 0; // 占位，后面会重新计算
            }
        }

        if (!isset($params['quantity'])) {
            return self::setError('调整数量不能为空');
        }
        $quantity = (int)$params['quantity'];

        Db::startTrans();
        try {
            $product = Product::where('id', $params['product_id'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->lock(true)
                ->find();

            if (!$product) {
                Db::rollback();
                return self::setError('商品不存在');
            }

            $beforeStock = $product->stock;

            // 设为目标值：delta = target - current
            if ($isTargetMode) {
                $targetStock = (int)$params['target_stock'];
                if ($targetStock < 0) {
                    Db::rollback();
                    return self::setError('目标库存不能为负数');
                }
                $quantity = $targetStock - $beforeStock;
            }

            $afterStock = $beforeStock + $quantity;

            if ($afterStock < 0) {
                Db::rollback();
                return self::setError('调整后库存不能为负数');
            }

            $product->stock = $afterStock;
            if ($product->save() === false) {
                throw new \Exception('Failed to save product');
            }

            $record = new InventoryRecord();
            $record->id = 'inv_' . bin2hex(random_bytes(8));
            $record->store_id = $storeId;
            $record->product_id = $params['product_id'];
            $record->type = $quantity > 0 ? 'adjust_in' : 'adjust_out';
            $record->quantity = abs($quantity);
            $record->stock_before = $beforeStock;
            $record->stock_after = $afterStock;
            if (!empty($params['remark'])) {
                $record->description = $params['remark'];
            } elseif ($isTargetMode) {
                $record->description = '库存设值（' . $beforeStock . ' → ' . $afterStock . '）';
            } else {
                $record->description = $quantity > 0 ? '库存调整（增加）' : '库存调整（减少）';
            }
            if ($record->save() === false) {
                throw new \Exception('Failed to save record');
            }

            Db::commit();
            return self::formatRecord($record->toArray(), $product);
        } catch (\Exception $e) {
            if (Db::getInstance()->inTransaction()) {
                Db::rollback();
            }
            Log::error('库存调整失败: ' . $e->getMessage() . ' | ' . $e->getFile() . ':' . $e->getLine());
            return self::setError('库存调整失败，请稍后重试');
        }
    }

    public static function getInventoryStats(string $storeId)
    {
        $products = Product::where('store_id', $storeId)->whereNull('deleted_at')->select();
        
        $totalProducts = count($products);
        $totalStock = 0;
        $totalValue = 0;
        $lowStockCount = 0;
        $outOfStockCount = 0;
        
        foreach ($products as $product) {
            $totalStock += $product->stock;
            $totalValue += $product->stock * $product->cost_price;
            
            if ($product->stock == 0) {
                $outOfStockCount++;
            } elseif ($product->stock <= $product->min_stock) {
                $lowStockCount++;
            }
        }

        $inboundToday = InventoryRecord::where('store_id', $storeId)
            ->where('type', 'inbound')
            ->whereTime('created_at', 'today')
            ->sum('quantity');
        
        $outboundToday = InventoryRecord::where('store_id', $storeId)
            ->where('type', 'outbound')
            ->whereTime('created_at', 'today')
            ->sum('quantity');

        return [
            'total_products' => $totalProducts,
            'total_stock' => $totalStock,
            'total_value' => $totalValue,
            'low_stock_count' => $lowStockCount,
            'out_of_stock_count' => $outOfStockCount,
            'inbound_today' => $inboundToday ?? 0,
            'outbound_today' => $outboundToday ?? 0,
        ];
    }

    private static function formatRecord(array $record, $product = null): array
    {
        $productData = null;
        if ($product) {
            $productData = [
                'id' => $product['id'],
                'name' => $product['name'],
                'code' => $product['code'] ?? '',
                'barcode' => $product['barcode'] ?? '',
                'unit' => $product['unit'] ?? '件',
            ];
        }

        return [
            'id' => $record['id'],
            'store_id' => $record['store_id'],
            'storeId' => $record['store_id'],
            'product_id' => $record['product_id'],
            'productId' => $record['product_id'],
            'product' => $productData,
            'type' => $record['type'],
            'type_label' => self::getTypeLabel($record['type']),
            'typeLabel' => self::getTypeLabel($record['type']),
            'quantity' => (int)$record['quantity'],
            'before_stock' => isset($record['stock_before']) ? (int)$record['stock_before'] : 0,
            'beforeStock' => isset($record['stock_before']) ? (int)$record['stock_before'] : 0,
            'after_stock' => isset($record['stock_after']) ? (int)$record['stock_after'] : 0,
            'afterStock' => isset($record['stock_after']) ? (int)$record['stock_after'] : 0,
            'remark' => $record['description'] ?? '',
            'created_at' => $record['created_at'],
            'createdAt' => $record['created_at'],
        ];
    }

    private static function getTypeLabel(string $type): string
    {
        $labels = [
            'inbound' => '入库',
            'outbound' => '出库',
            'adjust_in' => '调整（增加）',
            'adjust_out' => '调整（减少）',
        ];
        return $labels[$type] ?? $type;
    }
}
