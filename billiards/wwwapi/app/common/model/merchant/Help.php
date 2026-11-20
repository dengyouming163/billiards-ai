<?php

declare (strict_types=1);

namespace app\common\model\merchant;

use think\Model;

class Help extends Model
{
    protected $name = 'busi_help';
    protected $pk = 'id';

    protected $schema = [
        'id' => 'string',
        'category' => 'string',
        'title' => 'string',
        'content' => 'string',
        'sort' => 'int',
        'status' => 'int',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function getCategoryTextAttr($value, $data)
    {
        $categories = [
            'sys-overview' => '系统总览',
            'sys-store' => '商家管理后台',
            'sys-pos' => '收银POS端',
            'sys-tablet' => '平板点单端',
            'sys-app' => '移动员工端',
            'sys-miniapp' => '微信小程序',
            'sys-platform' => '平台管理后台',
            'sys-socket' => '实时通信服务',
            'sys-api' => '后端API',
            'role-boss' => '老板/店长',
            'role-cashier' => '收银员',
            'role-assistant' => '助教',
            'role-waiter' => '服务员',
            'role-admin' => '平台管理员',
            'biz-open' => '开台流程',
            'biz-order' => '点单流程',
            'biz-assistant' => '助教服务',
            'biz-checkout' => '结账支付',
            'biz-coupon' => '套餐验券',
            'biz-member' => '会员管理',
            'biz-shift' => '交班对账',
            'biz-report' => '报表查看',
            'feat-table' => '台桌管理',
            'feat-order' => '订单管理',
            'feat-product' => '商品管理',
            'feat-member' => '会员管理',
            'feat-assistant' => '助教管理',
            'feat-employee' => '员工管理',
            'feat-pricing' => '计费规则',
            'feat-finance' => '财务对账',
            'feat-report' => '经营报表',
            'feat-coupon' => '套餐券管理',
            'feat-charging' => '充电管理',
            'feat-settings' => '系统设置',
            'feat-notification' => '通知消息',
            'feat-schedule' => '排班管理',
            'feat-approval' => '审批流程',
        ];
        return $categories[$data['category']] ?? $data['category'] ?? '其他';
    }

    public function scopeEnabled($query)
    {
        return $query->where('status', 1);
    }

    public function scopeByCategory($query, $category)
    {
        return $query->where('category', $category);
    }
}