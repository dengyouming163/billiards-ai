<?php
namespace app\adminapi\controller\announcement;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\announcement\AnnouncementLogic;
use app\common\service\JsonService;

class AnnouncementController extends BaseAdminController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = AnnouncementLogic::lists($params);
        return JsonService::data($result);
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
        $result = AnnouncementLogic::detail($id);
        if ($result === false) {
            return JsonService::fail(AnnouncementLogic::getError());
        }
        return JsonService::data($result);
    }

    public function add()
    {
        $params = $this->request->post();
        $result = AnnouncementLogic::add($params);
        if ($result === false) {
            return JsonService::fail(AnnouncementLogic::getError());
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
        $result = AnnouncementLogic::edit($id, $params);
        if ($result === false) {
            return JsonService::fail(AnnouncementLogic::getError());
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
        $result = AnnouncementLogic::delete($id);
        if ($result === false) {
            return JsonService::fail(AnnouncementLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function publish()
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
        $result = AnnouncementLogic::publish($id);
        if ($result === false) {
            return JsonService::fail(AnnouncementLogic::getError());
        }
        return JsonService::success('发布成功', $result);
    }
}