# BilliardsHub 台球厅管理系统 - API 接口清单

> 接口版本: v1.0.0
> 基础路径: `/api/v1`
> 认证方式: Bearer Token (JWT)
> 数据格式: JSON
> 编码: UTF-8

---

## 目录

1. [认证模块](#1-认证模块)
2. [门店管理](#2-门店管理)
3. [台桌管理](#3-台桌管理)
4. [分区管理](#4-分区管理)
5. [计费规则](#5-计费规则)
6. [会员管理](#6-会员管理)
7. [员工管理](#7-员工管理)
8. [助教管理](#8-助教管理)
9. [商品管理](#9-商品管理)
10. [库存管理](#10-库存管理)
11. [套餐管理](#11-套餐管理)
12. [订单管理](#12-订单管理)
13. [财务报表](#13-财务报表)
14. [经营报表](#14-经营报表)
15. [系统设置](#15-系统设置)
16. [文件上传](#16-文件上传)
17. [消息通知](#17-消息通知)
18. [数据字典](#18-数据字典)

---

## 1. 认证模块

### 1.1 登录

**POST** `/auth/login`

请求参数：
```json
{
  "phone": "13800138000",
  "password": "xxx",
  "store_id": "store_1"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "refresh_token": "xxx",
    "expires_in": 7200,
    "user": {
      "id": "emp_001",
      "name": "张三",
      "phone": "13800138000",
      "role": "manager",
      "store_id": "store_1",
      "store_name": "旗舰店"
    }
  }
}
```

### 1.2 刷新Token

**POST** `/auth/refresh`

请求参数：
```json
{
  "refresh_token": "xxx"
}
```

### 1.3 登出

**POST** `/auth/logout`

### 1.4 修改密码

**PUT** `/auth/password`

请求参数：
```json
{
  "old_password": "xxx",
  "new_password": "xxx"
}
```

### 1.5 短信登录

**POST** `/auth/sms/login`

请求参数：
```json
{
  "phone": "13800138000",
  "code": "123456",
  "store_id": "store_1"
}
```

### 1.6 发送短信验证码

**POST** `/auth/sms/send`

请求参数：
```json
{
  "phone": "13800138000",
  "type": "login|reset_password"
}
```

---

## 2. 门店管理

### 2.1 获取门店列表

**GET** `/stores`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | int | 否 | 状态：0-停业 1-营业 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "store_1",
      "name": "旗舰店",
      "code": "STORE001",
      "address": "xxx",
      "phone": "400-xxx",
      "business_hours_start": "09:00",
      "business_hours_end": "23:00",
      "status": 1
    }
  ]
}
```

### 2.2 获取门店详情

**GET** `/stores/{id}`

### 2.3 创建门店

**POST** `/stores`

请求参数：
```json
{
  "name": "新门店",
  "code": "STORE002",
  "address": "地址",
  "phone": "电话",
  "business_hours_start": "09:00",
  "business_hours_end": "23:00",
  "description": "描述"
}
```

### 2.4 更新门店

**PUT** `/stores/{id}`

### 2.5 删除门店

**DELETE** `/stores/{id}`

### 2.6 切换门店

**POST** `/stores/switch`

请求参数：
```json
{
  "store_id": "store_1"
}
```

---

## 3. 台桌管理

### 3.1 获取台桌列表

**GET** `/tables`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| zone_id | string | 否 | 分区ID |
| status | string | 否 | 状态 |
| type | string | 否 | 类型 |
| keyword | string | 否 | 关键词搜索 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "table_1",
      "store_id": "store_1",
      "zone_id": "zone_1",
      "zone_name": "普通区",
      "number": "01",
      "name": "1号台",
      "type": "standard",
      "status": "idle",
      "pricing_id": "pricing_1",
      "pricing_name": "标准计费",
      "hourly_rate": 30.00,
      "total_usage_count": 156,
      "total_usage_hours": 468.5
    }
  ]
}
```

### 3.2 获取台桌详情

**GET** `/tables/{id}`

### 3.3 创建台桌

**POST** `/tables`

请求参数：
```json
{
  "zone_id": "zone_1",
  "number": "01",
  "name": "1号台",
  "type": "standard",
  "pricing_id": "pricing_1",
  "hourly_rate": 30.00,
  "description": "描述"
}
```

### 3.4 更新台桌

**PUT** `/tables/{id}`

### 3.5 删除台桌

**DELETE** `/tables/{id}`

### 3.6 批量创建台桌

**POST** `/tables/batch`

请求参数：
```json
{
  "zone_id": "zone_1",
  "prefix": "A",
  "start": 1,
  "end": 10,
  "type": "standard"
}
```

### 3.7 生成台桌二维码

**POST** `/tables/{id}/qrcode`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "qrcode_url": "https://xxx/qrcode/table_1.png"
  }
}
```

### 3.8 绑定计费规则

**POST** `/tables/{id}/pricing`

请求参数：
```json
{
  "pricing_id": "pricing_1"
}
```

### 3.9 获取台桌统计

**GET** `/tables/stats`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| zone_id | string | 否 | 分区ID |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 20,
    "idle": 8,
    "occupied": 10,
    "reserved": 2,
    "maintenance": 0,
    "total_usage_hours": 1568.5,
    "total_revenue": 45680.00
  }
}
```

---

## 4. 分区管理

### 4.1 获取分区列表

**GET** `/zones`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| store_id | string | 是 | 门店ID |

### 4.2 获取分区详情

**GET** `/zones/{id}`

### 4.3 创建分区

**POST** `/zones`

请求参数：
```json
{
  "name": "普通区",
  "code": "NORMAL",
  "color": "#00D4AA",
  "description": "普通台球区",
  "sort_order": 1,
  "status": 1
}
```

### 4.4 更新分区

**PUT** `/zones/{id}`

### 4.5 删除分区

**DELETE** `/zones/{id}`

### 4.6 获取分区下的台桌

**GET** `/zones/{id}/tables`

---

## 5. 计费规则

### 5.1 获取计费规则列表

**GET** `/pricings`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型 |
| status | int | 否 | 状态 |

### 5.2 获取计费规则详情

**GET** `/pricings/{id}`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "pricing_1",
    "name": "标准计时",
    "type": "time",
    "price": 30.00,
    "unit": "hour",
    "min_duration": 60,
    "description": "每小时30元",
    "status": 1,
    "periods": [
      {
        "id": "period_1",
        "name": "平时段",
        "type": "off_peak",
        "start_time": "09:00",
        "end_time": "18:00",
        "price": 30.00,
        "coefficient": 1.0
      },
      {
        "id": "period_2",
        "name": "高峰时段",
        "type": "peak",
        "start_time": "18:00",
        "end_time": "23:00",
        "price": 50.00,
        "coefficient": 1.5
      }
    ]
  }
}
```

### 5.3 创建计费规则

**POST** `/pricings`

请求参数：
```json
{
  "name": "标准计时",
  "type": "time",
  "price": 30.00,
  "unit": "hour",
  "min_duration": 60,
  "description": "描述",
  "status": 1,
  "periods": [
    {
      "name": "平时段",
      "type": "off_peak",
      "start_time": "09:00",
      "end_time": "18:00",
      "price": 30.00,
      "coefficient": 1.0
    }
  ]
}
```

### 5.4 更新计费规则

**PUT** `/pricings/{id}`

### 5.5 删除计费规则

**DELETE** `/pricings/{id}`

### 5.6 获取时段配置列表

**GET** `/pricings/{id}/periods`

### 5.7 添加时段配置

**POST** `/pricings/{id}/periods`

请求参数：
```json
{
  "name": "黄金时段",
  "type": "golden",
  "start_time": "20:00",
  "end_time": "23:00",
  "price": 60.00,
  "coefficient": 2.0,
  "weekdays": "1,2,3,4,5,6,7"
}
```

### 5.8 更新时段配置

**PUT** `/pricings/{pricing_id}/periods/{period_id}`

### 5.9 删除时段配置

**DELETE** `/pricings/{pricing_id}/periods/{period_id}`

---

## 6. 会员管理

### 6.1 获取会员列表

**GET** `/members`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level_id | string | 否 | 等级ID |
| status | int | 否 | 状态 |
| keyword | string | 否 | 搜索(姓名/手机号) |
| start_date | string | 否 | 注册开始日期 |
| end_date | string | 否 | 注册结束日期 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "member_1",
      "name": "李四",
      "phone": "13900139000",
      "level_id": "level_gold",
      "level_name": "金卡会员",
      "level_color": "#ffd700",
      "balance": 500.00,
      "points": 8500,
      "total_consume": 12000.00,
      "total_recharge": 15000.00,
      "status": 1,
      "last_consume_time": "2024-01-15 14:30:00"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 6.2 获取会员详情

**GET** `/members/{id}`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "member_1",
    "store_id": "store_1",
    "name": "李四",
    "phone": "13900139000",
    "gender": "male",
    "avatar": "https://xxx/avatar.jpg",
    "birthday": "1990-01-01",
    "level_id": "level_gold",
    "level_name": "金卡会员",
    "balance": 500.00,
    "points": 8500,
    "total_consume": 12000.00,
    "total_recharge": 15000.00,
    "status": 1,
    "created_at": "2023-06-01 10:00:00"
  }
}
```

### 6.3 创建会员

**POST** `/members`

请求参数：
```json
{
  "name": "李四",
  "phone": "13900139000",
  "gender": "male",
  "birthday": "1990-01-01",
  "password": "123456",
  "balance": 0,
  "points": 0
}
```

### 6.4 更新会员

**PUT** `/members/{id}`

### 6.5 删除会员

**DELETE** `/members/{id}`

### 6.6 会员充值

**POST** `/members/{id}/recharge`

请求参数：
```json
{
  "amount": 1000.00,
  "gift_amount": 100.00,
  "payment_method": "wechat",
  "gift_points": 100,
  "operator_id": "emp_1",
  "operator_name": "张三"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "recharge_id": "recharge_1",
    "order_no": "CZ20240115143000001",
    "amount": 1000.00,
    "gift_amount": 100.00,
    "balance_before": 400.00,
    "balance_after": 1500.00,
    "gift_points": 100,
    "points_before": 8000,
    "points_after": 8100
  }
}
```

### 6.7 获取充值记录

**GET** `/members/{id}/recharges`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

### 6.8 获取消费记录

**GET** `/members/{id}/consumes`

### 6.9 积分兑换

**POST** `/members/{id}/points/exchange`

请求参数：
```json
{
  "points": 1000,
  "exchange_type": "balance|coupon|gift"
}
```

### 6.10 积分调整

**POST** `/members/{id}/points/adjust`

请求参数：
```json
{
  "points": 100,
  "type": "add|deduct",
  "reason": "活动奖励"
}
```

### 6.11 获取会员等级列表

**GET** `/member-levels`

### 6.12 创建会员等级

**POST** `/member-levels`

请求参数：
```json
{
  "name": "金卡会员",
  "code": "gold",
  "color": "#ffd700",
  "discount_rate": 90.00,
  "points_multiplier": 1.5,
  "min_points": 5000,
  "description": "金卡会员描述"
}
```

### 6.13 更新会员等级

**PUT** `/member-levels/{id}`

### 6.14 删除会员等级

**DELETE** `/member-levels/{id}`

---

## 7. 员工管理

### 7.1 获取员工列表

**GET** `/employees`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 否 | 角色 |
| status | int | 否 | 状态 |
| keyword | string | 否 | 搜索 |

### 7.2 获取员工详情

**GET** `/employees/{id}`

### 7.3 创建员工

**POST** `/employees`

请求参数：
```json
{
  "name": "王五",
  "phone": "13700137000",
  "gender": "male",
  "id_card": "110101199001011234",
  "role": "cashier",
  "position": "收银员",
  "salary": 5000.00,
  "password": "123456",
  "hire_date": "2024-01-01"
}
```

### 7.4 更新员工

**PUT** `/employees/{id}`

### 7.5 删除员工(离职)

**DELETE** `/employees/{id}`

### 7.6 重置密码

**POST** `/employees/{id}/reset-password`

### 7.7 员工排班

#### 7.7.1 获取排班列表

**GET** `/employees/schedules`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| employee_id | string | 否 | 员工ID |
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |

#### 7.7.2 创建排班

**POST** `/employees/schedules`

请求参数：
```json
{
  "employee_id": "emp_1",
  "work_date": "2024-01-15",
  "shift_type": "morning",
  "start_time": "09:00",
  "end_time": "17:00"
}
```

#### 7.7.3 批量创建排班

**POST** `/employees/schedules/batch`

请求参数：
```json
{
  "employee_ids": ["emp_1", "emp_2"],
  "schedules": [
    {
      "work_date": "2024-01-15",
      "shift_type": "morning",
      "start_time": "09:00",
      "end_time": "17:00"
    }
  ]
}
```

#### 7.7.4 删除排班

**DELETE** `/employees/schedules/{id}`

### 7.8 考勤管理

#### 7.8.1 签到

**POST** `/employees/attendance/check-in`

请求参数：
```json
{
  "schedule_id": "schedule_1"
}
```

#### 7.8.2 签退

**POST** `/employees/attendance/check-out`

请求参数：
```json
{
  "schedule_id": "schedule_1"
}
```

#### 7.8.3 获取考勤记录

**GET** `/employees/{id}/attendances`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |

#### 7.8.4 获取考勤统计

**GET** `/employees/attendance/stats`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| employee_id | string | 否 | 员工ID |
| month | string | 是 | 月份 2024-01 |

---

## 8. 助教管理

### 8.1 获取助教列表

**GET** `/assistants`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| level_id | string | 否 | 等级ID |
| status | int | 否 | 状态 |
| keyword | string | 否 | 搜索 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "assistant_1",
      "name": "小美",
      "phone": "13600136000",
      "level_id": "alevel_senior",
      "level_name": "高级助教",
      "level_color": "#8b5cf6",
      "skills": "入门教学,技巧提升",
      "hourly_rate": 120.00,
      "status": 1,
      "total_orders": 156,
      "total_hours": 468.5,
      "total_amount": 56220.00,
      "rating": 4.8
    }
  ]
}
```

### 8.2 获取助教详情

**GET** `/assistants/{id}`

### 8.3 创建助教

**POST** `/assistants`

请求参数：
```json
{
  "name": "小美",
  "phone": "13600136000",
  "gender": "female",
  "level_id": "alevel_intermediate",
  "skills": "入门教学,技巧提升",
  "hourly_rate": 80.00,
  "description": "简介"
}
```

### 8.4 更新助教

**PUT** `/assistants/{id}`

### 8.5 删除助教

**DELETE** `/assistants/{id}`

### 8.6 获取助教等级列表

**GET** `/assistant-levels`

### 8.7 创建助教等级

**POST** `/assistant-levels`

请求参数：
```json
{
  "name": "金牌助教",
  "code": "gold",
  "color": "#f59e0b",
  "hourly_rate": 200.00,
  "description": "金牌助教描述"
}
```

### 8.8 更新助教等级

**PUT** `/assistant-levels/{id}`

### 8.9 删除助教等级

**DELETE** `/assistant-levels/{id}`

### 8.10 获取助教订单记录

**GET** `/assistants/{id}/orders`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

### 8.11 获取助教业绩排行

**GET** `/assistants/rank`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| type | string | 否 | amount-业绩 hours-时长 orders-单数 |
| limit | int | 否 | 前几名，默认10 |

---

## 9. 商品管理

### 9.1 获取商品分类列表

**GET** `/product-categories`

### 9.2 创建商品分类

**POST** `/product-categories`

请求参数：
```json
{
  "name": "酒水饮料",
  "code": "DRINK",
  "icon": "coffee",
  "sort_order": 1
}
```

### 9.3 更新商品分类

**PUT** `/product-categories/{id}`

### 9.4 删除商品分类

**DELETE** `/product-categories/{id}`

### 9.5 获取商品列表

**GET** `/products`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category_id | string | 否 | 分类ID |
| status | int | 否 | 状态 |
| keyword | string | 否 | 搜索 |
| low_stock | int | 否 | 库存预警 |

### 9.6 获取商品详情

**GET** `/products/{id}`

### 9.7 创建商品

**POST** `/products`

请求参数：
```json
{
  "category_id": "cat_1",
  "name": "可乐",
  "code": "COLA001",
  "barcode": "6901234567890",
  "unit": "瓶",
  "price": 5.00,
  "cost_price": 2.50,
  "stock": 100,
  "min_stock": 20,
  "description": "冰镇可乐"
}
```

### 9.8 更新商品

**PUT** `/products/{id}`

### 9.9 删除商品

**DELETE** `/products/{id}`

### 9.10 批量更新库存

**POST** `/products/batch-stock`

请求参数：
```json
{
  "items": [
    {"product_id": "prod_1", "stock": 100},
    {"product_id": "prod_2", "stock": 50}
  ]
}
```

### 9.11 获取商品统计

**GET** `/products/stats`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 50,
    "onsale": 45,
    "offsale": 5,
    "total_stock": 2500,
    "total_value": 12500.00,
    "low_stock_count": 3,
    "out_of_stock_count": 1
  }
}
```

---

## 10. 库存管理

### 10.1 获取库存记录

**GET** `/inventory/records`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| product_id | string | 否 | 商品ID |
| type | string | 否 | inbound-outbound-adjustment |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| operator_id | string | 否 | 操作员ID |

### 10.2 入库

**POST** `/inventory/inbound`

请求参数：
```json
{
  "product_id": "prod_1",
  "quantity": 50,
  "price": 2.50,
  "total_amount": 125.00,
  "reason": "新批次入库",
  "operator_id": "emp_1",
  "operator_name": "张三",
  "remark": "备注"
}
```

### 10.3 出库

**POST** `/inventory/outbound`

请求参数：
```json
{
  "product_id": "prod_1",
  "quantity": 5,
  "reason": "损耗出库",
  "operator_id": "emp_1",
  "operator_name": "张三",
  "order_id": "order_1",
  "remark": "备注"
}
```

### 10.4 库存调整

**POST** `/inventory/adjust`

请求参数：
```json
{
  "product_id": "prod_1",
  "quantity": -3,
  "reason": "盘点差异",
  "operator_id": "emp_1",
  "operator_name": "张三",
  "remark": "备注"
}
```

### 10.5 获取库存预警列表

**GET** `/inventory/alerts`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "product_id": "prod_1",
      "product_name": "可乐",
      "category_name": "酒水饮料",
      "stock": 15,
      "min_stock": 20,
      "alert_level": "warning",
      "diff": -5
    }
  ]
}
```

### 10.6 获取库存统计

**GET** `/inventory/stats`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_products": 50,
    "total_stock": 2500,
    "total_value": 12500.00,
    "today_inbound_count": 5,
    "today_inbound_amount": 500.00,
    "today_outbound_count": 20,
    "today_outbound_amount": 100.00,
    "low_stock_count": 3,
    "out_of_stock_count": 1
  }
}
```

---

## 11. 套餐管理

### 11.1 获取套餐列表

**GET** `/packages`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | time-product-mixed-member |
| status | int | 否 | 状态 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "pkg_1",
      "name": "2小时畅打套餐",
      "type": "time",
      "price": 50.00,
      "cost_price": 30.00,
      "validity_days": 30,
      "status": 1,
      "sales_count": 156,
      "total_amount": 7800.00,
      "items": [
        {
          "item_type": "time",
          "item_name": "2小时打球时长",
          "quantity": 2,
          "unit": "小时"
        }
      ]
    }
  ]
}
```

### 11.2 获取套餐详情

**GET** `/packages/{id}`

### 11.3 创建套餐

**POST** `/packages`

请求参数：
```json
{
  "name": "2小时畅打套餐",
  "type": "time",
  "price": 50.00,
  "cost_price": 30.00,
  "validity_days": 30,
  "description": "包含2小时打球时长",
  "status": 1,
  "items": [
    {
      "item_type": "time",
      "item_name": "2小时打球时长",
      "quantity": 2,
      "unit": "小时"
    }
  ]
}
```

### 11.4 更新套餐

**PUT** `/packages/{id}`

### 11.5 删除套餐

**DELETE** `/packages/{id}`

### 11.6 获取套餐类型列表

**GET** `/package-types`

### 11.7 创建套餐类型

**POST** `/package-types`

请求参数：
```json
{
  "name": "时长套餐",
  "code": "time",
  "color": "#3b82f6",
  "description": "按打球时长计费的套餐"
}
```

### 11.8 更新套餐类型

**PUT** `/package-types/{id}`

### 11.9 删除套餐类型

**DELETE** `/package-types/{id}`

---

## 12. 订单管理

### 12.1 获取订单列表

**GET** `/orders`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | table-product-assistant |
| status | string | 否 | pending-in_progress-completed-cancelled |
| member_id | string | 否 | 会员ID |
| table_id | string | 否 | 台桌ID |
| assistant_id | string | 否 | 助教ID |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| keyword | string | 否 | 订单号/会员名 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "order_1",
      "order_no": "TB20240115143000001",
      "type": "table",
      "status": "completed",
      "member_id": "member_1",
      "member_name": "李四",
      "table_id": "table_1",
      "table_name": "1号台",
      "original_amount": 60.00,
      "discount_amount": 10.00,
      "final_amount": 50.00,
      "payment_method": "wechat",
      "balance_paid": 0.00,
      "cash_paid": 0.00,
      "wechat_paid": 50.00,
      "start_time": "2024-01-15 14:00:00",
      "end_time": "2024-01-15 16:00:00",
      "duration_minutes": 120,
      "operator_name": "张三",
      "created_at": "2024-01-15 14:30:00"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### 12.2 获取订单详情

**GET** `/orders/{id}`

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "order_1",
    "order_no": "TB20240115143000001",
    "type": "table",
    "status": "completed",
    "member_id": "member_1",
    "member_name": "李四",
    "member_level": "金卡会员",
    "table_id": "table_1",
    "table_name": "1号台",
    "pricing_id": "pricing_1",
    "pricing_name": "标准计时",
    "original_amount": 60.00,
    "discount_amount": 10.00,
    "discount_rate": 85.00,
    "final_amount": 50.00,
    "balance_paid": 0.00,
    "cash_paid": 0.00,
    "wechat_paid": 50.00,
    "alipay_paid": 0.00,
    "card_paid": 0.00,
    "points_deduct": 0,
    "points_gained": 50,
    "start_time": "2024-01-15 14:00:00",
    "end_time": "2024-01-15 16:00:00",
    "duration_minutes": 120,
    "items": [
      {
        "id": "item_1",
        "item_type": "time",
        "item_name": "平时段2小时",
        "quantity": 2,
        "unit": "小时",
        "unit_price": 30.00,
        "total_price": 60.00,
        "discount_rate": 85.00,
        "final_price": 51.00
      }
    ],
    "payments": [
      {
        "payment_method": "wechat",
        "amount": 50.00,
        "transaction_no": "wx123456",
        "paid_at": "2024-01-15 16:00:00"
      }
    ],
    "operator_name": "张三",
    "remark": "备注",
    "created_at": "2024-01-15 14:30:00"
  }
}
```

### 12.3 开台(创建台桌订单)

**POST** `/orders/table`

请求参数：
```json
{
  "table_id": "table_1",
  "member_id": "member_1",
  "pricing_id": "pricing_1",
  "operator_id": "emp_1",
  "operator_name": "张三",
  "remark": "备注"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "order_1",
    "order_no": "TB20240115143000001",
    "table_id": "table_1",
    "table_name": "1号台",
    "start_time": "2024-01-15 14:30:00",
    "status": "in_progress"
  }
}
```

### 12.4 订单加时

**POST** `/orders/{id}/extend`

请求参数：
```json
{
  "minutes": 60
}
```

### 12.5 订单暂停

**POST** `/orders/{id}/pause`

### 12.6 订单恢复

**POST** `/orders/{id}/resume`

### 12.7 结账(关台)

**POST** `/orders/{id}/checkout`

请求参数：
```json
{
  "payment_method": "wechat",
  "balance_paid": 0.00,
  "cash_paid": 0.00,
  "wechat_paid": 50.00,
  "alipay_paid": 0.00,
  "card_paid": 0.00,
  "points_deduct": 0,
  "use_balance": true,
  "remark": "备注"
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "order_1",
    "order_no": "TB20240115143000001",
    "status": "completed",
    "original_amount": 60.00,
    "discount_amount": 10.00,
    "final_amount": 50.00,
    "balance_paid": 0.00,
    "wechat_paid": 50.00,
    "points_gained": 50,
    "end_time": "2024-01-15 16:00:00",
    "duration_minutes": 90
  }
}
```

### 12.8 取消订单

**POST** `/orders/{id}/cancel`

请求参数：
```json
{
  "reason": "客户取消"
}
```

### 12.9 创建商品订单

**POST** `/orders/product`

请求参数：
```json
{
  "type": "product",
  "member_id": "member_1",
  "items": [
    {"product_id": "prod_1", "quantity": 2},
    {"product_id": "prod_2", "quantity": 1}
  ],
  "payment_method": "balance",
  "operator_id": "emp_1",
  "operator_name": "张三"
}
```

### 12.10 创建助教订单

**POST** `/orders/assistant`

请求参数：
```json
{
  "type": "assistant",
  "member_id": "member_1",
  "assistant_id": "assistant_1",
  "table_id": "table_1",
  "hours": 1,
  "payment_method": "wechat",
  "operator_id": "emp_1",
  "operator_name": "张三"
}
```

### 12.11 合并订单

**POST** `/orders/merge`

请求参数：
```json
{
  "order_ids": ["order_1", "order_2", "order_3"]
}
```

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "main_order_id": "order_1",
    "merged_order_ids": ["order_2", "order_3"],
    "total_amount": 150.00,
    "items": [...]
  }
}
```

### 12.12 订单退款

**POST** `/orders/{id}/refund`

请求参数：
```json
{
  "refund_amount": 50.00,
  "refund_method": "wechat",
  "reason": "客户投诉"
}
```

### 12.13 获取进行中的订单

**GET** `/orders/in-progress`

### 12.14 添加订单备注

**POST** `/orders/{id}/remark`

请求参数：
```json
{
  "remark": "备注内容"
}
```

---

## 13. 财务报表

### 13.1 获取资金流水

**GET** `/finance/cash-flows`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | income-expense |
| category | string | 否 | table-product-assistant-member_recharge |
| payment_method | string | 否 | wechat-alipay-cash-balance |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "id": "cf_1",
      "type": "income",
      "category": "table",
      "category_name": "台桌收入",
      "amount": 50.00,
      "payment_method": "wechat",
      "balance_before": 1000.00,
      "balance_after": 1050.00,
      "order_no": "TB20240115143000001",
      "description": "1号台消费",
      "operator_name": "张三",
      "created_at": "2024-01-15 16:00:00"
    }
  ],
  "pagination": {...}
}
```

