<?php
namespace app\adminapi\logic\ticket;

use app\adminapi\lists\ticket\TicketLists;
use app\common\logic\BaseLogic;
use app\common\model\ticket\Ticket;
use app\common\service\JsonService;

class TicketLogic extends BaseLogic
{
    public static function lists(array $params)
    {
        $lists = new TicketLists($params);
        return JsonService::dataLists($lists);
    }

    public static function detail(string $id)
    {
        $ticket = Ticket::find($id);
        if (empty($ticket)) {
            self::setError('工单不存在');
            return false;
        }
        return $ticket->toArray();
    }

    public static function add(array $params)
    {
        $ticket = new Ticket();
        $ticket->id = self::uuid();
        $ticket->ticket_no = self::generateTicketNo();
        $ticket->merchant_id = $params['merchant_id'] ?? '';
        $ticket->type = $params['type'] ?? Ticket::TYPE_CONSULTATION;
        $ticket->priority = $params['priority'] ?? Ticket::PRIORITY_NORMAL;
        $ticket->title = $params['title'] ?? '';
        $ticket->content = $params['content'] ?? '';
        $ticket->attachments = json_encode($params['attachments'] ?? []);
        $ticket->status = Ticket::STATUS_SUBMITTED;
        $ticket->created_at = date('Y-m-d H:i:s');

        if (!$ticket->save()) {
            self::setError('添加失败');
            return false;
        }

        return $ticket->toArray();
    }

    public static function edit(string $id, array $params)
    {
        $ticket = Ticket::find($id);
        if (empty($ticket)) {
            self::setError('工单不存在');
            return false;
        }

        if (isset($params['title'])) $ticket->title = $params['title'];
        if (isset($params['content'])) $ticket->content = $params['content'];
        if (isset($params['type'])) $ticket->type = $params['type'];
        if (isset($params['priority'])) $ticket->priority = $params['priority'];
        if (isset($params['status'])) $ticket->status = $params['status'];
        if (isset($params['assigned_to'])) $ticket->assigned_to = $params['assigned_to'];
        if (isset($params['internal_notes'])) $ticket->internal_notes = $params['internal_notes'];
        $ticket->updated_at = date('Y-m-d H:i:s');

        if (!$ticket->save()) {
            self::setError('修改失败');
            return false;
        }

        return $ticket->toArray();
    }

    public static function delete(string $id)
    {
        $ticket = Ticket::find($id);
        if (empty($ticket)) {
            self::setError('工单不存在');
            return false;
        }

        if (!$ticket->delete()) {
            self::setError('删除失败');
            return false;
        }

        return true;
    }

    public static function statistics()
    {
        $total = Ticket::count();
        $submitted = Ticket::where('status', Ticket::STATUS_SUBMITTED)->count();
        $processing = Ticket::where('status', Ticket::STATUS_PROCESSING)->count();
        $closed = Ticket::where('status', Ticket::STATUS_CLOSED)->count();

        return [
            'total' => $total,
            'submitted' => $submitted,
            'processing' => $processing,
            'closed' => $closed,
        ];
    }

    private static function uuid()
    {
        return sprintf(
            '%04x%04x-%04x-%04x-%04x-%04x%04x%04x',
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0x0fff) | 0x4000,
            mt_rand(0, 0x3fff) | 0x8000,
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff),
            mt_rand(0, 0xffff)
        );
    }

    private static function generateTicketNo()
    {
        return 'TK' . date('Ymd') . str_pad((string)mt_rand(1, 99999), 5, '0', STR_PAD_LEFT);
    }

    /** 工单状态变更 */
    public static function statusChange(string $id, string $status): bool
    {
        $ticket = \app\common\model\merchant\Ticket::find($id);
        if (!$ticket) { self::setError('工单不存在'); return false; }
        $ticket->status = $status;
        $ticket->save();
        return true;
    }
}