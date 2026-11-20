<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Table;
use app\common\constants\TableStatus;
use think\facade\Cache;

class AuthController extends BaseTabletController
{
    public array $notNeedLogin = ['login'];
    
    /**
     * 标准化台桌状态值
     */
    private function normalizeTableStatus($status): string
    {
        if (empty($status)) {
            return TableStatus::IDLE;
        }
        
        $statusMap = [
            '0' => TableStatus::IDLE,
            'normal' => TableStatus::IDLE,
            'available' => TableStatus::IDLE,
            'free' => TableStatus::IDLE,
            TableStatus::IDLE => TableStatus::IDLE,
            
            '1' => TableStatus::OCCUPIED,
            'using' => TableStatus::OCCUPIED,
            'busy' => TableStatus::OCCUPIED,
            'in_use' => TableStatus::OCCUPIED,
            TableStatus::OCCUPIED => TableStatus::OCCUPIED,
            
            '2' => TableStatus::RESERVED,
            'booked' => TableStatus::RESERVED,
            TableStatus::RESERVED => TableStatus::RESERVED,
            
            '3' => TableStatus::MAINTENANCE,
            'repair' => TableStatus::MAINTENANCE,
            'broken' => TableStatus::MAINTENANCE,
            TableStatus::MAINTENANCE => TableStatus::MAINTENANCE,
        ];
        
        $key = strtolower(trim((string)$status));
        return $statusMap[$key] ?? TableStatus::IDLE;
    }
    
    public function login()
    {
        $code = $this->request->post('code');
        
        if (empty($code)) {
            return $this->fail('请输入台桌编码');
        }
        
        if (!preg_match('/^\d{4,8}$/', $code)) {
            return $this->fail('台桌编码必须为4-8位数字');
        }
        
        $table = Table::where('code', $code)
            ->find();
        
        if (!$table) {
            return $this->fail('台桌编码不存在或已停用');
        }
        
        $token = $this->generateToken($table->id);
        
        Cache::set('tablet_token:' . $token, [
            'table_id' => $table->id,
            'store_id' => $table->store_id,
            'table_code' => $table->code,
            'table_name' => $table->name,
        ], 7200);
        
        return $this->success('登录成功', [
            'token' => $token,
            'table' => [
                'id' => $table->id,
                'code' => $table->code,
                'name' => $table->name,
                'store_id' => $table->store_id,
                'type' => $table->type,
                'status' => $this->normalizeTableStatus($table->status),
                'hourly_rate' => $table->hourly_rate,
            ],
        ]);
    }
    
    public function info()
    {
        $tableInfo = $this->getTableInfo();
        
        if (!$tableInfo) {
            return $this->fail('登录失效，请重新登录', [], 401);
        }
        
        $table = Table::find($tableInfo['table_id']);
        
        if (!$table) {
            return $this->fail('台桌不存在');
        }
        
        return $this->success('获取成功', [
            'id' => $table->id,
            'code' => $table->code,
            'name' => $table->name,
            'store_id' => $table->store_id,
            'type' => $table->type,
            'status' => $this->normalizeTableStatus($table->status),
            'hourly_rate' => $table->hourly_rate,
        ]);
    }
    
    public function logout()
    {
        $token = $this->request->header('Authorization');
        if ($token) {
            $token = str_replace('Bearer ', '', $token);
            Cache::delete('tablet_token:' . $token);
        }
        
        return $this->success('退出成功');
    }
    
    private function generateToken($tableId): string
    {
        return md5(uniqid('tablet_' . $tableId . '_', true));
    }
    
    public static function getTableInfoFromToken($token)
    {
        return Cache::get('tablet_token:' . $token);
    }
    
    private function getTableInfo()
    {
        $token = $this->request->header('Authorization');
        if (empty($token)) {
            return null;
        }
        $token = str_replace('Bearer ', '', $token);
        return Cache::get('tablet_token:' . $token);
    }
}
