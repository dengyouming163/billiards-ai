<?php

declare (strict_types=1);

namespace app\storeapi\logic\member;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Member;
use app\common\model\merchant\MemberLevel;
use app\common\model\merchant\MemberRecharge;
use app\common\model\merchant\MemberConsume;
use app\common\model\merchant\CashFlow;
use think\db\exception\DbException;

class MemberLogic extends BaseLogic
{
    private static function formatMember(array &$item)
    {
        $item['cardNumber'] = $item['card_number'] ?? '';
        $item['totalConsume'] = $item['total_consume'] ?? 0;
        $item['totalRecharge'] = $item['total_recharge'] ?? 0;
        $item['lastConsumeAt'] = $item['last_consume_time'] ?? null;
        $item['createdAt'] = $item['created_at'] ?? '';
        $item['levelName'] = $item['level']['name'] ?? '';
        $item['levelCode'] = $item['level']['code'] ?? '';
        $item['levelColor'] = $item['level']['color'] ?? '#94a3b8';
        $item['levelDiscount'] = $item['level']['discount_rate'] ?? 100;
        $item['levelPointsRate'] = $item['level']['points_multiplier'] ?? 1;
        $item['level'] = $item['levelCode'];

        $statusMap = ['0' => 'frozen', '1' => 'active', '2' => 'expired'];
        $item['status'] = $statusMap[(string)$item['status']] ?? 'active';

        unset($item['card_number'], $item['total_consume'], $item['total_recharge']);
        unset($item['last_consume_time'], $item['created_at']);
    }

