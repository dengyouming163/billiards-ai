<?php

declare (strict_types=1);

namespace app\storeapi\logic\shift;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Employee;
use app\common\model\merchant\EmployeeAttendance;
use app\common\model\merchant\EmployeeStore;
use app\common\model\merchant\ShiftConfig;
use app\common\model\merchant\Store;
use think\facade\Db;

class ShiftLogic extends BaseLogic
{
    public static function checkIn(array $params, string $employeeId, string $storeId)
    {
        if (empty($params['type'])) {
            self::setError('班次类型不能为空');
            return false;
        }

        $today = date('Y-m-d');

        // 闭环：自动签退该员工非今天的未关闭班次
        self::autoCloseStaleShifts($employeeId, $today);

        $existing = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('store_id', $storeId)
            ->where('work_date', $today)
            ->where('type', $params['type'])
            ->where('status', 'checked_in')
            ->find();
        
        if ($existing) {
            self::setError('今日已签到，请勿重复签到');
            return false;
        }

        $attendance = new EmployeeAttendance();
        $attendance->id = 'att_' . uniqid();
        $attendance->employee_id = $employeeId;
        $attendance->store_id = $storeId;
        $attendance->work_date = $today;
        $attendance->type = $params['type'];
        $attendance->status = 'checked_in';
        $attendance->check_in_time = date('Y-m-d H:i:s');
        $attendance->description = $params['description'] ?? ($params['opening_cash'] ?? '');
        
        if (!$attendance->save()) {
            self::setError('签到失败');
            return false;
        }

        return $attendance->toArray();
    }

