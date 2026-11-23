<?php

namespace app\storeapi\controller;

use app\common\service\JsonService;

class UploadController extends BaseStoreController
{
    public array $notNeedLogin = ['index'];

    public function index()
    {
        $file = request()->file('file');
        if (!$file) {
            return JsonService::fail('请选择要上传的图片');
        }

        $type = request()->post('type', 'general');

        // 验证文件类型
        $ext = strtolower(pathinfo($file->getOriginalName(), PATHINFO_EXTENSION));
        $allowedExt = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
        if (!in_array($ext, $allowedExt)) {
            return JsonService::fail('不支持的图片格式');
        }

        // 验证大小 (5MB)
        if ($file->getSize() > 5 * 1024 * 1024) {
            return JsonService::fail('图片大小不能超过 5MB');
        }

        // 保存
        $uploadDir = app()->getRootPath() . 'public/uploads/' . $type;
        $timestamp = floor(microtime(true) * 1000);
        $filename = $type . '_' . $timestamp . '.' . $ext;
        $savename = $uploadDir . '/' . $filename;
        $fileSize = $file->getSize(); // 在 move 之前获取文件大小

        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        try {
            $file->move($uploadDir, $filename);
        } catch (\Exception $e) {
            return JsonService::fail('图片保存失败，请重试');
        }

        $url = 'https://api.tpzl88.com/uploads/' . $type . '/' . $filename;

        return JsonService::success('上传成功', [
            'url' => $url,
            'filename' => $filename,
            'fileSize' => $fileSize,
        ]);
    }
}
