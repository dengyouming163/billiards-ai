<?php
namespace app\adminapi\controller\service;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\service\ServiceLogic;
use app\common\service\JsonService;

class ServiceController extends BaseAdminController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = ServiceLogic::lists($params);
        return $result;
    }

    public function detail()
    {
        $id = $this->request->param('id');
        if (empty($id)) {
            $path = $this->request->pathinfo();
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = ServiceLogic::detail($id);
        if ($result === false) {
            return JsonService::fail(ServiceLogic::getError());
        }
        return JsonService::data($result);
    }

    public function add()
    {
        $params = $this->request->post();
        $result = ServiceLogic::add($params);
        if ($result === false) {
            return JsonService::fail(ServiceLogic::getError());
        }
        return JsonService::success('添加成功', $result);
    }

    public function edit()
    {
        $id = $this->request->param('id');
        if (empty($id)) {
            $path = $this->request->pathinfo();
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = ServiceLogic::edit($id, $params);
        if ($result === false) {
            return JsonService::fail(ServiceLogic::getError());
        }
        return JsonService::success('修改成功', $result);
    }

    public function toggleStatus()
    {
        $id = $this->request->param('id');
        if (empty($id)) {
            $path = $this->request->pathinfo();
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = ServiceLogic::toggleStatus($id);
        if ($result === false) {
            return JsonService::fail(ServiceLogic::getError());
        }
        $status = $result['status'] == 1 ? '上架' : '下架';
        return JsonService::success($status . '成功', $result);
    }

    public function delete()
    {
        $id = $this->request->param('id');
        if (empty($id)) {
            $path = $this->request->pathinfo();
            $segments = explode('/', trim($path, '/'));
            $id = end($segments);
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = ServiceLogic::delete($id);
        if ($result === false) {
            return JsonService::fail(ServiceLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function statistics()
    {
        $result = ServiceLogic::statistics();
        return JsonService::data($result);
    }

    public array $notNeedLogin = ['statistics'];
}