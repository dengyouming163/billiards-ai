<?php

declare(strict_types=1);

namespace app\storeapi\controller\pricing;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\MemberDiscountLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class MemberDiscountController extends BaseStoreController
{
    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $storeId = $this->storeId;

        $data = MemberDiscountLogic::getList($storeId);

        return JsonService::data($data);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function detail()
    {
        $id = input('id', '');

        if (empty($id)) {
            return JsonService::fail('参数错误：id不能为空');
        }

        $data = MemberDiscountLogic::getDetail($id);

        if (!$data) {
            return JsonService::fail('折扣配置不存在');
        }

        return JsonService::data($data);
    }

    #[Permission('pricing:rule', '计费规则', 'pc', '系统设置', ['boss', 'manager'])]
    public function update()
    {
        $storeId = $this->storeId;

        $discountsJson = input('discounts', '[]');
        $discounts = json_decode($discountsJson, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return JsonService::fail('参数错误：discounts格式不正确');
        }

        $result = MemberDiscountLogic::update($storeId, ['discounts' => $discounts]);

        if ($result['code'] !== 0) {
            return JsonService::fail($result['msg']);
        }

        return JsonService::success('更新成功', $result['data'] ?? null);
    }
}
