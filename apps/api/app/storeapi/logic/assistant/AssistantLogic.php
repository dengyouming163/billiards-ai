<?php

declare (strict_types=1);

namespace app\storeapi\logic\assistant;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantLevel;
use app\common\model\merchant\AssistantOrderDetail;
use app\common\model\merchant\AssistantService;
use app\common\model\merchant\EmployeeSchedule;
use app\common\model\merchant\ShiftConfig;
use app\common\model\merchant\CommissionConfig;
use app\common\model\merchant\CommissionRecord;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\common\model\merchant\OrderPauseLog;
use app\common\model\merchant\Employee;
use app\common\constants\RoleConstants;
use think\facade\Db;
use Exception;

class AssistantLogic extends BaseLogic
{
    private static function formatAssistant(array &$item)
    {
        // 统一状态映射: 0=rest(休息) 1=available(空闲) 2=serving(服务中)
        $statusMap = ['0' => 'rest', '1' => 'available', '2' => 'serving'];
        $item['status'] = $statusMap[(string)$item['status']] ?? 'available';

        $levels = AssistantLevel::whereNull('deleted_at')
            ->column('code', 'id');

        $item['level_code'] = $levels[$item['level_id']] ?? 'junior';

        if (!empty($item['skills']) && is_string($item['skills'])) {
            $item['skills'] = json_decode($item['skills'], true) ?: [];
        } elseif (empty($item['skills'])) {
            $item['skills'] = [];
        }
    }

    /**
     * 根据计费规则计算费用
     * @param float $hourlyRate 时薪（元/小时）
     * @param int $minutes 服务分钟数
     * @param string $billingRule 计费规则：minute-按分钟, half_hour-半小时
     * @return float 费用（元）
     */
    public static function calculateFee(float $hourlyRate, int $minutes, string $billingRule = 'half_hour'): float
    {
        if ($minutes <= 0 || $hourlyRate <= 0) {
            return 0.00;
        }

        if ($billingRule === 'minute') {
            return round(($minutes / 60) * $hourlyRate, 2);
        }

        // 默认半小时计费：向上取整到30分钟单位
        $units = ceil($minutes / 30);
        $hours = $units * 0.5;
        return round($hours * $hourlyRate, 2);
    }