### 13.2 获取营收统计

**GET** `/finance/revenue`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| group_by | string | 否 | day-month |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "date": "2024-01-15",
      "total_amount": 5680.00,
      "table_amount": 3200.00,
      "product_amount": 1680.00,
      "assistant_amount": 800.00,
      "order_count": 45,
      "member_recharge": 2000.00
    }
  ]
}
```

### 13.3 获取日报表

**GET** `/finance/daily`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 日期 2024-01-15 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "date": "2024-01-15",
    "revenue": {
      "total": 5680.00,
      "table": 3200.00,
      "product": 1680.00,
      "assistant": 800.00
    },
    "payment": {
      "wechat": 2800.00,
      "alipay": 1500.00,
      "cash": 880.00,
      "balance": 500.00
    },
    "order_count": 45,
    "table_hours": 156.5,
    "member_recharge": 2000.00,
    "member_count": 5,
    "new_members": 2,
    "profit": 3200.00
  }
}
```

### 13.4 获取月报表

**GET** `/finance/monthly`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| month | string | 是 | 月份 2024-01 |

### 13.5 获取支付方式分布

**GET** `/finance/payment-distribution`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {"payment_method": "wechat", "amount": 28000.00, "ratio": 0.45},
    {"payment_method": "alipay", "amount": 18000.00, "ratio": 0.30},
    {"payment_method": "cash", "amount": 10000.00, "ratio": 0.15},
    {"payment_method": "balance", "amount": 6000.00, "ratio": 0.10}
  ]
}
```

### 13.6 导出财务报表

**POST** `/finance/export`

请求参数：
```json
{
  "type": "daily|monthly|cash_flow",
  "start_date": "2024-01-01",
  "end_date": "2024-01-31",
  "format": "excel|csv"
}
```

---

## 14. 经营报表

### 14.1 获取经营概览

**GET** `/reports/overview`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total_revenue": 156800.00,
    "total_orders": 1256,
    "total_members": 358,
    "total_tables": 20,
    "avg_table_usage": 62.8,
    "avg_order_amount": 124.84,
    "member_consume_ratio": 0.75,
    "growth_rate": 12.5
  }
}
```

