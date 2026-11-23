# 首页数据报表功能完善方案

## 一、日期筛选功能设计

### 1.1 日期筛选类型

| 筛选类型 | 标识 | 时间范围计算 |
|----------|------|--------------|
| 今日 | `today` | 00:00:00 - 23:59:59 |
| 昨日 | `yesterday` | 昨天00:00:00 - 昨天23:59:59 |
| 本周 | `week` | 本周一00:00:00 - 当前时间 |
| 上周 | `last_week` | 上周一00:00:00 - 上周日23:59:59 |
| 本月 | `month` | 本月1日00:00:00 - 当前时间 |
| 上月 | `last_month` | 上月1日00:00:00 - 上月最后一天23:59:59 |
| 自定义 | `custom` | 用户指定开始日期 - 用户指定结束日期 |

### 1.2 日期筛选接口设计

**接口**: `POST /mobile.Mobile/dashboardStats`

**请求参数**:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| store_id | string | 是 | 门店ID |
| date_type | string | 否 | 日期类型：today/yesterday/week/last_week/month/last_month/custom |
| start_date | string | 否 | 自定义开始日期(YYYY-MM-DD)，date_type=custom时必填 |
| end_date | string | 否 | 自定义结束日期(YYYY-MM-DD)，date_type=custom时必填 |

**响应结构**: 见下文

---

## 二、数据指标详细分析

### 2.1 收入类指标

| 指标名称 | 数据库表 | 查询条件 | 计算方法 |
|----------|----------|----------|----------|
| 台费收入 | `bi_busi_order` | type='table', status='completed' | SUM(final_amount) |
| 助教费收入 | `bi_busi_order` | type='assistant', status='completed' | SUM(final_amount) |
| 商品费收入 | `bi_busi_order` | type='product', status='completed' | SUM(final_amount) |
| 套餐收入 | `bi_busi_order` | type='package', status='completed' | SUM(final_amount) |
| 总收入 | `bi_busi_order` | status='completed' | SUM(final_amount) |
| 订单数量 | `bi_busi_order` | status='completed' | COUNT(id) |

**SQL示例 - 收入分类统计**:
```sql
SELECT 
    type,
    SUM(final_amount) as amount
FROM bi_busi_order
WHERE store_id = 'xxx'
  AND status = 'completed'
  AND created_at BETWEEN 'start_date 00:00:00' AND 'end_date 23:59:59'
GROUP BY type;
```

### 2.2 KPI指标

| 指标名称 | 计算逻辑 | 公式 |
|----------|----------|------|
| 开台率 | 占用台桌数 / 总台桌数 | `occupied_tables / total_tables * 100%` |
| 翻台率 | 已完成订单数 / 总台桌数 | `completed_orders / total_tables` |
| 客单价 | 总收入 / 订单数 | `total_revenue / order_count` |
| 同比增长率 | 本期收入 / 上期收入 - 1 | `(current_revenue / last_period_revenue - 1) * 100%` |

**SQL示例 - 开台率**:
```sql
-- 占用台桌数
SELECT COUNT(*) FROM bi_busi_table 
WHERE store_id = 'xxx' AND status = 'occupied';

-- 总台桌数（排除已删除）
SELECT COUNT(*) FROM bi_busi_table 
WHERE store_id = 'xxx' AND deleted_at IS NULL;
```

**SQL示例 - 翻台率**:
```sql
-- 已完成订单数
SELECT COUNT(*) FROM bi_busi_order 
WHERE store_id = 'xxx' AND status = 'completed'
  AND created_at BETWEEN 'start_date 00:00:00' AND 'end_date 23:59:59';

-- 总台桌数
SELECT COUNT(*) FROM bi_busi_table 
WHERE store_id = 'xxx' AND deleted_at IS NULL;
```

### 2.3 趋势指标

| 指标名称 | 时间周期 | 查询方法 |
|----------|----------|----------|
| 营收趋势 | 按天聚合 | GROUP BY DATE(created_at) |
| 订单趋势 | 按天聚合 | GROUP BY DATE(created_at) |
| 客流趋势 | 按天聚合 | GROUP BY DATE(created_at) |

**SQL示例 - 营收趋势**:
```sql
SELECT 
    DATE(created_at) as date,
    SUM(final_amount) as revenue,
    COUNT(id) as orders
FROM bi_busi_order
WHERE store_id = 'xxx'
  AND status = 'completed'
  AND created_at BETWEEN 'start_date 00:00:00' AND 'end_date 23:59:59'
GROUP BY DATE(created_at)
ORDER BY date;
```

### 2.4 商品销售指标

