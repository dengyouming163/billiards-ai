<?php

declare (strict_types=1);

namespace app\storeapi\logic\employee;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Employee;
use app\common\model\merchant\EmployeeRole;
use app\common\model\merchant\EmployeeRoleRelation;
use app\common\model\merchant\EmployeeStore;
use app\common\model\merchant\EmployeeSchedule;
use app\common\model\merchant\EmployeeAttendance;
use app\common\model\merchant\Store;
use think\facade\Db;
use Exception;

class EmployeeLogic extends BaseLogic
{
    public static function getList(array $params, string $storeId)
    {
        $employeeIds = EmployeeStore::where('store_id', $storeId)->column('employee_id');

        if (empty($employeeIds)) {
            return [];
        }

        $query = Employee::alias('e')
            ->leftJoin('busi_employee_role_relation err', 'e.id = err.employee_id')
            ->leftJoin('busi_employee_role r', 'err.role_id = r.id AND r.status = 1')
            ->field('e.*, r.id as role_id, r.name as role_name, r.code as role_code')
            ->whereIn('e.id', $employeeIds);

        if (!empty($params['role'])) {
            $query->where(function($q) use ($params) {
                $q->where('r.code', $params['role'])
                  ->whereOr('e.role', $params['role']);
            });
        }
        if (isset($params['status'])) {
            $query->where('e.status', $params['status']);
        } else {
            $query->where('e.status', 1);
        }
        if (!empty($params['keyword'])) {
            $keyword = $params['keyword'];
            $query->where(function($q) use ($keyword) {
                $q->whereLike('e.name', "%{$keyword}%")
                  ->whereOr('e.phone', 'like', "%{$keyword}%");
            });
        }

        return $query->hidden(['password'])->select()->toArray();
    }

    public static function getDetail(string $id, string $storeId)
    {
        $employeeStore = EmployeeStore::where('employee_id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$employeeStore) {
            return self::setError('员工不存在');
        }

        $employee = Employee::find($id);
        
        if (!$employee) {
            return self::setError('员工不存在');
        }

        $storeIds = EmployeeStore::where('employee_id', $id)->column('store_id');
        $result = $employee->hidden(['password'])->toArray();
        $result['store_ids'] = $storeIds ?: [];
        return $result;
    }

    public static function create(array $params, string $storeId)
    {
        $required = ['name', 'phone'];
        foreach ($required as $field) {
            if (empty($params[$field])) {
                return self::setError($field . '不能为空');
            }
        }

        if (!preg_match('/^1[3-9]\d{9}$/', $params['phone'])) {
            return self::setError('手机号格式错误');
        }

        $phoneExists = Employee::where('phone', $params['phone'])->find();
        if ($phoneExists) {
            return self::setError('手机号已存在');
        }

        $activeRoles = EmployeeRole::where(function ($q) use ($storeId) {
            $q->where('store_id', $storeId)->whereOr('store_id', '');
        })
            ->where('status', 1)
            ->column('code');
        if (empty($activeRoles)) {
            $activeRoles = ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'waiter'];
        }

        $role = $params['role'] ?? 'waiter';
        if (!in_array($role, $activeRoles)) {
            return self::setError('角色参数错误');
        }

        $validGenders = ['male', 'female', 'unknown'];
        $gender = $params['gender'] ?? 'unknown';
        $genderMap = ['0' => 'unknown', '1' => 'male', '2' => 'female'];
        $gender = $genderMap[$gender] ?? $gender;
        if (!in_array($gender, $validGenders)) {
            return self::setError('性别参数错误');
        }

        if (isset($params['salary']) && (!is_numeric($params['salary']) || $params['salary'] < 0)) {
            return self::setError('薪资格式错误');
        }

        if (!empty($params['id_card']) && !preg_match('/^\d{17}[\dXx]$/', $params['id_card'])) {
            return self::setError('身份证号格式错误');
        }