    public static function getList(array $params, string $storeId)
    {
        try {
            $query = Assistant::where('store_id', $storeId)
                ->whereNull('deleted_at');
            
            if (!empty($params['keyword'])) {
                $keyword = strtolower($params['keyword']);
                $query->where(function ($q) use ($keyword) {
                    $q->where('name', 'like', "%{$keyword}%")
                      ->whereOr('phone', 'like', "%{$keyword}%");
                });
            }
            
            if (!empty($params['level_id'])) {
                $query->where('level_id', $params['level_id']);
            }
            
            if (isset($params['status'])) {
                $query->where('status', $params['status']);
            }
            
            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);
            
            $total = $query->count();
            $data = $query->order('created_at', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();

            $levels = AssistantLevel::whereNull('deleted_at')
                ->column('code', 'id');

            $levelFallback = [
                'ast-level-001' => 'junior',
                'ast-level-002' => 'intermediate',
                'ast-level-003' => 'senior',
                'ast-level-004' => 'gold',
            ];

            $formattedData = [];
            foreach ($data as $item) {
                // 统一状态映射: 0=rest(休息) 1=available(空闲) 2=serving(服务中)
                $statusMap = ['0' => 'rest', '1' => 'available', '2' => 'serving'];
                $itemStatus = $statusMap[(string)($item['status'] ?? '1')] ?? 'available';
                $itemLevel = $levels[$item['level_id']] ?? ($levelFallback[$item['level_id'] ?? ''] ?? 'junior');
                $itemSkills = [];
                if (!empty($item['skills'])) {
                    $skills = json_decode($item['skills'], true);
                    $itemSkills = is_array($skills) ? $skills : [];
                }
                
                $formattedData[] = [
                    'id' => $item['id'],
                    'store_id' => $item['store_id'] ?? '',
                    'name' => $item['name'] ?? '',
                    'phone' => $item['phone'] ?? '',
                    'avatar' => $item['avatar'] ?? null,
                    'level' => $itemLevel,
                    'level_id' => $item['level_id'] ?? '',
                    'skills' => $itemSkills,
                    'hourly_rate' => $item['hourly_rate'] ?? 0,
                    'billing_rule' => $item['billing_rule'] ?? 'half_hour',
                    'status' => $itemStatus,
                    'rating' => $item['rating'] ?? null,
                    'service_count' => $item['total_orders'] ?? 0,
                    'total_hours' => $item['total_hours'] ?? 0,
                    'description' => $item['description'] ?? null,
                    'created_at' => $item['created_at'] ?? null,
                ];
            }
            
            return [
                'data' => $formattedData,
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

    public static function getDetail(string $id, string $storeId)
    {
        try {
            $assistant = Assistant::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$assistant) {
                self::setError('助教不存在');
                return false;
            }
            
            return $assistant->toArray();
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function create(array $params, string $storeId)
    {
        try {
            if (empty($params['name'])) {
                self::setError('请输入助理姓名');
                return false;
            }

            if (empty($params['phone'])) {
                self::setError('请输入手机号');
                return false;
            }

            if (empty($params['level_id'])) {
                self::setError('请选择助理等级');
                return false;
            }

            $level = AssistantLevel::where('id', $params['level_id'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$level) {
                self::setError('等级不存在');
                return false;
            }

            // Phone reuse: check if employee already exists for this store
            $existingEmployee = Db::name('busi_employee')
                ->where('phone', $params['phone'])
                ->where('store_id', $storeId)
                ->find();

            Db::startTrans();

            if ($existingEmployee) {
                // Reactivate if soft-deleted
                if (!empty($existingEmployee['deleted_at'])) {
                    Db::name('busi_employee')->where('id', $existingEmployee['id'])->update([
                        'deleted_at' => null,
                        'status' => 1,
                        'updated_at' => date('Y-m-d H:i:s'),
                    ]);
                }
                // Ensure EmployeeStore link
                $esExists = Db::name('busi_employee_store')
                    ->where('employee_id', $existingEmployee['id'])
                    ->where('store_id', $storeId)
                    ->find();
                if (!$esExists) {
                    Db::name('busi_employee_store')->insert([
                        'id' => 'es_' . bin2hex(random_bytes(8)),
                        'merchant_id' => $merchantId,
                        'employee_id' => $existingEmployee['id'],
                        'store_id' => $storeId,
                        'created_at' => date('Y-m-d H:i:s'),
                    ]);
                }
                $employeeId = $existingEmployee['id'];
            }

            $merchantId = Db::name('busi_store')->where('id', $storeId)->value('merchant_id') ?: '';

            if (empty($employeeId)) {
                $employeeId = 'emp_' . bin2hex(random_bytes(8));
                Employee::create([
                    'id' => $employeeId,
                    'store_id' => $storeId,
                    'merchant_id' => $merchantId,
                    'name' => $params['name'],
                    'phone' => $params['phone'],
                    'password' => password_hash('888888', PASSWORD_DEFAULT),
                    'role' => RoleConstants::ROLE_ASSISTANT,
                    'status' => 1,
                    'hire_date' => date('Y-m-d'),
                    'salary' => $params['salary'] ?? 0,
                    'id_card' => $params['id_card'] ?? '',
                    'description' => $params['description'] ?? '',
                    'created_at' => date('Y-m-d H:i:s'),
                    'updated_at' => date('Y-m-d H:i:s'),
                ]);

            // Sync EmployeeStore so employee appears in employee list
            Db::name('busi_employee_store')->insert([
                'id' => 'es_' . bin2hex(random_bytes(8)),
                'merchant_id' => $merchantId,
                'employee_id' => $employeeId,
                'store_id' => $storeId,
                'created_at' => date('Y-m-d H:i:s'),
            ]);
            }

            $assistant = Assistant::create([
                'id' => 'assistant_' . substr(strval(time()), -8) . rand(1000, 9999),
                'employee_id' => $employeeId,
                'store_id' => $storeId,
                'level_id' => $params['level_id'],
                'name' => $params['name'],
                'phone' => $params['phone'],
                'gender' => $params['gender'] ?? 'unknown',
                'avatar' => $params['avatar'] ?? '',
                'skills' => json_encode($params['skills'] ?? []),
                'hourly_rate' => $params['hourly_rate'] ?? $level['hourly_rate'],
                'billing_rule' => $params['billing_rule'] ?? $level['billing_rule'] ?? 'half_hour',
                'status' => 1,
                'total_orders' => 0,
                'total_hours' => 0,
                'total_amount' => 0,
                'rating' => 5,
                'description' => $params['description'] ?? '',
            ]);

            Db::commit();

            return $assistant->toArray();
        } catch (\Exception $e) {
            try { Db::rollback(); } catch (\Throwable $ignore) {}
            self::setError('创建失败：' . $e->getMessage());
            return false;
        }
    }

    public static function update(string $id, array $params, string $storeId)
    {
        try {
            $assistant = Assistant::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$assistant) {
                self::setError('助教不存在');
                return false;
            }
            
            $updateData = [];
            if (isset($params['name'])) $updateData['name'] = $params['name'];
            if (isset($params['phone'])) $updateData['phone'] = $params['phone'];
            if (isset($params['gender'])) $updateData['gender'] = $params['gender'];
            if (isset($params['avatar'])) $updateData['avatar'] = $params['avatar'];
            if (isset($params['skills'])) $updateData['skills'] = json_encode($params['skills']);
            if (isset($params['hourly_rate'])) $updateData['hourly_rate'] = $params['hourly_rate'];
            if (isset($params['billing_rule'])) $updateData['billing_rule'] = $params['billing_rule'];
            if (isset($params['level_id'])) $updateData['level_id'] = $params['level_id'];
            if (isset($params['status'])) { $statusMap = ['rest' => 0, 'available' => 1, 'serving' => 2, 'busy' => 1]; $updateData['status'] = $statusMap[$params['status']] ?? (int)$params['status']; }
            if (isset($params['description'])) $updateData['description'] = $params['description'];
            
            if (!empty($updateData)) {
                $assistant->save($updateData);
            }
            
            if (!empty($assistant['employee_id'])) {
                $employeeUpdateData = [];
                if (isset($params['name'])) $employeeUpdateData['name'] = $params['name'];
                if (isset($params['phone'])) $employeeUpdateData['phone'] = $params['phone'];
                if (isset($params['status'])) {
                    $employeeUpdateData['status'] = $params['status'] == 1 ? 1 : 0;
                }
                if (isset($params['description'])) $employeeUpdateData['description'] = $params['description'];
                
                if (!empty($employeeUpdateData)) {
                    $employeeUpdateData['updated_at'] = date('Y-m-d H:i:s');
                    Employee::where('id', $assistant['employee_id'])->save($employeeUpdateData);
                }
            }
            
            return $assistant->toArray();
        } catch (\Exception $e) {
            self::setError('更新失败：' . $e->getMessage());
            return false;
        }
    }

    public static function delete(string $id, string $storeId)
    {
        try {
            $assistant = Assistant::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$assistant) {
                self::setError('助教不存在');
                return false;
            }
            
            $assistant->delete();
            return true;
        } catch (\Exception $e) {
            self::setError('删除失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getLevels(string $storeId)
    {
        try {
            $levels = AssistantLevel::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->order('sort_order')
                ->select()
                ->toArray();
            
            return $levels;
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function createLevel(array $params, string $storeId)
    {
        try {
            $level = AssistantLevel::create([
                'id' => 'level_' . substr(strval(time()), -8) . rand(1000, 9999),
                'store_id' => $storeId,
                'name' => $params['name'],
                'code' => $params['code'] ?? 'custom_' . substr(strval(time()), -8),
                'color' => $params['color'] ?? '#94a3b8',
                'hourly_rate' => $params['hourly_rate'] ?? 60,
                'billing_rule' => $params['billing_rule'] ?? 'half_hour',
                'description' => $params['description'] ?? '',
                'sort_order' => $params['sort_order'] ?? 0,
                'status' => 1,
            ]);
            
            return $level->toArray();
        } catch (\Exception $e) {
            self::setError('创建失败：' . $e->getMessage());
            return false;
        }
    }

    public static function updateLevel(string $id, array $params, string $storeId)
    {
        try {
            $level = AssistantLevel::where('id', $id)
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
            if (isset($params['hourly_rate'])) $updateData['hourly_rate'] = $params['hourly_rate'];
            if (isset($params['billing_rule'])) $updateData['billing_rule'] = $params['billing_rule'];
            if (isset($params['description'])) $updateData['description'] = $params['description'];
            if (isset($params['sort_order'])) $updateData['sort_order'] = $params['sort_order'];
            if (isset($params['status'])) { $statusMap = ['rest' => 0, 'available' => 1, 'serving' => 2, 'busy' => 1]; $updateData['status'] = $statusMap[$params['status']] ?? (int)$params['status']; }
            
            if (!empty($updateData)) {
                $level->save($updateData);
            }
            
            return $level->toArray();
        } catch (\Exception $e) {
            self::setError('更新失败：' . $e->getMessage());
            return false;
        }
    }

    public static function deleteLevel(string $id, string $storeId)
    {
        try {
            $level = AssistantLevel::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$level) {
                self::setError('等级不存在');
                return false;
            }
            
            $count = Assistant::where('level_id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->count();
            
            if ($count > 0) {
                self::setError('该等级下存在助教，无法删除');
                return false;
            }
            
            $level->delete();
            return true;
        } catch (\Exception $e) {
            self::setError('删除失败：' . $e->getMessage());
            return false;
        }
    }

    public static function initLevels(string $storeId)
    {
        try {
            $existing = AssistantLevel::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->select()
                ->toArray();

            if (!empty($existing)) {
                return $existing;
            }

            $defaultLevels = AssistantLevel::where('store_id', 'default')
                ->whereNull('deleted_at')
                ->order('sort_order')
                ->select()
                ->toArray();

            if (empty($defaultLevels)) {
                self::setError('没有找到默认等级数据');
                return false;
            }

            $newLevels = [];
            foreach ($defaultLevels as $level) {
                $newId = 'level_' . $level['code'];

                $idExists = AssistantLevel::where('id', $newId)->find();
                if ($idExists) {
                    $newId = 'level_' . $level['code'] . '_' . substr(md5($storeId), 0, 6);
                }

                $newLevel = AssistantLevel::create([
                    'id' => $newId,
                    'store_id' => $storeId,
                    'name' => $level['name'],
                    'code' => $level['code'],
                    'color' => $level['color'],
                    'hourly_rate' => $level['hourly_rate'],
                    'billing_rule' => $level['billing_rule'] ?? 'half_hour',
                    'description' => $level['description'],
                    'sort_order' => $level['sort_order'],
                    'status' => $level['status'],
                ]);

                $newLevels[] = $newLevel->toArray();
            }

            return $newLevels;
        } catch (\Exception $e) {
            self::setError('初始化等级失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getSchedules(string $assistantId, string $startDate, string $endDate)
    {
        try {
            $assistant = Assistant::where('id', $assistantId)
                ->whereNull('deleted_at')
                ->find();

            if (!$assistant) {
                self::setError('助教不存在');
                return false;
            }

            $schedules = EmployeeSchedule::where('employee_id', $assistant['employee_id'])
                ->where('employee_type', 'assistant')
                ->whereBetween('work_date', [$startDate, $endDate])
                ->whereNull('deleted_at')
                ->order('work_date', 'asc')
                ->select()
                ->toArray();

            foreach ($schedules as &$item) {
                $item['assistant_id'] = $assistantId;
                if (isset($item['work_date'])) {
                    $item['date'] = $item['work_date'];
                    unset($item['work_date']);
                }
                if (isset($item['shift_type'])) {
                    $item['shift'] = $item['shift_type'];
                    unset($item['shift_type']);
                }
                $item['employee_name'] = $assistant['name'] ?? '';
                unset($item['employee_id']);
                unset($item['employee_type']);
                unset($item['check_in_time']);
                unset($item['check_out_time']);
                unset($item['description']);
            }

            return $schedules;
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function setSchedule(array $params, string $storeId)
    {
        try {
            $assistant = Assistant::where('id', $params['assistant_id'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$assistant) {
                self::setError('助教不存在');
                return false;
            }

            foreach ($params['schedules'] as $schedule) {
                $date = $schedule['date'];
                $newStart = $schedule['start_time'];
                $newEnd = $schedule['end_time'];

                $existingSchedules = EmployeeSchedule::where('employee_id', $assistant['employee_id'])
                    ->where('employee_type', 'assistant')
                    ->where('work_date', $date)
                    ->whereNull('deleted_at')
                    ->select()
                    ->toArray();

                foreach ($existingSchedules as $existing) {
                    $existStart = $existing['start_time'];
                    $existEnd = $existing['end_time'];

                    $isCrossDay = strtotime($existEnd) < strtotime($existStart);

                    if ($isCrossDay) {
                        $overlapWithStart = strtotime($newStart) >= strtotime($existStart) || strtotime($newStart) < strtotime($existEnd);
                        $overlapWithEnd = strtotime($newEnd) > strtotime($existStart) || strtotime($newEnd) <= strtotime($existEnd);
                        if ($overlapWithStart || $overlapWithEnd) {
                            self::setError("{$date} 已存在排班「{$existing['shift_type']}」，时间冲突");
                            return false;
                        }
                    } else {
                        if (strtotime($newStart) < strtotime($existEnd) && strtotime($newEnd) > strtotime($existStart)) {
                            self::setError("{$date} 已存在排班「{$existing['shift_type']}」，时间冲突");
                            return false;
                        }
                    }
                }

                EmployeeSchedule::create([
                    'id' => 'schedule_' . substr(strval(time()), -8) . rand(1000, 9999),
                    'employee_id' => $assistant['employee_id'],
                    'employee_type' => 'assistant',
                    'store_id' => $storeId,
                    'work_date' => $schedule['date'],
                    'shift_type' => $schedule['shift'],
                    'start_time' => $schedule['start_time'],
                    'end_time' => $schedule['end_time'],
                    'status' => 'scheduled',
                    'remark' => $schedule['remark'] ?? '',
                ]);
            }

            return true;
        } catch (\Exception $e) {
            self::setError('设置失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getShiftConfigs(string $storeId)
    {
        try {
            $configs = ShiftConfig::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->where('status', 1)
                ->order('sort_order')
                ->select()
                ->toArray();
            
            return $configs;
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function createShiftConfig(array $params, string $storeId)
    {
        try {
            if (empty($params['name'])) {
                self::setError('班次名称不能为空');
                return false;
            }
            
            if (empty($params['start_time'])) {
                self::setError('开始时间不能为空');
                return false;
            }
            
            if (empty($params['end_time'])) {
                self::setError('结束时间不能为空');
                return false;
            }
            
            $nameExists = ShiftConfig::where('store_id', $storeId)
                ->where('name', $params['name'])
                ->whereNull('deleted_at')
                ->find();
            
            if ($nameExists) {
                self::setError('班次名称已存在');
                return false;
            }
            
            $code = $params['code'] ?? '';
            if (empty($code)) {
                $code = 'shift_' . substr(strval(time()), -6) . '_' . rand(1000, 9999);
            } else {
                $codeExists = ShiftConfig::where('store_id', $storeId)
                    ->where('code', $code)
                    ->whereNull('deleted_at')
                    ->find();
                
                if ($codeExists) {
                    $code = $code . '_' . rand(1000, 9999);
                }
            }
            
            $config = ShiftConfig::create([
                'id' => 'shift_' . substr(strval(time()), -8) . rand(1000, 9999),
                'store_id' => $storeId,
                'name' => $params['name'],
                'code' => $code,
                'start_time' => $params['start_time'],
                'end_time' => $params['end_time'],
                'color' => $params['color'] ?? '#22c55e',
                'sort_order' => $params['sort_order'] ?? 0,
                'status' => $params['status'] ?? 1,
                'description' => $params['description'] ?? '',
            ]);
            
            return $config->toArray();
        } catch (\Exception $e) {
            self::setError('创建班次配置失败：' . $e->getMessage());
            return false;
        }
    }

    public static function updateShiftConfig(string $id, array $params, string $storeId)
    {
        try {
            $config = ShiftConfig::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$config) {
                self::setError('班次配置不存在');
                return false;
            }
            
            if (isset($params['name']) && $params['name'] !== $config['name']) {
                $nameExists = ShiftConfig::where('store_id', $storeId)
                    ->where('name', $params['name'])
                    ->where('id', '<>', $id)
                    ->whereNull('deleted_at')
                    ->find();
                
                if ($nameExists) {
                    self::setError('班次名称已存在');
                    return false;
                }
            }
            
            if (isset($params['code']) && $params['code'] !== $config['code']) {
                $codeExists = ShiftConfig::where('store_id', $storeId)
                    ->where('code', $params['code'])
                    ->where('id', '<>', $id)
                    ->whereNull('deleted_at')
                    ->find();
                
                if ($codeExists) {
                    self::setError('班次编码已存在');
                    return false;
                }
            }
            
            $updateData = [];
            if (isset($params['name'])) $updateData['name'] = $params['name'];
            if (isset($params['code'])) $updateData['code'] = $params['code'];
            if (isset($params['start_time'])) $updateData['start_time'] = $params['start_time'];
            if (isset($params['end_time'])) $updateData['end_time'] = $params['end_time'];
            if (isset($params['color'])) $updateData['color'] = $params['color'];
            if (isset($params['sort_order'])) $updateData['sort_order'] = $params['sort_order'];
            if (isset($params['status'])) { $statusMap = ['rest' => 0, 'available' => 1, 'serving' => 2, 'busy' => 1]; $updateData['status'] = $statusMap[$params['status']] ?? (int)$params['status']; }
            if (isset($params['description'])) $updateData['description'] = $params['description'];
            
            if (empty($updateData)) {
                self::setError('没有需要更新的数据');
                return false;
            }
            
            $config->save($updateData);
            
            return $config->toArray();
        } catch (\Exception $e) {
            self::setError('更新班次配置失败：' . $e->getMessage());
            return false;
        }
    }

    public static function deleteShiftConfig(string $id, string $storeId)
    {
        try {
            $config = ShiftConfig::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$config) {
                self::setError('班次配置不存在');
                return false;
            }
            
            $scheduleCount = EmployeeSchedule::where('shift_type', $config['code'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->count();
            
            if ($scheduleCount > 0) {
                self::setError('该班次下存在排班记录，无法删除');
                return false;
            }
            
            $config->delete();
            
            return true;
        } catch (\Exception $e) {
            self::setError('删除班次配置失败：' . $e->getMessage());
            return false;
        }
    }

    public static function initDefaultShiftConfigs(string $storeId)
    {
        try {
            $existing = ShiftConfig::where('store_id', $storeId)->count();
            if ($existing > 0) {
                return true;
            }
            
            $defaultConfigs = [
                [
                    'name' => '早班',
                    'code' => 'morning',
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'color' => '#22c55e',
                    'sort_order' => 1,
                    'description' => '上午9点到下午5点',
                ],
                [
                    'name' => '晚班',
                    'code' => 'evening',
                    'start_time' => '17:00:00',
                    'end_time' => '01:00:00',
                    'color' => '#3b82f6',
                    'sort_order' => 2,
                    'description' => '下午5点到凌晨1点',
                ],
                [
                    'name' => '全天班',
                    'code' => 'full_day',
                    'start_time' => '09:00:00',
                    'end_time' => '01:00:00',
                    'color' => '#f59e0b',
                    'sort_order' => 3,
                    'description' => '全天值班',
                ],
                [
                    'name' => '深夜班',
                    'code' => 'night',
                    'start_time' => '23:00:00',
                    'end_time' => '09:00:00',
                    'color' => '#8b5cf6',
                    'sort_order' => 4,
                    'description' => '深夜值班',
                ],
            ];
            
            foreach ($defaultConfigs as $config) {
                $code = $config['code'];
                $codeExists = ShiftConfig::where('store_id', $storeId)
                    ->where('code', $code)
                    ->whereNull('deleted_at')
                    ->find();
                
                if ($codeExists) {
                    $code = $code . '_' . rand(1000, 9999);
                }
                
                ShiftConfig::create([
                    'id' => 'shift_' . substr(strval(time()), -8) . rand(1000, 9999),
                    'store_id' => $storeId,
                    'name' => $config['name'],
                    'code' => $code,
                    'start_time' => $config['start_time'],
                    'end_time' => $config['end_time'],
                    'color' => $config['color'],
                    'sort_order' => $config['sort_order'],
                    'status' => 1,
                    'description' => $config['description'],
                ]);
            }
            
            return true;
        } catch (\Exception $e) {
            self::setError('初始化班次配置失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getOrders(array $params, string $storeId)
    {
        try {
            $query = Order::where('store_id', $storeId)
                ->where('type', 'assistant')
                ->whereNull('deleted_at');
            
            if (!empty($params['assistant_id'])) {
                $query->where('assistant_id', $params['assistant_id']);
            }
            
            if (!empty($params['status'])) {
                $query->where('status', $params['status']);
            }
            
            if (!empty($params['start_date']) && !empty($params['end_date'])) {
                $query->whereBetween('created_at', [$params['start_date'], $params['end_date'] . ' 23:59:59']);
            }
            
            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);
            
            $total = $query->count();
            $data = $query->order('created_at', 'desc')
                ->page($page, $pageSize)
                ->select()
                ->toArray();
            
            foreach ($data as &$item) {
                $detail = AssistantOrderDetail::where('order_id', $item['id'])->find();
                if ($detail) {
                    $item = array_merge($item, $detail->toArray());
                }
            }
            
            return [
                'data' => $data,
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

    public static function updateSchedule(string $id, array $params)
    {
        try {
            $schedule = EmployeeSchedule::where('id', $id)
                ->whereNull('deleted_at')
                ->find();

            if (!$schedule) {
                self::setError('排班不存在');
                return false;
            }

            $updateData = [];
            if (isset($params['date'])) $updateData['work_date'] = $params['date'];
            if (isset($params['shift'])) $updateData['shift_type'] = $params['shift'];
            if (isset($params['start_time'])) $updateData['start_time'] = $params['start_time'];
            if (isset($params['end_time'])) $updateData['end_time'] = $params['end_time'];
            if (isset($params['remark'])) $updateData['remark'] = $params['remark'];

            if (!empty($updateData)) {
                $schedule->save($updateData);
            }

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
                self::setError('排班不存在');
                return false;
            }

            $schedule->delete();
            return true;
        } catch (\Exception $e) {
            self::setError('删除失败：' . $e->getMessage());
            return false;
        }
    }

    public static function createOrder(array $params, string $storeId)
    {
        try {
            $assistant = Assistant::where('id', $params['assistant_id'])
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$assistant) {
                self::setError('助教不存在');
                return false;
            }
            
            $orderNo = 'AO' . date('YmdHis') . rand(1000, 9999);
            
            $order = Order::create([
                'id' => 'order_' . substr(strval(time()), -8) . rand(1000, 9999),
                'store_id' => $storeId,
                'order_no' => $orderNo,
                'type' => 'assistant',
                'status' => 'pending',
                'member_id' => $params['member_id'] ?? null,
                'assistant_id' => $params['assistant_id'],
                'original_amount' => $params['total_amount'],
                'discount_amount' => 0,
                'final_amount' => $params['total_amount'],
                'start_time' => $params['start_time'] ?? null,
                'operator_id' => $params['operator_id'] ?? null,
                'operator_name' => $params['operator_name'] ?? null,
                'remark' => $params['remark'] ?? '',
            ]);
            
            OrderItem::create([
                'id' => 'item_' . substr(strval(time()), -8) . rand(1000, 9999),
                'order_id' => $order['id'],
                'assistant_id' => $params['assistant_id'],
                'item_type' => 'assistant_service',
                'item_name' => $params['service_type'] === 'one_on_one' ? '一对一教学' : '小班课',
                'quantity' => 1,
                'unit' => '小时',
                'unit_price' => $params['unit_price'],
                'total_price' => $params['total_amount'],
                'discount_rate' => 100,
                'final_price' => $params['total_amount'],
                'description' => $params['student_name'] ?? '',
            ]);
            
            AssistantOrderDetail::create([
                'id' => 'detail_' . substr(strval(time()), -8) . rand(1000, 9999),
                'order_id' => $order['id'],
                'store_id' => $storeId,
                'assistant_id' => $params['assistant_id'],
                'member_id' => $params['member_id'] ?? null,
                'student_name' => $params['student_name'] ?? '',
                'student_phone' => $params['student_phone'] ?? '',
                'service_type' => $params['service_type'] ?? 'one_on_one',
                'duration' => $params['duration'],
                'start_time' => $params['start_time'] ?? null,
                'end_time' => $params['end_time'] ?? null,
                'remark' => $params['remark'] ?? '',
            ]);
            
            return $order->toArray();
        } catch (\Exception $e) {
            self::setError('创建订单失败：' . $e->getMessage());
            return false;
        }
    }

    public static function updateOrderStatus(string $orderId, string $status, string $storeId)
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$order) {
                self::setError('订单不存在');
                return false;
            }
            
            $allowedTransitions = [
                'pending' => ['in_progress', 'cancelled'],
                'in_progress' => ['completed'],
                'completed' => ['reviewed'],
                'cancelled' => [],
            ];
            
            if (!in_array($status, $allowedTransitions[$order['status']] ?? [])) {
                self::setError('状态转换不允许');
                return false;
            }
            
            $updateData = ['status' => $status];
            if ($status === 'completed') {
                $updateData['end_time'] = date('Y-m-d H:i:s');
                $updateData['completed_at'] = date('Y-m-d H:i:s');
            }
            
            $order->save($updateData);
            
            if ($status === 'completed') {
                $detail = AssistantOrderDetail::where('order_id', $orderId)->find();
                if ($detail) {
                    $detail->end_time = date('Y-m-d H:i:s');
                    $detail->save();
                }
            }
            
            return $order->toArray();
        } catch (\Exception $e) {
            self::setError('更新失败：' . $e->getMessage());
            return false;
        }
    }

    public static function submitReview(string $orderId, int $rating, string $review, string $storeId)
    {
        try {
            $order = Order::where('id', $orderId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();
            
            if (!$order) {
                self::setError('订单不存在');
                return false;
            }
            
            if ($order['status'] !== 'completed') {
                self::setError('订单未完成，无法评价');
                return false;
            }
            
            $detail = AssistantOrderDetail::where('order_id', $orderId)->find();
            if (!$detail) {
                self::setError('订单详情不存在');
                return false;
            }
            
            $detail->rating = $rating;
            $detail->review = $review;
            $detail->save();
            
            $order->status = 'reviewed';
            $order->save();
            
            $assistant = Assistant::where('id', $order['assistant_id'])->find();
            if ($assistant) {
                $totalOrders = $assistant['total_orders'] + 1;
                $totalRating = ($assistant['rating'] * $assistant['total_orders'] + $rating) / $totalOrders;
                
                $assistant->save([
                    'total_orders' => $totalOrders,
                    'rating' => round($totalRating, 1),
                ]);
            }
            
            return true;
        } catch (\Exception $e) {
            self::setError('评价失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getStats(string $storeId)
    {
        try {
            $assistants = Assistant::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->count();
            
            $today = date('Y-m-d');
            $todayStart = $today . ' 00:00:00';
            $todayEnd = $today . ' 23:59:59';
            $startOfMonth = date('Y-m-01 00:00:00');
            $endOfMonth = date('Y-m-t 23:59:59');
            $todayOrders = Order::where('store_id', $storeId)
                ->where('type', 'assistant')
                ->whereIn('status', ['completed', 'reviewed'])
                ->whereBetween('end_time', [$todayStart, $todayEnd])
                ->count();
            
            
            $monthOrders = Order::where('store_id', $storeId)
                ->where('type', 'assistant')
                ->where('status', 'completed')
                ->whereBetween('end_time', [$startOfMonth, $endOfMonth])
                ->sum('final_amount');
            
            $totalRevenue = Order::where('store_id', $storeId)
                ->where('type', 'assistant')
                ->where('status', 'completed')
                ->sum('final_amount');
            
            return [
                'total_assistants' => $assistants,
                'today_orders' => $todayOrders,
                'month_revenue' => $monthOrders ?? 0,
                'total_revenue' => $totalRevenue ?? 0,
            ];
        } catch (\Exception $e) {
            self::setError('统计失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getCommissionConfig(string $assistantId, string $storeId)
    {
        try {
            $config = CommissionConfig::where('assistant_id', $assistantId)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$config) {
                return null;
            }

            return $config->toArray();
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getAllCommissionConfigs(string $storeId)
    {
        try {
            $configs = CommissionConfig::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->where('status', 1)
                ->select()
                ->toArray();

            return $configs;
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function saveCommissionConfig(array $params, string $storeId)
    {
        try {
            $assistantIds = [];
            if (!empty($params['assistant_ids']) && is_array($params['assistant_ids'])) {
                $assistantIds = $params['assistant_ids'];
            } elseif (!empty($params['assistant_id'])) {
                $assistantIds = [$params['assistant_id']];
            }

            if (empty($assistantIds)) {
                self::setError('请选择助教');
                return false;
            }

            if (!in_array($params['commission_mode'] ?? '', ['no_guarantee', 'with_guarantee', 'base_salary'])) {
                self::setError('无效的提成模式');
                return false;
            }

            $results = [];
            foreach ($assistantIds as $assistantId) {
                $assistant = Assistant::where('id', $assistantId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();

                if (!$assistant) {
                    continue;
                }

                $existing = CommissionConfig::where('assistant_id', $assistantId)
                    ->where('store_id', $storeId)
                    ->whereNull('deleted_at')
                    ->find();

                $data = [
                    'store_id' => $storeId,
                    'assistant_id' => $assistantId,
                    'commission_type' => $params['commission_type'],
                    'commission_rate' => $params['commission_rate'] ?? 0,
                    'commission_mode' => $params['commission_mode'] ?? '',
                    'guarantee_hours' => $params['guarantee_hours'] ?? 0,
                    'guarantee_amount' => $params['guarantee_amount'] ?? 0,
                    'base_salary' => $params['base_salary'] ?? null,
                    'settlement_period' => $params['settlement_period'] ?? 'monthly',
                    'effective_date' => $params['effective_date'] ?? null,
                    'status' => $params['status'] ?? 1,
                    'remark' => $params['remark'] ?? '',
                ];

                if ($existing) {
                    $existing->save($data);
                    $results[] = $existing->toArray();
                } else {
                    $data['id'] = 'cc_' . substr(strval(time()), -8) . rand(1000, 9999);
                    $config = CommissionConfig::create($data);
                    $results[] = $config->toArray();
                }
            }

            return !empty($results) ? $results[0] : false;
        } catch (\Exception $e) {
            self::setError('保存失败：' . $e->getMessage());
            return false;
        }
    }

    public static function deleteCommissionConfig(string $id, string $storeId)
    {
        try {
            $config = CommissionConfig::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$config) {
                self::setError('提成配置不存在');
                return false;
            }

            $config->delete();
            return true;
        } catch (\Exception $e) {
            self::setError('删除失败：' . $e->getMessage());
            return false;
        }
    }

    public static function calculateCommission(string $assistantId, string $orderItemId, float $orderAmount, string $storeId): ?float
    {
        $config = CommissionConfig::where('assistant_id', $assistantId)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->find();

        if (!$config) {
            return null;
        }

        // 幂等检查：同一订单项已计算过提成则跳过
        $existing = CommissionRecord::where('order_item_id', $orderItemId)->find();
        if ($existing) {
            return (float)$existing['commission_amount'];
        }

        $commissionAmount = 0.00;

        switch ($config['commission_type']) {
            case 'percentage':
                $commissionAmount = round($orderAmount * ((float)$config['commission_rate']) / 100, 2);
                break;
            case 'fixed':
                $commissionAmount = (float)$config['commission_rate'];
                break;
            case 'mixed':
                $commissionAmount = round($orderAmount * ((float)$config['commission_rate']) / 100, 2);
                break;
        }

        CommissionRecord::create([
            'id' => 'cr_' . substr(strval(time()), -8) . rand(1000, 9999),
            'store_id' => $storeId,
            'assistant_id' => $assistantId,
            'order_item_id' => $orderItemId,
            'order_amount' => $orderAmount,
            'commission_type' => $config['commission_type'],
            'commission_rate' => (float)$config['commission_rate'],
            'commission_amount' => $commissionAmount,
            'status' => 'pending',
        ]);

        return $commissionAmount;
    }

    /**
     * Settle monthly commission for an assistant
     * @param string $assistantId
     * @param string $month Format: YYYY-MM
     * @param string $storeId
     * @return array|bool
     */
    public static function settleMonthlyCommission(string $assistantId, string $month, string $storeId): array|bool
    {
        $config = CommissionConfig::where('assistant_id', $assistantId)
            ->where('store_id', $storeId)
            ->where('status', 1)
            ->whereNull('deleted_at')
            ->find();
        if (!$config) {
            self::setError('未配置提成规则');
            return false;
        }

        $startDate = "{$month}-01";
        $endDate = date('Y-m-t', strtotime($startDate));

        // Get actual service duration: OrderItem time minus pause time
        $items = OrderItem::where('assistant_id', $assistantId)
            ->where('item_type', 'assistant')
            ->where('started_at', '>=', $startDate . ' 00:00:00')
            ->where('started_at', '<=', $endDate . ' 23:59:59')
            ->whereNotNull('started_at')
            ->select()
            ->toArray();
        $serviceSeconds = 0;
        foreach ($items as $item) {
            $endTime = $item['ended_at'] ?: date('Y-m-d H:i:s');
            $serviceSeconds += max(0, strtotime($endTime) - strtotime($item['started_at']));
        }

        $pauseSeconds = OrderPauseLog::alias('pl')
            ->join('busi_order_item oi', 'oi.order_id = pl.order_id AND oi.item_type = "assistant"')
            ->where('pl.pause_type', 'assistant')
            ->where('oi.assistant_id', $assistantId)
            ->whereBetween('pl.created_at', [$startDate, $endDate . ' 23:59:59'])
            ->sum('pl.duration_seconds');

        $tableSeconds = max(0, ($serviceSeconds ?: 0) - ($pauseSeconds ?: 0));
        $tableHours = ($tableSeconds ?: 0) / 3600;

        // Get commission total for the month
        $commissionTotal = CommissionRecord::where('assistant_id', $assistantId)
            ->whereBetween('created_at', [$startDate, $endDate . ' 23:59:59'])
            ->sum('commission_amount');

        // Calculate salary based on commission mode
        $mode = $config['commission_mode'] ?? '';
        $salary = match ($mode) {
            'no_guarantee' => (float)$commissionTotal,
            'with_guarantee' => ($tableHours >= ((float)$config['guarantee_hours']))
                ? (float)$commissionTotal
                : (float)$config['guarantee_amount'],
            'base_salary' => ((float)$config['base_salary']) + (float)$commissionTotal,
            default => (float)$commissionTotal,
        };

        $note = '';
        if ($mode === 'with_guarantee' && $tableHours < ((float)$config['guarantee_hours'])) {
            $note = '上桌' . round($tableHours, 2) . 'h < 保底' . $config['guarantee_hours'] . 'h，触发保底';
        }

        return [
            'assistant_id' => $assistantId,
            'commission_mode' => $mode,
            'table_duration_hours' => round($tableHours, 2),
            'commission_total' => round((float)$commissionTotal, 2),
            'base_or_guarantee' => $mode === 'base_salary' ? (float)$config['base_salary'] : (float)$config['guarantee_amount'],
            'salary_total' => round($salary, 2),
            'note' => $note,
        ];
    }

    public static function getCommissionRecords(array $params, string $storeId)
    {
        try {
            $page = (int)($params['page'] ?? 1);
            $pageSize = (int)($params['page_size'] ?? 20);

            $query = CommissionRecord::where('store_id', $storeId);

            if (!empty($params['assistant_id'])) {
                $query->where('assistant_id', $params['assistant_id']);
            }
            if (!empty($params['status'])) {
                $query->where('status', $params['status']);
            }
            if (!empty($params['start_date'])) {
                $query->where('created_at', '>=', $params['start_date'] . ' 00:00:00');
            }
            if (!empty($params['end_date'])) {
                $query->where('created_at', '<=', $params['end_date'] . ' 23:59:59');
            }

            $total = $query->count();
            $records = $query->order('created_at', 'desc')
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

    public static function markCommissionPaid(array $ids, string $storeId)
    {
        try {
            $now = date('Y-m-d H:i:s');
            CommissionRecord::whereIn('id', $ids)
                ->where('store_id', $storeId)
                ->where('status', 'pending')
                ->update([
                    'status' => 'paid',
                    'paid_at' => $now,
                ]);

            return true;
        } catch (\Exception $e) {
            self::setError('操作失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getCommissionStats(string $storeId, array $params = [])
    {
        try {
            $baseQuery = CommissionRecord::where('store_id', $storeId);

            if (!empty($params['assistant_id'])) {
                $baseQuery->where('assistant_id', $params['assistant_id']);
            }
            if (!empty($params['start_date'])) {
                $baseQuery->where('created_at', '>=', $params['start_date'] . ' 00:00:00');
            }
            if (!empty($params['end_date'])) {
                $baseQuery->where('created_at', '<=', $params['end_date'] . ' 23:59:59');
            }

            $totalCommission = (clone $baseQuery)->where('status', '<>', 'cancelled')->sum('commission_amount');
            $paidCommission = (clone $baseQuery)->where('status', 'paid')->sum('commission_amount');
            $pendingCommission = (clone $baseQuery)->where('status', 'pending')->sum('commission_amount');

            return [
                'total_commission' => $totalCommission ?? 0,
                'paid_commission' => $paidCommission ?? 0,
                'pending_commission' => $pendingCommission ?? 0,
            ];
        } catch (\Exception $e) {
            self::setError('统计失败：' . $e->getMessage());
            return false;
        }
    }

    public static function getServices(string $storeId)
    {
        try {
            $services = AssistantService::where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->order('sort_order')
                ->select()
                ->toArray();

            return $services;
        } catch (\Exception $e) {
            self::setError('查询失败：' . $e->getMessage());
            return false;
        }
    }

    public static function createService(array $params, string $storeId)
    {
        try {
            if (empty($params['name'])) {
                self::setError('服务名称不能为空');
                return false;
            }

            if (!isset($params['price']) || $params['price'] < 0) {
                self::setError('价格不能为空');
                return false;
            }

            $service = AssistantService::create([
                'id' => 'svc_' . substr(strval(time()), -8) . rand(1000, 9999),
                'store_id' => $storeId,
                'employee_id' => $params['employee_id'] ?? '',
                'icon' => $params['icon'] ?? '',
                'name' => $params['name'],
                'description' => $params['description'] ?? '',
                'price' => $params['price'],
                'unit' => $params['unit'] ?? '次',
                'sort_order' => $params['sort_order'] ?? 0,
                'status' => $params['status'] ?? 1,
            ]);

            return $service->toArray();
        } catch (\Exception $e) {
            self::setError('创建失败：' . $e->getMessage());
            return false;
        }
    }

    public static function updateService(string $id, array $params, string $storeId)
    {
        try {
            $service = AssistantService::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$service) {
                self::setError('服务项目不存在');
                return false;
            }

            $updateData = [];
            if (isset($params['employee_id'])) $updateData['employee_id'] = $params['employee_id'];
            if (isset($params['icon'])) $updateData['icon'] = $params['icon'];
            if (isset($params['name'])) $updateData['name'] = $params['name'];
            if (isset($params['description'])) $updateData['description'] = $params['description'];
            if (isset($params['price'])) $updateData['price'] = $params['price'];
            if (isset($params['unit'])) $updateData['unit'] = $params['unit'];
            if (isset($params['sort_order'])) $updateData['sort_order'] = $params['sort_order'];
            if (isset($params['status'])) { $statusMap = ['rest' => 0, 'available' => 1, 'serving' => 2, 'busy' => 1]; $updateData['status'] = $statusMap[$params['status']] ?? (int)$params['status']; }

            if (empty($updateData)) {
                self::setError('没有需要更新的数据');
                return false;
            }

            $service->save($updateData);

            return $service->toArray();
        } catch (\Exception $e) {
            self::setError('更新失败：' . $e->getMessage());
            return false;
        }
    }

    public static function deleteService(string $id, string $storeId)
    {
        try {
            $service = AssistantService::where('id', $id)
                ->where('store_id', $storeId)
                ->whereNull('deleted_at')
                ->find();

            if (!$service) {
                self::setError('服务项目不存在');
                return false;
            }

            $service->delete();

            return true;
        } catch (\Exception $e) {
            self::setError('删除失败：' . $e->getMessage());
            return false;
        }
    }
}