| 指标名称 | 统计方法 | 排序方式 |
|----------|----------|----------|
| 热门商品TOP4 | 按商品销售额统计 | 降序取前4 |
| 畅销商品TOP4 | 按商品销量统计 | 降序取前4 |

**SQL示例 - 热门商品**:
```sql
SELECT 
    product_name,
    SUM(quantity * price) as revenue,
    SUM(quantity) as quantity
FROM bi_busi_order_item
WHERE store_id = 'xxx'
  AND created_at BETWEEN 'start_date 00:00:00' AND 'end_date 23:59:59'
GROUP BY product_name
ORDER BY revenue DESC
LIMIT 4;
```

### 2.5 人员相关指标

| 指标名称 | 数据库表 | 查询条件 |
|----------|----------|----------|
| 员工打卡率 | `bi_busi_employee_attendance` | 统计已打卡人数 |
| 助教出勤率 | `bi_busi_assistant` + `bi_busi_employee_attendance` | 助教角色打卡统计 |

---

## 三、完整API响应结构

```json
{
  "code": 1,
  "msg": "success",
  "data": {
    "date_range": {
      "date_type": "today",
      "start_date": "2024-01-15",
      "end_date": "2024-01-15",
      "label": "今日"
    },
    "revenue": {
      "table_revenue": 1250.00,
      "assistant_revenue": 890.00,
      "product_revenue": 450.00,
      "package_revenue": 0.00,
      "total_revenue": 2590.00,
      "order_count": 45,
      "last_period_revenue": 2300.00,
      "revenue_change": 12.61
    },
    "kpi": {
      "occupancy_rate": 68.5,
      "turnover_rate": 3.2,
      "avg_customer_spend": 57.56,
      "table_utilization": 72.3
    },
    "trend": [
      {"date": "01-09", "revenue": 1800, "orders": 32},
      {"date": "01-10", "revenue": 2100, "orders": 38},
      {"date": "01-11", "revenue": 1950, "orders": 35},
      {"date": "01-12", "revenue": 2300, "orders": 42},
      {"date": "01-13", "revenue": 2800, "orders": 50},
      {"date": "01-14", "revenue": 3500, "orders": 62},
      {"date": "01-15", "revenue": 2590, "orders": 45}
    ],
    "hot_products": [
      {"rank": 1, "name": "青岛啤酒", "revenue": 320, "quantity": 16},
      {"rank": 2, "name": "红牛", "revenue": 210, "quantity": 14},
      {"rank": 3, "name": "矿泉水", "revenue": 98, "quantity": 49},
      {"rank": 4, "name": "瓜子", "revenue": 65, "quantity": 13}
    ],
    "staff_stats": {
      "total_employees": 25,
      "checked_in_count": 22,
      "checkin_rate": 88.0,
      "total_assistants": 8,
      "working_assistants": 6
    },
    "pending_tasks": {
      "approvals": 3,
      "orders": 2,
      "notifications": 5
    }
  }
}
```

---

## 四、后端实现方案

### 4.1 修改 MobileLogic

**文件**: `app/storeapi/logic/mobile/MobileLogic.php`

**新增方法**:

| 方法名 | 功能 |
|--------|------|
| `parseDateRange()` | 解析日期类型，返回开始/结束时间 |
| `getRevenueStats()` | 统计收入数据 |
| `getKPIStats()` | 计算KPI指标 |
| `getTrendData()` | 获取趋势数据 |
| `getHotProducts()` | 获取热门商品 |
| `getStaffStats()` | 获取人员统计 |

### 4.2 日期范围解析逻辑