        if (!empty($params['hire_date']) && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $params['hire_date'])) {
            return self::setError('入职日期格式错误');
        }

        try {
            Db::startTrans();

            $employeeId = 'emp_' . bin2hex(random_bytes(8));

            $employee = new Employee();
            $employee->id = $employeeId;
            $employee->name = $params['name'];
            $employee->phone = $params['phone'];
            $employee->gender = $gender;
            $employee->id_card = $params['id_card'] ?? '';
            $employee->role = $role;
            $employee->position = $params['position'] ?? '';
            $employee->salary = $params['salary'] ?? 0.00;
            $employee->status = 1;
            $employee->hire_date = $params['hire_date'] ?? date('Y-m-d');
            $employee->password = password_hash('888888', PASSWORD_DEFAULT);
            $employee->merchant_id = Store::where('id', $storeId)->value('merchant_id') ?: '';
            $employee->store_id = $storeId;
            $employee->save();

            $employeeStore = new EmployeeStore();
            $employeeStore->id = 'es_' . bin2hex(random_bytes(8));
            $employeeStore->employee_id = $employeeId;
            $employeeStore->store_id = $storeId;
            $currentStoreMerchantId = Store::where('id', $storeId)->value('merchant_id') ?: '';
            $employeeStore->merchant_id = $currentStoreMerchantId;
            $employeeStore->save();

            $roleRecord = EmployeeRole::where('code', $role)
                ->where('status', 1)
                ->where(function ($q) use ($storeId) {
                    $q->where('store_id', $storeId)
                      ->whereOr(function ($sq) {
                          $sq->where('is_system', 1)
                             ->where(function ($ssq) {
                                 $ssq->where('store_id', '')->whereOr('store_id', '__system__');
                             });
                      });
                })
                ->find();

            if ($roleRecord) {
                EmployeeRoleRelation::create([
                    'id' => 'err_' . uniqid(),
                    'employee_id' => $employeeId,
                    'role_id' => $roleRecord['id'],
                    'store_id' => $storeId,
                ]);
            }

            if (!empty($params['store_ids']) && is_array($params['store_ids'])) {
                $additionalStoreIds = array_diff($params['store_ids'], [$storeId]);
                foreach ($additionalStoreIds as $sid) {
                    $es = new EmployeeStore();
                    $es->id = 'es_' . bin2hex(random_bytes(8));
                    $es->employee_id = $employeeId;
                    $es->store_id = $sid;
                    $additionalStoreMerchantId = Store::where('id', $sid)->value('merchant_id') ?: '';
                    $es->merchant_id = $additionalStoreMerchantId;
                    $es->save();
                }
            }

            Db::commit();

            return $employee->hidden(['password'])->toArray() ?: [];
        } catch (Exception $e) {
            try {
                Db::rollback();
            } catch (\Throwable $ignore) {}
            return self::setError('创建员工失败：' . $e->getMessage());
        }
    }

    public static function update(string $id, array $params, string $storeId)
    {
        $employeeStore = EmployeeStore::where('employee_id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$employeeStore) {
            return self::setError('员工不存在');
        }

        $employee = Employee::find($id);
        
        if (!$employee) {
            return self::setError('员工不存在');
        }

        if (isset($params['phone']) && !preg_match('/^1[3-9]\d{9}$/', $params['phone'])) {
            return self::setError('手机号格式错误');
        }

        if (isset($params['phone'])) {
            $phoneExists = Employee::where('phone', $params['phone'])
                ->where('id', '<>', $id)
                ->find();
            if ($phoneExists) {
                return self::setError('手机号已存在');
            }
        }

        if (isset($params['role'])) {
            $activeRoles = EmployeeRole::where(function ($q) use ($storeId) {
                $q->where('store_id', $storeId)->whereOr('store_id', '');
            })
                ->where('status', 1)
                ->column('code');
            if (empty($activeRoles)) {
                $activeRoles = ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'waiter'];
            }
            if (!in_array($params['role'], $activeRoles)) {
                return self::setError('角色参数错误');
            }
        }

        if (isset($params['gender'])) {
            $g = $params['gender'];
            $gm = ['0' => 'unknown', '1' => 'male', '2' => 'female'];
            $params['gender'] = $gm[$g] ?? $g;
        }
        if (isset($params['gender']) && !in_array($params['gender'], ['male', 'female', 'unknown'])) {
            return self::setError('性别参数错误');
        }

        if (isset($params['salary']) && (!is_numeric($params['salary']) || $params['salary'] < 0)) {
            return self::setError('薪资格式错误');
        }

        if (isset($params['id_card']) && !empty($params['id_card']) && !preg_match('/^\d{17}[\dXx]$/', $params['id_card'])) {
            return self::setError('身份证号格式错误');
        }

        $updatable = ['name', 'phone', 'gender', 'id_card', 'role', 'position', 'salary', 'status'];
        foreach ($updatable as $field) {
            if (isset($params[$field])) {
                $employee->$field = $params[$field];
            }
        }

        $employee->save();

        if (isset($params['role'])) {
            $roleRecord = EmployeeRole::where('code', $params['role'])
                ->where('status', 1)
                ->where(function ($q) use ($storeId) {
                    $q->where('store_id', $storeId)
                      ->whereOr(function ($sq) {
                          $sq->where('is_system', 1)
                             ->where(function ($ssq) {
                                 $ssq->where('store_id', '')->whereOr('store_id', '__system__');
                             });
                      });
                })
                ->find();

            if ($roleRecord) {
                $existing = EmployeeRoleRelation::where('employee_id', $id)->find();
                if ($existing) {
                    $existing->role_id = $roleRecord['id'];
                    $existing->save();
                } else {
                    EmployeeRoleRelation::create([
                        'id' => 'err_' . uniqid(),
                        'employee_id' => $id,
                        'role_id' => $roleRecord['id'],
                        'store_id' => $storeId,
                    ]);
                }
            }
        }

        if (isset($params['store_ids']) && is_array($params['store_ids'])) {
            // 删除当前门店之外的所有关联，再重新添加
            EmployeeStore::where('employee_id', $id)
                ->where('store_id', '<>', $storeId)
                ->delete();
            foreach ($params['store_ids'] as $sid) {
                if ($sid === $storeId) {
                    continue;  // 当前门店已在 create 时关联，跳过
                }
                // 检查是否已存在，避免重复
                $exists = EmployeeStore::where('employee_id', $id)
                    ->where('store_id', $sid)->find();
                if (!$exists) {
                    $es = new EmployeeStore();
                    $es->id = 'es_' . uniqid();
                    $es->employee_id = $id;
                    $es->store_id = $sid;
                    $additionalStoreMerchantId = Store::where('id', $sid)->value('merchant_id') ?: '';
                    $es->merchant_id = $additionalStoreMerchantId;
                    $es->save();
                }
            }
        }

        return $employee->hidden(['password'])->toArray() ?: [];
    }

    public static function delete(string $id, string $storeId)
    {
        $employeeStore = EmployeeStore::where('employee_id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$employeeStore) {
            return self::setError('员工不存在');
        }

        $employee = Employee::find($id);
        
        if (!$employee) {
            return self::setError('员工不存在');
        }

        $employee->status = 0;
        $employee->save();

        EmployeeStore::where('employee_id', $id)->where('store_id', $storeId)->delete();

        return true;
    }

    public static function resetPassword(string $id, string $storeId)
    {
        $employeeStore = EmployeeStore::where('employee_id', $id)
            ->where('store_id', $storeId)
            ->find();

        if (!$employeeStore) {
            return self::setError('员工不存在');
        }

        $employee = Employee::find($id);
        
        if (!$employee) {
            return self::setError('员工不存在');
        }

        $newPassword = '888888';
        $employee->password = password_hash($newPassword, PASSWORD_DEFAULT);
        $employee->save();

        return ['password' => $newPassword];
    }

    public static function getEmployeeStores(string $employeeId)
    {
        $roleCode = self::getEmployeeRoleCode($employeeId);

        if ($roleCode === 'boss') {
            return Store::where('status', 1)->select()->toArray();
        }

        $storeIds = EmployeeStore::where('employee_id', $employeeId)->column('store_id');
        if (empty($storeIds)) {
            return [];
        }

        return Store::whereIn('id', $storeIds)->where('status', 1)->select()->toArray();
    }

    private static function getEmployeeRoleCode(string $employeeId): string
    {
        $relation = EmployeeRoleRelation::alias('err')
            ->join('busi_employee_role r', 'err.role_id = r.id')
            ->where('err.employee_id', $employeeId)
            ->where('r.status', 1)
            ->find();

        return $relation ? $relation->code : '';
    }

    public static function getSchedules(array $params, string $storeId)
    {
        try {
            $scheduleId = $params['id'] ?? '';

            if (!empty($scheduleId)) {
                $schedule = EmployeeSchedule::where('id', $scheduleId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();
                if (!$schedule) {
                    return self::setError('排班记录不存在');
                }
                return $schedule->toArray();
            }

            $employeeId = $params['employee_id'] ?? '';
            $startDate = $params['start_date'] ?? date('Y-m-01');
            $endDate = $params['end_date'] ?? date('Y-m-t');

            $query = EmployeeSchedule::where('store_id', $storeId)
                ->where('employee_type', 'assistant')
                ->whereBetween('work_date', [$startDate, $endDate])
                ->whereNull('deleted_at');

            if (!empty($employeeId)) {
                $query->where('employee_id', $employeeId);
            }

            $schedules = $query->order('work_date', 'asc')->select()->toArray();
            return $schedules;
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function createSchedule(array $params, string $storeId)
    {
        try {
            if (empty($params['employee_id']) || empty($params['work_date'])) {
                self::setError('参数错误');
                return false;
            }

            $schedule = EmployeeSchedule::create([
                'id' => 'sch_' . substr(strval(time()), -8) . rand(1000, 9999),
                'employee_id' => $params['employee_id'],
                'employee_type' => 'assistant',
                'store_id' => $storeId,
                'work_date' => $params['work_date'],
                'shift_type' => $params['shift_type'] ?? '',
                'start_time' => $params['start_time'] ?? '',
                'end_time' => $params['end_time'] ?? '',
                'remark' => $params['remark'] ?? '',
                'status' => 'scheduled',
            ]);

            return $schedule->toArray();
        } catch (\Exception $e) {
            self::setError('创建失败：' . $e->getMessage());
            return false;
        }
    }

    public static function batchCreateSchedules(array $params, string $storeId)
    {
        try {
            $schedules = [];
            foreach ($params['employee_ids'] as $employeeId) {
                foreach ($params['schedules'] as $schedule) {
                    $record = EmployeeSchedule::create([
                        'id' => 'sch_' . uniqid(),
                        'employee_id' => $employeeId,
                        'employee_type' => 'assistant',
                        'store_id' => $storeId,
                        'work_date' => $schedule['work_date'],
                        'shift_type' => $schedule['shift_type'],
                        'start_time' => $schedule['start_time'] ?? '',
                        'end_time' => $schedule['end_time'] ?? '',
                        'status' => 'scheduled',
                    ]);
                    $schedules[] = $record->toArray();
                }
            }
            return $schedules;
        } catch (\Exception $e) {
            self::setError('批量创建失败：' . $e->getMessage());
            return false;
        }
    }

    public static function updateSchedule(string $id, array $params, string $storeId)
    {
        try {
            $schedule = EmployeeSchedule::where('id', $id)->whereNull('deleted_at')->find();
            if (!$schedule) {
                return self::setError('排班记录不存在');
            }
            if (isset($params['shift_type'])) $schedule->shift_type = $params['shift_type'];
            if (isset($params['start_time'])) $schedule->start_time = $params['start_time'];
            if (isset($params['end_time'])) $schedule->end_time = $params['end_time'];
            if (isset($params['remark'])) $schedule->remark = $params['remark'];
            if (isset($params['work_date'])) $schedule->work_date = $params['work_date'];
            if (isset($params['employee_id'])) $schedule->employee_id = $params['employee_id'];
            $schedule->save();
            return $schedule->toArray();
        } catch (\Exception $e) {
            self::setError('更新失败：' . $e->getMessage());
            return false;
        }
    }

    public static function deleteSchedule(string $id)
    {
        try {
            $schedule = EmployeeSchedule::where('id', $id)
                ->whereNull('deleted_at')
                ->find();

            if (!$schedule) {
                self::setError('排班记录不存在');
                return false;
            }

            $schedule->delete();
            return true;
        } catch (\Exception $e) {
            self::setError('删除失败：' . $e->getMessage());
            return false;
        }
    }

    public static function checkIn(array $params)
    {
        try {
            $scheduleId = $params['schedule_id'];
            $schedule = EmployeeSchedule::where('id', $scheduleId)
                ->whereNull('deleted_at')
                ->find();

            if (!$schedule) {
                self::setError('排班记录不存在');
                return false;
            }

            $now = date('Y-m-d H:i:s');
            $schedule->check_in_time = $now;
            $schedule->status = 'checked_in';
            $schedule->save();

            EmployeeAttendance::create([
                'id' => 'att_' . uniqid(),
                'employee_id' => $schedule['employee_id'],
                'store_id' => $schedule['store_id'],
                'work_date' => date('Y-m-d'),
                'check_in_time' => $now,
                'status' => 'normal',
            ]);

            return [
                'schedule_id' => $scheduleId,
                'check_in_time' => $now,
                'status' => 'checked_in',
            ];
        } catch (\Exception $e) {
            self::setError('签到失败：' . $e->getMessage());
            return false;
        }
    }

    public static function checkOut(array $params)
    {
        try {
            $scheduleId = $params['schedule_id'];
            $schedule = EmployeeSchedule::where('id', $scheduleId)
                ->whereNull('deleted_at')
                ->find();

            if (!$schedule) {
                self::setError('排班记录不存在');
                return false;
            }

            $now = date('Y-m-d H:i:s');
            $schedule->check_out_time = $now;
            $schedule->status = 'completed';
            $schedule->save();

            $attendance = EmployeeAttendance::where('employee_id', $schedule['employee_id'])
                ->where('work_date', date('Y-m-d'))
                ->whereNull('check_out_time')
                ->order('created_at', 'desc')
                ->find();

            if ($attendance) {
                $checkInTs = strtotime($attendance['check_in_time']);
                $checkOutTs = strtotime($now);
                $workHours = round(($checkOutTs - $checkInTs) / 3600, 2);

                $attendance->check_out_time = $now;
                $attendance->work_hours = $workHours;
                $attendance->save();

                return [
                    'schedule_id' => $scheduleId,
                    'check_out_time' => $now,
                    'work_hours' => $workHours,
                    'status' => 'completed',
                ];
            }

            return [
                'schedule_id' => $scheduleId,
                'check_out_time' => $now,
                'work_hours' => 0,
                'status' => 'completed',
            ];
        } catch (\Exception $e) {
            self::setError('签退失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getAttendances(string $employeeId, array $params)
    {
        try {
            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);

            $query = EmployeeAttendance::where('employee_id', $employeeId);

            if (!empty($params['start_date'])) {
                $query->where('work_date', '>=', $params['start_date']);
            }
            if (!empty($params['end_date'])) {
                $query->where('work_date', '<=', $params['end_date']);
            }

            $total = $query->count();
            $records = $query->order('work_date', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            return [
                'data' => $records,
                'pagination' => [
                    'page' => $page,
                    'page_size' => $pageSize,
                    'total' => $total,
                    'total_pages' => ceil($total / $pageSize),
                ],
            ];
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getAttendanceStats(array $params)
    {
        try {
            $employeeId = $params['employee_id'] ?? '';
            $month = $params['month'] ?? date('Y-m');

            if (empty($employeeId)) {
                self::setError('参数错误');
                return false;
            }

            $startDate = $month . '-01';
            $endDate = date('Y-m-t', strtotime($startDate));

            $attendances = EmployeeAttendance::where('employee_id', $employeeId)
                ->whereBetween('work_date', [$startDate, $endDate])
                ->select();

            $totalDays = (int)date('t', strtotime($startDate));
            $workDays = 0;
            $lateCount = 0;
            $earlyCount = 0;
            $totalWorkHours = 0;

            foreach ($attendances as $att) {
                $workDays++;
                if ($att['status'] === 'late') $lateCount++;
                if ($att['status'] === 'early') $earlyCount++;
                $totalWorkHours += (float)($att['work_hours'] ?? 0);
            }

            return [
                'employee_id' => $employeeId,
                'month' => $month,
                'total_days' => $totalDays,
                'work_days' => $workDays,
                'late_count' => $lateCount,
                'early_count' => $earlyCount,
                'absent_count' => $totalDays - $workDays,
                'overtime_hours' => 0,
                'total_work_hours' => $totalWorkHours,
            ];
        } catch (\Exception $e) {
            self::setError('统计失败：' . $e->getMessage());
            return false;
        }
    }
}