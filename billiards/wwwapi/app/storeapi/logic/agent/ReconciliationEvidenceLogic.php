<?php

declare(strict_types=1);

namespace app\storeapi\logic\agent;

use stdClass;
use think\exception\HttpException;
use think\exception\HttpResponseException;
use think\facade\Db;

class ReconciliationEvidenceLogic
{
    private const ROW_LIMIT = 1000;

    private const SNAPSHOT_FIELDS = [
        'total_revenue', 'order_count', 'cash_paid', 'wechat_paid', 'balance_paid',
        'table_revenue', 'product_revenue', 'assistant_revenue', 'open_table_count', 'recharge_total',
    ];

    private const ORDER_FIELDS = [
        'id', 'store_id', 'order_no', 'type', 'status', 'member_id', 'table_id', 'assistant_id',
        'original_amount', 'discount_amount', 'final_amount', 'balance_paid', 'cash_paid',
        'wechat_paid', 'alipay_paid', 'card_paid', 'points_deduct', 'points_gained',
        'start_time', 'end_time', 'duration_minutes', 'operator_id', 'merged_to_order_id',
        'created_at', 'table_fee', 'product_fee', 'assistant_fee',
    ];

    private const PAYMENT_FIELDS = [
        'id', 'order_id', 'store_id', 'order_no', 'payment_method', 'channel', 'order_item_id',
        'amount', 'status', 'paid_at', 'operator_id', 'created_at',
    ];

    private const RECHARGE_FIELDS = [
        'id', 'member_id', 'store_id', 'order_no', 'amount', 'gift_amount', 'payment_method',
        'balance_before', 'balance_after', 'points_before', 'points_after', 'gift_points',
        'operator_id', 'created_at', 'status',
    ];

    private const CASH_FLOW_FIELDS = [
        'id', 'store_id', 'order_id', 'order_no', 'type', 'category', 'amount', 'payment_method',
        'balance_before', 'balance_after', 'operator_id', 'created_at',
    ];