    public static function getList(array $params, string $storeId)
    {
        try {
            $query = Member::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->with(['level' => function ($query) {
                    $query->field('id, name, code, color, discount_rate, points_multiplier');
                }]);

            if (!empty($params['level_id'])) {
                $query->where('level_id', $params['level_id']);
            }
            if (isset($params['status'])) {
                $query->where('status', $params['status']);
            }
            if (!empty($params['keyword'])) {
                $keyword = strtolower($params['keyword']);
                $query->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%")
                      ->whereOr('phone', 'like', "%{$keyword}%")
                      ->whereOr('card_number', 'like', "%{$keyword}%");
                });
            }
            if (!empty($params['start_date'])) {
                $query->where('created_at', '>=', $params['start_date']);
            }
            if (!empty($params['end_date'])) {
                $query->where('created_at', '<=', $params['end_date']);
            }

            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);

            $total = $query->count();
            $data = $query->order('created_at', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            foreach ($data as &$item) {
                self::formatMember($item);
            }

            return [
                'data' => $data,
                'pagination' => [
                    'page' => (int)$page,
                    'page_size' => (int)$pageSize,
                    'total' => $total,
                    'total_pages' => ceil($total / $pageSize),
                ],
            ];
        } catch (DbException $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getDetail(string $id, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->with(['level' => function ($query) {
                    $query->field('id, name, code, color, discount_rate, points_multiplier, description, min_amount, min_points');
                }])
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $data = $member->toArray();
            self::formatMember($data);

            $data['levelDescription'] = $data['level']['description'] ?? '';
            $data['levelMinAmount'] = $data['level']['min_amount'] ?? 0;
            $data['levelMinPoints'] = $data['level']['min_points'] ?? 0;

            return $data;
        } catch (DbException $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function create(array $params, string $storeId)
    {
        try {
            $cardNumber = $params['card_number'] ?? '';
            if (empty($cardNumber)) {
                $cardNumber = '88' . substr((string)time(), -8) . str_pad((string)mt_rand(0, 99), 2, '0', STR_PAD_LEFT);
            }

            $member = Member::create([
                'id' => 'mem-' . date('YmdHis') . rand(1000, 9999),
                'store_id' => $storeId,
                'level_id' => $params['level_id'] ?? 'level_normal',
                'name' => $params['name'],
                'phone' => $params['phone'],
                'gender' => $params['gender'] ?? 'unknown',
                'card_number' => $cardNumber,
                'balance' => $params['balance'] ?? 0,
                'points' => $params['points'] ?? 0,
                'birthday' => $params['birthday'] ?? null,
                'remark' => $params['remark'] ?? '',
                'status' => 1,
            ]);

            return $member->toArray();
        } catch (DbException $e) {
            self::setError('创建会员失败：' . $e->getMessage());
            return false;
        }
    }

    public static function update(string $id, array $params, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $updateData = [];
            if (isset($params['name'])) $updateData['name'] = $params['name'];
            if (isset($params['phone'])) $updateData['phone'] = $params['phone'];
            if (isset($params['gender'])) $updateData['gender'] = $params['gender'];
            if (isset($params['birthday'])) $updateData['birthday'] = $params['birthday'];
            if (isset($params['remark'])) $updateData['remark'] = $params['remark'];
            if (isset($params['status'])) $updateData['status'] = $params['status'];
            if (isset($params['level_id'])) $updateData['level_id'] = $params['level_id'];

            if (!empty($updateData)) {
                $member->update_time = date('Y-m-d H:i:s');
                $member->save($updateData);
            }

            return $member->toArray();
        } catch (DbException $e) {
            self::setError('更新会员失败：' . $e->getMessage());
            return false;
        }
    }

    public static function delete(string $id, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $member->deleted_at = date('Y-m-d H:i:s');
            $member->save();

            return true;
        } catch (DbException $e) {
            self::setError('删除会员失败：' . $e->getMessage());
            return false;
        }
    }

    public static function recharge(string $id, array $params, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $amount = floatval($params['amount'] ?? 0);
            if ($amount <= 0) {
                self::setError('充值金额必须大于0');
                return false;
            }

            if ($amount > 50000) {
                self::setError('单次充值不能超过 ¥50,000');
                return false;
            }

            $giftAmount = floatval($params['gift_amount'] ?? 0);
            $giftPoints = intval($params['gift_points'] ?? 0);
            $paymentMethod = $params['payment_method'] ?? 'cash';

            $balanceBefore = $member->balance;
            $pointsBefore = $member->points;

            $member->balance = $balanceBefore + $amount + $giftAmount;
            $member->points = $pointsBefore + $giftPoints + intval($amount);
            $member->total_recharge = $member->total_recharge + $amount + $giftAmount;
            $member->update_time = date('Y-m-d H:i:s');
            $member->save();

            $record = MemberRecharge::create([
                'id' => 'rch-' . date('YmdHis') . rand(1000, 9999),
                'member_id' => $id,
                'store_id' => $storeId,
                'order_no' => 'CZ' . date('YmdHis') . rand(1000, 9999),
                'amount' => $amount,
                'gift_amount' => $giftAmount,
                'gift_points' => $giftPoints,
                'payment_method' => $paymentMethod,
                'balance_before' => $balanceBefore,
                'balance_after' => $member->balance,
                'points_before' => $pointsBefore,
                'points_after' => $member->points,
                'operator_id' => $params['operator_id'] ?? '',
                'operator_name' => $params['operator_name'] ?? '',
                'remark' => $params['remark'] ?? '',
            ]);

            // 写现金流
            CashFlow::create([
                'id'              => 'cf-' . date('YmdHis') . rand(1000, 9999),
                'store_id'        => $storeId,
                'order_id'        => $record->id,
                'order_no'        => $record->order_no,
                'type'            => CashFlow::TYPE_INCOME,
                'category'        => CashFlow::CATEGORY_MEMBER_RECHARGE,
                'amount'          => $amount + $giftAmount,
                'payment_method'  => $paymentMethod,
                'balance_before'  => $balanceBefore,
                'balance_after'   => $member->balance,
                'description'     => '会员' . ($paymentMethod === 'cash' ? '现金' : ($paymentMethod === 'wechat' ? '微信' : '线上')) . '充值',
                'operator_id'     => $params['operator_id'] ?? '',
                'operator_name'   => $params['operator_name'] ?? '',
            ]);

            self::checkLevelUpgrade($id, $storeId);

            return [
                'balance' => $member->balance,
                'points' => $member->points,
                'record' => $record->toArray(),
                'receipt' => [
                    'member_name'    => $member->name,
                    'member_phone'   => $member->phone,
                    'amount'         => $amount,
                    'gift_amount'    => $giftAmount,
                    'gift_points'    => $giftPoints,
                    'payment_method' => $paymentMethod,
                    'balance_before' => $balanceBefore,
                    'balance_after'  => $member->balance,
                    'order_no'       => $record->order_no,
                    'created_at'     => $record->created_at,
                ],
            ];
        } catch (DbException $e) {
            self::setError('充值失败：' . $e->getMessage());
            return false;
        }
    }

    /**
     * 现金录单充值 — 确认收款后更新余额并写账单
     */
    public static function rechargeCash(string $id, array $params, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $amount = floatval($params['amount'] ?? 0);
            if ($amount <= 0) {
                self::setError('充值金额必须大于0');
                return false;
            }

            if ($amount > 50000) {
                self::setError('单次充值不能超过 ¥50,000');
                return false;
            }

            $giftAmount = floatval($params['gift_amount'] ?? 0);
            $giftPoints = intval($params['gift_points'] ?? 0);

            $balanceBefore = $member->balance;
            $pointsBefore = $member->points;
            $totalAdd = $amount + $giftAmount;

            $member->balance = $balanceBefore + $totalAdd;
            $member->points = $pointsBefore + $giftPoints + intval($amount);
            $member->total_recharge = $member->total_recharge + $totalAdd;
            $member->update_time = date('Y-m-d H:i:s');
            $member->save();

            $recordId = 'rch-' . date('YmdHis') . rand(1000, 9999);
            $orderNo = 'CZ' . date('YmdHis') . rand(1000, 9999);

            $record = MemberRecharge::create([
                'id'              => $recordId,
                'member_id'       => $id,
                'store_id'        => $storeId,
                'order_no'        => $orderNo,
                'amount'          => $amount,
                'gift_amount'     => $giftAmount,
                'gift_points'     => $giftPoints,
                'payment_method'  => 'cash',
                'balance_before'  => $balanceBefore,
                'balance_after'   => $member->balance,
                'points_before'   => $pointsBefore,
                'points_after'    => $member->points,
                'operator_id'     => $params['operator_id'] ?? '',
                'operator_name'   => $params['operator_name'] ?? '',
                'remark'          => $params['remark'] ?? '',
            ]);

            // 写现金流水
            CashFlow::create([
                'id'              => 'cf-' . date('YmdHis') . rand(1000, 9999),
                'store_id'        => $storeId,
                'order_id'        => $recordId,
                'order_no'        => $orderNo,
                'type'            => CashFlow::TYPE_INCOME,
                'category'        => CashFlow::CATEGORY_MEMBER_RECHARGE,
                'amount'          => $totalAdd,
                'payment_method'  => 'cash',
                'balance_before'  => $balanceBefore,
                'balance_after'   => $member->balance,
                'description'     => '会员现金充值',
                'operator_id'     => $params['operator_id'] ?? '',
                'operator_name'   => $params['operator_name'] ?? '',
            ]);

            self::checkLevelUpgrade($id, $storeId);

            return [
                'balance'  => $member->balance,
                'points'   => $member->points,
                'record'   => $record->toArray(),
                'receipt'  => [
                    'member_name'    => $member->name,
                    'member_phone'   => $member->phone,
                    'amount'         => $amount,
                    'gift_amount'    => $giftAmount,
                    'gift_points'    => $giftPoints,
                    'payment_method' => 'cash',
                    'balance_before' => $balanceBefore,
                    'balance_after'  => $member->balance,
                    'order_no'       => $orderNo,
                    'created_at'     => $record->created_at,
                ],
            ];
        } catch (DbException $e) {
            self::setError('充值失败：' . $e->getMessage());
            return false;
        }
    }

    /**
     * 充值锁价 — 生成 token 锁定充值金额 120 秒
     */
    public static function prepareRecharge(string $memberId, string $storeId, float $amount): array|false
    {
        try {
            $member = Member::where('id', $memberId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            if ($amount <= 0) {
                self::setError('充值金额必须大于0');
                return false;
            }

            $token = md5(uniqid('recharge_', true));
            $cacheKey = 'recharge_prepare_' . $token;

            \think\facade\Cache::set($cacheKey, [
                'member_id'  => $memberId,
                'store_id'   => $storeId,
                'amount'     => $amount,
                'created_at' => time(),
            ], 120);

            return [
                'token'   => $token,
                'amount'  => $amount,
                'member'  => [
                    'id'    => $member->id,
                    'name'  => $member->name,
                    'phone' => $member->phone,
                ],
            ];
        } catch (DbException $e) {
            self::setError('锁定失败：' . $e->getMessage());
            return false;
        }
    }

    /**
     * 微信扫码充值 — 验证 token + 调用 micropay + 写完整账单
     */
    public static function rechargeWechat(string $memberId, array $params, string $storeId): array|false
    {
        try {
            $token = $params['token'] ?? '';
            $authCode = $params['auth_code'] ?? '';

            if (empty($token) || empty($authCode)) {
                self::setError('参数不完整');
                return false;
            }

            // 1. 验证 token
            $cacheKey = 'recharge_prepare_' . $token;
            $cache = \think\facade\Cache::get($cacheKey);

            if (!$cache) {
                self::setError('支付令牌已过期，请重新发起充值');
                return false;
            }

            if ($cache['member_id'] !== $memberId || $cache['store_id'] !== $storeId) {
                self::setError('支付令牌校验失败');
                return false;
            }

            $amount = floatval($cache['amount']);
            $giftAmount = floatval($params['gift_amount'] ?? 0);
            $giftPoints = intval($params['gift_points'] ?? 0);

            if ($amount > 50000) {
                self::setError('单次充值不能超过 ¥50,000');
                return false;
            }

            // 2. 获取子商户号
            $subMchId = \think\facade\Db::name('wechat_applyment')
                ->where('store_id', $storeId)
                ->whereNotNull('sub_mchid')
                ->where('sub_mchid', '<>', '')
                ->order('id', 'desc')
                ->value('sub_mchid') ?? '';

            // 3. 生成订单号
            $orderNo = 'CZ' . date('YmdHis') . rand(1000, 9999);

            // 4. 调用微信扫码支付（金额单位：分）
            $wechatService = app(\app\common\service\pay\WechatPaymentService::class);
            $amountInFen = intval($amount * 100);

            $payResult = $wechatService->micropay(
                $orderNo,
                $authCode,
                $amountInFen,
                '会员充值',
                $subMchId
            );

            if (!$payResult || empty($payResult['success'])) {
                $errMsg = $payResult['error_msg'] ?? '微信支付失败';
                self::setError($errMsg);
                return false;
            }

            $transactionId = $payResult['transaction_id'];

            // 5. 支付成功 — 在事务中更新会员余额 + 写记录
            \think\facade\Db::transaction(function () use (
                $memberId, $storeId, $amount, $giftAmount, $giftPoints,
                $orderNo, $transactionId, $params, $cacheKey
            ) {
                $member = Member::where('id', $memberId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->lock(true)
                    ->find();

                if (!$member) {
                    throw new \think\db\exception\DbException('会员不存在或已删除');
                }

                $balanceBefore = $member->balance;
                $pointsBefore = $member->points;
                $totalAdd = $amount + $giftAmount;

                $member->balance = $balanceBefore + $totalAdd;
                $member->points = $pointsBefore + $giftPoints + intval($amount);
                $member->total_recharge = $member->total_recharge + $totalAdd;
                $member->update_time = date('Y-m-d H:i:s');
                $member->save();

                $recordId = 'rch-' . date('YmdHis') . rand(1000, 9999);

                $record = MemberRecharge::create([
                    'id'              => $recordId,
                    'member_id'       => $memberId,
                    'store_id'        => $storeId,
                    'order_no'        => $orderNo,
                    'amount'          => $amount,
                    'gift_amount'     => $giftAmount,
                    'gift_points'     => $giftPoints,
                    'payment_method'  => 'wechat',
                    'transaction_no'  => $transactionId,
                    'balance_before'  => $balanceBefore,
                    'balance_after'   => $member->balance,
                    'points_before'   => $pointsBefore,
                    'points_after'    => $member->points,
                    'operator_id'     => $params['operator_id'] ?? '',
                    'operator_name'   => $params['operator_name'] ?? '',
                    'remark'          => $params['remark'] ?? '',
                ]);

                CashFlow::create([
                    'id'              => 'cf-' . date('YmdHis') . rand(1000, 9999),
                    'store_id'        => $storeId,
                    'order_id'        => $recordId,
                    'order_no'        => $orderNo,
                    'type'            => CashFlow::TYPE_INCOME,
                    'category'        => CashFlow::CATEGORY_MEMBER_RECHARGE,
                    'amount'          => $totalAdd,
                    'payment_method'  => 'wechat',
                    'balance_before'  => $balanceBefore,
                    'balance_after'   => $member->balance,
                    'description'     => '会员微信充值',
                    'operator_id'     => $params['operator_id'] ?? '',
                    'operator_name'   => $params['operator_name'] ?? '',
                ]);

                $amountInFen = intval(round($amount * 100));
                \think\facade\Db::name('payment_records')->insert([
                    'id'                => 'pay-' . date('YmdHis') . rand(1000, 9999),
                    'order_id'          => $recordId,
                    'payment_id'        => $transactionId,
                    'request_id'        => $orderNo,
                    'channel'           => 'wechat',
                    'amount'            => $amountInFen,
                    'status'            => 'paid',
                    'channel_trade_no'  => $transactionId,
                    'paid_amount'       => $amountInFen,
                    'created_at'        => date('Y-m-d H:i:s'),
                    'updated_at'        => date('Y-m-d H:i:s'),
                ]);

                \think\facade\Cache::delete($cacheKey);

                self::checkLevelUpgrade($memberId, $storeId);

                // Return via closure — store results for use after transaction
            });

            // Re-fetch for return values
            $member = Member::where('id', $memberId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            return [
                'success'       => true,
                'trade_no'      => $transactionId,
                'balance'       => $member->balance ?? 0,
                'points'        => $member->points ?? 0,
                'receipt'       => [
                    'member_name'    => $member->name ?? '',
                    'member_phone'   => $member->phone ?? '',
                    'amount'         => $amount,
                    'gift_amount'    => $giftAmount,
                    'gift_points'    => $giftPoints,
                    'payment_method' => 'wechat',
                    'balance_before' => ($member->balance ?? 0) - ($amount + $giftAmount),
                    'balance_after'  => $member->balance ?? 0,
                    'order_no'       => $orderNo,
                    'created_at'     => date('Y-m-d H:i:s'),
                ],
            ];
        } catch (DbException $e) {
            self::setError('充值失败：' . $e->getMessage());
            return false;
        } catch (\Throwable $e) {
            self::setError('支付异常：' . $e->getMessage());
            return false;
        }
    }

    /**
     * 余额调整 — 手动加减会员余额（补偿/扣减/修正）
     */
    public static function adjustBalance(string $id, array $params, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $adjustAmount = floatval($params['amount'] ?? 0);
            if ($adjustAmount == 0) {
                self::setError('调整金额不能为0');
                return false;
            }

            $remark = trim($params['remark'] ?? '');
            if (empty($remark)) {
                self::setError('请输入调整原因');
                return false;
            }

            $balanceBefore = $member->balance;
            $member->balance = $balanceBefore + $adjustAmount;
            $member->update_time = date('Y-m-d H:i:s');
            $member->save();

            $recordId = 'adj-' . date('YmdHis') . rand(1000, 9999);
            $orderNo = 'TZ' . date('YmdHis') . rand(1000, 9999);

            // 写调整记录
            MemberRecharge::create([
                'id'              => $recordId,
                'member_id'       => $id,
                'store_id'        => $storeId,
                'order_no'        => $orderNo,
                'amount'          => $adjustAmount,
                'gift_amount'     => 0,
                'gift_points'     => 0,
                'payment_method'  => 'adjustment',
                'balance_before'  => $balanceBefore,
                'balance_after'   => $member->balance,
                'points_before'   => $member->points,
                'points_after'    => $member->points,
                'operator_id'     => $params['operator_id'] ?? '',
                'operator_name'   => $params['operator_name'] ?? '',
                'remark'          => $remark,
            ]);

            // 写现金流（收入或支出，取决于正负）
            $flowType = $adjustAmount > 0 ? CashFlow::TYPE_INCOME : CashFlow::TYPE_EXPENSE;
            CashFlow::create([
                'id'              => 'cf-' . date('YmdHis') . rand(1000, 9999),
                'store_id'        => $storeId,
                'order_id'        => $recordId,
                'order_no'        => $orderNo,
                'type'            => $flowType,
                'category'        => CashFlow::CATEGORY_BALANCE_ADJUSTMENT,
                'amount'          => abs($adjustAmount),
                'payment_method'  => 'adjustment',
                'balance_before'  => $balanceBefore,
                'balance_after'   => $member->balance,
                'description'     => '余额调整：' . $remark,
                'operator_id'     => $params['operator_id'] ?? '',
                'operator_name'   => $params['operator_name'] ?? '',
            ]);

            return [
                'balance'        => $member->balance,
                'balance_before' => $balanceBefore,
                'balance_after'  => $member->balance,
            ];
        } catch (DbException $e) {
            self::setError('调整失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getRecharges(string $id, string $storeId, array $params = [])
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $query = MemberRecharge::where('member_id', $id)
                ->where('store_id', $storeId);

            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);

            $total = $query->count();
            $data = $query->order('created_at', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            return [
                'data' => $data,
                'pagination' => [
                    'page' => (int)$page,
                    'page_size' => (int)$pageSize,
                    'total' => $total,
                    'total_pages' => ceil($total / $pageSize),
                ],
            ];
        } catch (DbException $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getConsumes(string $id, string $storeId, array $params = [])
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $query = MemberConsume::where('member_id', $id)
                ->where('store_id', $storeId);

            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);

            $total = $query->count();
            $data = $query->order('created_at', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            return [
                'data' => $data,
                'pagination' => [
                    'page' => (int)$page,
                    'page_size' => (int)$pageSize,
                    'total' => $total,
                    'total_pages' => ceil($total / $pageSize),
                ],
            ];
        } catch (DbException $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function pointsExchange(string $id, array $params, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $points = intval($params['points'] ?? 0);
            if ($points <= 0) {
                self::setError('兑换积分必须大于0');
                return false;
            }

            if ($member->points < $points) {
                self::setError('积分不足，当前积分：' . $member->points);
                return false;
            }

            $exchangeAmount = floor($points / 100);
            if ($exchangeAmount <= 0) {
                self::setError('100积分可兑换1元，请兑换足够积分');
                return false;
            }

            $balanceBefore = $member->balance;
            $pointsBefore = $member->points;

            $member->balance = $balanceBefore + $exchangeAmount;
            $member->points = $pointsBefore - $points;
            $member->update_time = date('Y-m-d H:i:s');
            $member->save();

            MemberConsume::create([
                'id' => 'csm-' . date('YmdHis') . rand(1000, 9999),
                'member_id' => $id,
                'store_id' => $storeId,
                'amount' => -$exchangeAmount,
                'points_gained' => 0,
                'points_deduct' => $points,
                'balance_deduct' => 0,
                'discount_amount' => 0,
                'consume_type' => 'points_exchange',
                'balance_before' => $balanceBefore,
                'balance_after' => $member->balance,
                'points_before' => $pointsBefore,
                'points_after' => $member->points,
                'operator_id' => $params['operator_id'] ?? '',
                'operator_name' => $params['operator_name'] ?? '',
                'remark' => '积分兑换余额',
            ]);

            return [
                'balance' => $member->balance,
                'points' => $member->points,
            ];
        } catch (DbException $e) {
            self::setError('积分兑换失败：' . $e->getMessage());
            return false;
        }
    }

    public static function pointsAdjust(string $id, array $params, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $points = intval($params['points'] ?? 0);
            $type = $params['type'] ?? 'add';
            $reason = $params['reason'] ?? '';

            if ($points <= 0) {
                self::setError('调整积分必须大于0');
                return false;
            }

            $balanceBefore = $member->balance;
            $pointsBefore = $member->points;

            if ($type === 'add') {
                $member->points = $pointsBefore + $points;
            } else {
                if ($member->points < $points) {
                    self::setError('积分不足，当前积分：' . $member->points);
                    return false;
                }
                $member->points = $pointsBefore - $points;
            }

            $member->update_time = date('Y-m-d H:i:s');
            $member->save();

            MemberConsume::create([
                'id' => 'csm-' . date('YmdHis') . rand(1000, 9999),
                'member_id' => $id,
                'store_id' => $storeId,
                'amount' => 0,
                'points_gained' => $type === 'add' ? $points : 0,
                'points_deduct' => $type === 'reduce' ? $points : 0,
                'balance_deduct' => 0,
                'discount_amount' => 0,
                'consume_type' => 'points_adjust',
                'balance_before' => $balanceBefore,
                'balance_after' => $member->balance,
                'points_before' => $pointsBefore,
                'points_after' => $member->points,
                'operator_id' => $params['operator_id'] ?? '',
                'operator_name' => $params['operator_name'] ?? '',
                'remark' => ($type === 'add' ? '增加' : '扣除') . "积分：{$points}" . ($reason ? "，原因：{$reason}" : ''),
            ]);

            self::checkLevelUpgrade($id, $storeId);

            return [
                'balance' => $member->balance,
                'points' => $member->points,
            ];
        } catch (DbException $e) {
            self::setError('积分调整失败：' . $e->getMessage());
            return false;
        }
    }

    public static function checkLevelUpgrade(string $id, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->with('level')
                ->find();

            if (!$member) {
                return null;
            }

            $levels = MemberLevel::where('store_id', $storeId)
                ->where('status', 1)
                ->whereNull('deleted_at')
                ->order('sort_order', 'asc')
                ->select()
                ->toArray();

            $currentSort = 0;
            foreach ($levels as $level) {
                if ($level['id'] === $member->level_id) {
                    $currentSort = $level['sort_order'] ?? 0;
                    break;
                }
            }

            foreach ($levels as $level) {
                $levelSort = $level['sort_order'] ?? 0;
                if ($levelSort <= $currentSort) {
                    continue;
                }

                $minAmount = $level['min_amount'] ?? 0;
                $minPoints = $level['min_points'] ?? 0;

                if ($member->total_consume >= $minAmount || $member->total_points >= $minPoints) {
                    $member->level_id = $level['id'];
                    $member->update_time = date('Y-m-d H:i:s');
                    $member->save();

                    MemberConsume::create([
                        'id' => 'csm-' . date('YmdHis') . rand(1000, 9999),
                        'member_id' => $id,
                        'store_id' => $storeId,
                        'amount' => 0,
                        'points_gained' => 0,
                        'points_deduct' => 0,
                        'balance_deduct' => 0,
                        'discount_amount' => 0,
                        'consume_type' => 'level_up',
                        'balance_before' => $member->balance,
                        'balance_after' => $member->balance,
                        'points_before' => $member->points,
                        'points_after' => $member->points,
                        'remark' => '系统自动升级为' . $level['name'],
                    ]);

                    return [
                        'old_level' => $member->level->name ?? '',
                        'new_level' => $level['name'],
                    ];
                }
            }

            return null;
        } catch (DbException $e) {
            return null;
        }
    }

    public static function manualUpgrade(string $id, string $levelId, string $storeId)
    {
        try {
            $member = Member::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$member) {
                self::setError('会员不存在');
                return false;
            }

            $level = MemberLevel::where('id', $levelId)
                ->where('store_id', $storeId)
                ->where('status', 1)
                ->whereNull('deleted_at')
                ->find();

            if (!$level) {
                self::setError('等级不存在');
                return false;
            }

            $oldLevelId = $member->level_id;
            if ($oldLevelId === $levelId) {
                self::setError('会员已在该等级');
                return false;
            }

            $member->level_id = $levelId;
            $member->update_time = date('Y-m-d H:i:s');
            $member->save();

            MemberConsume::create([
                'id' => 'csm-' . date('YmdHis') . rand(1000, 9999),
                'member_id' => $id,
                'store_id' => $storeId,
                'amount' => 0,
                'points_gained' => 0,
                'points_deduct' => 0,
                'balance_deduct' => 0,
                'discount_amount' => 0,
                'consume_type' => 'level_up',
                'balance_before' => $member->balance,
                'balance_after' => $member->balance,
                'points_before' => $member->points,
                'points_after' => $member->points,
                'remark' => '手动升级为' . $level->name,
            ]);

            return [
                'old_level_id' => $oldLevelId,
                'new_level_id' => $levelId,
                'new_level_name' => $level->name,
            ];
        } catch (DbException $e) {
            self::setError('升级失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getStatistics(string $storeId)
    {
        try {
            $stats = [
                'total_member' => Member::where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->count(),
                'active_member' => Member::where('store_id', $storeId)
                    ->where('status', 1)
                    ->whereNull('deleted_at')
                    ->count(),
                'total_balance' => Member::where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->sum('balance') ?? 0,
                'total_points' => Member::where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->sum('points') ?? 0,
                'level_stats' => [],
            ];

            $levels = MemberLevel::where('store_id', $storeId)
                ->where('status', 1)
                ->whereNull('deleted_at')
                ->select()
                ->toArray();

            foreach ($levels as $level) {
                $count = Member::where('store_id', $storeId)
                    ->where('level_id', $level['id'])
                    ->whereNull('deleted_at')
                    ->count();

                $stats['level_stats'][] = [
                    'id' => $level['id'],
                    'name' => $level['name'],
                    'code' => $level['code'],
                    'color' => $level['color'],
                    'count' => $count,
                    'minAmount' => $level['min_amount'] ?? 0,
                    'minPoints' => $level['min_points'] ?? 0,
                    'benefits' => [],
                ];
            }

            return $stats;
        } catch (DbException $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function getLevels(string $storeId)
    {
        try {
            $levels = MemberLevel::where('store_id', $storeId)
                ->where('status', 1)
                ->whereNull('deleted_at')
                ->order('sort_order', 'asc')
                ->select()
                ->toArray();

            $result = [];
            foreach ($levels as $level) {
                $result[] = [
                    'id' => $level['id'],
                    'storeId' => $level['store_id'],
                    'level' => $level['code'],
                    'name' => $level['name'],
                    'discount' => $level['discount_rate'] / 100,
                    'pointsRate' => $level['points_multiplier'],
                    'benefits' => [],
                    'minAmount' => $level['min_amount'] ?? 0,
                    'minPoints' => $level['min_points'] ?? 0,
                    'status' => $level['status'] ? 'active' : 'inactive',
                ];
            }

            return $result;
        } catch (DbException $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function search(string $keyword, string $storeId)
    {
        try {
            $members = Member::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->with(['level' => function ($query) {
                    $query->field('id, name, code, color, discount_rate, points_multiplier');
                }])
                ->where(function ($query) use ($keyword) {
                    $query->where('name', 'like', "%{$keyword}%")
                        ->whereOr('phone', 'like', "%{$keyword}%")
                        ->whereOr('card_number', 'like', "%{$keyword}%");
                })
                ->limit(20)
                ->order('last_consume_time', 'desc')
                ->select()
                ->toArray();

            foreach ($members as &$item) {
                self::formatMember($item);
            }

            return $members;
        } catch (DbException $e) {
            self::setError('搜索失败：' . $e->getMessage());
            return false;
        }
    }

    public static function createLevel(array $params, string $storeId)
    {
        try {
            $level = MemberLevel::create([
                'id' => 'level_' . substr(strval(time()), -8) . rand(1000, 9999),
                'store_id' => $storeId,
                'name' => $params['name'],
                'code' => $params['code'] ?? 'custom_' . substr(strval(time()), -8),
                'color' => $params['color'] ?? '#94a3b8',
                'discount_rate' => $params['discount_rate'] ?? 100,
                'points_multiplier' => $params['points_multiplier'] ?? 1,
                'min_amount' => $params['min_amount'] ?? 0,
                'min_points' => $params['min_points'] ?? 0,
                'sort_order' => $params['sort_order'] ?? 0,
                'status' => 1,
                'description' => $params['description'] ?? '',
            ]);

            return $level->toArray();
        } catch (DbException $e) {
            self::setError('创建等级失败：' . $e->getMessage());
            return false;
        }
    }

    public static function updateLevel(string $id, array $params, string $storeId)
    {
        try {
            $level = MemberLevel::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$level) {
                self::setError('等级不存在');
                return false;
            }

            $updateData = [];
            if (isset($params['name'])) $updateData['name'] = $params['name'];
            if (isset($params['color'])) $updateData['color'] = $params['color'];
            if (isset($params['discount_rate'])) $updateData['discount_rate'] = $params['discount_rate'];
            if (isset($params['points_multiplier'])) $updateData['points_multiplier'] = $params['points_multiplier'];
            if (isset($params['min_amount'])) $updateData['min_amount'] = $params['min_amount'];
            if (isset($params['min_points'])) $updateData['min_points'] = $params['min_points'];
            if (isset($params['sort_order'])) $updateData['sort_order'] = $params['sort_order'];
            if (isset($params['status'])) $updateData['status'] = $params['status'];
            if (isset($params['description'])) $updateData['description'] = $params['description'];

            if (!empty($updateData)) {
                $level->updated_at = date('Y-m-d H:i:s');
                $level->save($updateData);
            }

            return $level->toArray();
        } catch (DbException $e) {
            self::setError('更新等级失败：' . $e->getMessage());
            return false;
        }
    }

    public static function deleteLevel(string $id, string $storeId)
    {
        try {
            $level = MemberLevel::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$level) {
                self::setError('等级不存在');
                return false;
            }

            $memberCount = Member::where('level_id', $id)
                ->whereNull('deleted_at')
                ->count();

            if ($memberCount > 0) {
                self::setError('该等级下有' . $memberCount . '个会员，无法删除');
                return false;
            }

            $level->deleted_at = date('Y-m-d H:i:s');
            $level->save();

            return true;
        } catch (DbException $e) {
            self::setError('删除等级失败：' . $e->getMessage());
            return false;
        }
    }
}
