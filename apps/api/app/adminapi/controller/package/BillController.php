<?php
namespace app\adminapi\controller\package;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\package\BillLogic;
use app\common\service\JsonService;

class BillController extends BaseAdminController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = BillLogic::lists($params);
        return $result;
    }

    public function detail($id)
    {
        $result = BillLogic::detail($id);
        if ($result === false) {
            return JsonService::fail(BillLogic::getError());
        }
        return JsonService::data($result);
    }

    public function add()
    {
        $params = $this->request->post();
        $result = BillLogic::add($params);
        if ($result === false) {
            return JsonService::fail(BillLogic::getError());
        }
        return JsonService::success('添加成功', $result);
    }

    public function statistics()
    {
        $result = BillLogic::statistics();
        return JsonService::data($result);
    }

    public array $notNeedLogin = ['statistics'];
}