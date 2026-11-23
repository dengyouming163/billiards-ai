<?php

namespace app\storeapi\logic\mobile;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Notification;

class NotificationLogic extends BaseLogic
{
    public static function getLists($userId, $params = [])
    {
        $page = $params['page_no'] ?? 1;
        $pageSize = $params['page_size'] ?? 20;
        $type = $params['type'] ?? '';

        $where = [['user_id', '=', $userId]];

        if ($type) {
            $where[] = ['type', '=', $type];
        }

        $list = Notification::where($where)
            ->order('created_at', 'desc')
            ->paginate($pageSize, false, ['page' => $page]);

        $items = [];
        foreach ($list->items() as $item) {
            $items[] = [
                'id' => $item['id'],
                'type' => $item['type'],
                'title' => $item['title'],
                'content' => $item['content'],
                'is_read' => $item['is_read'],
                'link' => $item['link'] ?? '',
                'created_at' => $item['created_at'],
            ];
        }

        return [
            'list' => $items,
            'total' => $list->total(),
            'page_no' => $page,
            'page_size' => $pageSize,
        ];
    }

    public static function getDetail($id, $userId)
    {
        $item = Notification::where('id', $id)
            ->where('user_id', '=', $userId)
            ->find();

        if (!$item) {
            self::setError('通知不存在');
            return false;
        }

        return [
            'id' => $item['id'],
            'type' => $item['type'],
            'title' => $item['title'],
            'content' => $item['content'],
            'is_read' => $item['is_read'],
            'link' => $item['link'] ?? '',
            'created_at' => $item['created_at'],
        ];
    }

    public static function markRead($id, $userId)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', '=', $userId)
            ->find();

        if (!$notification) {
            self::setError('通知不存在');
            return false;
        }

        $notification->is_read = 1;
        $notification->read_at = date('Y-m-d H:i:s');
        $notification->save();

        return true;
    }

    public static function markAllRead($userId)
    {
        Notification::where('user_id', '=', $userId)
            ->where('is_read', '=', 0)
            ->update([
                'is_read' => 1,
                'read_at' => date('Y-m-d H:i:s'),
            ]);

        return true;
    }

    public static function getUnreadCount($userId)
    {
        $count = Notification::where('user_id', '=', $userId)
            ->where('is_read', '=', 0)
            ->count();
        return ['count' => $count];
    }

    public static function deleteNotification($id, $userId)
    {
        $notification = Notification::where('id', $id)
            ->where('user_id', '=', $userId)
            ->find();

        if (!$notification) {
            self::setError('通知不存在');
            return false;
        }

        $notification->delete();

        return true;
    }
}
