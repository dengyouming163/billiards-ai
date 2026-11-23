<?php

namespace app\storeapi\logic\mobile;

use app\common\model\system\AssistantTag;

class AssistantTagLogic
{
    public static function getTags()
    {
        $tags = AssistantTag::where('status', 1)
            ->order('sort_order', 'asc')
            ->select();
        
        $result = [];
        foreach ($tags as $tag) {
            $result[] = [
                'id' => $tag->id,
                'name' => $tag->name,
                'category' => $tag->category
            ];
        }
        
        return $result;
    }
    
    public static function getTagsGrouped()
    {
        $tags = AssistantTag::where('status', 1)
            ->order('sort_order', 'asc')
            ->select();
        
        $grouped = [];
        foreach ($tags as $tag) {
            $category = $tag->category ?: '未分类';
            if (!isset($grouped[$category])) {
                $grouped[$category] = [];
            }
            $grouped[$category][] = [
                'id' => $tag->id,
                'name' => $tag->name
            ];
        }
        
        return $grouped;
    }
}