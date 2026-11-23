<?php

namespace app\storeapi\controller\support;

use app\storeapi\controller\BaseStoreController;
use app\common\service\JsonService;
use think\facade\Db;

/**
 * 商户端 — 工单提交与查询
 */
class SupportController extends BaseStoreController
{
    // 文档和公告无需登录
    public array $notNeedLogin = ['articles', 'articleDetail', 'announcements'];

    // ==================== 工单 ====================

    /** 商户工单列表 */
    public function tickets()
    {
        $storeId = $this->getStoreId();
        $params  = $this->request->get();

        $query = Db::name('tickets')->where('store_id', $storeId)
            ->order('created_at', 'desc');

        if (!empty($params['status'])) $query->where('status', $params['status']);
        $list  = $query->page($params['page_no'] ?? 1, $params['page_size'] ?? 20)->select()->toArray();

        return JsonService::data(['list' => $list]);
    }

    /** 提交工单 */
    public function submitTicket()
    {
        $params = $this->request->post();
        if (empty($params['title'])) return JsonService::fail('请填写问题标题');
        if (empty($params['content'])) return JsonService::fail('请填写问题描述');

        $storeId = $this->getStoreId();
        $store   = Db::name('busi_store')->where('id', $storeId)->field('name, merchant_id')->find();
        $merchantName = '';

        if ($store && !empty($store['merchant_id'])) {
            $merchant = Db::name('merchants')->where('id', $store['merchant_id'])->field('name')->find();
            $merchantName = $merchant['name'] ?? '';
        }

        $ticketNo = 'TK' . date('YmdHis') . mt_rand(100, 999);
        $id = 'tkt_' . bin2hex(random_bytes(12));

        Db::name('tickets')->insert([
            'id'            => $id,
            'ticket_no'     => $ticketNo,
            'store_id'      => $storeId,
            'merchant_name' => $merchantName,
            'type'          => $params['type'] ?? 'other',
            'title'         => $params['title'],
            'content'       => $params['content'],
            'status'        => 'submitted',
            'created_at'    => date('Y-m-d H:i:s'),
        ]);

        return JsonService::success('工单已提交', ['id' => $id, 'ticket_no' => $ticketNo]);
    }

    /** 工单详情+回复 */
    public function ticketDetail()
    {
        $id = $this->request->param('id');
        $ticket = Db::name('tickets')->where('id', $id)->find();
        if (!$ticket) return JsonService::fail('工单不存在');

        $replies = Db::name('ticket_replies')->where('ticket_id', $id)
            ->order('created_at', 'asc')->select()->toArray();

        return JsonService::data(['ticket' => $ticket, 'replies' => $replies]);
    }

    // ==================== 帮助文档 ====================

    /** 文档列表 */
    public function articles()
    {
        $params = $this->request->get();
        $query = Db::name('help_articles')->where('status', 'published');

        if (!empty($params['category'])) {
            $query->where('category', $params['category']);
        }

        $list = $query->field('id, title, category, content, created_at')
            ->order('sort_order', 'asc')->order('created_at', 'desc')
            ->select()->toArray();
        return JsonService::data(['list' => $list]);
    }

    /** 文档详情 */
    public function articleDetail()
    {
        $id = $this->request->param('id');
        $article = Db::name('help_articles')->where('id', $id)->find();
        if (!$article) return JsonService::fail('文档不存在');
        return JsonService::data($article);
    }

    // ==================== 公告 ====================

    /** 公告列表 */
    public function announcements()
    {
        $list = Db::name('announcements')
            ->where('status', 'published')
            ->field('id, title, content, created_at')
            ->order('created_at', 'desc')->limit(20)->select()->toArray();
        return JsonService::data(['list' => $list]);
    }
}
