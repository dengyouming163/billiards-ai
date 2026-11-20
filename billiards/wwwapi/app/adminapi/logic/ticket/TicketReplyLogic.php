<?php
namespace app\adminapi\logic\ticket;

use app\common\model\ticket\Ticket;
use app\common\model\ticket\TicketReply;
use think\facade\Db;

class TicketReplyLogic
{
    protected static $error = '';

    public static function getError()
    {
        return self::$error;
    }

    public static function lists($ticket_id)
    {
        $list = TicketReply::where('ticket_id', $ticket_id)
            ->order('created_at', 'asc')
            ->select()
            ->toArray();

        return [
            'lists' => $list,
            'count' => count($list),
        ];
    }

    public static function add($params)
    {
        $ticket_id = $params['ticket_id'] ?? '';
        $content = $params['content'] ?? '';

        if (empty($ticket_id)) {
            self::$error = '请选择工单';
            return false;
        }

        if (empty($content)) {
            self::$error = '请输入回复内容';
            return false;
        }

        $ticket = Ticket::where('id', $ticket_id)->find();
        if (!$ticket) {
            self::$error = '工单不存在';
            return false;
        }

        $adminId = request()->adminId;
        $admin = \app\common\model\auth\Admin::where('id', $adminId)->find();

        $reply = TicketReply::create([
            'id' => uniqid(),
            'ticket_id' => $ticket_id,
            'sender_type' => 'admin',
            'sender_id' => $adminId,
            'sender_name' => $admin['name'] ?? '管理员',
            'content' => $content,
            'attachments' => $params['attachments'] ?? null,
            'created_at' => date('Y-m-d H:i:s'),
        ]);

        Ticket::where('id', $ticket_id)->update([
            'status' => 'processing',
            'updated_at' => date('Y-m-d H:i:s'),
        ]);

        return $reply->toArray();
    }

    public static function delete($id)
    {
        $reply = TicketReply::where('id', $id)->find();
        if (!$reply) {
            self::$error = '回复不存在';
            return false;
        }

        $reply->delete();
        return true;
    }
}