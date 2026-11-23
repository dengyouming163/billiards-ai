<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\member\MemberLogic;

class MemberController extends BasePosController
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

    public function lists()
    {
        $params = $this->request->get();
        $result = MemberLogic::getList($params, $this->storeId);
        return $this->data($result);
    }

    public function detail()
    {
        $id = $this->getIdFromRequest('detail');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $result = MemberLogic::getDetail($id, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->data($result);
    }

    public function create()
    {
        $params = $this->request->post();
        $result = MemberLogic::create($params, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->success('创建成功', $result);
    }

    public function update()
    {
        $id = $this->getIdFromRequest('update');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $params = $this->request->put();
        $result = MemberLogic::update($id, $params, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->success('更新成功', $result);
    }

    public function delete()
    {
        $id = $this->getIdFromRequest('delete');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $result = MemberLogic::delete($id, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->success('删除成功');
    }

    public function recharge()
    {
        $id = $this->getIdFromRequest('recharge');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $params = $this->request->post();
        $params['operator_id'] = $this->employeeId;
        $params['operator_name'] = $this->employeeName;
        
        $result = MemberLogic::recharge($id, $params, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->success('充值成功', $result);
    }

    public function consume()
    {
        $id = $this->getIdFromRequest('consume');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $params = $this->request->post();
        $params['operator_id'] = $this->employeeId;
        $params['operator_name'] = $this->employeeName;
        
        $result = MemberLogic::consume($id, $params, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->success('消费成功', $result);
    }

    public function recharges()
    {
        $id = $this->getIdFromRequest('recharges');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $params = $this->request->get();
        $result = MemberLogic::getRecharges($id, $this->storeId, $params);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->data($result);
    }

    public function consumes()
    {
        $id = $this->getIdFromRequest('consumes');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $params = $this->request->get();
        $result = MemberLogic::getConsumes($id, $this->storeId, $params);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->data($result);
    }

    public function pointsExchange()
    {
        $id = $this->getIdFromRequest('pointsExchange');
        
        if (empty($id)) {
            return $this->fail('参数错误');
        }
        
        $params = $this->request->post();
        $result = MemberLogic::pointsExchange($id, $params, $this->storeId);
        
        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }
        
        return $this->success('兑换成功', $result);
    }

    public function levels()
    {
        $result = MemberLogic::getLevels($this->storeId);
        return $this->data($result);
    }

    public function search()
    {
        $keyword = $this->request->get('keyword', '');

        if (empty($keyword)) {
            return $this->fail('搜索关键词不能为空');
        }

        $result = MemberLogic::search($keyword, $this->storeId);
        return $this->data($result);
    }

    public function rechargeCash()
    {
        $params = $this->request->post();
        $memberId = $params['member_id'] ?? '';

        if (empty($memberId)) {
            return $this->fail('请选择会员');
        }

        $params['operator_id'] = $this->employeeId;
        $params['operator_name'] = $this->employeeName;

        $result = MemberLogic::rechargeCash($memberId, $params, $this->storeId);

        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }

        return $this->success('现金充值成功', $result);
    }

    public function prepareRecharge()
    {
        $params = $this->request->post();
        $memberId = $params['member_id'] ?? '';
        $amount = floatval($params['amount'] ?? 0);

        if (empty($memberId) || $amount <= 0) {
            return $this->fail('参数错误');
        }

        $result = MemberLogic::prepareRecharge($memberId, $this->storeId, $amount);

        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }

        return $this->success('ok', $result);
    }

    public function rechargeWechat()
    {
        $params = $this->request->post();
        $memberId = $params['member_id'] ?? '';

        if (empty($memberId)) {
            return $this->fail('请选择会员');
        }

        $params['operator_id'] = $this->employeeId;
        $params['operator_name'] = $this->employeeName;

        $result = MemberLogic::rechargeWechat($memberId, $params, $this->storeId);

        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }

        return $this->success('微信充值成功', $result);
    }

    public function adjustBalance()
    {
        $params = $this->request->post();
        $memberId = $params['member_id'] ?? '';

        if (empty($memberId)) {
            return $this->fail('请选择会员');
        }

        $params['operator_id'] = $this->employeeId;
        $params['operator_name'] = $this->employeeName;

        $result = MemberLogic::adjustBalance($memberId, $params, $this->storeId);

        if ($result === false) {
            return $this->fail(MemberLogic::getError());
        }

        return $this->success('余额调整成功', $result);
    }

    /**
     * 门店充值记录列表（联表查询会员信息）
     * GET /pos.Member/rechargeRecords?phone=&page=1&pageSize=20
     */
    public function rechargeRecords()
    {
        $phone = $this->request->get('phone', '');
        $operatorId = $this->request->get('operator_id', '');
        $page = (int)($this->request->get('page', 1));
        $pageSize = (int)($this->request->get('pageSize', 20));

        $query = \think\facade\Db::name('busi_member_recharge')->alias('mr')
            ->leftJoin('busi_member m', 'mr.member_id = m.id')
            ->where('mr.store_id', $this->storeId)
            ->field('mr.*, m.name as member_name, m.phone as member_phone');

        if (!empty($phone)) {
            $query->where('m.phone', 'like', "%{$phone}%");
        }

        if (!empty($operatorId)) {
            $query->where('mr.operator_id', $operatorId);
        }

        $total = $query->count();
        $list = $query->order('mr.created_at', 'desc')
            ->page($page, $pageSize)
            ->select()
            ->toArray();

        return $this->success('获取成功', [
            'lists' => $list,
            'total' => $total,
            'page' => $page,
            'page_size' => $pageSize,
        ]);
    }
}
