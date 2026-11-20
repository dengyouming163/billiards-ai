<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\NotificationLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class NotificationController extends BaseStoreController
{
    #[Permission('mobile:notification', '通知中心', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = NotificationLogic::getLists($this->employeeId, $params);
        return JsonService::data($result);
    }

    #[Permission('mobile:notification', '通知中心', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function detail()
    {
        $id = $this->request->get('id');
        $result = NotificationLogic::getDetail($id, $this->employeeId);
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('mobile:notification', '通知中心', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function read()
    {
        $id = $this->request->post('id');
        $result = NotificationLogic::markRead($id, $this->employeeId);
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::success('已标记为已读');
    }

    #[Permission('mobile:notification', '通知中心', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function readAll()
    {
        $result = NotificationLogic::markAllRead($this->employeeId);
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::success('已全部标记为已读');
    }

    #[Permission('mobile:notification', '通知中心', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function unreadCount()
    {
        $count = NotificationLogic::getUnreadCount($this->employeeId);
        return JsonService::data($count);
    }

    #[Permission('mobile:notification', '通知中心', 'mobile', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function delete()
    {
        $id = $this->request->post('id');
        $result = NotificationLogic::deleteNotification($id, $this->employeeId);
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::success('已删除');
    }
}
