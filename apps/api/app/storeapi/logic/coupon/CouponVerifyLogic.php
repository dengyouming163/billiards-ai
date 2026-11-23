<?php

declare(strict_types=1);

namespace app\storeapi\logic\coupon;

use app\common\logic\BaseLogic;
use app\common\model\merchant\CouponVerify as CouponVerifyModel;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\Table;
use app\common\model\merchant\CouponPackage as CouponPackageModel;
use app\common\gateway\MeituanAdapter;
use app\common\gateway\DouyinAdapter;
use app\common\gateway\CouponPlatformInterface;
use app\common\constants\TableStatus;
use think\facade\Db;
use think\facade\Log;

class CouponVerifyLogic extends BaseLogic
{
    private static function getAdapter(string $platform): CouponPlatformInterface
    {
        return $platform === 'meituan' ? new MeituanAdapter() : new DouyinAdapter();
    }

    private static function getConfigOrFail(string $storeId, string $platform): array
    {
        $config = CouponPlatformLogic::getAdapterConfig($storeId, $platform);
        if (!$config) {
            self::setError('请先配置' . $platform . '平台API凭证');
            return [];
        }
        return $config;
    }

    public static function prepare(string $storeId, string $platform, string $couponCode): array
    {
        $config = self::getConfigOrFail($storeId, $platform);
        if (!$config) return ['success' => false, 'message' => self::getError()];

        $adapter = self::getAdapter($platform);
        $result = $adapter->prepare($config, $couponCode);

        if (!$result['success']) {
            return $result;
        }

        $data = $result['data'];

        // 匹配本地套餐（用于统计）
        $packageId = '';
        $matchedPackage = CouponPackageModel::where('store_id', $storeId)
            ->where('platform', $platform)
            ->where('name', 'like', '%' . mb_substr($data['package_name'], 0, 4) . '%')
            ->find();
        if ($matchedPackage) {
            $packageId = $matchedPackage->id;
        }

        return [
            'success' => true,
            'message' => 'ok',
            'data' => [
                'coupon_code' => $data['coupon_code'],
                'package_name' => $data['package_name'],
                'package_id' => $packageId,
                'price' => $data['price'],
                'duration_minutes' => $data['duration_minutes'],
                'platform_order_id' => $data['platform_order_id'],
                'verify_token' => $data['verify_token'],
                'raw' => $data['raw'],
            ],
        ];
    }

