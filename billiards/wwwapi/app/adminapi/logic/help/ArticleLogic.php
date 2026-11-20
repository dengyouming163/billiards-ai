<?php
namespace app\adminapi\logic\help;

use app\common\model\help\Article;

class ArticleLogic
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
        $category = $params['category'] ?? '';
        $status = $params['status'] ?? '';

        $query = Article::order('sort', 'asc')->order('created_at', 'desc');

        if (!empty($category)) {
            $query->where('category', $category);
        }

        if ($status !== '' && $status !== null) {
            // busi_help.status is tinyint: 0=draft, 1=published
            $query->where('status', $status === 'published' || $status === '1' ? 1 : 0);
        }

        $list = $query->page($pageNo, $pageSize)->select()->toArray();
        // 状态映射：tinyint → string 保持前端兼容
        foreach ($list as &$item) {
            $item['status'] = ($item['status'] ?? 0) == 1 ? 'published' : 'draft';
        }
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
        $article = Article::where('id', $id)->find();
        if (!$article) {
            self::$error = '文档不存在';
            return false;
        }
        return $article->toArray();
    }

    public static function add($params)
    {
        $title = $params['title'] ?? '';
        $content = $params['content'] ?? '';

        if (empty($title)) {
            self::$error = '请输入文档标题';
            return false;
        }

        if (empty($content)) {
            self::$error = '请输入文档内容';
            return false;
        }

        $article = Article::create([
            'id'        => uniqid(),
            'title'     => $title,
            'category'  => $params['category'] ?? 'guide',
            'content'   => $content,
            'status'    => ($params['status'] ?? 'draft') === 'published' ? 1 : 0,
            'sort'      => $params['sort_order'] ?? $params['sort'] ?? 0,
            'created_at'=> date('Y-m-d H:i:s'),
            'updated_at'=> date('Y-m-d H:i:s'),
        ]);

        return $article->toArray();
    }

    public static function edit($id, $params)
    {
        $article = Article::where('id', $id)->find();
        if (!$article) {
            self::$error = '文档不存在';
            return false;
        }

        $data = [];
        if (isset($params['title'])) {
            $data['title'] = $params['title'];
        }
        if (isset($params['category'])) {
            $data['category'] = $params['category'];
        }
        if (isset($params['content'])) {
            $data['content'] = $params['content'];
        }
        if (isset($params['author'])) {
            $data['author'] = $params['author'];
        }
        if (isset($params['status'])) {
            $data['status'] = $params['status'] === 'published' || $params['status'] === '1' ? 1 : 0;
        }
        if (isset($params['sort_order'])) {
            $data['sort'] = (int) $params['sort_order'];
        }
        if (isset($params['sort'])) {
            $data['sort'] = (int) $params['sort'];
        }

        $data['updated_at'] = date('Y-m-d H:i:s');
        $article->save($data);

        return $article->toArray();
    }

    public static function delete($id)
    {
        $article = Article::where('id', $id)->find();
        if (!$article) {
            self::$error = '文档不存在';
            return false;
        }

        $article->delete();
        return true;
    }
}