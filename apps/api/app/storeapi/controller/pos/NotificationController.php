<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\notification\NotificationLogic;

class NotificationController extends BasePosController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = NotificationLogic::getLists($this->storeId, $this->userId, $params);
        return $this->data($result);
    }

    public function read()
    {
        $params = $this->request->post();
        $result = NotificationLogic::markRead($this->storeId, $this->userId, $params['id'] ?? '');
        
        if ($result === false) {
            return $this->fail(NotificationLogic::getError());
        }
        
        return $this->success('已标记为已读');
    }

    public function readAll()
    {
        $result = NotificationLogic::markAllRead($this->storeId, $this->userId);
        
        if ($result === false) {
            return $this->fail(NotificationLogic::getError());
        }
        
        return $this->success('已全部标记为已读');
    }

    public function delete()
    {
        $params = $this->request->post();
        $result = NotificationLogic::deleteNotification($this->storeId, $this->userId, $params['id'] ?? '');
        
        if ($result === false) {
            return $this->fail(NotificationLogic::getError());
        }
        
        return $this->success('删除成功');
    }

    public function unreadCount()
    {
        $result = NotificationLogic::getUnreadCount($this->storeId, $this->userId);
        return $this->data(['count' => $result]);
    }

    public function detail()
    {
        $id = $this->request->get('id', '');
        $result = NotificationLogic::getDetail($this->storeId, $this->userId, $id);
        
        if ($result === false) {
            return $this->fail(NotificationLogic::getError());
        }
        
        return $this->data($result);
    }
}
