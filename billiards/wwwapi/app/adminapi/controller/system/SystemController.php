<?php
namespace app\adminapi\controller\system;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\system\SystemLogic;
use app\common\service\JsonService;

class SystemController extends BaseAdminController
{
    public function userLists()
    {
        $params = $this->request->get();
        $result = SystemLogic::userLists($params);
        return $result;
    }

    public function userDetail()
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
        $result = SystemLogic::userDetail($id);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::data($result);
    }

    public function userAdd()
    {
        $params = $this->request->post();
        $result = SystemLogic::userAdd($params);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('添加成功', $result);
    }

    public function userEdit()
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
        $result = SystemLogic::userEdit($id, $params);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('修改成功', $result);
    }

    public function userToggleStatus()
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
        $result = SystemLogic::userToggleStatus($id);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('操作成功', $result);
    }

    public function userDelete()
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
        $result = SystemLogic::userDelete($id);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function roleLists()
    {
        $params = $this->request->get();
        $result = SystemLogic::roleLists($params);
        return $result;
    }

    public function roleDetail()
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
        $result = SystemLogic::roleDetail($id);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::data($result);
    }

    public function roleAdd()
    {
        $params = $this->request->post();
        $result = SystemLogic::roleAdd($params);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('添加成功', $result);
    }

    public function roleEdit()
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
        $result = SystemLogic::roleEdit($id, $params);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('修改成功', $result);
    }

    public function roleDelete()
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
        $result = SystemLogic::roleDelete($id);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function getPermissions()
    {
        $result = SystemLogic::getPermissions();
        return JsonService::data($result);
    }

    public function logLists()
    {
        $params = $this->request->get();
        $result = SystemLogic::logLists($params);
        return $result;
    }

    public function logDetail()
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
        $result = SystemLogic::logDetail($id);
        if ($result === false) {
            return JsonService::fail(SystemLogic::getError());
        }
        return JsonService::data($result);
    }
}