<?php

declare (strict_types=1);

namespace app\storeapi\logic\help;

use app\common\logic\BaseLogic;
use app\common\model\merchant\Help;

class HelpLogic extends BaseLogic
{
    public static function getLists(array $params)
    {
        try {
            $category = $params['category'] ?? '';

            $query = Help::enabled()->order('sort', 'asc');

            if (!empty($category)) {
                $query->where('category', $category);
            }

            $list = $query->select();

            $result = [];
            foreach ($list as $item) {
                $result[] = [
                    'id' => $item['id'],
                    'category' => $item['category'],
                    'categoryText' => $item->category_text,
                    'title' => $item['title'],
                    'content' => $item['content'],
                ];
            }

            return $result;
        } catch (\Exception $e) {
            self::setError($e->getMessage());
            return false;
        }
    }

    public static function getCategories()
    {
        return [
            ['key' => 'sys-overview', 'label' => '📘 系统总览'],
            ['key' => 'sys-store', 'label' => '📗 子系统 — 商家管理后台'],
            ['key' => 'sys-pos', 'label' => '📗 子系统 — 收银POS端'],
            ['key' => 'sys-tablet', 'label' => '📗 子系统 — 平板点单端'],
            ['key' => 'sys-app', 'label' => '📗 子系统 — 移动员工端'],
            ['key' => 'sys-miniapp', 'label' => '📗 子系统 — 微信小程序'],
            ['key' => 'sys-platform', 'label' => '📗 子系统 — 平台管理后台'],
            ['key' => 'role-boss', 'label' => '📙 角色操作手册 — 老板/店长'],
            ['key' => 'role-cashier', 'label' => '📙 角色操作手册 — 收银员'],
            ['key' => 'role-assistant', 'label' => '📙 角色操作手册 — 助教'],
            ['key' => 'role-waiter', 'label' => '📙 角色操作手册 — 服务员'],
            ['key' => 'role-admin', 'label' => '📙 角色操作手册 — 平台管理员'],
            ['key' => 'biz-open', 'label' => '📕 业务流程 — 开台计费'],
            ['key' => 'biz-order', 'label' => '📕 业务流程 — 点单配送'],
            ['key' => 'biz-assistant', 'label' => '📕 业务流程 — 助教服务'],
            ['key' => 'biz-checkout', 'label' => '📕 业务流程 — 结账支付'],
            ['key' => 'biz-coupon', 'label' => '📕 业务流程 — 套餐验券'],
            ['key' => 'biz-member', 'label' => '📕 业务流程 — 会员管理'],
            ['key' => 'biz-shift', 'label' => '📕 业务流程 — 交班对账'],
            ['key' => 'biz-report', 'label' => '📕 业务流程 — 报表查看'],
            ['key' => 'feat-table', 'label' => '📓 功能模块 — 台桌管理'],
            ['key' => 'feat-order', 'label' => '📓 功能模块 — 订单管理'],
            ['key' => 'feat-product', 'label' => '📓 功能模块 — 商品管理'],
            ['key' => 'feat-member', 'label' => '📓 功能模块 — 会员管理'],
            ['key' => 'feat-assistant', 'label' => '📓 功能模块 — 助教管理'],
            ['key' => 'feat-employee', 'label' => '📓 功能模块 — 员工管理'],
            ['key' => 'feat-pricing', 'label' => '📓 功能模块 — 计费规则'],
            ['key' => 'feat-finance', 'label' => '📓 功能模块 — 财务对账'],
            ['key' => 'feat-coupon', 'label' => '📓 功能模块 — 套餐券'],
            ['key' => 'feat-charging', 'label' => '📓 功能模块 — 充电管理'],
            ['key' => 'feat-settings', 'label' => '📓 功能模块 — 系统设置'],
        ];
    }
}