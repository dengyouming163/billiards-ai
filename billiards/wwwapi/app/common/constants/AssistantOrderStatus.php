<?php

declare (strict_types=1);

namespace app\common\constants;

class AssistantOrderStatus
{
    const PENDING = 'pending';
    const ACCEPTED = 'accepted';
    const REJECTED = 'rejected';
    const IN_PROGRESS = 'in_progress';
    const COMPLETED = 'completed';
    const REVIEWED = 'reviewed';
    const CANCELLED = 'cancelled';

    const ALL = [
        self::PENDING,
        self::ACCEPTED,
        self::REJECTED,
        self::IN_PROGRESS,
        self::COMPLETED,
        self::REVIEWED,
        self::CANCELLED,
    ];

    const ACTIVE = [
        self::PENDING,
        self::ACCEPTED,
        self::IN_PROGRESS,
    ];

    const FINISHED = [
        self::COMPLETED,
        self::REVIEWED,
    ];

    const CAN_ACCEPT = [self::PENDING];
    const CAN_REJECT = [self::PENDING];
    const CAN_START = [self::ACCEPTED];
    const CAN_COMPLETE = [self::IN_PROGRESS];
    const CAN_CANCEL = [self::PENDING, self::IN_PROGRESS];
    const CAN_REVIEW = [self::COMPLETED];
}
