<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\CheckinLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;
use app\common\service\UploadService;
use app\common\enum\FileEnum;
use app\common\model\merchant\Employee;
use app\common\model\merchant\EmployeeAttendance;
use app\common\model\merchant\CheckinPhoto;
use Exception;

class CheckinController extends BaseStoreController
{
    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function signIn()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;
        $params['type'] = 'sign_in';

        $result = CheckinLogic::signIn($params);
        if ($result === false) {
            return JsonService::fail(CheckinLogic::getError());
        }
        return JsonService::success('签到成功', $result->toArray());
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function signOut()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;
        $params['type'] = 'sign_out';

        $result = CheckinLogic::signOut($params);
        if ($result === false) {
            return JsonService::fail(CheckinLogic::getError());
        }
        return JsonService::success('签退成功', $result->toArray());
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function records()
    {
        $page = $this->request->get('page_no', 1);
        $pageSize = $this->request->get('page_size', 20);

        $result = CheckinLogic::getRecords($this->employeeId, $page, $pageSize);
        return JsonService::data($result);
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function todayStatus()
    {
        $result = CheckinLogic::getTodayStatus($this->employeeId);
        return JsonService::data($result);
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function applyOutwork()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;
        $params['type'] = 'outwork';

        $result = CheckinLogic::applyOutwork($params);
        if ($result === false) {
            return JsonService::fail(CheckinLogic::getError());
        }
        return JsonService::success('申请成功', $result->toArray());
    }

    #[Permission('mobile:report', '考勤报表', 'mobile', '考勤', ['boss', 'manager', 'admin', 'owner'])]
    public function dailyAttendance()
    {
        $date = $this->request->get('date', date('Y-m-d'));
        $storeId = $this->storeId;

        $result = CheckinLogic::dailyAttendance($storeId, $date);
        return JsonService::success('获取成功', $result);
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function uploadPhotos()
    {
        try {
            // Delegate to shared UploadService — same pattern as UploadController::image
            $result = UploadService::image(0, 0, FileEnum::SOURCE_USER, 'uploads/checkin');
            return JsonService::success('上传成功', $result);
        } catch (Exception $e) {
            return JsonService::fail($e->getMessage());
        }
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function signInWithPhotos()
    {
        $photoUrls = $this->request->post('photo_urls', []);
        if (!is_array($photoUrls)) {
            $photoUrls = explode(',', $photoUrls);
        }
        if (count($photoUrls) < 3) {
            return JsonService::fail('请上传至少3张打卡照片');
        }

        $employeeId = $this->employeeId;
        $storeId = $this->storeId;
        $today = date('Y-m-d');

        // Derive employee_type from actual role instead of hardcoding 'assistant'
        $employee = Employee::where('id', $employeeId)->find();
        $employeeType = ($employee && $employee->role === 'assistant') ? 'assistant' : 'employee';

        $exist = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('work_date', $today)
            ->where('type', 'sign_in')
            ->find();
        if ($exist) {
            return JsonService::fail('今天已签到');
        }

        $now = date('Y-m-d H:i:s');
        $attendance = EmployeeAttendance::create([
            'id' => 'att-' . uniqid(),
            'employee_id' => $employeeId,
            'store_id' => $storeId,
            'work_date' => $today,
            'type' => 'sign_in',
            'employee_type' => $employeeType,
            'has_photos' => 1,
            'check_in_time' => $now,
            'latitude' => $this->request->post('latitude', ''),
            'longitude' => $this->request->post('longitude', ''),
            'location_address' => $this->request->post('location_address', ''),
            'status' => 'normal',
        ]);

        foreach ($photoUrls as $i => $url) {
            CheckinPhoto::create([
                'id' => 'att-photo-' . uniqid(),
                'attendance_id' => $attendance->id,
                'employee_id' => $employeeId,
                'photo_url' => $url,
                'sort_order' => $i + 1,
            ]);
        }

        return JsonService::success('签到成功', $attendance->toArray());
    }

    #[Permission('mobile:checkin', '打卡签到', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier'])]
    public function signOutWithPhotos()
    {
        $photoUrls = $this->request->post('photo_urls', []);
        if (!is_array($photoUrls)) {
            $photoUrls = explode(',', $photoUrls);
        }
        if (count($photoUrls) < 3) {
            return JsonService::fail('请上传至少3张打卡照片');
        }

        $employeeId = $this->employeeId;
        $storeId = $this->storeId;
        $today = date('Y-m-d');

        // Derive employee_type from actual role instead of hardcoding 'assistant'
        $employee = Employee::where('id', $employeeId)->find();
        $employeeType = ($employee && $employee->role === 'assistant') ? 'assistant' : 'employee';

        $signIn = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('work_date', $today)
            ->where('type', 'sign_in')
            ->find();
        if (!$signIn) {
            return JsonService::fail('今日未签到，无法签退');
        }

        $exist = EmployeeAttendance::where('employee_id', $employeeId)
            ->where('work_date', $today)
            ->where('type', 'sign_out')
            ->find();
        if ($exist) {
            return JsonService::fail('今天已签退');
        }

        $now = date('Y-m-d H:i:s');
        $attendance = EmployeeAttendance::create([
            'id' => 'att-' . uniqid(),
            'employee_id' => $employeeId,
            'store_id' => $storeId,
            'work_date' => $today,
            'type' => 'sign_out',
            'employee_type' => $employeeType,
            'has_photos' => 1,
            'check_out_time' => $now,
            'latitude' => $this->request->post('latitude', ''),
            'longitude' => $this->request->post('longitude', ''),
            'location_address' => $this->request->post('location_address', ''),
            'status' => 'normal',
        ]);

        foreach ($photoUrls as $i => $url) {
            CheckinPhoto::create([
                'id' => 'att-photo-' . uniqid(),
                'attendance_id' => $attendance->id,
                'employee_id' => $employeeId,
                'photo_url' => $url,
                'sort_order' => $i + 1,
            ]);
        }

        return JsonService::success('签退成功', $attendance->toArray());
    }
}
