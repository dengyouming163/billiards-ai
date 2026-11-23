<?php

namespace app\storeapi\controller\upload;

use app\storeapi\controller\BaseStoreController;
use app\common\service\JsonService;

class UploadController extends BaseStoreController
{
    public array $notNeedLogin = ['image'];

    public function image()
    {
        $file = request()->file('file');
        if (!$file) {
            return JsonService::fail('请选择要上传的图片');
        }

        $type = request()->post('type', 'general');
        $ext = strtolower(pathinfo($file->getOriginalName(), PATHINFO_EXTENSION));
        if (!in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'])) {
            return JsonService::fail('不支持的图片格式');
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return JsonService::fail('图片大小不能超过 5MB');
        }

        $uploadDir = app()->getRootPath() . 'public/uploads/' . $type;
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0775, true);
        }

        $filename = $type . '_' . round(microtime(true) * 1000) . '.' . $ext;
        try {
            $file->move($uploadDir, $filename);
        } catch (\Exception $e) {
            return JsonService::fail('图片保存失败');
        }

        $url = 'https://api.tpzl88.com/uploads/' . $type . '/' . $filename;
        return JsonService::success('上传成功', ['url' => $url, 'filename' => $filename]);
    }
}