    public static function confirm(string $storeId, array $params): array
    {
        $platform = $params['platform'] ?? '';
        $couponCode = $params['coupon_code'] ?? '';
        $tableId = $params['table_id'] ?? '';
        $verifyToken = $params['verify_token'] ?? '';
        $packageName = $params['package_name'] ?? '';
        $price = floatval($params['price'] ?? 0);
        $durationMinutes = intval($params['duration_minutes'] ?? 60);
        $platformOrderId = $params['platform_order_id'] ?? '';
        $packageId = $params['package_id'] ?? '';
        $employeeId = $params['employee_id'] ?? '';
        $preparedRaw = $params['_prepared_raw'] ?? [];

        if (empty($couponCode) || empty($tableId) || empty($verifyToken)) {
            return ['success' => false, 'message' => '参数不完整'];
        }

        $config = self::getConfigOrFail($storeId, $platform);
        if (!$config) return ['success' => false, 'message' => self::getError()];

        $table = Table::where('id', $tableId)->where('store_id', $storeId)->find();
        if (!$table) return ['success' => false, 'message' => '台桌不存在'];
        if ($table->status !== TableStatus::IDLE) {
            return ['success' => false, 'message' => '台桌当前不可用'];
        }

        // 注入 prepare 阶段的中间数据（抖音 encrypted_codes 等）
        if (!empty($preparedRaw)) {
            $cert = $preparedRaw['certificates'][0] ?? null;
            $config['_prepared_encrypted_codes'] = $cert ? [$cert['encrypted_code']] : null;
        }

        $adapter = self::getAdapter($platform);
        $consumeResult = $adapter->consume($config, $couponCode, $verifyToken);

        if (!$consumeResult['success']) {
            return $consumeResult;
        }

        Db::startTrans();
        try {
            // 1. 记录核销
            $verifyId = 'cv_' . bin2hex(random_bytes(6));
            $verify = new CouponVerifyModel();
            $verify->id = $verifyId;
            $verify->store_id = $storeId;
            $verify->platform = $platform;
            $verify->coupon_code = substr($couponCode, 0, 3) . '***' . substr($couponCode, -3);
            $verify->platform_order_id = $consumeResult['data']['platform_order_id'] ?? $platformOrderId;
            $verify->package_id = $packageId;
            $verify->package_name = $packageName;
            $verify->verify_price = $price;
            $verify->duration_minutes = $durationMinutes;
            $verify->table_id = $tableId;
            $verify->status = 'verified';
            $verify->verify_token = $verifyToken;
            $verify->verified_at = date('Y-m-d H:i:s');
            $verify->verified_by = $employeeId;
            $verify->raw_response = json_encode($preparedRaw, JSON_UNESCAPED_UNICODE);
            $verify->save();

            // 2. 创建订单（复用 prepaidOpen 模式）
            $orderId = 'order_' . bin2hex(random_bytes(8));
            $orderNo = 'MT' . date('YmdHis') . str_pad((string)mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);

            $order = new Order();
            $order->id = $orderId;
            $order->store_id = $storeId;
            $order->order_no = $orderNo;
            $order->type = 'table';
            $order->status = 'in_progress';
            $order->table_id = $tableId;
            $order->start_time = date('Y-m-d H:i:s');
            $order->source = $platform;
            $order->coupon_verify_id = $verifyId;
            $order->prepaid_hours = intval(ceil($durationMinutes / 60));
            $order->remaining_minutes = $durationMinutes;
            $order->payment_status = 'paid';
            $order->prepaid_amount = $price;
            $order->original_amount = $price;
            $order->final_amount = $price;
            $order->save();

            // 更新核销记录关联订单
            $verify->order_id = $orderId;
            $verify->save();

            // 3. 创建 OrderItem: coupon
            $couponItem = new OrderItem();
            $couponItem->id = 'oi_' . bin2hex(random_bytes(6));
            $couponItem->order_id = $orderId;
            $couponItem->item_type = 'coupon';
            $couponItem->item_name = ($platform === 'meituan' ? '美团券-' : '抖音券-') . $packageName;
            $couponItem->quantity = 1;
            $couponItem->unit = '张';
            $couponItem->unit_price = $price;
            $couponItem->total_price = $price;
            $couponItem->final_price = 0;
            $couponItem->status = 'delivered';
            $couponItem->description = json_encode([
                'platform' => $platform,
                'coupon_code' => $verify->coupon_code,
                'coupon_duration_minutes' => $durationMinutes,
                'verify_id' => $verifyId,
                'platform_order_id' => $verify->platform_order_id,
            ], JSON_UNESCAPED_UNICODE);
            $couponItem->save();

            // 4. 创建 OrderItem: table
            $tableItem = new OrderItem();
            $tableItem->id = 'oi_' . bin2hex(random_bytes(6));
            $tableItem->order_id = $orderId;
            $tableItem->item_type = 'table';
            $tableItem->item_name = '台费';
            $tableItem->quantity = 1;
            $tableItem->unit = '小时';
            $tableItem->unit_price = $table->hourly_rate ?? 0;
            $tableItem->total_price = 0;
            $tableItem->final_price = 0;
            $tableItem->save();

            // 5. 更新球台状态
            $table->status = TableStatus::OCCUPIED;
            $table->save();

            // 6. WebSocket 推送
            try {
                \app\common\lib\WebSocketNotification::sendToGroup(
                    "store_{$storeId}",
                    ['type' => 'coupon_verify', 'data' => [
                        'platform' => $platform,
                        'table_id' => $tableId,
                        'order_id' => $orderId,
                        'package_name' => $packageName,
                    ]]
                );
            } catch (\Exception $e) {
                Log::warning('WS push failed for coupon_verify: ' . $e->getMessage());
            }

            Db::commit();

            return [
                'success' => true,
                'message' => '核销成功，已开台',
                'data' => [
                    'verify_id' => $verifyId,
                    'order_id' => $orderId,
                    'order_no' => $orderNo,
                    'table_id' => $tableId,
                    'table_name' => $table->name ?? '',
                    'package_name' => $packageName,
                    'duration_minutes' => $durationMinutes,
                    'start_time' => $order->start_time,
                ],
            ];
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('CouponVerifyLogic::confirm error: ' . $e->getMessage());
            return ['success' => false, 'message' => '核销开台失败: ' . $e->getMessage()];
        }
    }

