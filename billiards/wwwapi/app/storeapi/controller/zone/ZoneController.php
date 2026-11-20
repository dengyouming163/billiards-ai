<?php

namespace app\storeapi\controller\zone;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\zone\ZoneLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ZoneController extends BaseStoreController
{
    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = ZoneLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function all()
    {
        $params = $this->request->get();
        $result = ZoneLogic::getAll($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function detail(string $id)
    {
        $result = ZoneLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ZoneLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        if (empty($params['name']) || mb_strlen($params['name']) > 20) {
            return JsonService::fail('分区名称不能为空且不超过20个字符');
        }
        $result = ZoneLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ZoneLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function update(string $id)
    {
        $params = $this->request->post();
        if (isset($params['name']) && mb_strlen($params['name']) > 20) {
            return JsonService::fail('分区名称不超过20个字符');
        }
        $result = ZoneLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ZoneLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function delete(string $id)
    {
        $result = ZoneLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ZoneLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('settings:table', '区域管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $id = $this->request->post('id', '');
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = ZoneLogic::toggle($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(ZoneLogic::getError());
        }
        return JsonService::success('操作成功', $result);
    }
}