```php
private static function parseDateRange($dateType, $startDate = null, $endDate = null) {
    $now = date('Y-m-d H:i:s');
    $today = date('Y-m-d');
    
    switch ($dateType) {
        case 'today':
            return [
                'start' => $today . ' 00:00:00',
                'end' => $today . ' 23:59:59',
                'label' => '今日',
                'last_period_start' => date('Y-m-d', strtotime('-1 day')) . ' 00:00:00',
                'last_period_end' => date('Y-m-d', strtotime('-1 day')) . ' 23:59:59'
            ];
        case 'yesterday':
            $yesterday = date('Y-m-d', strtotime('-1 day'));
            return [
                'start' => $yesterday . ' 00:00:00',
                'end' => $yesterday . ' 23:59:59',
                'label' => '昨日',
                'last_period_start' => date('Y-m-d', strtotime('-2 day')) . ' 00:00:00',
                'last_period_end' => date('Y-m-d', strtotime('-2 day')) . ' 23:59:59'
            ];
        case 'week':
            $weekStart = date('Y-m-d', strtotime('monday this week'));
            return [
                'start' => $weekStart . ' 00:00:00',
                'end' => $now,
                'label' => '本周',
                'last_period_start' => date('Y-m-d', strtotime('monday last week')) . ' 00:00:00',
                'last_period_end' => date('Y-m-d', strtotime('sunday last week')) . ' 23:59:59'
            ];
        case 'month':
            $monthStart = date('Y-m-01');
            return [
                'start' => $monthStart . ' 00:00:00',
                'end' => $now,
                'label' => '本月',
                'last_period_start' => date('Y-m-01', strtotime('-1 month')) . ' 00:00:00',
                'last_period_end' => date('Y-m-t', strtotime('-1 month')) . ' 23:59:59'
            ];
        case 'custom':
        default:
            return [
                'start' => $startDate . ' 00:00:00',
                'end' => $endDate . ' 23:59:59',
                'label' => $startDate . ' ~ ' . $endDate,
                'last_period_start' => null,
                'last_period_end' => null
            ];
    }
}
```

---

## 五、前端适配方案

### 5.1 日期筛选组件设计

```typescript
// 日期筛选选项
const dateOptions = [
  { value: 'today', label: '今日' },
  { value: 'yesterday', label: '昨日' },
  { value: 'week', label: '本周' },
  { value: 'last_week', label: '上周' },
  { value: 'month', label: '本月' },
  { value: 'last_month', label: '上月' },
  { value: 'custom', label: '自定义' },
];

// 自定义日期选择
const showDatePicker = ref(false);
const customStartDate = ref('');
const customEndDate = ref('');
```

### 5.2 API调用示例

```typescript
export async function getDashboardData(
  dateType: string = 'today',
  startDate?: string,
  endDate?: string
): Promise<{ code: number; data: DashboardData }> {
  const params: Record<string, any> = {
    date_type: dateType
  };
  if (dateType === 'custom' && startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  }
  
  const result = await request<DashboardData>({
    url: '/mobile.Mobile/dashboardStats',
    method: 'GET',
    data: params
  });
  return { code: 1, data: result };
}
```

---

## 六、数据库索引优化

| 表名 | 索引名 | 索引字段 | 用途 |
|------|--------|----------|------|
| `bi_busi_order` | `idx_store_status_date` | `store_id, status, created_at` | 加速订单统计 |
| `bi_busi_order` | `idx_store_type_date` | `store_id, type, created_at` | 加速收入分类统计 |
| `bi_busi_table` | `idx_store_status` | `store_id, status` | 加速台桌状态统计 |
| `bi_busi_order_item` | `idx_store_date_product` | `store_id, created_at, product_name` | 加速商品统计 |
| `bi_busi_employee_attendance` | `idx_store_date` | `store_id, checkin_date` | 加速打卡统计 |

---

## 七、实施计划

### 阶段一：后端API开发

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 添加日期范围解析方法 | `MobileLogic.php` |
| 2 | 添加收入统计方法 | `MobileLogic.php` |
| 3 | 添加KPI计算方法 | `MobileLogic.php` |
| 4 | 添加趋势数据方法 | `MobileLogic.php` |
| 5 | 添加热门商品方法 | `MobileLogic.php` |
| 6 | 更新主方法整合数据 | `MobileLogic.php` |
| 7 | 添加数据库索引 | 数据库迁移脚本 |

### 阶段二：前端适配

| 步骤 | 任务 | 文件 |
|------|------|------|
| 1 | 更新类型定义 | `dashboard.ts` |
| 2 | 更新API调用 | `dashboard.ts` |
| 3 | 添加日期筛选组件 | `index.vue` |
| 4 | 更新数据展示逻辑 | `index.vue` |

### 阶段三：测试验证

| 步骤 | 任务 | 验证方式 |
|------|------|----------|
| 1 | 测试各日期筛选类型 | Postman |
| 2 | 验证数据准确性 | 对比数据库 |
| 3 | 验证UI展示 | 前端页面 |
| 4 | 性能测试 | 接口响应时间 |

---

## 八、预期成果

1. ✅ 支持多种日期筛选（今日、昨日、本周、上周、本月、上月、自定义）
2. ✅ 收入数据按类型分类统计（台费、助教费、商品费、套餐）
3. ✅ KPI指标完整（开台率、翻台率、客单价、同比增长）
4. ✅ 趋势数据完整（近7天营收、订单趋势）
5. ✅ 热门商品TOP4展示
6. ✅ 人员统计数据（打卡率、出勤情况）
7. ✅ 所有数据均从数据库实时查询，无静态数据