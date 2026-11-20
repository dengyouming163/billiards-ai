<?php

declare (strict_types=1);

namespace app\storeapi\logic\notification;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Notification;

class NotificationLogic extends BaseLogic
{
    public static function getLists(string $storeId, string $userId, array $params)
    {
        try {
            $page = $params['page'] ?? 1;
            $pageSize = $params['page_size'] ?? 20;

            $query = Notification::where('store_id', $storeId)
                ->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)->whereOr('user_id', '');
                })
                ->order('created_at', 'desc');

            // 支持增量拉取：只返回 since 时间之后的通知
            if (!empty($params['since'])) {
                $sinceTime = $params['since'];
                if (strlen($sinceTime) > 19) {
                    $sinceTime = date('Y-m-d H:i:s', strtotime($sinceTime));
                }
                $query->where('created_at', '>', $sinceTime);
            }

            $list = $query->paginate([
                'page' => $page,
                'list_rows' => $pageSize,
            ]);

            $items = [];
            foreach ($list->items() as $item) {
                $items[] = [
                    'id' => $item['id'],
                    'type' => $item['type'],
                    'typeText' => $item->getTypeTextAttr(null, $item->toArray()),
                    'title' => $item['title'],
                    'content' => $item['content'],
                    'isRead' => (bool)$item['is_read'],
                    'createdAt' => $item['created_at'],
                ];
            }

            return [
                'list' => $items,
                'total' => $list->total(),
                'page' => $list->currentPage(),
                'pageSize' => $list->listRows(),
            ];
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function markRead(string $storeId, string $userId, string $id)
    {
        try {
            if (empty($id)) {
                self::setError('通知ID不能为空');
                return false;
            }

            $notification = Notification::where('id', $id)
                ->where('store_id', $storeId)
                ->find();

            if (!$notification) {
                self::setError('通知不存在');
                return false;
            }

            $notification->is_read = 1;
            $notification->read_at = date('Y-m-d H:i:s');
            $notification->save();

            return true;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function markAllRead(string $storeId, string $userId)
    {
        try {
            Notification::where('store_id', $storeId)
                ->where('is_read', 0)
                ->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)->whereOr('user_id', '');
                })
                ->update([
                    'is_read' => 1,
                    'read_at' => date('Y-m-d H:i:s'),
                ]);

            return true;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function deleteNotification(string $storeId, string $userId, string $id)
    {
        try {
            if (empty($id)) {
                self::setError('通知ID不能为空');
                return false;
            }

            $notification = Notification::where('id', $id)
                ->where('store_id', $storeId)
                ->find();

            if (!$notification) {
                self::setError('通知不存在');
                return false;
            }

            $notification->delete();

            return true;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function getUnreadCount(string $storeId, string $userId)
    {
        try {
            return Notification::where('store_id', $storeId)
                ->where('is_read', 0)
                ->where(function ($q) use ($userId) {
                    $q->where('user_id', $userId)->whereOr('user_id', '');
                })
                ->count();
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return 0;
        }
    }

    public static function getDetail(string $storeId, string $userId, string $id)
    {
        try {
            if (empty($id)) {
                self::setError('通知ID不能为空');
                return false;
            }

            $notification = Notification::where('id', $id)
                ->where('store_id', $storeId)
                ->find();

            if (!$notification) {
                self::setError('通知不存在');
                return false;
            }

            return [
                'id' => $notification['id'],
                'type' => $notification['type'],
                'title' => $notification['title'],
                'content' => $notification['content'],
                'is_read' => $notification['is_read'],
                'created_at' => $notification['created_at'],
                'link' => $notification['link'] ?? '',
            ];
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }
}