    public static function getShiftEvidence(string $shiftId, string $storeId): array
    {
        $shiftFields = array_merge(['id', 'store_id', 'employee_id', 'status', 'check_in_time', 'check_out_time'], self::SNAPSHOT_FIELDS);
        $shift = Db::name('busi_employee_attendance')
            ->where('id', $shiftId)
            ->where('store_id', $storeId)
            ->field(implode(',', $shiftFields))
            ->find();

        if (!$shift) {
            throw new HttpException(404, '班次不存在');
        }

        if ($shift['status'] === 'checked_in'
            || $shift['check_in_time'] === null
            || $shift['check_out_time'] === null
            || $shift['check_out_time'] < $shift['check_in_time']
        ) {
            throw new HttpResponseException(json([
                'code' => 'invalid_shift_window',
                'message' => 'Shift window must be complete and chronological',
            ], 422));
        }

        $checkInTime = (string)$shift['check_in_time'];
        $checkOutTime = (string)$shift['check_out_time'];
        $employeeId = (string)$shift['employee_id'];

        $orders = Db::name('busi_order')
            ->where('store_id', $storeId)
            ->where('operator_id', $employeeId)
            ->where('status', 'completed')
            ->where('end_time', '>=', $checkInTime)
            ->where('end_time', '<=', $checkOutTime)
            ->field(implode(',', self::ORDER_FIELDS))
            ->order('end_time', 'asc')
            ->order('id', 'asc')
            ->limit(self::ROW_LIMIT + 1)
            ->select()
            ->toArray();
        self::rejectOversized($orders, 'orders');

        $paymentFields = implode(',', array_map(static fn(string $field): string => 'p.' . $field, self::PAYMENT_FIELDS));
        $payments = Db::name('busi_order_payment')->alias('p')
            ->join('bi_busi_order o', 'p.order_id = o.id')
            ->where('p.store_id', $storeId)
            ->where('o.store_id', $storeId)
            ->where('o.operator_id', $employeeId)
            ->where('o.status', 'completed')
            ->where('o.end_time', '>=', $checkInTime)
            ->where('o.end_time', '<=', $checkOutTime)
            ->where(function ($query) use ($checkInTime, $checkOutTime) {
                $query->whereNull('p.paid_at')
                    ->whereOr(function ($query) use ($checkInTime, $checkOutTime) {
                        $query->where('p.paid_at', '>=', $checkInTime)
                            ->where('p.paid_at', '<=', $checkOutTime);
                    });
            })
            ->field($paymentFields)
            ->order('p.paid_at', 'asc')
            ->order('p.order_item_id', 'asc')
            ->order('p.id', 'asc')
            ->limit(self::ROW_LIMIT + 1)
            ->select()
            ->toArray();
        self::rejectOversized($payments, 'payments');

        $recharges = Db::name('busi_member_recharge')
            ->where('store_id', $storeId)
            ->where('operator_id', $employeeId)
            ->where('created_at', '>=', $checkInTime)
            ->where('created_at', '<=', $checkOutTime)
            ->field(implode(',', self::RECHARGE_FIELDS))
            ->order('created_at', 'asc')
            ->order('id', 'asc')
            ->limit(self::ROW_LIMIT + 1)
            ->select()
            ->toArray();
        self::rejectOversized($recharges, 'recharges');

        $cashFlows = Db::name('busi_cash_flow')
            ->where('store_id', $storeId)
            ->where('operator_id', $employeeId)
            ->where('created_at', '>=', $checkInTime)
            ->where('created_at', '<=', $checkOutTime)
            ->field(implode(',', self::CASH_FLOW_FIELDS))
            ->order('created_at', 'asc')
            ->order('id', 'asc')
            ->limit(self::ROW_LIMIT + 1)
            ->select()
            ->toArray();
        self::rejectOversized($cashFlows, 'cash_flows');

        [$orders, $merges, $exclusions] = self::resolveMerges($orders, $checkInTime, $checkOutTime);
        foreach ($payments as &$payment) {
            if ($payment['order_item_id'] === null) {
                $payment['classification'] = 'order';
            } elseif ($payment['order_item_id'] === '') {
                $payment['classification'] = 'unknown';
                $exclusions[] = [
                    'type' => 'payment_classification_excluded',
                    'payment_id' => $payment['id'],
                    'order_id' => $payment['order_id'],
                    'reason' => 'invalid_order_item_id',
                    'attribution' => 'unknown',
                ];
            } else {
                $payment['classification'] = 'item';
            }
            $payment['paid_at_status'] = $payment['paid_at'] === null ? 'unknown' : 'known';
            $payment['merge'] = $merges[$payment['order_id']] ?? self::noMerge();
            if ($payment['paid_at'] === null) {
                $exclusions[] = [
                    'type' => 'payment_time_excluded',
                    'payment_id' => $payment['id'],
                    'order_id' => $payment['order_id'],
                    'reason' => 'paid_at_missing',
                    'attribution' => 'unknown',
                ];
            }
        }
        unset($payment);

        $snapshot = [];
        $snapshotFieldsPresent = [];
        foreach (self::SNAPSHOT_FIELDS as $field) {
            if ($shift[$field] !== null) {
                $snapshot[$field] = $shift[$field];
                $snapshotFieldsPresent[] = $field;
            }
        }

        return [
            'schema_version' => 'reconciliation-evidence/v1',
            'shift' => [
                'id' => $shift['id'],
                'store_id' => $shift['store_id'],
                'employee_id' => $shift['employee_id'],
                'status' => $shift['status'],
                'check_in_time' => $shift['check_in_time'],
                'check_out_time' => $shift['check_out_time'],
                'snapshot' => (object)$snapshot,
                'snapshot_fields_present' => $snapshotFieldsPresent,
            ],
            'orders' => $orders,
            'payments' => $payments,
            'recharges' => $recharges,
            'cash_flows' => $cashFlows,
            'exclusions' => $exclusions,
            'meta' => [
                'generated_at' => gmdate('Y-m-d\TH:i:s\Z'),
                'limits' => self::ROW_LIMIT,
                'truncated' => false,
                'code_version' => self::resolveCodeVersion(),
            ],
        ];
    }

