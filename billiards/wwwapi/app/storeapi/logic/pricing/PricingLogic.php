<?php

declare (strict_types=1);

namespace app\storeapi\logic\pricing;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Pricing;

class PricingLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $query = Pricing::where('store_id', $storeId);

        if (!empty($params['type'])) {
            $query->where('type', $params['type']);
        }
        if (!empty($params['keyword'])) {
            $keyword = strtolower($params['keyword']);
            $query->where('name', 'like', "%{$keyword}%");
        }

        $page = $params['page'] ?? 1;
        $pageSize = $params['page_size'] ?? 20;
        
        $list = $query->order('priority', 'asc')->order('sort_order', 'asc')->paginate([
            'page' => (int)$page,
            'list_rows' => (int)$pageSize,
        ]);

        $data = $list->items();
        foreach ($data as &$item) {
            $item = self::formatRule($item->toArray());
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
        $query = Pricing::where('store_id', $storeId);
        $list = $query->order('priority', 'asc')->order('sort_order', 'asc')->select()->toArray();
        
        foreach ($list as &$item) {
            $item = self::formatRule($item);
        }
        
        return $list;
    }

    public static function getDetail(string $id, string $storeId)
    {
        $pricing = Pricing::where('id', $id)->where('store_id', $storeId)->find();
        if (!$pricing) {
            return self::setError('计费规则不存在');
        }
        
        return self::formatRule($pricing->toArray());
    }

    private static function formatRule(array $item): array
    {
        if (!empty($item['config'])) {
            if (is_string($item['config'])) {
                $item['config'] = json_decode($item['config'], true) ?: [];
            } elseif (is_object($item['config'])) {
                $item['config'] = (array)$item['config'];
            }
        } else {
            $item['config'] = [];
        }
        
        $item['applicableTables'] = !empty($item['applicable_tables']) ? (is_array($item['applicable_tables']) ? array_values($item['applicable_tables']) : []) : [];
        $weekdayTypes = !empty($item['weekday_types']) ? $item['weekday_types'] : ['all'];
        $item['weekdayTypes'] = is_array($weekdayTypes) ? array_values($weekdayTypes) : ['all'];
        $memberLevels = !empty($item['member_levels']) ? $item['member_levels'] : ['normal', 'silver', 'gold', 'diamond'];
        $item['memberLevels'] = is_array($memberLevels) ? array_values($memberLevels) : ['normal', 'silver', 'gold', 'diamond'];
        $item['status'] = $item['status'] == 1 ? 'active' : 'inactive';
        
        unset($item['applicable_tables'], $item['weekday_types'], $item['member_levels']);
        
        return $item;
    }

    public static function create(array $params, string $storeId)
    {
        $required = ['name', 'type'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return self::setError($field . '不能为空');
            }
        }

        $pricing = new Pricing();
        $pricing->id = 'pricing_' . uniqid();
        $pricing->store_id = $storeId;
        $pricing->name = $params['name'];
        $pricing->type = $params['type'];
        $pricing->description = $params['description'] ?? '';
        $pricing->priority = $params['priority'] ?? 1;
        $pricing->status = (($params['status'] ?? 'active') === 'inactive') ? 0 : 1;
        $pricing->sort_order = $params['sort_order'] ?? 0;
        
        if (!empty($params['config'])) {
            $pricing->config = is_array($params['config']) ? json_encode($params['config']) : $params['config'];
        }
        
        if (!empty($params['applicableTables'])) {
            $pricing->applicable_tables = is_array($params['applicableTables']) ? array_values($params['applicableTables']) : [];
        }
        
        if (!empty($params['weekdayTypes'])) {
            $pricing->weekday_types = is_array($params['weekdayTypes']) ? array_values($params['weekdayTypes']) : [];
        }
        
        if (!empty($params['memberLevels'])) {
            $pricing->member_levels = is_array($params['memberLevels']) ? array_values($params['memberLevels']) : [];
        }

        $pricing->save();
        
        return self::formatRule($pricing->toArray());
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $pricing = Pricing::where('id', $id)->where('store_id', $storeId)->find();
        if (!$pricing) {
            return self::setError('计费规则不存在');
        }

        if (isset($params['name'])) {
            $pricing->name = $params['name'];
        }
        if (isset($params['type'])) {
            $pricing->type = $params['type'];
        }
        if (isset($params['description'])) {
            $pricing->description = $params['description'];
        }
        if (isset($params['priority'])) {
            $pricing->priority = $params['priority'];
        }
        if (isset($params['sort_order'])) {
            $pricing->sort_order = $params['sort_order'];
        }
        if (isset($params['status'])) {
            $pricing->status = $params['status'] === 'inactive' ? 0 : 1;
        }
        
        if (isset($params['config'])) {
            $pricing->config = is_array($params['config']) ? json_encode($params['config']) : $params['config'];
        }
        
        if (isset($params['applicableTables'])) {
            $pricing->applicable_tables = is_array($params['applicableTables']) ? array_values($params['applicableTables']) : [];
        }
        
        if (isset($params['weekdayTypes'])) {
            $pricing->weekday_types = is_array($params['weekdayTypes']) ? array_values($params['weekdayTypes']) : [];
        }
        
        if (isset($params['memberLevels'])) {
            $pricing->member_levels = is_array($params['memberLevels']) ? array_values($params['memberLevels']) : [];
        }

        $result = $pricing->save();
        if (!$result) {
            return self::setError('保存失败');
        }
        
        return self::formatRule($pricing->toArray());
    }

    public static function delete(string $id, string $storeId)
    {
        $pricing = Pricing::where('id', $id)->where('store_id', $storeId)->find();
        if (!$pricing) {
            return self::setError('计费规则不存在');
        }

        if ($pricing['status'] == 1) {
            return self::setError('只能删除已禁用的计费规则');
        }

        $result = $pricing->delete();
        if (!$result) {
            return self::setError('删除失败');
        }
        
        return true;
    }

    public static function toggle(string $id, string $storeId)
    {
        $pricing = Pricing::where('id', $id)->where('store_id', $storeId)->find();
        if (!$pricing) {
            return self::setError('计费规则不存在');
        }

        $pricing->status = $pricing['status'] == 1 ? 0 : 1;
        $pricing->save();
        
        return [
            'id' => $pricing['id'],
            'status' => $pricing['status'] == 1 ? 'active' : 'inactive',
        ];
    }
}
