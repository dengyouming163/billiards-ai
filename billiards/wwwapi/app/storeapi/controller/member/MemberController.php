<?php

namespace app\storeapi\controller\member;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\member\MemberLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class MemberController extends BaseStoreController
{
    private function getIdFromRequest($method)
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match("/{$method}\/([^\/\?]+)/", $path, $matches)) {
                $id = $matches[1];
            }
        }
        return $id;
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = MemberLogic::getList($params, $this->storeId);
        if ($result === false) return JsonService::fail(MemberLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function detail()
    {
        $id = $this->getIdFromRequest('detail');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = MemberLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        if ($result === false) return JsonService::fail(MemberLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function create()
    {
        $params = $this->request->post();
        $result = MemberLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function update()
    {
        $id = $this->getIdFromRequest('update');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->put();
        $result = MemberLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function delete()
    {
        $id = $this->getIdFromRequest('delete');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = MemberLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function recharge()
    {
        $id = $this->getIdFromRequest('recharge');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = MemberLogic::recharge($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('充值成功', $result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function recharges()
    {
        $id = $this->getIdFromRequest('recharges');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->get();
        $result = MemberLogic::getRecharges($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        if ($result === false) return JsonService::fail(MemberLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function consumes()
    {
        $id = $this->getIdFromRequest('consumes');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->get();
        $result = MemberLogic::getConsumes($id, $this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        if ($result === false) return JsonService::fail(MemberLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function pointsExchange()
    {
        $id = $this->getIdFromRequest('points-exchange');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = MemberLogic::pointsExchange($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('兑换成功', $result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function pointsAdjust()
    {
        $id = $this->getIdFromRequest('points-adjust');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = MemberLogic::pointsAdjust($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('调整成功', $result);
    }

    #[Permission('member:tier', '会员等级', 'pc', '会员管理', ['boss', 'manager'])]
    public function levels()
    {
        $result = MemberLogic::getLevels($this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        if ($result === false) return JsonService::fail(MemberLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function statistics()
    {
        $result = MemberLogic::getStatistics($this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        if ($result === false) return JsonService::fail(MemberLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('member:tier', '会员等级', 'pc', '会员管理', ['boss', 'manager'])]
    public function upgrade()
    {
        $id = $this->getIdFromRequest('upgrade');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $levelId = $params['level_id'] ?? '';
        if (!empty($levelId)) {
            $result = MemberLogic::manualUpgrade($id, $levelId, $this->storeId);
        } else {
            $result = MemberLogic::checkLevelUpgrade($id, $this->storeId);
        }
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        if ($result === null) {
            return JsonService::fail('未达到升级条件');
        }
        return JsonService::success('升级成功', $result);
    }

    #[Permission('member:list', '会员管理', 'pc', '会员管理', ['boss', 'manager', 'cashier'])]
    public function consume()
    {
        $id = $this->getIdFromRequest('consume');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = MemberLogic::addConsume($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('消费成功', $result);
    }

    #[Permission('member:tier', '会员等级', 'pc', '会员管理', ['boss', 'manager'])]
    public function createLevel()
    {
        $params = $this->request->post();
        $result = MemberLogic::createLevel($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('member:tier', '会员等级', 'pc', '会员管理', ['boss', 'manager'])]
    public function updateLevel()
    {
        $id = $this->getIdFromRequest('updateLevel');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->put();
        $result = MemberLogic::updateLevel($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('member:tier', '会员等级', 'pc', '会员管理', ['boss', 'manager'])]
    public function deleteLevel()
    {
        $id = $this->getIdFromRequest('deleteLevel');
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = MemberLogic::deleteLevel($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(MemberLogic::getError());
        }
        return JsonService::success('删除成功');
    }
}
