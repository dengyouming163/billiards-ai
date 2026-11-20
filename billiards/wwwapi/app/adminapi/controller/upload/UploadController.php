<?php

namespace app\adminapi\controller\upload;

use app\adminapi\controller\BaseAdminController;
use app\common\enum\FileEnum;
use app\common\service\UploadService;
use Exception;

class UploadController extends BaseAdminController
{
    public function image()
    {
        try {
            $result = UploadService::image(0, 0, FileEnum::SOURCE_ADMIN);
            return json(['code' => 1, 'msg' => '上传成功', 'data' => $result]);
        } catch (Exception $e) {
            return json(['code' => 0, 'msg' => $e->getMessage(), 'data' => null]);
        }
    }

    public function file()
    {
        try {
            $result = UploadService::file(0, 0, FileEnum::SOURCE_ADMIN);
            return json(['code' => 1, 'msg' => '上传成功', 'data' => $result]);
        } catch (Exception $e) {
            return json(['code' => 0, 'msg' => $e->getMessage(), 'data' => null]);
        }
    }
}