    public static function revoke(string $verifyId, string $storeId, string $employeeId): array
    {
        $verify = CouponVerifyModel::where('id', $verifyId)
            ->where('store_id', $storeId)
            ->find();

        if (!$verify) return ['success' => false, 'message' => '核销记录不存在'];
        if ($verify->status === 'revoked') return ['success' => false, 'message' => '该券已撤销'];

        // 检查1小时内
        $verifiedTime = strtotime($verify->verified_at);
        if (time() - $verifiedTime > 3600) {
            return ['success' => false, 'message' => '已超过1小时，无法撤销'];
        }

        $config = self::getConfigOrFail($storeId, $verify->platform);
        if (!$config) return ['success' => false, 'message' => self::getError()];

        $adapter = self::getAdapter($verify->platform);
        // For Douyin, pass order_id through config
        $config['_platform_order_id'] = $verify->platform_order_id;
        $result = $adapter->reverse($config, $verify->coupon_code, $verify->verify_token);

        if (!$result['success']) {
            return $result;
        }

        Db::startTrans();
        try {
            $verify->status = 'revoked';
            $verify->revoked_at = date('Y-m-d H:i:s');
            $verify->save();

            if (!empty($verify->order_id)) {
                OrderItem::where('order_id', $verify->order_id)
                    ->where('item_type', 'coupon')
                    ->update(['status' => 'cancelled']);

                $itemCount = OrderItem::where('order_id', $verify->order_id)
                    ->where('item_type', '<>', 'coupon')
                    ->where('status', '<>', 'cancelled')
                    ->count();

                if ($itemCount === 0) {
                    $order = Order::where('id', $verify->order_id)->find();
                    if ($order) {
                        $order->status = 'cancelled';
                        $order->end_time = date('Y-m-d H:i:s');
                        $order->save();
                        Table::where('id', $order->table_id)->update(['status' => TableStatus::IDLE]);
                    }
                }
            }

            Db::commit();
            return ['success' => true, 'message' => '撤销成功'];
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('CouponVerifyLogic::revoke error: ' . $e->getMessage());
            return ['success' => false, 'message' => '撤销失败: ' . $e->getMessage()];
        }
    }

    public static function getRecords(string $storeId, array $params): array
    {
        $platform = $params['platform'] ?? '';
        $date = $params['date'] ?? '';
        $page = intval($params['page_no'] ?? 1);
        $pageSize = intval($params['page_size'] ?? 20);

        $query = CouponVerifyModel::where('store_id', $storeId);
        if (!empty($platform)) $query->where('platform', $platform);
        if (!empty($date)) $query->where('verified_at', 'like', $date . '%');

        $count = $query->count();
        $lists = $query->page($page, $pageSize)->order('verified_at', 'desc')->select()->toArray();

        return ['lists' => $lists, 'count' => $count, 'page_no' => $page, 'page_size' => $pageSize];
    }
}
