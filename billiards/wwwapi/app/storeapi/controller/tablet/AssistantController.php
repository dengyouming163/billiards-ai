<?php

declare (strict_types=1);

namespace app\storeapi\controller\tablet;

use app\common\model\merchant\Assistant;
use app\common\model\merchant\AssistantLevel;
use app\common\model\merchant\AssistantOrder;
use app\common\model\merchant\AssistantProfile;
use app\common\model\merchant\Order;
use app\common\model\merchant\OrderItem;
use app\storeapi\logic\order\AssistantOrderLogic;
use think\facade\Db;
use think\facade\Log;

class AssistantController extends BaseTabletController
{
    public array $notNeedLogin = ['list', 'book', 'cancel', 'getOrder', 'getAssistantOrders', 'levels', 'createOrder', 'getOrderStatus', 'cancelOrder', 'startService', 'endService', 'getAlbums', 'uploadAlbum', 'deleteAlbum'];
    
    
    public function list()
    {
        $storeId = $this->getStoreId();
        
        // 0=休息 1=空闲 — 全部返回，前端做状态区分
        $assistants = Assistant::where('status', '>=', 0);

        if ($storeId) {
            $assistants->where('store_id', $storeId);
        }
        
        $assistants = $assistants->select()->toArray();
        
        $levels = AssistantLevel::where('status', 1)->select()->toArray();
        $levelMap = [];
        foreach ($levels as $level) {
            $levelMap[$level['id']] = $level['name'];
        }
        
        // 从 busi_order_item 批量查询真正忙碌的助教（活跃服务项）
        $assistantIds = array_column($assistants, 'id');
        $busyOrderItemIds = $assistantIds ? OrderItem::whereIn('assistant_id', $assistantIds)
            ->whereIn('item_type', ['assistant', 'assistant_service'])
            ->whereIn('status', ['pending', 'processing', 'serving', 'prepay_draft'])
            ->column('assistant_id') : [];
        $busyOrderItemSet = array_flip($busyOrderItemIds);

        // 批量查询 AssistantOrder 获取 current_order_id
        $assistantOrders = $assistantIds ? AssistantOrder::whereIn('assistant_id', $assistantIds)
            ->where('status', 'in_progress')
            ->column('id', 'assistant_id') : [];
        // column with key=assistant_id, value=id

        foreach ($assistants as &$assistant) {
            // is_busy: DB status==2(服务中) OR 有活跃 OrderItem
            $assistant['is_busy'] = ($assistant['status'] == 2) || isset($busyOrderItemSet[$assistant['id']]);
            $assistant['current_order_id'] = $assistantOrders[$assistant['id']] ?? null;
            $assistant['level_name'] = $levelMap[$assistant['level_id']] ?? '初级教练';
            $assistant['introduction'] = $assistant['description'] ?? '暂无介绍';
            $assistant['gift_count'] = $assistant['gift_count'] ?? 0;

            // 从 busi_assistant_profile 获取相册和头像
            $employeeId = $assistant['employee_id'] ?? '';
            if ($employeeId) {
                $profile = AssistantProfile::where('employee_id', $employeeId)->find();
                if ($profile) {
                    $assistant['profile_avatar'] = $profile->avatar ?: '';
                    $assistant['album'] = $profile->album ?: [];
                } else {
                    $assistant['profile_avatar'] = '';
                    $assistant['album'] = [];
                }
            } else {
                $assistant['profile_avatar'] = '';
                $assistant['album'] = [];
            }
        }
        
        return $this->success('获取成功', $assistants);
    }
    
    public function book()
    {
        $data = $this->request->post();
        
        $orderId = $data['order_id'] ?? '';
        $assistantId = $data['assistant_id'] ?? '';
        
        if (!$orderId || !$assistantId) {
            return $this->fail('参数错误');
        }
        
        $params = [
            'assistant_id' => $assistantId,
            'duration' => $data['hours'] ?? 1,
            'student_name' => $data['student_name'] ?? '',
            'student_phone' => $data['student_phone'] ?? '',
            'service_type' => $data['service_type'] ?? 'practice',
            'remark' => $data['remark'] ?? '',
        ];
        
        $result = AssistantOrderLogic::createAssistantOrder($orderId, $params, $this->getStoreId());
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('预约成功', $result);
    }
    
