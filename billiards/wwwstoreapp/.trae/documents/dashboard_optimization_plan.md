# 球房老板首页运营报表优化方案

## 一、球房老板核心需求分析

### 1.1 目标用户：球房老板

| 需求维度 | 核心需求 | 说明 |
|---------|---------|-----|
| **营收分析** | 实时了解收入构成 | 台费、助教费、商品费三大支柱 |
| **运营效率** | 开台率、翻台率监控 | 资源利用率评估 |
| **成本控制** | 人力成本、物料成本 | 盈利能力分析 |
| **会员管理** | 会员增长、活跃度 | 用户粘性分析 |
| **趋势预测** | 同比环比分析 | 辅助决策 |

### 1.2 关键业务指标

| 指标类别 | 具体指标 | 重要性 |
|---------|---------|-------|
| **核心收入** | 台费收入、助教费收入、商品费收入 | 高 |
| **经营效率** | 开台率、翻台率、客单价 | 高 |
| **会员数据** | 新增会员、活跃会员、会员消费占比 | 中 |
| **人力成本** | 助教提成、员工工资、人效比 | 中 |
| **库存管理** | 商品库存、畅销/滞销品 | 中 |

---

## 二、首页运营报表设计方案

### 2.1 页面布局结构

```
┌─────────────────────────────────────────────────────┐
│  📊 运营报表  │  🏠 数据看板  │  🔔 通知(3)      │  ← 顶部导航
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         📈 今日概览卡片                     │   │
│  │  ┌──────┬──────┬──────┐                   │   │
│  │  │台费  │助教费│商品费│   总收入: ¥12,800   │   │
│  │  │¥6,500│¥3,200│¥3,100│   订单数: 45      │   │
│  │  └──────┴──────┴──────┘                   │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         📊 收入构成分析                      │   │
│  │  台费: 51% ■■■■■                           │   │
│  │  助教费: 25% ■■■                           │   │
│  │  商品费: 24% ■■■                          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐         │   │
│  │ 开台率  │  │ 翻台率  │  │ 客单价  │         │   │
│  │   85%   │  │   2.3   │  │  ¥284   │         │   │
│  └─────────┘  └─────────┘  └─────────┘         │   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         📉 营收趋势图（近7天）               │   │
│  │  ¥15,000                                    │   │
│  │  ¥10,000     ■ ■ ■ ■ ■ ■ ■                 │   │
│  │   ¥5,000                                    │   │
│  │      0   一  二  三  四  五  六  日         │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         📋 待处理事项                       │   │
│  │   3条审批待处理      2条订单待接单          │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │         🔥 今日TOP商品                      │   │
│  │  1. 红牛         ¥580   2. 矿泉水    ¥320   │   │
│  │  3. 可乐         ¥280   4. 薯片      ¥180   │   │
│  └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

### 2.2 数据模块设计

#### 模块一：今日概览卡片

```scss
.today-overview {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  border-radius: 28rpx;
  padding: 32rpx;
  color: #ffffff;
  box-shadow: 0 8rpx 24rpx rgba(34, 197, 94, 0.3);
  
  .overview-title {
    font-size: 28rpx;
    opacity: 0.9;
    margin-bottom: 20rpx;
  }
  
  .revenue-grid {
    display: flex;
    gap: 16rpx;
    margin-bottom: 20rpx;
    
    .revenue-item {
      flex: 1;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 16rpx;
      padding: 16rpx;
      text-align: center;
      
      .item-value {
        font-size: 32rpx;
        font-weight: 700;
      }
      
      .item-label {
        font-size: 22rpx;
        opacity: 0.85;
        margin-top: 4rpx;
      }
    }
  }
  
  .total-info {
    display: flex;
    justify-content: space-between;
    
    .total-item {
      text-align: center;
      
      .total-value {
        font-size: 40rpx;
        font-weight: 700;
      }
      
      .total-label {
        font-size: 24rpx;
        opacity: 0.85;
      }
    }
  }
}
```

#### 模块二：收入构成分析

```scss
.revenue-analysis {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .analysis-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 24rpx;
  }
  
  .analysis-list {
    display: flex;
    flex-direction: column;
    gap: 16rpx;
    
    .analysis-item {
      display: flex;
      align-items: center;
      
      .item-label {
        width: 120rpx;
        font-size: 28rpx;
        color: #6b7280;
      }
      
      .progress-bar {
        flex: 1;
        height: 16rpx;
        background: #f1f5f9;
        border-radius: 8rpx;
        overflow: hidden;
        margin: 0 16rpx;
        
        .progress-fill {
          height: 100%;
          border-radius: 8rpx;
          transition: width 0.5s ease;
          
          &.table { background: #22c55e; }
          &.assistant { background: #3b82f6; }
          &.product { background: #f59e0b; }
        }
      }
      
      .item-percent {
        width: 80rpx;
        font-size: 28rpx;
        font-weight: 600;
        color: #1f2937;
        text-align: right;
      }
    }
  }
}
```

#### 模块三：关键指标卡片

```scss
.kpi-cards {
  display: flex;
  gap: 20rpx;
  
  .kpi-card {
    flex: 1;
    background: #ffffff;
    border-radius: 24rpx;
    padding: 28rpx;
    text-align: center;
    box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
    
    .kpi-value {
      font-size: 44rpx;
      font-weight: 700;
      color: #1f2937;
      margin-bottom: 8rpx;
    }
    
    .kpi-label {
      font-size: 24rpx;
      color: #6b7280;
    }
    
    .kpi-trend {
      font-size: 22rpx;
      margin-top: 8rpx;
      
      &.up { color: #22c55e; }
      &.down { color: #ef4444; }
    }
  }
}
```

#### 模块四：营收趋势图

```scss
.trend-chart {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .chart-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 24rpx;
  }
  
  .chart-container {
    height: 200rpx;
    position: relative;
    
    .chart-bars {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      height: 160rpx;
      
      .bar-item {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        
        .bar {
          width: 32rpx;
          background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
          border-radius: 8rpx 8rpx 0 0;
          transition: height 0.3s ease;
        }
        
        .bar-label {
          font-size: 22rpx;
          color: #9ca3af;
          margin-top: 12rpx;
        }
      }
    }
    
    .chart-grid {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 40rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      
      .grid-line {
        height: 1rpx;
        background: #f1f5f9;
      }
    }
  }
}
```

#### 模块五：待处理事项

```scss
.pending-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .section-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #1f2937;
    }
    
    .section-more {
      font-size: 26rpx;
      color: #22c55e;
    }
  }
  
  .pending-list {
    display: flex;
    gap: 24rpx;
    
    .pending-item {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .pending-dot {
        width: 16rpx;
        height: 16rpx;
        border-radius: 8rpx;
        
        &.approval { background: #ef4444; }
        &.order { background: #f59e0b; }
      }
      
      .pending-text {
        font-size: 28rpx;
        color: #1f2937;
      }
    }
  }
}
```

#### 模块六：热门商品排行

```scss
.hot-products {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04);
  
  .section-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #1f2937;
    margin-bottom: 20rpx;
  }
  
  .product-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16rpx;
    
    .product-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16rpx;
      background: #f8fafc;
      border-radius: 16rpx;
      
      .product-rank {
        width: 36rpx;
        height: 36rpx;
        background: #22c55e;
        color: #ffffff;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 22rpx;
        font-weight: 600;
        margin-right: 12rpx;
      }
      
      .product-name {
        flex: 1;
        font-size: 26rpx;
        color: #1f2937;
      }
      
      .product-revenue {
        font-size: 26rpx;
        font-weight: 600;
        color: #1f2937;
      }
    }
  }
}
```

---

## 三、数据接口设计

### 3.1 获取运营报表数据

```typescript
// src/api/modules/dashboard.ts

