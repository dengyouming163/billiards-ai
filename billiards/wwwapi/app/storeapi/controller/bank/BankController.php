<?php

namespace app\storeapi\controller\bank;

use app\storeapi\controller\BaseStoreController;
use app\common\service\JsonService;
use app\common\service\pay\WechatPayService;

/**
 * 银行查询 API — 微信支付进件结算账户辅助
 * 所有端点代理调用微信支付 API，前端无需感知
 */
class BankController extends BaseStoreController
{
    /** GET 对私银行列表 */
    public function personalBanks()
    {
        try {
            $offset = $this->request->get('offset', 0);
            $limit  = $this->request->get('limit', 200);
            $service = WechatPayService::getInstance();
            $result  = $service->getPersonalBankingBanks((int)$offset, (int)$limit);
            if ($result['code'] === 0) return JsonService::data($result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败: ' . $e->getMessage());
        }
    }

    /** GET 对公银行列表 */
    public function corporateBanks()
    {
        try {
            $offset = $this->request->get('offset', 0);
            $limit  = $this->request->get('limit', 200);
            $service = WechatPayService::getInstance();
            $result  = $service->getCorporateBankingBanks((int)$offset, (int)$limit);
            if ($result['code'] === 0) return JsonService::data($result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败: ' . $e->getMessage());
        }
    }

    /** GET 按银行账号搜索银行 */
    public function searchByAccount()
    {
        try {
            $accountNumber = $this->request->get('account_number', '');
            if (empty($accountNumber)) return JsonService::fail('请输入银行账号');
            $service = WechatPayService::getInstance();
            $result  = $service->searchBanksByBankAccount($accountNumber);
            if ($result['code'] === 0) return JsonService::data($result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败: ' . $e->getMessage());
        }
    }

    /** GET 省份列表 */
    public function provinces()
    {
        try {
            $service = WechatPayService::getInstance();
            $result  = $service->getProvinces();
            if ($result['code'] === 0) return JsonService::data($result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败: ' . $e->getMessage());
        }
    }

    /** GET 城市列表 ?province_code=xxx */
    public function cities()
    {
        try {
            $provinceCode = $this->request->get('province_code', '');
            if (empty($provinceCode)) return JsonService::fail('请选择省份');
            $service = WechatPayService::getInstance();
            $result  = $service->getCities($provinceCode);
            if ($result['code'] === 0) return JsonService::data($result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败: ' . $e->getMessage());
        }
    }

    /** GET 支行列表 ?bank_alias_code=xxx&city_code=xxx */
    public function branches()
    {
        try {
            $bankAliasCode = $this->request->get('bank_alias_code', '');
            $cityCode      = $this->request->get('city_code', '');
            $offset        = $this->request->get('offset', 0);
            $limit         = $this->request->get('limit', 200);
            if (empty($bankAliasCode) || empty($cityCode)) return JsonService::fail('请先选择银行和城市');
            $service = WechatPayService::getInstance();
            $result  = $service->getBankBranches($bankAliasCode, $cityCode, (int)$offset, (int)$limit);
            if ($result['code'] === 0) return JsonService::data($result['data']);
            return JsonService::fail($result['message']);
        } catch (\Exception $e) {
            return JsonService::fail('查询失败: ' . $e->getMessage());
        }
    }
}
