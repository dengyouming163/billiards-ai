<?php

declare (strict_types=1);

namespace app\storeapi\logic\table;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Table;
use app\common\model\merchant\Zone;
use app\common\model\merchant\Pricing;
use app\common\model\merchant\TableType;

class TableLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $query = Table::where('store_id', $storeId)->where('status', '<>', 0);

        if (!empty($params['zone_id'])) {
            $query->where('zone_id', $params['zone_id']);
        }
        if (!empty($params['status'])) {
            $query->where('status', $params['status']);
        }
        if (!empty($params['type'])) {
            $query->where('type', $params['type']);
        }
        if (!empty($params['keyword'])) {
            $keyword = strtolower($params['keyword']);
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                  ->whereOr('number', 'like', "%{$keyword}%");
            });
        }

        $page = $params['page'] ?? 1;
        $pageSize = $params['page_size'] ?? 20;
        
        $list = $query->order('sort_order', 'asc')->paginate([
            'page' => (int)$page,
            'list_rows' => (int)$pageSize,
        ]);

        $data = $list->items();
        foreach ($data as &$item) {
            $item = $item->toArray();
            if (!empty($item['zone_id'])) {
                $zone = Zone::where('id', $item['zone_id'])->find();
                $item['zone_name'] = $zone['name'] ?? '';
                $item['zone_color'] = $zone['color'] ?? '';
            } else {
                $item['zone_name'] = '';
                $item['zone_color'] = '';
            }
            if (!empty($item['table_type_id'])) {
                $tableType = TableType::where('id', $item['table_type_id'])->value('name');
                $item['table_type_name'] = $tableType ?: '';
            } else {
                $item['table_type_name'] = '';
            }
            if (!empty($item['pricing_id'])) {
                $pricing = Pricing::where('id', $item['pricing_id'])->find();
                if ($pricing) {
                    $pricing = $pricing->toArray();
                    $item['pricing_name'] = $pricing['name'];
                    $config = [];
                    if (is_string($pricing['config'])) {
                        $config = json_decode($pricing['config'], true) ?? [];
                    } elseif (is_object($pricing['config'])) {
                        $config = (array)$pricing['config'];
                    } elseif (is_array($pricing['config'])) {
                        $config = $pricing['config'];
                    }
                    $item['hourly_rate'] = isset($config['pricePerHour']) ? $config['pricePerHour'] : (isset($pricing['price']) ? $pricing['price'] : 0);
                }
            }
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

    public static function getDetail(string $id, string $storeId)
    {
        $table = Table::where('id', $id)->where('store_id', $storeId)->where('status', '<>', 0)->find();
        if (!$table) {
            return self::setError('台桌不存在');
        }
        
        $data = $table->toArray();
        if (!empty($data['zone_id'])) {
            $zone = Zone::where('id', $data['zone_id'])->find();
            if ($zone) {
                $data['zone_name'] = $zone['name'];
                $data['zone_color'] = $zone['color'];
            }
        }
        if (!empty($data['table_type_id'])) {
            $tableType = TableType::where('id', $data['table_type_id'])->find();
            if ($tableType) {
                $data['table_type_name'] = $tableType['name'];
            }
        }
        if (!empty($data['pricing_id'])) {
            $pricing = Pricing::where('id', $data['pricing_id'])->find();
            if ($pricing) {
                $pricing = $pricing->toArray();
                $data['pricing_name'] = $pricing['name'];
                $config = [];
                if (is_string($pricing['config'])) {
                    $config = json_decode($pricing['config'], true) ?? [];
                } elseif (is_object($pricing['config'])) {
                    $config = (array)$pricing['config'];
                } elseif (is_array($pricing['config'])) {
                    $config = $pricing['config'];
                }
                $data['hourly_rate'] = isset($config['pricePerHour']) ? $config['pricePerHour'] : (isset($pricing['price']) ? $pricing['price'] : 0);
            }
        }
        
        return $data;
    }

    private static function generateUniqueNumber(string $storeId): string
    {
        $maxAttempts = 10;
        
        for ($i = 0; $i < $maxAttempts; $i++) {
            $number = '';
            for ($j = 0; $j < 6; $j++) {
                $number .= rand(0, 9);
            }
            
            $count = Table::where('store_id', $storeId)->where('number', $number)->count();
            if ($count == 0) {
                return $number;
            }
        }
        
        return date('YmdHis');
    }

    public static function create($params, string $storeId)
    {
        if (empty($storeId)) {
            self::setError('store_id不能为空');
            return false;
        }
        
        if ($params instanceof \stdClass) {
            $params = (array)$params;
        }
        
        $required = ['zone_id'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                self::setError($field . '不能为空');
                return false;
            }
        }

        if (empty($params['code'])) {
            $params['code'] = self::generateUniqueCode();
        }

        $table = new Table();
        $table->id = 'table_' . bin2hex(random_bytes(8));
        $table->store_id = $storeId;
        $table->zone_id = $params['zone_id'];
        $table->table_type_id = isset($params['table_type_id']) ? $params['table_type_id'] : '';
        $table->number = isset($params['number']) ? $params['number'] : self::generateUniqueNumber($storeId);
        $table->name = isset($params['name']) ? $params['name'] : '';
        $table->code = $params['code'];
        $table->pricing_id = isset($params['pricing_id']) ? $params['pricing_id'] : '';
        $table->type = $params['type'] ?? 'standard';
        $table->status = 'idle';

        // 检查套餐台桌数量限制
        $store = \app\common\model\merchant\Store::where('id', $storeId)->find();
        if ($store && !empty($store['merchant_id'])) {
            $pkg = \think\facade\Db::name('merchant_packages')->alias('mp')
                ->leftJoin('packages p', 'mp.package_id = p.id')
                ->where('mp.merchant_id', $store['merchant_id'])->where('mp.status', 'active')
                ->field('p.table_limit')->find();
            if ($pkg) {
                $currentCount = Table::where('store_id', $storeId)->count();
                if ($currentCount >= (int)$pkg['table_limit']) {
                    return self::setError("台桌数已达套餐上限({$pkg['table_limit']})，请联系平台升级套餐");
                }
            }
        }

        if (!empty($params['pricing_id'])) {
            $pricing = Pricing::where('id', $params['pricing_id'])->find();
            if ($pricing) {
                $pricing = $pricing->toArray();
                $config = [];
                if (is_string($pricing['config'])) {
                    $config = json_decode($pricing['config'], true) ?? [];
                } elseif (is_object($pricing['config'])) {
                    $config = (array)$pricing['config'];
                } elseif (is_array($pricing['config'])) {
                    $config = $pricing['config'];
                }
                $table->hourly_rate = isset($config['pricePerHour']) ? $config['pricePerHour'] : (isset($pricing['price']) ? $pricing['price'] : 0);
            }
        }

        if (!$table->save()) {
            self::setError('创建失败');
            return false;
        }
        
        $result = $table->toArray();
        if (empty($result)) {
            self::setError('获取数据失败');
            return false;
        }
        $zone = Zone::where('id', $params['zone_id'])->value('name');
        $result['zone_name'] = $zone ?: '';
        
        return $result;
    }

    public static function update(string $id, $params, string $storeId)
    {
        if ($params instanceof \stdClass) {
            $params = (array)$params;
        }
        
        $table = Table::where('id', $id)->where('store_id', $storeId)->where('status', '<>', 0)->find();
        if (!$table) {
            return self::setError('台桌不存在');
        }

        $updatable = ['zone_id', 'table_type_id', 'number', 'name', 'pricing_id', 'description', 'sort_order'];
        foreach ($updatable as $field) {
            if (isset($params[$field])) {
                $table->$field = $params[$field];
            }
        }

        if (isset($params['pricing_id'])) {
            $pricing = Pricing::where('id', $params['pricing_id'])->find();
            if ($pricing) {
                $pricing = $pricing->toArray();
                $config = [];
                if (is_string($pricing['config'])) {
                    $config = json_decode($pricing['config'], true) ?? [];
                } elseif (is_object($pricing['config'])) {
                    $config = (array)$pricing['config'];
                } elseif (is_array($pricing['config'])) {
                    $config = $pricing['config'];
                }
                $table->hourly_rate = isset($config['pricePerHour']) ? $config['pricePerHour'] : (isset($pricing['price']) ? $pricing['price'] : 0);
            } else {
                $table->hourly_rate = 0;
            }
        }

        $table->save();
        
        $result = $table->toArray();
        if (!empty($result['zone_id'])) {
            $zone = Zone::where('id', $result['zone_id'])->value('name');
            $result['zone_name'] = $zone ?: '';
        }
        
        return $result;
    }

    public static function delete(string $id, string $storeId)
    {
        $table = Table::where('id', $id)->where('store_id', $storeId)->where('status', '<>', 0)->find();
        if (!$table) {
            return self::setError('台桌不存在');
        }
        
        if ($table['status'] === 'occupied') {
            return self::setError('台桌正在使用中，无法删除');
        }

        $table->status = 0;
        $table->save();
        
        return true;
    }

    public static function batchCreate(array $params, string $storeId)
    {
        $required = ['zone_id', 'prefix', 'start', 'end'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return self::setError($field . '不能为空');
            }
        }

        $tables = [];
        for ($i = (int)$params['start']; $i <= (int)$params['end']; $i++) {
            $number = $params['prefix'] . str_pad($i, 2, '0', STR_PAD_LEFT);
            
            $table = new Table();
            $table->id = 'table_' . bin2hex(random_bytes(8));
            $table->store_id = $storeId;
            $table->zone_id = $params['zone_id'];
            $table->number = $number;
            $table->name = $number . '号台';
            $table->type = $params['type'] ?? 'standard';
            $table->status = 'idle';
            $table->save();
            
            $tables[] = $table->toArray();
        }

        return $tables;
    }

    private static function generateUniqueCode(): string
    {
        $maxAttempts = 100;
        $attempt = 0;
        
        while ($attempt < $maxAttempts) {
            $code = str_pad((string)mt_rand(100000, 999999), 6, '0', STR_PAD_LEFT);
            
            $count = Table::where('code', $code)->count();
            
            if ($count === 0) {
                return $code;
            }
            
            $attempt++;
        }
        
        $timestamp = (string)time();
        return substr($timestamp, -6);
    }

    public static function generateQrcode(string $id, string $storeId)
    {
        $table = Table::where('id', $id)->where('store_id', $storeId)->where('status', '<>', 0)->find();
        if (!$table) {
            return self::setError('台桌不存在');
        }

        $qrcodeContent = json_encode([
            'storeId' => $storeId,
            'tableId' => $id,
            'tableNumber' => $table['number'],
            'name' => $table['name'] ?: "台桌 {$table['number']}",
        ]);
        
        $qrcodeBase64 = self::generateQrCodeBase64($qrcodeContent);

        $table->qrcode = $qrcodeBase64;
        $table->save();

        return [
            'qrcode_url' => 'data:image/png;base64,' . $qrcodeBase64,
        ];
    }

    private static function generateQrCodeBase64(string $content): string
    {
        return base64_encode('QRCODE_DATA_' . $content);
    }

    public static function bindPricing(string $id, array $params, string $storeId)
    {
        if (empty($params['pricing_id'])) {
            return self::setError('计费规则ID不能为空');
        }

        $table = Table::where('id', $id)->where('store_id', $storeId)->where('status', '<>', 0)->find();
        if (!$table) {
            return self::setError('台桌不存在');
        }

        $pricing = Pricing::where('id', $params['pricing_id'])->find();
        if (!$pricing) {
            return self::setError('计费规则不存在');
        }

        $table->pricing_id = $params['pricing_id'];
        $config = is_string($pricing['config']) ? json_decode($pricing['config'], true) : ($pricing['config'] ?? []);
        $table->hourly_rate = $config['pricePerHour'] ?? $pricing['price'] ?? 0;
        $table->save();

        $result = $table->toArray();
        $result['pricing_name'] = $pricing['name'];
        
        return $result;
    }

    public static function getStats(string $storeId, array $params = [])
    {
        $query = Table::where('store_id', $storeId)->where('status', '<>', 0);

        if (!empty($params['zone_id'])) {
            $query->where('zone_id', $params['zone_id']);
        }

        $tables = $query->select()->toArray();

        $stats = [
            'total' => count($tables),
            'idle' => 0,
            'occupied' => 0,
            'reserved' => 0,
            'maintenance' => 0,
            'total_usage_hours' => 0,
            'total_revenue' => 0,
        ];

        foreach ($tables as $table) {
            if (isset($stats[$table['status']])) {
                $stats[$table['status']]++;
            }
            $stats['total_usage_hours'] += $table['total_usage_hours'] ?? 0;
            $stats['total_revenue'] += ($table['total_usage_hours'] ?? 0) * ($table['hourly_rate'] ?? 0);
        }

        return $stats;
    }
}
