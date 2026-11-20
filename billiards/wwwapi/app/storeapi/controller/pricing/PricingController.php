<?php

namespace app\storeapi\controller\pricing;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\pricing\PricingLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class PricingController extends BaseStoreController
{
    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = PricingLogic::getList($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function all()
    {
        $params = $this->request->get();
        $result = PricingLogic::getAll($params, $this->storeId);
        return JsonService::data($result);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function detail()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/detail\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = PricingLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PricingLogic::getError());
        }
        return JsonService::data($result);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        $result = PricingLogic::create($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PricingLogic::getError());
        }
        return JsonService::success('创建成功', $result);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function update()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/update\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->put();
        if (empty($params)) {
            return JsonService::fail('缺少更新数据');
        }
        $result = PricingLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PricingLogic::getError());
        }
        if (empty($result)) {
            return JsonService::fail('更新失败');
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function delete()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/delete\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = PricingLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PricingLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function toggle()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $id = $this->request->post('id', '');
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = PricingLogic::toggle($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(PricingLogic::getError());
        }
        return JsonService::success('操作成功', $result);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function calculate()
    {
        $params = $this->request->post();
        
        $pricingId = $params['pricing_id'] ?? '';
        $startTime = $params['start_time'] ?? '';
        $endTime = $params['end_time'] ?? '';
        $memberLevel = $params['member_level'] ?? null;

        if (empty($pricingId)) {
            return JsonService::fail('计费规则ID不能为空');
        }
        if (empty($startTime)) {
            return JsonService::fail('开始时间不能为空');
        }
        if (empty($endTime)) {
            return JsonService::fail('结束时间不能为空');
        }

        $result = \app\common\logic\PricingCalculatorLogic::calculateByPricingId(
            $this->storeId, 
            $pricingId, 
            $startTime, 
            $endTime, 
            $memberLevel
        );

        if ($result['success']) {
            return JsonService::data($result);
        }
        return JsonService::fail($result['msg']);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function calculateByTable()
    {
        $params = $this->request->post();
        
        $tableId = $params['table_id'] ?? '';
        $startTime = $params['start_time'] ?? '';
        $endTime = $params['end_time'] ?? '';
        $memberLevel = $params['member_level'] ?? null;

        if (empty($tableId)) {
            return JsonService::fail('台桌ID不能为空');
        }
        if (empty($startTime)) {
            return JsonService::fail('开始时间不能为空');
        }
        if (empty($endTime)) {
            return JsonService::fail('结束时间不能为空');
        }

        $result = \app\common\logic\PricingCalculatorLogic::calculateByTableId(
            $tableId, 
            $startTime, 
            $endTime, 
            $memberLevel
        );

        if ($result['success']) {
            return JsonService::data($result);
        }
        return JsonService::fail($result['msg']);
    }
}