    public function cancel()
    {
        $data = $this->request->post();
        
        $assistantOrderId = $data['assistant_order_id'] ?? '';
        
        if (!$assistantOrderId) {
            return $this->fail('预约ID不能为空');
        }
        
        $params = [
            'reason' => $data['reason'] ?? '',
            'operator_id' => $data['operator_id'] ?? '',
            'operator_name' => $data['operator_name'] ?? '',
        ];
        
        $result = AssistantOrderLogic::cancel($assistantOrderId, $this->getStoreId(), $params);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('取消成功', $result);
    }
    
    public function getOrder()
    {
        $assistantOrderId = $this->request->get('assistant_order_id');
        
        if (!$assistantOrderId) {
            return $this->fail('预约ID不能为空');
        }
        
        $assistantOrder = AssistantOrder::where('id', $assistantOrderId)->find();
        if (!$assistantOrder) {
            return $this->fail('预约不存在');
        }
        
        return $this->success('获取成功', $assistantOrder->toArray());
    }
    
    public function getAssistantOrders()
    {
        $orderId = $this->request->get('order_id');
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $assistantOrders = AssistantOrder::where('order_id', $orderId)
            ->order('created_at', 'desc')
            ->select()->toArray();
            
        return $this->success('获取成功', $assistantOrders);
    }
    
    public function levels()
    {
        $storeId = $this->getStoreId();
        
        $levels = AssistantLevel::where('status', 1);
        
        if ($storeId) {
            $levels->where('store_id', $storeId);
        }
        
        $levels = $levels->order('sort_order', 'asc')
            ->select()->toArray();
            
        return $this->success('获取成功', $levels);
    }
    
    public function createOrder()
    {
        $data = $this->request->post();
        
        $assistantId = $data['assistant_id'] ?? '';
        $serviceType = $data['service_type'] ?? 'one_on_one';
        $duration = $data['duration'] ?? 1;
        
        if (!$assistantId) {
            return $this->fail('助教ID不能为空');
        }
        
        $assistant = Assistant::where('id', $assistantId)->where('status', 1)->find();
        if (!$assistant) {
            return $this->fail('助教不存在');
        }
        
        $existingOrder = AssistantOrder::where('assistant_id', $assistantId)
            ->where('status', 'in_progress')
            ->find();
            
        if ($existingOrder) {
            return $this->fail('该助教当前正忙');
        }
        
        Db::startTrans();
        
        try {
            $assistantOrder = new AssistantOrder();
            $assistantOrder->id = $this->uuid();
            $assistantOrder->order_id = $this->uuid();
            $assistantOrder->assistant_id = $assistantId;
            $assistantOrder->store_id = $this->getStoreId() ?: $assistant->store_id;
            $assistantOrder->hours = $duration;
            $assistantOrder->unit_price = $assistant->hourly_rate;
            $assistantOrder->total_price = $assistant->hourly_rate * $duration;
            $assistantOrder->status = 'pending';
            $assistantOrder->save();
            
            Db::commit();
            
            return $this->success('预约成功', [
                'order_id' => $assistantOrder->order_id,
                'assistant_order_id' => $assistantOrder->id,
                'assistant_name' => $assistant->name,
                'hours' => $duration,
                'total_amount' => $assistantOrder->total_price,
                'status' => 'pending'
            ]);
            
        } catch (\Exception $e) {
            Db::rollback();
            Log::error('助教预约失败: ' . $e->getMessage());
            return $this->fail('预约失败');
        }
    }
    
    public function getOrderStatus()
    {
        $orderId = $this->request->get('order_id');
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $assistantOrder = AssistantOrder::where('order_id', $orderId)
            ->orWhere('id', $orderId)
            ->find();
            
        if (!$assistantOrder) {
            return $this->fail('订单不存在');
        }
        
        return $this->success('获取成功', [
            'order_id' => $assistantOrder->order_id,
            'assistant_order_id' => $assistantOrder->id,
            'assistant_id' => $assistantOrder->assistant_id,
            'hours' => $assistantOrder->hours,
            'total_amount' => $assistantOrder->total_price,
            'status' => $assistantOrder->status,
            'created_at' => $assistantOrder->created_at
        ]);
    }
    
    public function cancelOrder()
    {
        $orderId = $this->request->post('order_id');
        
        if (!$orderId) {
            return $this->fail('订单ID不能为空');
        }
        
        $assistantOrder = AssistantOrder::where('order_id', $orderId)
            ->orWhere('id', $orderId)
            ->find();
            
        if (!$assistantOrder) {
            return $this->fail('订单不存在');
        }
        
        if ($assistantOrder->status == 'completed') {
            return $this->fail('订单已完成，无法取消');
        }
        
        if ($assistantOrder->status == 'cancelled') {
            return $this->fail('订单已取消');
        }
        
        $assistantOrder->status = 'cancelled';
        $assistantOrder->save();
        
        return $this->success('取消成功');
    }
    
