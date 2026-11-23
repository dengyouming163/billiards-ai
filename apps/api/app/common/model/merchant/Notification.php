<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Notification extends Model
{
    protected $name = 'busi_notification';
    protected $pk = 'id';

    protected $schema = [
        'id' => 'string',
        'store_id' => 'string',
        'user_id' => 'string',
        'type' => 'string',
        'title' => 'string',
        'content' => 'string',
        'is_read' => 'int',
        'read_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getTypeTextAttr($value, $data)
    {
        $types = [
            'system' => '系统通知',
            'order' => '订单通知',
            'finance' => '财务通知',
            'alert' => '预警通知',
        ];
        return $types[$data['type']] ?? '未知';
    }

    public function scopeUnread($query)
    {
        return $query->where('is_read', 0);
    }

    public function scopeStore($query, $storeId)
    {
        return $query->where('store_id', $storeId);
    }

    public function scopeUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}