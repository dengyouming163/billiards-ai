<?php
namespace app\adminapi\controller\ticket;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\ticket\TicketReplyLogic;
use app\common\service\JsonService;

class TicketReplyController extends BaseAdminController
{
    public function lists($ticket_id)
    {
        $result = TicketReplyLogic::lists($ticket_id);
        return $result;
    }

    public function add()
    {
        $params = $this->request->post();
        $result = TicketReplyLogic::add($params);
        if ($result === false) {
            return JsonService::fail(TicketReplyLogic::getError());
        }
        return JsonService::success('回复成功', $result);
    }

    public function delete($id)
    {
        $result = TicketReplyLogic::delete($id);
        if ($result === false) {
            return JsonService::fail(TicketReplyLogic::getError());
        }
        return JsonService::success('删除成功');
    }
}