### 14.2 获取营收趋势

**GET** `/reports/revenue-trend`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| type | string | 否 | day-week-month |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {"date": "2024-01-01", "amount": 5680.00},
    {"date": "2024-01-02", "amount": 4560.00},
    {"date": "2024-01-03", "amount": 6230.00}
  ]
}
```

### 14.3 获取台桌利用率排行

**GET** `/reports/table-usage-rank`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| limit | int | 否 | 前几名 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "table_id": "table_1",
      "table_name": "1号台",
      "zone_name": "普通区",
      "usage_count": 156,
      "usage_hours": 468.5,
      "usage_rate": 0.85,
      "revenue": 14055.00
    }
  ]
}
```

### 14.4 获取商品销售排行

**GET** `/reports/product-sales-rank`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| limit | int | 否 | 前几名 |

### 14.5 获取会员消费排行

**GET** `/reports/member-consume-rank`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| limit | int | 否 | 前几名 |

### 14.6 获取助教业绩排行

**GET** `/reports/assistant-rank`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |
| type | string | 否 | amount-hours-orders |
| limit | int | 否 | 前几名 |

### 14.7 获取时段分析

**GET** `/reports/period-analysis`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "period_type": "off_peak",
      "period_name": "平时段",
      "order_count": 456,
      "total_hours": 912.0,
      "total_amount": 27360.00,
      "ratio": 0.45
    },
    {
      "period_type": "peak",
      "period_name": "高峰时段",
      "order_count": 567,
      "total_hours": 680.4,
      "total_amount": 34020.00,
      "ratio": 0.55
    }
  ]
}
```

### 14.8 获取员工绩效统计

**GET** `/reports/employee-performance`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

---

## 15. 系统设置

### 15.1 获取配置

**GET** `/settings/config`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | store-payment-notification-display |

### 15.2 更新配置

**PUT** `/settings/config`

请求参数：
```json
{
  "category": "store",
  "items": [
    {"key": "name", "value": "新门店名称"},
    {"key": "phone", "value": "400-xxx"}
  ]
}
```

### 15.3 获取通知设置

**GET** `/settings/notifications`

### 15.4 更新通知设置

**PUT** `/settings/notifications`

请求参数：
```json
{
  "order_reminder": {
    "enabled": true,
    "template": "您的订单已开始..."
  },
  "stock_alert": {
    "enabled": true,
    "threshold": 10
  }
}
```

### 15.5 获取时段配置

**GET** `/settings/time-periods`

### 15.6 创建时段配置

**POST** `/settings/time-periods`

请求参数：
```json
{
  "name": "平时段",
  "type": "off_peak",
  "start_time": "09:00",
  "end_time": "18:00",
  "coefficient": 1.0,
  "color": "#00D4AA",
  "description": "平时段描述"
}
```

### 15.7 更新时段配置

**PUT** `/settings/time-periods/{id}`

### 15.8 删除时段配置

**DELETE** `/settings/time-periods/{id}`

### 15.9 获取操作日志

**GET** `/settings/operate-logs`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| module | string | 否 | 模块 |
| action | string | 否 | 操作类型 |
| operator_id | string | 否 | 操作员 |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

### 15.10 获取登录日志

**GET** `/settings/login-logs`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| user_id | string | 否 | 用户ID |
| status | int | 否 | 状态 |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

---

## 16. 文件上传

### 16.1 上传文件

**POST** `/upload`

请求参数：`multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 文件 |
| category | string | 否 | avatar-product-table-qrcode-document |

