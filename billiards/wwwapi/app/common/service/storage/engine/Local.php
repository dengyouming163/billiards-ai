<?php

namespace app\common\service\storage\engine;


/**
 * 本地文件驱动
 * Class Local
 * @package app\common\library\storage\drivers
 */
class Local extends Server
{
    public function __construct()
    {
        parent::__construct();
    }

    /**
     * 上传
     * @param $save_dir (保存路径)
     * @return bool
     */
    public function upload($save_dir)
    {
        // 确保上传目录存在
        $fullDir = public_path() . $save_dir;
        if (!is_dir($fullDir)) {
            mkdir($fullDir, 0755, true);
        }

        // 验证文件并上传
        $info = $this->file->move($fullDir, $this->fileName);
        if (empty($info)) {
            $this->error = $this->file->getError();
            return false;
        }
        return true;
    }

    /**
     * 返回文件路径 (相对 public 目录)
     */
    public function getFileName()
    {
        return $this->fileName;
    }

    public function fetch($url, $key=null) {}

    /**
     * 删除文件
     * @param $fileName
     * @return bool|mixed
     */
    public function delete($fileName)
    {
        $check = strpos($fileName, '/');
        if ($check !== false && $check == 0) {
            // 文件所在目录
            $fileName = substr_replace($fileName,"",0,1);
        }
        $filePath = public_path() . "{$fileName}";
        return !file_exists($filePath) ?: unlink($filePath);
    }

}
