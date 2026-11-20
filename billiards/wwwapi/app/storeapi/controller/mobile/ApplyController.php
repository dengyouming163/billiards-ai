<?php

namespace app\storeapi\controller\mobile;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\mobile\ApplyLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class ApplyController extends BaseStoreController
{
    #[Permission('mobile:apply', '申请', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'coach', 'cashier'])]
    public function checkin()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;
        $params['type'] = 'checkin';

        $result = ApplyLogic::submitCheckin($params);
        if ($result === false) {
            return JsonService::fail(ApplyLogic::getError());
        }
        return JsonService::success('申请成功', $result);
    }

    #[Permission('mobile:apply', '申请', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'coach', 'cashier'])]
    public function leave()
    {
        $params = $this->request->post();
        $params['employee_id'] = $this->employeeId;
        $params['store_id'] = $this->storeId;
        $params['type'] = 'leave';

        $result = ApplyLogic::submitLeave($params);
        if ($result === false) {
            return JsonService::fail(ApplyLogic::getError());
        }
        return JsonService::success('申请成功', $result);
    }

    #[Permission('mobile:apply', '申请', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'coach', 'cashier'])]
    public function records()
    {
        $type = $this->request->get('type', '');
        $page = $this->request->get('page_no', 1);
        $pageSize = $this->request->get('page_size', 20);

        $result = ApplyLogic::getRecords($this->employeeId, $type, $page, $pageSize);
        return JsonService::data($result);
    }

    /**
     * 提交意见反馈
     * POST /mobile.Apply/feedback
     */
    #[Permission('mobile:apply', '申请', 'mobile', '考勤', ['boss', 'manager', 'employee', 'assistant', 'cashier', 'coach'])]
    public function feedback()
    {
        $params = $this->request->post();
        $content = $params['content'] ?? '';
        $type = $params['type'] ?? 'other';
        $contact = $params['contact'] ?? '';

        if (empty(trim($content))) {
            return JsonService::fail('反馈内容不能为空');
        }

        $data = [
            'employee_id' => $this->employeeId,
            'store_id'    => $this->storeId,
            'type'        => $type,
            'content'     => $content,
            'contact'     => $contact,
            'status'      => 0,
            'create_time' => time(),
        ];

        \think\facade\Db::name('feedback')->insert($data);

        return JsonService::success('感谢您的反馈！');
    }
}
