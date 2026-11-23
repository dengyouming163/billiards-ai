<?php
namespace app\adminapi\controller\help;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\help\ArticleLogic;
use app\common\service\JsonService;

class ArticleController extends BaseAdminController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = ArticleLogic::lists($params);
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
        $result = ArticleLogic::detail($id);
        if ($result === false) {
            return JsonService::fail(ArticleLogic::getError());
        }
        return JsonService::data($result);
    }

    public function add()
    {
        $params = $this->request->post();
        $result = ArticleLogic::add($params);
        if ($result === false) {
            return JsonService::fail(ArticleLogic::getError());
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
        $result = ArticleLogic::edit($id, $params);
        if ($result === false) {
            return JsonService::fail(ArticleLogic::getError());
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
        $result = ArticleLogic::delete($id);
        if ($result === false) {
            return JsonService::fail(ArticleLogic::getError());
        }
        return JsonService::success('删除成功');
    }
}