export interface RevenueData {
  table_revenue: number        // 台费收入
  assistant_revenue: number    // 助教费收入
  product_revenue: number      // 商品费收入
  total_revenue: number        // 总收入
  order_count: number          // 订单数
}

export interface KPIData {
  occupancy_rate: number       // 开台率
  turnover_rate: number        // 翻台率
  avg_customer_spend: number   // 客单价
}

export interface TrendData {
  date: string
  revenue: number
}

export interface HotProduct {
  rank: number
  name: string
  revenue: number
}

export interface DashboardData {
  revenue: RevenueData
  kpi: KPIData
  trend: TrendData[]
  hot_products: HotProduct[]
}

export async function getDashboardData(): Promise<DashboardData> {
  const result = await request({
    url: '/storeapi/dashboard.index',
    method: 'GET'
  })
  return result.data
}
```

---

## 四、实施计划

### 4.1 阶段一：更新首页模板（1天）

1. 添加运营报表模块
2. 实现收入构成分析
3. 添加关键指标卡片
4. 实现营收趋势图

### 4.2 阶段二：添加API接口（0.5天）

1. 创建 `src/api/modules/dashboard.ts`
2. 添加 `getDashboardData` 接口

### 4.3 阶段三：更新首页逻辑（1天）

1. 调用新接口获取数据
2. 实现数据展示逻辑
3. 添加加载状态处理

### 4.4 阶段四：样式优化（0.5天）

1. 调整响应式布局
2. 添加动画效果
3. 优化交互体验

---

## 五、球房老板最关心的数据

### 5.1 核心KPI优先级

| 优先级 | 指标 | 说明 |
|-------|-----|-----|
| P0 | 总收入 | 一目了然的核心指标 |
| P0 | 收入构成 | 了解三大收入来源占比 |
| P1 | 开台率 | 资源利用率关键指标 |
| P1 | 翻台率 | 运营效率指标 |
| P1 | 客单价 | 消费能力分析 |
| P2 | 营收趋势 | 同比环比分析 |
| P2 | 热门商品 | 库存管理参考 |
| P2 | 待处理事项 | 高效处理审批 |

### 5.2 辅助功能建议

| 功能 | 说明 |
|-----|-----|
| 日期筛选 | 按日/周/月查看报表 |
| 同比对比 | 与上周/上月对比 |
| 导出报表 | 导出Excel/PDF |
| 数据钻取 | 点击查看详情 |

---

**文档版本**: v1.0  
**创建时间**: 2026-05-12  
**状态**: 待评审