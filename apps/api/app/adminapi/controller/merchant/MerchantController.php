<?php
namespace app\adminapi\controller\merchant;

use app\adminapi\controller\BaseAdminController;
use app\adminapi\logic\merchant\MerchantLogic;
use app\common\service\JsonService;

class MerchantController extends BaseAdminController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = MerchantLogic::lists($params);
        return JsonService::data($result);
    }

    public function detail()
    {
        $id = $this->request->param('id');
        try {
            $result = MerchantLogic::detail($id);
            return JsonService::data($result);
        } catch (\Exception $e) {
            return JsonService::fail($e->getMessage());
        }
    }

    public function create()
    {
        $params = $this->request->post();
        if (empty($params['name'])) return JsonService::fail('商户名称不能为空');
        if (empty($params['package_id'])) return JsonService::fail('请选择套餐');
        try {
            $result = MerchantLogic::create($params);
            return JsonService::success('商户创建成功', $result);
        } catch (\Exception $e) {
            return JsonService::fail($e->getMessage());
        }
    }

    public function toggle()
    {
        $id = $this->request->param('id');
        try {
            $newStatus = MerchantLogic::toggleStatus($id);
            return JsonService::success($newStatus === 'active' ? '已启用' : '已停用');
        } catch (\Exception $e) {
            return JsonService::fail($e->getMessage());
        }
    }
}
