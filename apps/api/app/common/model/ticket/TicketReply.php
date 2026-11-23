<?php
namespace app\common\model\ticket;

use app\common\model\BaseModel;

class TicketReply extends BaseModel
{
    protected $name = 'ticket_replies';

    protected $schema = [
        'id' => 'string',
        'ticket_id' => 'string',
        'sender_type' => 'string',
        'sender_id' => 'string',
        'content' => 'string',
        'attachments' => 'json',
        'created_at' => 'datetime',
    ];

    const SENDER_TYPE_MERCHANT = 'merchant';
    const SENDER_TYPE_PLATFORM = 'platform';
}