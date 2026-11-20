<?php

namespace app\storeapi\controller\table;

use app\storeapi\controller\BaseStoreController;
use app\storeapi\logic\table\TableLogic;
use app\common\annotation\Permission;
use app\common\service\JsonService;

class TableController extends BaseStoreController
{
    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function lists()
    {
        $params = $this->request->get();
        $result = TableLogic::getList($params, $this->storeId);
        if ($result === false) return JsonService::fail(TableLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
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
        $result = TableLogic::getDetail($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableLogic::getError());
        }
        if ($result === false) return JsonService::fail(TableLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function create()
    {
        $params = $this->request->post();
        $storeId = $this->storeId ?: ($params['store_id'] ?? $this->request->get('store_id', ''));
        $result = TableLogic::create($params, $storeId);
        if ($result === false || $result === null) {
            return JsonService::fail(TableLogic::getError() ?: '创建失败');
        }
        return JsonService::success('创建成功', $result??[]);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
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
        $result = TableLogic::update($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableLogic::getError());
        }
        if (empty($result)) {
            return JsonService::fail('更新失败');
        }
        return JsonService::success('更新成功', $result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
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
        $result = TableLogic::delete($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableLogic::getError());
        }
        return JsonService::success('删除成功');
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function batch()
    {
        $params = $this->request->post();
        $result = TableLogic::batchCreate($params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableLogic::getError());
        }
        return JsonService::success('批量创建成功', $result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function qrcode()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/qrcode\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $result = TableLogic::generateQrcode($id, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableLogic::getError());
        }
        if ($result === false) return JsonService::fail(TableLogic::getError());
        return JsonService::data($result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function pricing()
    {
        $id = $this->request->param('id', '');
        if (empty($id)) {
            $path = $this->request->url(true);
            if (preg_match('/pricing\/([^\/\?]+)/', $path, $matches)) {
                $id = $matches[1];
            }
        }
        if (empty($id)) {
            return JsonService::fail('参数错误');
        }
        $params = $this->request->post();
        $result = TableLogic::bindPricing($id, $params, $this->storeId);
        if ($result === false) {
            return JsonService::fail(TableLogic::getError());
        }
        return JsonService::success('绑定成功', $result);
    }

    #[Permission('settings:table', '台桌管理', 'pc', '系统设置', ['boss', 'manager'])]
    public function stats()
    {
        $params = $this->request->get();
        $result = TableLogic::getStats($this->storeId, $params);
        if ($result === false) return JsonService::fail(TableLogic::getError());
        return JsonService::data($result);
    }
}