    public static function checkOut(string $employeeId, string $storeId, array $params = [])
    {
        $today = date('Y-m-d');
        
        $attendance = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('store_id', $storeId)
            ->where('work_date', $today)
            ->where('status', 'checked_in')
            ->order('check_in_time', 'desc')
            ->find();
        
        if (!$attendance) {
            self::setError('今日未签到或已签退');
            return false;
        }

        $checkOutTime = date('Y-m-d H:i:s');
        $checkInTime = $attendance->check_in_time;
        
        $hours = (strtotime($checkOutTime) - strtotime($checkInTime)) / 3600;
        $attendance->check_out_time = $checkOutTime;
        $attendance->work_hours = round($hours, 2);
        $attendance->status = 'checked_out';
        
        if (isset($params['description'])) {
            $attendance->description = $params['description'];
        }

        $shiftConfig = ShiftConfig::where('code', $attendance->type)
            ->where('store_id', $storeId)
            ->find();
        
        if ($shiftConfig && $shiftConfig->end_time) {
            $expectedEndTime = $today . ' ' . $shiftConfig->end_time;
            if (strtotime($checkOutTime) > strtotime($expectedEndTime)) {
                $attendance->overtime_hours = round((strtotime($checkOutTime) - strtotime($expectedEndTime)) / 3600, 2);
            }
        }
        
        // 班次快照 — 使用 attendance 记录的 employee_id
        $shiftEmployeeId = $attendance->employee_id;

        // 冻结签退时的统计数据 (按结账时间 end_time 过滤)
        $snapshot = Db::name('busi_order')
            ->where('store_id', $storeId)
            ->where('operator_id', $shiftEmployeeId)
            ->where('end_time', '>=', $checkInTime)
            ->where('end_time', '<=', $checkOutTime)
            ->where('status', 'completed')
            ->fieldRaw("
                COALESCE(SUM(final_amount), 0) as totalRevenue,
                COALESCE(SUM(table_fee), 0) as tableRevenue,
                COALESCE(SUM(product_fee), 0) as productRevenue,
                COALESCE(SUM(assistant_fee), 0) as assistantRevenue,
                COALESCE(SUM(wechat_paid), 0) as wechatPaid,
                COALESCE(SUM(cash_paid), 0) as cashPaid,
                COALESCE(SUM(balance_paid), 0) as balancePaid,
                COUNT(*) as orderCount
            ")
            ->find();
        $openTableCount = Db::name('busi_order')
            ->where('store_id', $storeId)
            ->where('operator_id', $shiftEmployeeId)
            ->where('status', 'in_progress')
            ->count();
        $rechargeTotal = Db::name('busi_member_recharge')
            ->where('store_id', $storeId)
            ->where('operator_id', $shiftEmployeeId)
            ->where('created_at', '>=', $checkInTime)
            ->where('created_at', '<=', $checkOutTime)
            ->sum('amount');

        $attendance->total_revenue = (float)($snapshot['totalRevenue'] ?? 0);
        $attendance->order_count = (int)($snapshot['orderCount'] ?? 0);
        $attendance->cash_paid = (float)($snapshot['cashPaid'] ?? 0);
        $attendance->wechat_paid = (float)($snapshot['wechatPaid'] ?? 0);
        $attendance->balance_paid = (float)($snapshot['balancePaid'] ?? 0);
        $attendance->table_revenue = (float)($snapshot['tableRevenue'] ?? 0);
        $attendance->product_revenue = (float)($snapshot['productRevenue'] ?? 0);
        $attendance->assistant_revenue = (float)($snapshot['assistantRevenue'] ?? 0);
        $attendance->open_table_count = $openTableCount;
        $attendance->recharge_total = (float)($rechargeTotal ?? 0);

        if (!$attendance->save()) {
            self::setError('签退失败');
            return false;
        }

        return $attendance->toArray();
    }

    public static function getCurrent(string $employeeId, string $storeId)
    {
        $today = date('Y-m-d');
        
        $attendance = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('store_id', $storeId)
            ->where('work_date', $today)
            ->order('check_in_time', 'desc')
            ->find();
        
        if (!$attendance) {
            return [
                'is_on_shift' => false,
                'attendance' => null,
            ];
        }

        $data = $attendance->toArray();
        $data['is_on_shift'] = ($data['status'] === 'checked_in');
        
        if ($data['is_on_shift'] && $data['check_in_time']) {
            $data['working_hours'] = round((time() - strtotime($data['check_in_time'])) / 3600, 2);
        }

        return [
            'is_on_shift' => $data['is_on_shift'],
            'attendance' => $data,
        ];
    }

    public static function getRecords(string $employeeId, string $storeId, array $params = [])
    {
        $query = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('store_id', $storeId);

        if (!empty($params['start_date'])) {
            $query->where('work_date', '>=', $params['start_date']);
        }
        
        if (!empty($params['end_date'])) {
            $query->where('work_date', '<=', $params['end_date']);
        }

        $page = $params['page'] ?? 1;
        $pageSize = $params['page_size'] ?? 20;
        
        $list = $query->order('work_date', 'desc')
            ->order('check_in_time', 'desc')
            ->paginate([
                'page' => (int)$page,
                'list_rows' => (int)$pageSize,
            ]);

        return $list;
    }

    public static function getShiftConfigs(string $storeId)
    {
        $configs = ShiftConfig::where('store_id', $storeId)
            ->where('status', 1)
            ->order('sort_order', 'asc')
            ->select()
            ->toArray();
        
        return $configs;
    }

    public static function getEmployees(string $storeId)
    {
        $storeEmployeeIds = EmployeeStore::where('store_id', $storeId)->column('employee_id');

        $directEmployeeIds = Employee::where('status', 1)
            ->where('store_id', $storeId)
            ->column('id');

        $allEmployeeIds = array_unique(array_merge($storeEmployeeIds, $directEmployeeIds));
        if (empty($allEmployeeIds)) {
            return [];
        }

        $employees = Employee::whereIn('id', $allEmployeeIds)
            ->where('status', 1)
            ->field('id, name, phone, role')
            ->select()
            ->toArray();
        return $employees;
    }

    public static function handover(string $currentEmployeeId, string $storeId, array $params)
    {
        $newEmployeeId = $params['new_employee_id'] ?? '';
        $password = $params['password'] ?? '';
        if (empty($newEmployeeId) || empty($password)) {
            self::setError('接班人信息和密码不能为空');
            return false;
        }
        $newEmployee = Employee::where('id', $newEmployeeId)->where('status', 1)->find();
        if (!$newEmployee) {
            self::setError('该员工不存在或已禁用');
            return false;
        }
        if (empty($newEmployee['password'])) {
            self::setError('该员工未设置密码，无法交接');
            return false;
        }
        $isValid = false;
        if (password_verify($password, $newEmployee['password'])) {
            $isValid = true;
        } elseif (md5($password) === $newEmployee['password']) {
            $isValid = true;
        }
        if (!$isValid) {
            self::setError('密码错误');
            return false;
        }
        // 签退当前操作员
        $today = date('Y-m-d');
        $currentAttendance = EmployeeAttendance::where('employee_id', $currentEmployeeId)
            ->where('store_id', $storeId)
            ->where('work_date', $today)
            ->where('status', 'checked_in')
            ->order('check_in_time', 'desc')
            ->find();

        Db::startTrans();
        try {
            if ($currentAttendance) {
                $checkOutTime = date('Y-m-d H:i:s');
                $hours = (strtotime($checkOutTime) - strtotime($currentAttendance->check_in_time)) / 3600;
                $currentAttendance->check_out_time = $checkOutTime;
                $currentAttendance->work_hours = round($hours, 2);
                $currentAttendance->status = 'checked_out';
                $currentAttendance->description = $params['description'] ?? '';
                if (!$currentAttendance->save()) {
                    Db::rollback();
                    self::setError('签退失败');
                    return false;
                }
            }
            // 签入新员工
            $newAttendance = new EmployeeAttendance();
            $newAttendance->id = 'att_' . uniqid();
            $newAttendance->employee_id = $newEmployeeId;
            $newAttendance->store_id = $storeId;
            $newAttendance->work_date = $today;
            $newAttendance->type = 'full';
            $newAttendance->status = 'checked_in';
            $newAttendance->check_in_time = date('Y-m-d H:i:s');
            $newAttendance->description = '接手自 ' . $currentEmployeeId;
            if (!$newAttendance->save()) {
                Db::rollback();
                self::setError('签入失败');
                return false;
            }
            Db::commit();
        } catch (\Exception $e) {
            Db::rollback();
            self::setError('交接失败');
            return false;
        }
        // 获取门店信息
        $store = Store::find($storeId);
        // 生成新 token
        $tokenInfo = \app\storeapi\service\PosEmployeeTokenService::setToken($newEmployeeId, $storeId, 'pos');
        return [
            'token' => $tokenInfo['token'],
            'employee' => [
                'id' => $newEmployee['id'],
                'name' => $newEmployee['name'],
                'phone' => $newEmployee['phone'],
                'role' => $newEmployee['role'],
                'store_id' => $storeId,
                'store_name' => $store ? $store['name'] : '',
            ],
        ];
    }

    public static function startWork(string $employeeId, string $password, string $storeId)
    {
        $employee = Employee::where('id', $employeeId)->where('status', 1)->find();
        if (!$employee) {
            self::setError('该员工不存在或已禁用');
            return false;
        }
        if (empty($employee['password'])) {
            self::setError('该员工未设置密码，无法上班');
            return false;
        }
        if (empty($password)) {
            self::setError('密码不能为空');
            return false;
        }
        $isValid = false;
        if (password_verify($password, $employee['password'])) {
            $isValid = true;
        } elseif (md5($password) === $employee['password']) {
            $isValid = true;
        }
        if (!$isValid) {
            self::setError('密码错误');
            return false;
        }
        $today = date('Y-m-d');

        // 闭环：自动签退该员工非今天的未关闭班次
        self::autoCloseStaleShifts($employeeId, $today);

        // 按唯一键 (employee_id, work_date, type) 查询，避免 1062
        $existing = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('work_date', $today)
            ->find();

        $isNew = false;
        if ($existing) {
            $attendance = $existing;
            // 已有记录则更新状态和时间
            $attendance->store_id = $storeId;
            $attendance->status = 'checked_in';
            $attendance->check_in_time = date('Y-m-d H:i:s');
            $attendance->save();
        } else {
            $attendance = new EmployeeAttendance();
            $attendance->id = 'att_' . uniqid();
            $attendance->employee_id = $employeeId;
            $attendance->store_id = $storeId;
            $attendance->work_date = $today;
            $attendance->type = 'full';
            $attendance->status = 'checked_in';
            $attendance->check_in_time = date('Y-m-d H:i:s');
            if (!$attendance->save()) {
                self::setError('上班打卡失败');
                return false;
            }
            $isNew = true;
        }
        // 生成/刷新 token，确保后续请求的 employee_id 与考勤一致
        $tokenInfo = \app\storeapi\service\PosEmployeeTokenService::setToken($employeeId, $storeId, 'pos');
        return [
            'token' => $tokenInfo['token'],
            'employee' => [
                'id' => $employee['id'],
                'name' => $employee['name'],
                'phone' => $employee['phone'],
                'role' => $employee['role'],
            ],
            'attendance' => $attendance->toArray(),
            'is_new' => $isNew,
        ];
    }

    public static function shiftSummary(string $employeeId, string $storeId)
    {
        $today = date('Y-m-d');

        $attendance = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('store_id', $storeId)
            ->where('work_date', $today)
            ->where('status', 'checked_in')
            ->order('check_in_time', 'desc')
            ->find();

        if (!$attendance) {
            // 不报错，返回空数据让前端处理（清除过期状态、提示开始班次）
            return [
                'isOnShift' => false,
                'totalRevenue' => 0, 'tableRevenue' => 0, 'productRevenue' => 0, 'assistantRevenue' => 0,
                'wechatPaid' => 0, 'alipayPaid' => 0, 'cashPaid' => 0, 'cardPaid' => 0, 'balancePaid' => 0,
                'orderCount' => 0, 'openTableCount' => 0,
                'rechargeTotal' => 0, 'rechargeCount' => 0,
                'shiftStartTime' => '', 'workHours' => 0,
                'operatorName' => '', 'employeeId' => '',
            ];
        }

        $checkInTime = $attendance->check_in_time;
        $checkOutTime = date('Y-m-d H:i:s');
        $hours = round((strtotime($checkOutTime) - strtotime($checkInTime)) / 3600, 2);
        // 使用 attendance 记录的 employee_id 而非 session 的 (支持交接班场景)
        $shiftEmployeeId = $attendance->employee_id;
        $operatorName = '';
        $currentEmp = Employee::find($shiftEmployeeId);
        if ($currentEmp) {
            $operatorName = $currentEmp['name'];
        }

        // 按班次时间窗口 + 操作员过滤（operator_id 由 Controller 绑定 token employeeId 保证准确性）
        $summary = Db::name('busi_order')
            ->where('store_id', $storeId)
            ->where('operator_id', $shiftEmployeeId)
            ->where('end_time', '>=', $checkInTime)
            ->where('end_time', '<=', $checkOutTime)
            ->where('status', 'completed')
            ->fieldRaw("
                COALESCE(SUM(final_amount), 0) as totalRevenue,
                COALESCE(SUM(table_fee), 0) as tableRevenue,
                COALESCE(SUM(product_fee), 0) as productRevenue,
                COALESCE(SUM(assistant_fee), 0) as assistantRevenue,
                COALESCE(SUM(wechat_paid), 0) as wechatPaid,
                COALESCE(SUM(alipay_paid), 0) as alipayPaid,
                COALESCE(SUM(cash_paid), 0) as cashPaid,
                COALESCE(SUM(card_paid), 0) as cardPaid,
                COALESCE(SUM(balance_paid), 0) as balancePaid,
                COUNT(*) as orderCount
            ")
            ->find();

        $openTableCount = Db::name('busi_order')
            ->where('store_id', $storeId)
            ->where('operator_id', $shiftEmployeeId)
            ->where('status', 'in_progress')
            ->count();

        // 充值统计
        $rechargeSummary = Db::name('busi_member_recharge')
            ->where('store_id', $storeId)
            ->where('operator_id', $shiftEmployeeId)
            ->where('created_at', '>=', $checkInTime)
            ->where('created_at', '<=', $checkOutTime)
            ->fieldRaw("COALESCE(SUM(amount), 0) as total, COUNT(*) as cnt")
            ->find();

        return [
            'totalRevenue' => (float)($summary['totalRevenue'] ?? 0),
            'tableRevenue' => (float)($summary['tableRevenue'] ?? 0),
            'productRevenue' => (float)($summary['productRevenue'] ?? 0),
            'assistantRevenue' => (float)($summary['assistantRevenue'] ?? 0),
            'wechatPaid' => (float)($summary['wechatPaid'] ?? 0),
            'alipayPaid' => (float)($summary['alipayPaid'] ?? 0),
            'cashPaid' => (float)($summary['cashPaid'] ?? 0),
            'cardPaid' => (float)($summary['cardPaid'] ?? 0),
            'balancePaid' => (float)($summary['balancePaid'] ?? 0),
            'orderCount' => (int)($summary['orderCount'] ?? 0),
            'openTableCount' => $openTableCount,
            'rechargeTotal' => (float)($rechargeSummary['total'] ?? 0),
            'rechargeCount' => (int)($rechargeSummary['cnt'] ?? 0),
            'shiftStartTime' => $checkInTime,
            'workHours' => $hours,
            'operatorName' => $operatorName,
            'employeeId' => $shiftEmployeeId,
        ];
    }

    /**
     * 自动签退员工非今天的未关闭班次（防止跨天未签退，保证班次闭环）
     */
    private static function autoCloseStaleShifts(string $employeeId, string $today): void
    {
        $staleAttendances = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('status', 'checked_in')
            ->where('work_date', '<>', $today)
            ->select();

        foreach ($staleAttendances as $stale) {
            $checkOutTime = date('Y-m-d H:i:s');
            $hours = round((strtotime($checkOutTime) - strtotime($stale->check_in_time)) / 3600, 2);
            $stale->check_out_time = $checkOutTime;
            $stale->work_hours = round($hours, 2);
            $stale->status = 'checked_out';
            $stale->description = ($stale->description ?: '') . ' [系统自动签退]';

            // 冻结签退时的快照
            $snap = Db::name('busi_order')
                ->where('store_id', $stale->store_id)
                ->where('operator_id', $stale->employee_id)
                ->where('end_time', '>=', $stale->check_in_time)
                ->where('end_time', '<=', $checkOutTime)
                ->where('status', 'completed')
                ->fieldRaw("COALESCE(SUM(final_amount),0) as total_revenue, COALESCE(SUM(cash_paid),0) as cash, COALESCE(SUM(wechat_paid),0) as wechat, COALESCE(SUM(balance_paid),0) as balance, COUNT(*) as cnt")
                ->find();
            $stale->total_revenue = (float)($snap['total_revenue'] ?? 0);
            $stale->order_count = (int)($snap['cnt'] ?? 0);
            $stale->cash_paid = (float)($snap['cash'] ?? 0);
            $stale->wechat_paid = (float)($snap['wechat'] ?? 0);
            $stale->balance_paid = (float)($snap['balance'] ?? 0);
            $stale->save();
        }
    }
}
