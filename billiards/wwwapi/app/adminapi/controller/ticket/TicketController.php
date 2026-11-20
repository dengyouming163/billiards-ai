<?php
namespace app\adminapi\controller\ticket;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\ticket\TicketLogic;
use app\common\service\JsonService;

class TicketController extends BaseAdminController
{
    public function lists()
    {
        $params = $this->request->get();
        return TicketLogic::lists($params);
    }

    public function detail()
    {
        $path = $this->request->pathinfo();
        $id = $this->request->param('id') ?: $this->request->get('id');
        if (empty($id)) {
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = TicketLogic::detail($id);
        if ($result === false) {
            return JsonService::fail(TicketLogic::getError());
        }
        return JsonService::data($result);
    }

    public function add()
    {
        $params = $this->request->post();
        $result = TicketLogic::add($params);
        if ($result === false) {
            return JsonService::fail(TicketLogic::getError());
        }
        return JsonService::success('添加成功', $result);
    }

    public function edit()
    {
        $path = $this->request->pathinfo();
        $id = $this->request->param('id') ?: $this->request->post('id');
        if (empty($id)) {
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = TicketLogic::edit($id, $params);
        if ($result === false) {
            return JsonService::fail(TicketLogic::getError());
        }
        return JsonService::success('修改成功', $result);
    }

    public function delete()
    {
        $path = $this->request->pathinfo();
        $id = $this->request->param('id') ?: $this->request->post('id');
        if (empty($id)) {
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = TicketLogic::delete($id);
        if ($result === false) {
            return JsonService::fail(TicketLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function statistics()
    {
        $result = TicketLogic::statistics();
        return JsonService::data($result);
    }

    /** POST /ticket.Ticket/statusChange — 工单状态变更 */
    public function statusChange()
    {
        $params = $this->request->post();
        $id = $params['id'] ?? '';
        $status = $params['status'] ?? '';
        if (empty($id) || empty($status)) return JsonService::fail('参数错误');
        $result = TicketLogic::statusChange($id, $status);
        if ($result === false) return JsonService::fail(TicketLogic::getError());
        return JsonService::success('状态已更新');
    }

    public array $notNeedLogin = ['statistics'];
}