响应：
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "file_1",
    "file_name": "avatar.jpg",
    "file_url": "https://xxx.com/uploads/avatar.jpg",
    "file_size": 102400,
    "width": 200,
    "height": 200
  }
}
```

### 16.2 上传Base64图片

**POST** `/upload/base64`

请求参数：
```json
{
  "data": "data:image/jpeg;base64,xxx",
  "category": "product"
}
```

### 16.3 删除文件

**DELETE** `/upload/{id}`

### 16.4 获取文件列表

**GET** `/upload/list`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| category | string | 否 | 分类 |
| page | int | 否 | 页码 |
| page_size | int | 否 | 每页数量 |

---

## 17. 消息通知

### 17.1 获取消息模板列表

**GET** `/messages/templates`

### 17.2 创建消息模板

**POST** `/messages/templates`

请求参数：
```json
{
  "type": "sms",
  "name": "订单完成通知",
  "code": "order_complete",
  "title": "您的订单已完成",
  "content": "尊敬的{name}，您的订单{order_no}已完成，消费金额{amount}元。",
  "variables": ["name", "order_no", "amount"]
}
```

### 17.3 更新消息模板

**PUT** `/messages/templates/{id}`

### 17.4 删除消息模板

**DELETE** `/messages/templates/{id}`

### 17.5 发送消息

**POST** `/messages/send`

请求参数：
```json
{
  "type": "sms|wechat|notify",
  "template_id": "template_1",
  "recipient_id": "member_1",
  "recipient": "13900139000",
  "variables": {
    "name": "李四",
    "order_no": "TB20240115143000001",
    "amount": "50"
  }
}
```

### 17.6 获取消息发送记录

**GET** `/messages/logs`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| type | string | 否 | 类型 |
| status | string | 否 | 状态 |
| recipient_id | string | 否 | 接收者ID |
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

### 17.7 批量发送消息

**POST** `/messages/batch-send`

请求参数：
```json
{
  "type": "notify",
  "template_id": "template_1",
  "recipients": [
    {"recipient_id": "member_1", "variables": {...}},
    {"recipient_id": "member_2", "variables": {...}}
  ]
}
```

---

## 18. 数据字典

### 18.1 通用状态码

| code | 说明 |
|------|------|
| 0 | 成功 |
| 1001 | 参数错误 |
| 1002 | 缺少必填参数 |
| 2001 | 未登录 |
| 2002 | Token过期 |
| 2003 | 无权限访问 |
| 3001 | 资源不存在 |
| 3002 | 资源已存在 |
| 4001 | 业务处理失败 |
| 4002 | 余额不足 |
| 4003 | 库存不足 |
| 4004 | 订单状态不允许 |
| 5001 | 服务器错误 |

### 18.2 订单状态

| status | 说明 |
|--------|------|
| pending | 待支付 |
| in_progress | 进行中 |
| completed | 已完成 |
| cancelled | 已取消 |
| refunded | 已退款 |

### 18.3 台桌状态

| status | 说明 |
|--------|------|
| idle | 空闲 |
| occupied | 使用中 |
| reserved | 预约 |
| maintenance | 维护 |

### 18.4 支付方式

| method | 说明 |
|--------|------|
| cash | 现金 |
| wechat | 微信支付 |
| alipay | 支付宝 |
| card | 银行卡 |
| balance | 会员余额 |
| points | 积分抵扣 |

### 18.5 员工角色

| role | 说明 |
|------|------|
| owner | 老板 |
| manager | 店长 |
| cashier | 收银员 |
| waiter | 服务员 |
| assistant | 助教 |

### 18.6 计费规则类型

| type | 说明 |
|------|------|
| time | 计时 |
| round | 局数 |
| period | 包时段 |
| mixed | 混合 |
| cap | 封顶 |
| member | 会员专属 |

### 18.7 时段类型

| type | 说明 |
|------|------|
| off_peak | 平时段 |
| peak | 高峰时段 |
| golden | 黄金时段 |

### 18.8 库存记录类型

| type | 说明 |
|------|------|
| inbound | 入库 |
| outbound | 出库 |
| adjustment | 调整 |

### 18.9 套餐类型

| type | 说明 |
|------|------|
| time | 时长套餐 |
| product | 商品套餐 |
| mixed | 混合套餐 |
| member | 会员套餐 |

---

## 附录

### A. 错误响应格式

```json
{
  "code": 1001,
  "message": "参数错误",
  "errors": [
    {"field": "phone", "message": "手机号格式不正确"}
  ]
}
```

### B. 分页响应格式

```json
{
  "code": 0,
  "message": "success",
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 20,
    "total": 156,
    "total_pages": 8
  }
}
```

### C. 文件上传响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "file_xxx",
    "file_name": "xxx.jpg",
    "file_url": "https://xxx.com/xxx.jpg",
    "file_size": 102400,
    "mime_type": "image/jpeg"
  }
}
```

### D. 批量操作响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success_count": 10,
    "fail_count": 2,
    "results": [
      {"id": "xxx", "success": true},
      {"id": "xxx", "success": false, "error": "已存在"}
    ]
  }
}
```

---

**文档版本**: v1.0.0
**最后更新**: 2024年
**维护团队**: BilliardsHub Team