    public function startService()
    {
        $assistantOrderId = $this->request->post('assistant_order_id');
        
        if (!$assistantOrderId) {
            return $this->fail('助教订单ID不能为空');
        }
        
        $result = AssistantOrderLogic::startService($assistantOrderId, $this->getStoreId());
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('开始服务', $result);
    }
    
    public function endService()
    {
        $assistantOrderId = $this->request->post('assistant_order_id');
        $remark = $this->request->post('remark', '');
        
        if (!$assistantOrderId) {
            return $this->fail('助教订单ID不能为空');
        }
        
        $result = AssistantOrderLogic::endService($assistantOrderId, $this->getStoreId(), [
            'remark' => $remark
        ]);
        
        if (isset($result['error'])) {
            return $this->fail($result['error']);
        }
        
        return $this->success('结束服务', $result);
    }

    /** 顾客给助教送礼 */
    public function sendGift()
    {
        $params = $this->request->post();
        $assistantId = $params['assistant_id'] ?? '';
        $giftName = $params['gift_name'] ?? '礼物';
        $giftIcon = $params['gift_icon'] ?? '🎁';
        $quantity = (int)($params['quantity'] ?? 1);

        if (empty($assistantId)) return $this->fail('助教ID不能为空');

        $id = 'gr_' . bin2hex(random_bytes(12));
        \think\facade\Db::name('assistant_gift_record')->insert([
            'id' => $id,
            'store_id' => $this->storeId,
            'assistant_id' => $assistantId,
            'order_id' => $params['order_id'] ?? '',
            'gift_name' => $giftName,
            'gift_icon' => $giftIcon,
            'quantity' => $quantity,
            'amount' => 0,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        return $this->success('送礼成功', ['id' => $id]);
    }

    /**
     * 获取助教相册
     */
    public function getAlbums()
    {
        $assistantId = $this->request->param('assistant_id', '');
        if (!$assistantId) return $this->fail('缺少助教ID');
        $assistant = \app\common\model\merchant\Assistant::where('id', $assistantId)->find();
        if (!$assistant) return $this->fail('助教不存在');
        $employeeId = $assistant['employee_id'] ?? '';
        $profile = $employeeId ? \app\common\model\merchant\AssistantProfile::where('employee_id', $employeeId)->find() : null;
        return $this->success('获取成功', ['album' => $profile ? ($profile->album ?: []) : []]);
    }

    /**
     * 上传助教相册
     */
    public function uploadAlbum()
    {
        $assistantId = $this->request->param('assistant_id', '');
        $url = $this->request->param('url', '');
        if (!$assistantId || !$url) return $this->fail('参数错误');
        $assistant = \app\common\model\merchant\Assistant::where('id', $assistantId)->find();
        if (!$assistant) return $this->fail('助教不存在');
        $employeeId = $assistant['employee_id'] ?? '';
        $profile = $employeeId ? \app\common\model\merchant\AssistantProfile::where('employee_id', $employeeId)->find() : null;
        if (!$profile) {
            $profile = new \app\common\model\merchant\AssistantProfile();
            $profile->id = 'ap_' . bin2hex(random_bytes(8));
            $profile->employee_id = $employeeId;
            $profile->store_id = $assistant['store_id'] ?? '';
            $profile->album = [];
            $profile->save();
        }
        $album = $profile->album ?: [];
        $album[] = $url;
        $profile->album = $album;
        $profile->save();
        return $this->success('上传成功', ['url' => $url]);
    }

    /**
     * 删除助教相册
     */
    public function deleteAlbum()
    {
        $assistantId = $this->request->param('assistant_id', '');
        $url = $this->request->param('url', '');
        if (!$assistantId || !$url) return $this->fail('参数错误');
        $assistant = \app\common\model\merchant\Assistant::where('id', $assistantId)->find();
        if (!$assistant) return $this->fail('助教不存在');
        $employeeId = $assistant['employee_id'] ?? '';
        $profile = $employeeId ? \app\common\model\merchant\AssistantProfile::where('employee_id', $employeeId)->find() : null;
        if (!$profile) return $this->fail('无相册数据');
        $album = $profile->album ?: [];
        $album = array_values(array_filter($album, fn($item) => $item !== $url));
        $profile->album = $album;
        $profile->save();
        return $this->success('删除成功');
    }
}