<?php

namespace app\storeapi\logic\order;

use app\common\model\merchant\Reservation;
use app\common\model\merchant\Table;

class ReservationLogic
{
    public static function getLists(string $storeId, array $params = []): array
    {
        $query = Reservation::where('r.store_id', $storeId)
            ->alias('r')
            ->leftJoin(Table::getTable() . ' t', 't.id = r.table_id COLLATE utf8mb4_general_ci')
            ->field('r.*, t.name as table_name')
            ->order('r.reservation_time', 'desc');

        if (!empty($params['status'])) {
            if (is_array($params['status'])) {
                $query->whereIn('r.status', $params['status']);
            } else {
                $query->where('r.status', $params['status']);
            }
        }

        if (!empty($params['date'])) {
            $query->where('DATE(r.reservation_time)', $params['date']);
        }

        $list = $query->select();

        return $list ? $list->toArray() : [];
    }

    public static function create(array $data, string $storeId, string $operatorId = ''): array
    {
        if (empty($data['customer_name'])) {
            return ['error' => '客户姓名不能为空'];
        }
        if (empty($data['customer_phone'])) {
            return ['error' => '联系电话不能为空'];
        }
        if (empty($data['reservation_time'])) {
            return ['error' => '预约时间不能为空'];
        }

        try {
            $reservation = new Reservation();
            $reservation->id = 'res_' . bin2hex(random_bytes(8));
            $reservation->store_id = $storeId;
            $reservation->table_id = $data['table_id'] ?? '';
            $reservation->customer_name = $data['customer_name'];
            $reservation->customer_phone = $data['customer_phone'];
            $reservation->customer_count = (int)($data['customer_count'] ?? 1);
            $reservation->reservation_time = $data['reservation_time'];
            $reservation->duration = (int)($data['duration'] ?? 120);
            $reservation->source = $data['source'] ?? 'phone';
            $reservation->status = 'pending';
            $reservation->remark = $data['remark'] ?? '';
            $reservation->operator_id = $operatorId;
            $reservation->save();

            return [
                'id' => $reservation->id,
                'status' => 'pending',
            ];
        } catch (\Exception $e) {
            \think\facade\Log::error('Reservation create error: ' . $e->getMessage());
            return ['error' => '创建预约失败'];
        }
    }

    public static function cancel(string $id, string $storeId): array
    {
        $reservation = Reservation::where('id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$reservation) {
            return ['error' => '预约不存在'];
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            return ['error' => '当前状态不允许取消'];
        }

        $reservation->status = 'cancelled';
        $reservation->save();

        return ['success' => true];
    }

    public static function checkIn(string $id, string $storeId): array
    {
        $reservation = Reservation::where('id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$reservation) {
            return ['error' => '预约不存在'];
        }

        if (!in_array($reservation->status, ['pending', 'confirmed'])) {
            return ['error' => '当前状态不允许到店'];
        }

        $reservation->status = 'checked_in';
        $reservation->save();

        return [
            'success' => true,
            'table_id' => $reservation->table_id,
            'customer_name' => $reservation->customer_name,
        ];
    }

    public static function confirm(string $id, string $storeId): array
    {
        $reservation = Reservation::where('id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$reservation) {
            return ['error' => '预约不存在'];
        }

        if ($reservation->status != 'pending') {
            return ['error' => '当前状态不允许确认'];
        }

        $reservation->status = 'confirmed';
        $reservation->save();

        return ['success' => true];
    }
}
