<?php

declare (strict_types=1);

namespace app\common\logic;

use app\common\model\merchant\Notification;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;

class NotificationLogic extends BaseLogic
{
    const TYPE_NEW_ORDER_ITEM = 'new_order_item';
    const TYPE_ORDER_COMPLETED = 'order_completed';
    const TYPE_SERVICE_CALLED = 'service_called';

    public static function sendOrderItemNotification(OrderItem $item, Order $order, string $storeId): void
    {
        $table = Table::where('id', $order->table_id)->find();
        $tableNumber = $table ? $table->number : '未知桌台';
        
        $notification = new Notification();
        $notification->id = self::generateId();
        $notification->store_id = $storeId;
        $notification->type = self::TYPE_NEW_ORDER_ITEM;
        $notification->title = '新点单';
        $notification->content = "{$tableNumber}点了{$item->item_name} x{$item->quantity}";
        $notification->is_read = 0;
        $notification->save();
    }

    public static function sendServiceCallNotification(string $orderId, string $serviceType, string $tableNumber, string $storeId): void
    {
        $serviceNames = [
            'clean' => '清理台面',
            'add_product' => '添加商品',
            'repair' => '设备维修',
            'complaint' => '投诉建议',
            'other' => '其他需求'
        ];
        
        $notification = new Notification();
        $notification->id = self::generateId();
        $notification->store_id = $storeId;
        $notification->type = self::TYPE_SERVICE_CALLED;
        $notification->title = '服务呼叫';
        $serviceLabel = $serviceNames[$serviceType] ?? '其他服务';
        $notification->content = "{$tableNumber}呼叫：{$serviceLabel}";
        $notification->is_read = 0;
        $notification->save();
    }

    public static function getUnreadNotifications(string $storeId, int $limit = 50): array
    {
        $notifications = Notification::where('store_id', $storeId)
            ->where('is_read', 0)
            ->order('created_at', 'desc')
            ->limit($limit)
            ->select();
        
        return $notifications->toArray();
    }

    public static function getNotificationsSince(string $storeId, ?string $lastTime = null, int $limit = 50): array
    {
        $query = Notification::where('store_id', $storeId);
        
        if (!empty($lastTime)) {
            $query->where('created_at', '>', $lastTime);
        }
        
        $notifications = $query->order('created_at', 'desc')
            ->limit($limit)
            ->select();
        
        return [
            'has_new' => count($notifications) > 0,
            'notifications' => $notifications->toArray(),
            'count' => count($notifications)
        ];
    }

    public static function getPendingOrderItems(string $storeId): array
    {
        $items = OrderItem::where('order_id', 'IN', function($query) use ($storeId) {
            $query->name('busi_order')
                ->where('store_id', $storeId)
                ->where('status', 'in_progress')
                ->field('id');
        })
        ->where('item_type', 'product')
        ->whereIn('status', ['pending', 'processing'])
        ->order('created_at', 'asc')
        ->select();
        
        $result = [];
        foreach ($items as $item) {
            $order = Order::where('id', $item->order_id)->find();
            $table = $order ? Table::where('id', $order->table_id)->find() : null;
            
            $result[] = [
                'item_id' => $item->id,
                'order_id' => $item->order_id,
                'order_no' => $order ? $order->order_no : '',
                'table_number' => $table ? $table->number : '',
                'product_name' => $item->item_name,
                'quantity' => $item->quantity,
                'price' => $item->total_price,
                'remark' => $item->description,
                'status' => $item->status,
                'created_at' => $item->created_at
            ];
        }
        
        return $result;
    }

    public static function markAsRead(string $notificationId): bool
    {
        $notification = Notification::where('id', $notificationId)->find();
        if ($notification) {
            $notification->is_read = 1;
            $notification->read_at = date('Y-m-d H:i:s');
            $notification->save();
            return true;
        }
        return false;
    }

    public static function markAllAsRead(string $storeId): int
    {
        return Notification::where('store_id', $storeId)
            ->where('is_read', 0)
            ->update([
                'is_read' => 1,
                'read_at' => date('Y-m-d H:i:s')
            ]);
    }

    public static function getUnreadCount(string $storeId): int
    {
        return Notification::where('store_id', $storeId)
            ->where('is_read', 0)
            ->count();
    }

    public static function createNotification(string $storeId, string $type, string $title, string $content, ?string $userId = null): Notification
    {
        $notification = new Notification();
        $notification->id = self::generateId();
        $notification->store_id = $storeId;
        $notification->user_id = $userId;
        $notification->type = $type;
        $notification->title = $title;
        $notification->content = $content;
        $notification->is_read = 0;
        $notification->save();
        
        return $notification;
    }

    private static function generateId(): string
    {
        return md5(uniqid((string)mt_rand(), true));
    }
}
