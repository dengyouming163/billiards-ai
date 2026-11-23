<?php
namespace app\adminapi\logic\announcement;

use app\common\model\announcement\Announcement;
use think\facade\Db;

class AnnouncementLogic
{
    protected static $error = '';

    public static function getError()
    {
        return self::$error;
    }

    public static function lists($params)
    {
        $pageNo = $params['page_no'] ?? 1;
        $pageSize = $params['page_size'] ?? 10;
        $status = $params['status'] ?? '';
        $type = $params['type'] ?? '';

        $query = Announcement::order('created_at', 'desc');

        if (!empty($status)) {
            $query->where('status', $status);
        }

        if (!empty($type)) {
            $query->where('type', $type);
        }

        $list = $query->page($pageNo, $pageSize)->select()->toArray();
        $count = $query->count();

        return [
            'lists' => $list,
            'count' => $count,
            'page_no' => (int)$pageNo,
            'page_size' => (int)$pageSize,
        ];
    }

    public static function detail($id)
    {
        $announcement = Announcement::where('id', $id)->find();
        if (!$announcement) {
            self::$error = '公告不存在';
            return false;
        }
        return $announcement->toArray();
    }

    public static function add($params)
    {
        $title = $params['title'] ?? '';
        $content = $params['content'] ?? '';

        if (empty($title)) {
            self::$error = '请输入公告标题';
            return false;
        }

        if (empty($content)) {
            self::$error = '请输入公告内容';
            return false;
        }

        $announcement = Announcement::create([
            'id' => uniqid(),
            'title' => $title,
            'type' => $params['type'] ?? 'system',
            'content' => $content,
            'target_scope' => $params['target_scope'] ?? 'all',
            'target_merchant_ids' => $params['target_merchant_ids'] ?? null,
            'publish_at' => $params['publish_at'] ?? null,
            'status' => 'draft',
            'created_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $announcement->toArray();
    }

    public static function edit($id, $params)
    {
        $announcement = Announcement::where('id', $id)->find();
        if (!$announcement) {
            self::$error = '公告不存在';
            return false;
        }

        $data = [];
        if (isset($params['title'])) {
            $data['title'] = $params['title'];
        }
        if (isset($params['type'])) {
            $data['type'] = $params['type'];
        }
        if (isset($params['content'])) {
            $data['content'] = $params['content'];
        }
        if (isset($params['target_scope'])) {
            $data['target_scope'] = $params['target_scope'];
        }
        if (isset($params['target_merchant_ids'])) {
            $data['target_merchant_ids'] = $params['target_merchant_ids'];
        }
        if (isset($params['publish_at'])) {
            $data['publish_at'] = $params['publish_at'];
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $announcement->save($data);

        return $announcement->toArray();
    }

    public static function delete($id)
    {
        $announcement = Announcement::where('id', $id)->find();
        if (!$announcement) {
            self::$error = '公告不存在';
            return false;
        }

        $announcement->delete();
        return true;
    }

    public static function publish($id)
    {
        $announcement = Announcement::where('id', $id)->find();
        if (!$announcement) {
            self::$error = '公告不存在';
            return false;
        }

        $announcement->save([
            'status' => 'published',
            'publish_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $announcement->toArray();
    }
}