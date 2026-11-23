<?php

namespace app\storeapi\controller\store;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\store\StoreLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class StoreController extends BaseStoreController
{
    public function lists()
    {
        $params = $this->request->get();
        // 传入当前员工关联的 store_id，供 Logic 层按商户过滤门店
        $params['employee_store_id'] = $this->storeId;
        $result = StoreLogic::getList($params);
        return JsonService::data($result);
    }

    #[Permission('employee:store', '门店管理', 'pc', '员工管理', ['boss'])]
    public function detail(string $id)
    {
        $result = StoreLogic::getDetail($id);
        if ($result === false) {
            return JsonService::fail(StoreLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('employee:store', '门店管理', 'pc', '员工管理', ['boss'])]
    public function create()
    {
        $params = $this->request->post();
        $result = StoreLogic::create($params);
        if ($result === false) {
            return JsonService::fail(StoreLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('employee:store', '门店管理', 'pc', '员工管理', ['boss'])]
    public function update(string $id)
    {
        $params = $this->request->put();
        $result = StoreLogic::update($id, $params);
        if ($result === false) {
            return JsonService::fail(StoreLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('employee:store', '门店管理', 'pc', '员工管理', ['boss'])]
    public function delete(string $id)
    {
        $result = StoreLogic::delete($id);
        if ($result === false) {
            return JsonService::fail(StoreLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    public function switch()
    {
        $params = $this->request->post();
        $result = StoreLogic::switchStore($params, $this->employeeInfo);
        if ($result === false) {
            return JsonService::fail(StoreLogic::getError());
        }
        return JsonService::success('切换成功', $result);
    }
}
