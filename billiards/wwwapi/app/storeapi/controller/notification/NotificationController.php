<?php

namespace app\storeapi\controller\notification;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\notification\NotificationLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class NotificationController extends BaseStoreController
{
    #[Permission('overview', '通知中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = NotificationLogic::getLists($this->storeId, $this->userId, $params);
        return JsonService::data($result);
    }

    #[Permission('overview', '通知中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function read()
    {
        $params = $this->request->post();
        $result = NotificationLogic::markRead($this->storeId, $this->userId, $params['id'] ?? '');
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::success('已标记为已读');
    }

    #[Permission('overview', '通知中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function readAll()
    {
        $result = NotificationLogic::markAllRead($this->storeId, $this->userId);
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::success('已全部标记为已读');
    }

    #[Permission('overview', '通知中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function delete()
    {
        $params = $this->request->post();
        $result = NotificationLogic::deleteNotification($this->storeId, $this->userId, $params['id'] ?? '');
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('overview', '通知中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function unreadCount()
    {
        $result = NotificationLogic::getUnreadCount($this->storeId, $this->userId);
        return JsonService::data(['count' => $result]);
    }

    #[Permission('overview', '通知中心', 'pc', '通用', ['boss', 'manager', 'finance', 'coach', 'cashier', 'assistant', 'employee'])]
    public function detail()
    {
        $id = $this->request->get('id', '');
        $result = NotificationLogic::getDetail($this->storeId, $this->userId, $id);
        if ($result === false) {
            return JsonService::fail(NotificationLogic::getError());
        }
        return JsonService::data($result);
    }
}
