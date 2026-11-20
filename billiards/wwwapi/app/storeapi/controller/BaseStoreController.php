<?php

declare (strict_types=1);

namespace app\storeapi\controller;

use think\App;
use app\common\controller\BaseLikeAdminController;
use app\storeapi\logic\role\PermissionLogic;
use app\storeapi\service\EmployeeTokenService;

class BaseStoreController extends BaseLikeAdminController
{
    protected string $employeeId = '';
    protected string $employeeName = '';
    protected array $employeeInfo = [];
    protected string $storeId = '';
    protected string $userId = '';

    public function initialize()
    {
        if (isset($this->request->employeeInfo) && $this->request->employeeInfo) {
            $this->employeeInfo = $this->request->employeeInfo;
            $this->employeeId = $this->request->employeeId;
            $this->employeeName = $this->employeeInfo['name'] ?? '';
            $this->storeId = $this->request->get('store_id', '') ?: $this->request->post('store_id', '') ?: $this->request->storeId;
            $this->userId = $this->request->employeeId;
        } else {
            $this->storeId = $this->request->get('store_id', '') ?: $this->request->post('store_id', '');
        }
        
        if (empty($this->employeeId)) {
            $token = $this->request->header('Authorization', '');
            if ($token && str_starts_with($token, 'Bearer ')) {
                $token = substr($token, 7);
            }
            
            if (!empty($token)) {
                $info = EmployeeTokenService::getEmployeeInfo($token);
                if ($info && !empty($info['id'])) {
                    $this->employeeId = $info['id'];
                    $this->employeeName = $info['name'] ?? '';
                    $this->employeeInfo = $info;
                    if (empty($this->storeId)) {
                        $this->storeId = $info['store_id'] ?? '';
                    }
                    $this->userId = $this->employeeId;
                    
                    $this->request->employeeInfo = $info;
                    $this->request->employeeId = $info['id'];
                    if (empty($this->request->storeId)) {
                        $this->request->storeId = $this->storeId;
                    }
                }
            }
        }
    }
    
    protected function getStoreId(): string
    {
        return $this->storeId;
    }

    protected function checkPermission(string $permissionCode): void
    {
        if (empty($this->employeeId)) {
            return;
        }

        if (($this->employeeInfo['role'] ?? '') === 'boss') {
            return;
        }

        $hasPermission = PermissionLogic::hasPermission($this->employeeId, $permissionCode, $this->storeId);
        if (!$hasPermission) {
            throw new \think\exception\HttpException(403, '无权限访问');
        }
    }
}