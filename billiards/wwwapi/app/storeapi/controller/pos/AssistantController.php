<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantLevel;
use app\common\model\merchant\AssistantOrder;
use app\storeapi\logic\order\AssistantOrderLogic;

class AssistantController extends BasePosController
{
    public function lists()
    {
        $assistants = Assistant::where('status', 1)
            ->where('store_id', $this->storeId)
            ->select()
            ->toArray();

        $levels = AssistantLevel::where('status', 1)->select()->toArray();
        $levelMap = [];
        foreach ($levels as $level) {
            $levelMap[$level['id']] = $level['name'];
        }

        // 批量查询助教资料（相册/头像/标签/签名）
        $employeeIds = array_column($assistants, 'employee_id');
        $employeeIds = array_filter(array_unique($employeeIds));
        $profileMap = [];
        if (!empty($employeeIds)) {
            $profiles = \think\facade\Db::name('busi_assistant_profile')
                ->whereIn('employee_id', $employeeIds)
                ->whereNull('deleted_at')
                ->select()
                ->toArray();
            foreach ($profiles as $p) {
                $profileMap[$p['employee_id']] = $p;
            }
        }

        foreach ($assistants as &$assistant) {
            $currentOrder = AssistantOrder::where('assistant_id', $assistant['id'])
                ->where('status', 'in_progress')
                ->find();

            $assistant['hourly_rate'] = (float)($assistant['hourly_rate'] ?? 0);
            $assistant['is_busy'] = !empty($currentOrder);
            $assistant['status'] = $assistant['is_busy'] ? 'busy' : 'available';
            $assistant['current_order_id'] = $currentOrder ? $currentOrder['id'] : null;
            $assistant['level_name'] = $levelMap[$assistant['level_id']] ?? '初级教练';
            $assistant['introduction'] = $assistant['description'] ?? '暂无介绍';

            // 关联助教资料：头像、相册、标签、签名
            $profile = $profileMap[$assistant['employee_id']] ?? null;
            $normalizeUrl = function($url) {
                if (empty($url)) return $url;
                return str_replace(
                    ['http://127.0.0.1:10002', 'http://localhost:10002'],
                    'https://poolapi.kyyp.cn',
                    $url
                );
            };
            if ($profile) {
                $assistant['avatar']      = $normalizeUrl($profile['avatar'] ?: $assistant['avatar'] ?? '');
                $assistant['nickname']    = $profile['nickname'] ?? $assistant['name'];
                $assistant['signature']   = $profile['signature'] ?? '';
                $assistant['tags']        = json_decode($profile['tags'] ?? '[]', true) ?: [];
                $assistant['album']       = array_map($normalizeUrl, json_decode($profile['album'] ?? '[]', true) ?: []);
            } else {
                $assistant['avatar']      = $normalizeUrl($assistant['avatar'] ?? '');
                $assistant['nickname']    = $assistant['name'];
                $assistant['signature']   = '';
                $assistant['tags']        = [];
                $assistant['album']       = [];
            }
        }

        return $this->success('获取成功', $assistants);
    }

    public function services()
    {
        $orderId = $this->request->get('order_id', '');
        
        if (empty($orderId)) {
            $result = AssistantOrderLogic::getAllServices($this->storeId);
        } else {
            $result = AssistantOrderLogic::getServicesByOrder($orderId, $this->storeId);
        }
        
        return $this->data($result);
    }

    public function accept()
    {
        $data = $this->request->post();
        $assistantOrderId = $data['assistant_order_id'] ?? '';
        
        if (empty($assistantOrderId)) {
            return $this->fail('助教订单ID不能为空');
        }
        
        $result = AssistantOrderLogic::acceptAssistantOrder($assistantOrderId, $this->employeeId, $this->storeId);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('已接受预约', $result);
    }

    public function cancel()
    {
        $data = $this->request->post();
        $assistantOrderId = $data['assistant_order_id'] ?? '';
        
        if (empty($assistantOrderId)) {
            return $this->fail('助教订单ID不能为空');
        }
        
        $params = [
            'reason' => $data['reason'] ?? '',
            'operator_id' => $this->employeeId,
            'operator_name' => $this->employeeName,
        ];
        
        $result = AssistantOrderLogic::cancelAssistantOrder($assistantOrderId, $params, $this->storeId);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('已取消预约', $result);
    }

    public function levels()
    {
        $levels = AssistantLevel::where('status', 1)->select()->toArray();
        return $this->success('获取成功', $levels);
    }

    public function detail(string $id)
    {
        $assistant = Assistant::where('id', $id)
            ->where('store_id', $this->storeId)
            ->find();
        
        if (!$assistant) {
            return $this->fail('助教不存在');
        }
        
        $level = AssistantLevel::where('id', $assistant['level_id'])->find();
        $assistant['level_name'] = $level ? $level['name'] : '初级教练';
        
        $activeOrders = AssistantOrder::where('assistant_id', $id)
            ->where('status', 'in')
            ->count();
        
        $assistant['active_order_count'] = $activeOrders;
        
        return $this->success('获取成功', $assistant);
    }
}
