<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use think\App;
use app\common\controller\BaseLikeAdminController;
use app\storeapi\service\PosEmployeeTokenService;
use app\common\service\JsonService;

class BasePosController extends BaseLikeAdminController
{
    protected string $employeeId = '';
    protected string $employeeName = '';
    protected array $employeeInfo = [];
    protected string $storeId = '';
    protected string $userId = '';

    public function __construct(App $app)
    {
        parent::__construct($app);
    }

    public function initialize()
    {
        parent::initialize();
        
        $token = $this->request->header('Authorization');
        if ($token && str_starts_with($token, 'Bearer ')) {
            $token = substr($token, 7);
        }
        
        $isNotNeedLogin = $this->isNotNeedLogin();
        
        if (empty($token) && !$isNotNeedLogin) {
            JsonService::fail('请先登录', [], 2001)->send();
            exit;
        }
        
        $employeeInfo = null;
        if (!empty($token)) {
            $employeeInfo = PosEmployeeTokenService::getEmployeeInfo($token);
        }
        
        if (empty($employeeInfo) && !$isNotNeedLogin) {
            JsonService::fail('登录超时，请重新登录', [], 2002)->send();
            exit;
        }
        
        if ($employeeInfo) {
            PosEmployeeTokenService::refreshToken($token);
        }
        
        $this->employeeInfo = $employeeInfo ?? [];
        $this->employeeId = $employeeInfo['id'] ?? '';
        $this->employeeName = $employeeInfo['name'] ?? '';
        // 请求参数中的 store_id 优先（用户显式选择的门店），token 中的作为兜底
        $requestStoreId = $this->request->get('store_id', '') ?: $this->request->post('store_id', '');
        $this->storeId = $requestStoreId ?: ($employeeInfo['store_id'] ?? '');
        $this->userId = $this->employeeId;
        
        $this->request->employeeInfo = $this->employeeInfo;
        $this->request->employeeId = $this->employeeId;
        $this->request->storeId = $this->storeId;
    }
    
    public function isNotNeedLogin(): bool
    {
        if (property_exists($this, 'notNeedLogin') && is_array($this->notNeedLogin)) {
            $action = strtolower($this->request->action());
            return in_array($action, array_map('strtolower', $this->notNeedLogin));
        }
        return false;
    }
    
    protected function getStoreId(): string
    {
        return $this->storeId;
    }

    protected function getEmployeeId(): string
    {
        return $this->employeeId;
    }

    protected function getEmployeeInfo(): array
    {
        return $this->employeeInfo;
    }
}
