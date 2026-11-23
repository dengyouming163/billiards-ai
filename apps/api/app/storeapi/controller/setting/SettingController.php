<?php

namespace app\storeapi\controller\setting;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\setting\SettingLogic;
use app\common\annotation\Permission;
use app\common\model\merchant\DiscountConfig;
use app\common\service\JsonService;

class SettingController extends BaseStoreController
{
    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function get()
    {
        $category = $this->request->get('category', '');
        $result = SettingLogic::getSettings($this->storeId, $category);
        return JsonService::data($result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function save()
    {
        $params = $this->request->post();
        $result = SettingLogic::saveSettings($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(SettingLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function getNotification()
    {
        $result = SettingLogic::getNotificationSettings($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function saveNotification()
    {
        $params = $this->request->post();
        $result = SettingLogic::saveNotificationSettings($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(SettingLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function getPayment()
    {
        $result = SettingLogic::getPaymentSettings($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function savePayment()
    {
        $params = $this->request->post();
        $result = SettingLogic::savePaymentSettings($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(SettingLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function getBusiness()
    {
        $result = SettingLogic::getBusinessSettings($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function saveBusiness()
    {
        $params = $this->request->post();
        $result = SettingLogic::saveBusinessSettings($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(SettingLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function getSecurity()
    {
        $result = SettingLogic::getSecuritySettings($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function saveSecurity()
    {
        $params = $this->request->post();
        $result = SettingLogic::saveSecuritySettings($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(SettingLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function getDisplay()
    {
        $result = SettingLogic::getDisplaySettings($this->storeId);
        return JsonService::data($result);
    }

    #[Permission('settings:store', '门店设置', 'pc', '系统设置', ['boss', 'manager'])]
    public function saveDisplay()
    {
        $params = $this->request->post();
        $result = SettingLogic::saveDisplaySettings($this->storeId, $params);
        if ($result === false) {
            return JsonService::fail(SettingLogic::getError());
        }
        return JsonService::success('保存成功', $result);
    }

    #[Permission('settings:discount', '折扣配置', 'pc', '系统设置', ['boss', 'manager'])]
    public function getDiscountList()
    {
        $storeId = $this->request->get('store_id', $this->storeId);
        $list = DiscountConfig::where('store_id', $storeId)
            ->order('sort_order', 'asc')
            ->select()
            ->toArray();
        return JsonService::data($list);
    }

    #[Permission('settings:discount', '折扣配置', 'pc', '系统设置', ['boss', 'manager'])]
    public function saveDiscount()
    {
        $data = $this->request->post();
        $storeId = $data['store_id'] ?? $this->storeId;

        if (!empty($data['id'])) {
            $config = DiscountConfig::where('id', $data['id'])
                ->where('store_id', $storeId)
                ->find();
            if (!$config) {
                return JsonService::fail('折扣配置不存在');
            }
        } else {
            $config = new DiscountConfig();
            $config->id = md5(uniqid((string)mt_rand(), true));
            $config->store_id = $storeId;
        }

        $config->discount_name = $data['discount_name'];
        $config->discount_type = $data['discount_type'];
        $config->discount_value = $data['discount_value'];
        $config->rounding_mode = $data['rounding_mode'] ?? 'yuan';
        $config->status = $data['status'] ?? 1;
        $config->sort_order = $data['sort_order'] ?? 0;
        $config->save();

        return JsonService::success('保存成功', $config->toArray());
    }

    #[Permission('settings:discount', '折扣配置', 'pc', '系统设置', ['boss', 'manager'])]
    public function deleteDiscount()
    {
        $id = $this->request->post('id');
        $config = DiscountConfig::where('id', $id)->find();
        if (!$config) {
            return JsonService::fail('折扣配置不存在');
        }
        $config->delete();
        return JsonService::success('删除成功');
    }
}
