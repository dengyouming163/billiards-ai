<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\ProfileLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ProfileController extends BaseStoreController
{
    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function index()
    {
        $result = ProfileLogic::getProfile($this->employeeId, $this->storeId);
        $result['status'] = (int)(\app\common\model\merchant\Assistant::where('employee_id', $this->employeeId)->value('status') ?? 0);
        return JsonService::data($result);
    }

    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function update()
    {
        $data = $this->request->post();
        $result = ProfileLogic::updateProfile($this->employeeId, $data);
        if ($result === false) {
            return JsonService::fail(ProfileLogic::getError());
        }
        return JsonService::success('更新成功');
    }

    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function uploadAlbum()
    {
        $filePath = $this->request->post('file_path');
        $result = ProfileLogic::uploadAlbum($this->employeeId, $filePath);
        if ($result === false) {
            return JsonService::fail(ProfileLogic::getError());
        }
        return JsonService::data($result);
    }
    
    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function uploadAvatar()
    {
        $filePath = $this->request->post('file_path');
        $result = ProfileLogic::uploadAvatar($this->employeeId, $filePath);
        if ($result === null) {
            return JsonService::fail('上传失败');
        }
        return JsonService::data($result);
    }

    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function deleteAlbum()
    {
        $url = $this->request->post('url');
        $result = ProfileLogic::deleteAlbum($this->employeeId, $url);
        if ($result === false) {
            return JsonService::fail(ProfileLogic::getError());
        }
        return JsonService::success('删除成功');
    }
    
    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function saveService()
    {
        $data = $this->request->post();
        $result = ProfileLogic::saveService($this->employeeId, $this->storeId, $data);
        if ($result === null) {
            return JsonService::fail('保存失败');
        }
        return JsonService::data($result);
    }
    
    #[Permission('mobile:profile', '个人资料', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function deleteService()
    {
        $serviceId = $this->request->post('id');
        $result = ProfileLogic::deleteService($this->employeeId, $serviceId);
        if ($result === false) {
            return JsonService::fail('删除失败');
        }
        return JsonService::success('删除成功');
    }
}
