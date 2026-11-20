<?php
namespace app\common\model\merchant;

use app\common\model\BaseModel;

class Merchant extends BaseModel
{
    protected $name = 'merchants';

    protected $schema = [
        'id' => 'string',
        'name' => 'string',
        'business_license_no' => 'string',
        'legal_person' => 'string',
        'legal_id_card' => 'string',
        'legal_id_card_front_url' => 'string',
        'legal_id_card_back_url' => 'string',
        'business_license_url' => 'string',
        'contact_name' => 'string',
        'contact_phone' => 'string',
        'contact_email' => 'string',
        'address' => 'string',
        'industry_category' => 'string',
        'status' => 'string',
        'rejection_reason' => 'string',
        'approved_at' => 'datetime',
        'approved_by' => 'string',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    const STATUS_PENDING = 'pending';
    const STATUS_APPROVED = 'approved';
    const STATUS_REJECTED = 'rejected';
    const STATUS_CANCELLED = 'cancelled';

    public function getStatusTextAttr($value, $data)
    {
        $statusMap = [
            self::STATUS_PENDING => '待审核',
            self::STATUS_APPROVED => '已通过',
            self::STATUS_REJECTED => '已驳回',
            self::STATUS_CANCELLED => '已取消',
        ];
        return $statusMap[$data['status']] ?? '未知';
    }
}