    private static function resolveCodeVersion(): string
    {
        $gitSha = getenv('GIT_SHA');
        if ($gitSha !== false) {
            $gitSha = strtolower(trim($gitSha));
            if (preg_match('/^[0-9a-f]{40}$/', $gitSha)) {
                return $gitSha;
            }
            throw new HttpResponseException(json([
                'message' => 'GIT_SHA must be a full Git commit SHA',
            ], 503));
        }

        $projectRoot = dirname(app()->getRootPath(), 2);
        if (!is_dir($projectRoot . DIRECTORY_SEPARATOR . '.git') && !is_file($projectRoot . DIRECTORY_SEPARATOR . '.git')) {
            throw new HttpException(503, 'Git metadata unavailable; configure GIT_SHA');
        }

        $gitSha = strtolower(trim((string)shell_exec('git -C ' . escapeshellarg($projectRoot) . ' rev-parse HEAD')));
        if (!preg_match('/^[0-9a-f]{40}$/', $gitSha)) {
            throw new HttpException(503, 'Unable to resolve Git HEAD; configure GIT_SHA');
        }

        return $gitSha;
    }

    private static function rejectOversized(array $rows, string $category): void
    {
        if (count($rows) > self::ROW_LIMIT) {
            throw new HttpResponseException(json([
                'code' => 'evidence_too_large',
                'message' => $category . ' exceeds 1000 rows',
            ], 422));
        }
    }

    private static function resolveMerges(array $orders, string $checkInTime, string $checkOutTime): array
    {
        $parentIds = [];
        foreach ($orders as $order) {
            if (!empty($order['merged_to_order_id'])) {
                $parentIds[] = $order['merged_to_order_id'];
            }
        }

        $parents = [];
        if ($parentIds !== []) {
            $parentRows = Db::name('busi_order')
                ->whereIn('id', array_values(array_unique($parentIds)))
                ->field('id,store_id,operator_id,status,end_time')
                ->select()
                ->toArray();
            $parents = array_column($parentRows, null, 'id');
        }

        $merges = [];
        $exclusions = [];
        foreach ($orders as &$order) {
            [$merge, $reason] = self::resolveMerge($order, $parents, $checkInTime, $checkOutTime);
            $order['merge'] = $merge;
            $merges[$order['id']] = $merge;
            if ($reason !== null) {
                $exclusions[] = [
                    'type' => 'merge_excluded',
                    'order_id' => $order['id'],
                    'parent_order_id' => $merge['parent_order_id'],
                    'reason' => $reason,
                    'attribution' => 'unknown',
                ];
            }
        }
        unset($order);

        return [$orders, $merges, $exclusions];
    }

    private static function resolveMerge(array $order, array $parents, string $checkInTime, string $checkOutTime): array
    {
        $parentId = $order['merged_to_order_id'] ?? null;
        if ($parentId === null || $parentId === '') {
            return [self::noMerge(), null];
        }

        $parent = $parents[$parentId] ?? null;
        if ($parent
            && $parent['id'] !== $order['id']
            && $parent['store_id'] === $order['store_id']
            && $parent['operator_id'] === $order['operator_id']
            && $parent['status'] === 'completed'
            && $parent['end_time'] !== null
            && $parent['end_time'] >= $checkInTime
            && $parent['end_time'] <= $checkOutTime
        ) {
            return [[
                'state' => 'same_shift',
                'parent_order_id' => $parentId,
                'attribution' => 'parent',
            ], null];
        }

        $reason = 'unresolved_parent_merge';
        if ($parent) {
            if ($parent['store_id'] !== $order['store_id']) {
                $reason = 'cross_store_merge';
            } elseif ($parent['operator_id'] !== $order['operator_id']) {
                $reason = 'cross_operator_merge';
            } elseif ($parent['end_time'] === null || $parent['end_time'] < $checkInTime || $parent['end_time'] > $checkOutTime) {
                $reason = 'cross_shift_merge';
            } else {
                $reason = 'ambiguous_merge';
            }
        }

        return [[
            'state' => 'unknown',
            'parent_order_id' => $parentId,
            'attribution' => 'unknown',
        ], $reason];
    }

    private static function noMerge(): array
    {
        return [
            'state' => 'none',
            'parent_order_id' => null,
            'attribution' => 'self',
        ];
    }
}
