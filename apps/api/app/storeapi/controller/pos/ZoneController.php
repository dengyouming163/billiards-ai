<?php

declare (strict_types=1);

namespace app\storeapi\controller\pos;

use app\storeapi\logic\zone\ZoneLogic;

class ZoneController extends BasePosController
{
    public function lists()
    {
        $params = $this->request->get();
        $result = ZoneLogic::getList($params, $this->storeId);
        return $this->data($result);
    }

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
            return $this->fail('参数错误');
        }

        $result = ZoneLogic::getDetail($id, $this->storeId);

        if ($result === false) {
            return $this->fail(ZoneLogic::getError());
        }

        return $this->data($result);
    }
}
