# wwwtable 台桌大屏视觉颠覆性优化设计文档

**日期**: 2026-06-29
**项目**: wwwtable 台桌大屏前端页面视觉优化
**设计风格**: 现代 SaaS 产品风格（类似 Notion、Linear）

---

## 一、项目概述

### 1.1 项目背景
wwwtable 是球房台桌大屏应用，用于27寸竖屏（9:16比例），每个台桌配备一个屏幕，主要用于信息展示和触屏操作。

### 1.2 核心问题
- **视觉陈旧**: 界面缺乏现代化高级感
- **布局混乱**: 信息层次不清晰，操作不够直观

### 1.3 设计目标
- **视觉高级**: 像高端酒店/会所的界面，简洁大气，有品质感
- **信息清晰**: 一眼就能看到关键信息，层次分明
- **统一体验**: 所有页面保持一致的设计风格

### 1.4 设计风格
采用现代 SaaS 产品风格（类似 Notion、Linear）：
- 大圆角卡片布局
- 系统化、标准化设计
- 简洁优雅的视觉呈现
- 清晰的信息层级

### 1.5 优化范围
全量优化所有页面：
- 首页（仪表盘）
- 商品点单
- 教练预约
- 智能计分
- 开台
- 账单

---

## 二、设计系统

### 2.1 统一布局系统

#### 2.1.1 三段式页面布局结构

所有页面采用统一的**三段式布局**：

```
┌─────────────────────────────────┐
│      固定头部区域 (80px)         │  ← 台桌号 + 时间 + 状态 + 导航
├─────────────────────────────────┤
│                                 │
│      主内容区域 (自适应)          │  ← 大圆角卡片模块布局
│                                 │
├─────────────────────────────────┤
│      底部操作区域 (120px)        │  ← 主要操作按钮 + 次要操作
└─────────────────────────────────┘
```

**布局特点**：
- 头部和底部固定高度，主内容区自适应填充
- 主内容区采用卡片网格布局，支持单列或双列
- 整体使用 `padding: 24px` 确保边缘留白
- 使用 CSS Flexbox/Grid 实现响应式

#### 2.1.2 固定头部设计

**头部组件结构**：

```vue
<template>
  <view class="page-header">
    <!-- 左侧：台桌信息 -->
    <view class="header-left">
      <view class="table-number">01号桌</view>  ← 48px 大字号
      <view class="table-status">
        <view class="status-badge">计费中</view>
      </view>
    </view>

    <!-- 中间：时间信息 -->
    <view class="header-center">
      <view class="current-time">14:30</view>
      <view class="elapsed-time">已用时 2小时15分</view>
    </view>

    <!-- 右侧：导航/操作 -->
    <view class="header-right">
      <!-- 根据页面不同显示不同内容 -->
    </view>
  </view>
</template>
```

**头部样式规范**：
- 高度：`80px`（固定）
- 背景：深色模式 `#1a1a1a` / 浅色模式 `#f5f5f5`
- 底部边框：`border-bottom: 1px solid rgba(255,255,255,0.1)`
- 内部间距：`padding: 20px 24px`
- 台桌号字号：`48px`，加粗
- 状态徽章：圆角 `rounded-full`，颜色根据状态变化

---

### 2.2 间距系统

#### 2.2.1 8px 基准间距系统

所有间距都是 8 的倍数：

```
间距层级：
- xs:  8px   (元素内部小间距)
- sm:  16px  (元素间小间距)
- md:  24px  (卡片内部padding、元素间标准间距)
- lg:  32px  (卡片间间距、模块间间距)
- xl:  48px  (页面区块间大间距)
```

**应用规则**：
- 页面边缘留白：`24px`
- 卡片内部 padding：`24px`
- 卡片间间距：`32px`
- 卡片标题与内容间距：`16px`
- 内容元素间间距：`12px` 或 `16px`
- 按钮间距：`12px`

---

### 2.3 字体系统（适配27寸屏幕）

#### 2.3.1 字体层级

针对**27寸竖屏**，所有字体**放大约40%**：

```
字体层级（27寸优化版）：
- 标题级：48px - 40px - 32px - 28px
- 内容级：24px - 22px - 18px
- 辅助级：16px - 14px
```

#### 2.3.2 具体样式定义

```scss
// 页面主标题（如台桌号）
.text-page-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
}

// 卡片标题
.text-card-title {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.3;
}

// 卡片内主要内容
.text-primary {
  font-size: 24px;
  font-weight: 500;
  line-height: 1.4;
}

// 卡片内次要内容
.text-secondary {
  font-size: 22px;
  font-weight: 400;
  line-height: 1.4;
}

// 辅助信息
.text-auxiliary {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.5;
}

// 小标签
.text-label {
  font-size: 16px;
  font-weight: 500;
  line-height: 1.5;
}
```

---

### 2.4 颜色系统

#### 2.4.1 深色模式

```scss
// 背景色层级
$bg-primary: #1a1a1a;     // 页面主背景
$bg-secondary: #242424;   // 卡片背景
$bg-tertiary: #2a2a2a;    // 卡片内区块背景

// 文字色层级
$text-primary: #ffffff;      // 主要文字
$text-secondary: #b0b0b0;    // 次要文字
$text-tertiary: #808080;     // 辅助文字

// 边框色
$border-subtle: rgba(255,255,255,0.1);
$border-strong: rgba(255,255,255,0.2);

// 强调色（保持现有品牌色）
$accent-primary: #007aff;    // 主要操作
$accent-danger: #ff3b30;     // 危险操作
$accent-success: #34c759;    // 成功状态
```

#### 2.4.2 浅色模式

```scss
// 背景色层级
$bg-primary: #f5f5f5;     // 页面主背景
$bg-secondary: #ffffff;   // 卡片背景
$bg-tertiary: #fafafa;    // 卡片内区块背景

// 文字色层级
$text-primary: #1a1a1a;      // 主要文字
$text-secondary: #666666;    // 次要文字
$text-tertiary: #999999;     // 辅助文字

// 边框色
$border-subtle: rgba(0,0,0,0.1);
$border-strong: rgba(0,0,0,0.2);

// 强调色（保持现有品牌色）
$accent-primary: #007aff;
$accent-danger: #ff3b30;
$accent-success: #34c759;
```

---

### 2.5 圆角系统

```scss
// 圆角层级
$rounded-sm: 8px;    // 小按钮、标签
$rounded-md: 12px;   // 输入框、小卡片
$rounded-lg: 16px;   // 大卡片、主要区块（rounded-2xl）
$rounded-xl: 20px;   // 特大卡片
$rounded-full: 9999px; // 徽章、圆形按钮
```

**应用规则**：
- 主卡片：`16px`（rounded-2xl）
- 按钮组：`12px`
- 状态徽章：`rounded-full`
- 输入框：`12px`
- 弹窗容器：`20px`

---

### 2.6 卡片组件系统

#### 2.6.1 卡片基础样式

```scss
.card-base {
  border-radius: 16px;  // 大圆角
  padding: 24px;
  margin-bottom: 32px;

  // 深色模式
  background: #242424;
  border: 1px solid rgba(255,255,255,0.1);

  // 阴影效果（增加高级感）
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);

  // 浅色模式
  // background: #ffffff;
  // border: 1px solid rgba(0,0,0,0.1);
}
```

#### 2.6.2 卡片变体类型

1. **信息展示卡片**：纯展示信息，无交互
2. **可点击卡片**：有操作按钮或可点击区域
3. **列表卡片**：包含列表数据（如商品列表）
4. **状态卡片**：显示状态信息（如计分、计时）

#### 2.6.3 卡片内部结构

```vue
<template>
  <view class="card-base">
    <!-- 卡片标题 -->
    <view class="card-title text-card-title">
      台桌状态
    </view>

    <!-- 卡片内容 -->
    <view class="card-content">
      <!-- 根据卡片类型显示不同内容 -->
    </view>
  </view>
</template>
```

---

### 2.7 弹窗系统

#### 2.7.1 弹窗类型分类

1. **信息展示弹窗**：展示详细信息（如商品详情、教练信息）
2. **操作确认弹窗**：需要用户确认操作（如下单确认、开台确认）
3. **表单输入弹窗**：需要用户填写信息
4. **状态提示弹窗**：简短的成功/错误提示

#### 2.7.2 弹窗基础样式

```scss
// 弹窗遮罩
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

// 弹窗容器
.modal-container {
  width: 85%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: 20px;

  // 深色模式
  background: #2a2a2a;
  border: 1px solid rgba(255,255,255,0.15);

  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  overflow: hidden;
}
```

#### 2.7.3 弹窗结构设计

```vue
<template>
  <view class="modal-container">
    <!-- 弹窗头部 -->
    <view class="modal-header">
      <view class="modal-title text-card-title">商品详情</view>
      <view class="modal-close">×</view>
    </view>

    <!-- 弹窗内容 -->
    <view class="modal-body">
      <view class="modal-content">
        <!-- 根据弹窗类型显示不同内容 -->
      </view>
    </view>

    <!-- 弹窗底部 -->
    <view class="modal-footer">
      <view class="modal-actions">
        <button class="btn-secondary">取消</button>
        <button class="btn-primary">确认</button>
      </view>
    </view>
  </view>
</template>
```

#### 2.7.4 弹窗样式细节

```scss
// 弹窗头部
.modal-header {
  padding: 24px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.modal-title {
  font-size: 28px;
  font-weight: 600;
}

.modal-close {
  font-size: 32px;
  color: #808080;
  cursor: pointer;
}

// 弹窗内容区
.modal-body {
  padding: 24px;
  max-height: 60vh;
  overflow-y: auto;
}

// 弹窗底部
.modal-footer {
  padding: 24px;
  border-top: 1px solid rgba(255,255,255,0.1);
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
```

---

### 2.8 按钮系统

#### 2.8.1 按钮样式规范（适配27寸屏幕）

```scss
// 主要操作按钮
.btn-primary {
  font-size: 24px;
  padding: 16px 48px;
  border-radius: 12px;
  background: #007aff;
  color: #fff;
  font-weight: 600;
  min-height: 56px;  // 最小高度，便于触屏操作
}

// 次要操作按钮
.btn-secondary {
  font-size: 24px;
  padding: 16px 48px;
  border-radius: 12px;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #b0b0b0;
  font-weight: 500;
  min-height: 56px;
}

// 危险操作按钮
.btn-danger {
  font-size: 24px;
  padding: 16px 48px;
  border-radius: 12px;
  background: #ff3b30;
  color: #fff;
  font-weight: 600;
  min-height: 56px;
}

// 小按钮
.btn-sm {
  font-size: 20px;
  padding: 12px 32px;
  border-radius: 8px;
  min-height: 44px;
}
```

---

## 三、各页面具体布局设计

### 3.1 首页（仪表盘）

**核心布局结构**：

```
固定头部：
- 左侧：台桌号 + 状态徽章
- 中间：当前时间 + 计时信息
- 右侧：导航按钮（点单、账单）

主内容区：
- [状态信息卡片]：订单状态、已消费金额、预计结束时间
- [快捷操作卡片]：立即点单、查看账单、结账离场按钮
- [比赛信息卡片]（条件显示）：比赛状态、比分、参赛人员

底部操作区：
- 查看详情按钮 + 切换页面按钮
```

**关键设计要点**：
- 台桌号使用 `48px` 大字号，确保远距离可见
- 状态信息卡片采用网格布局，信息清晰展示
- 快捷操作按钮使用 `btn-primary`、`btn-secondary`、`btn-danger` 三种样式
- 比分信息使用超大字号显示

---

### 3.2 商品点单页面

**核心布局结构**：

```
固定头部：
- 左侧：台桌号 + 状态徽章
- 中间：当前时间
- 右侧：购物车图标 + 已选数量

主内容区：
- [商品分类卡片]：分类标签（横向滚动，大按钮）
- [商品列表区域]：
  - 双列卡片布局
  - 每个商品一个大圆角卡片
  - 卡片内容：商品图片 + 名称 + 价格 + 添加按钮

底部操作区：
- 购物车摘要：已选商品数量 + 总价
- 提交订单按钮
```

**关键设计要点**：
- 商品分类使用横向滚动的标签按钮，字号 `22px`
- 商品卡片采用双列布局，卡片间间距 `32px`
- 商品图片占据卡片上半部分（约40%高度）
- 商品名称使用 `24px` 字号，价格使用 `28px` 字号突出
- 添加按钮使用 `btn-sm` 样式，便于快速点击

---

### 3.3 智能计分页面

**核心布局结构**：

```
固定头部：
- 左侧：台桌号 + 比赛类型
- 中间：当前局数
- 右侧：比赛状态徽章

主内容区：
- [比分显示卡片]：
  - 左侧：选手1姓名 + 得分（超大字号）
  - 中间：比分符号（VS 或 :）
  - 右侧：选手2姓名 + 得分（超大字号）

- [计分操作卡片]：
  - 选手1加分/减分按钮
  - 选手2加分/减分按钮
  - 换边按钮

底部操作区：
- 暂停比赛按钮 + 结束比赛按钮
```

**关键设计要点**：
- 比分使用 `48px` 超大字号，确保远距离可见
- 计分按钮使用 `btn-primary` 样式，尺寸足够大
- 比分卡片占据主内容区主要空间（约60%高度）
- 计分操作卡片按钮排列清晰，便于快速操作

---

### 3.4 教练预约页面

**核心布局结构**：

```
固定头部：
- 左侧：台桌号
- 中间：教练预约标题
- 右侧：筛选按钮

主内容区：
- [筛选条件卡片]：
  - 教练类型选择
  - 时间段选择

- [教练列表区域]：
  - 单列卡片布局
  - 每个教练一个大圆角卡片
  - 卡片内容：教练头像 + 姓名 + 技能标签 + 预约按钮

底部操作区：
- 预约确认按钮
```

**关键设计要点**：
- 教练头像使用圆形，尺寸 `120px`
- 教练姓名使用 `28px` 字号
- 技能标签使用小徽章样式
- 预约按钮使用 `btn-primary` 样式
- 卡片间间距 `32px`

---

### 3.5 开台页面

**核心布局结构**：

```
固定头部：
- 左侧：选择台桌标题
- 中间：当前时间
- 右侧：返回按钮

主内容区：
- [台桌选择卡片]：
  - 网格布局（2-3列）
  - 每个台桌一个大按钮
  - 按钮显示：台桌号 + 状态

- [开台设置卡片]：
  - 开台时间选择
  - 人数设置
  - 备注（可选）

底部操作区：
- 确认开台按钮
```

**关键设计要点**：
- 台桌选择按钮使用网格布局，字号 `24px`
- 台桌按钮高度 `80px`，便于触屏点击
- 开台设置使用表单布局，输入框字号 `24px`
- 确认开台按钮使用 `btn-primary` 样式，尺寸足够大

---

### 3.6 账单页面

**核心布局结构**：

```
固定头部：
- 左侧：台桌号 + 状态徽章
- 中间：账单标题
- 右侧：当前时间

主内容区：
- [账单摘要卡片]：
  - 总金额（超大字号）
  - 消费明细统计

- [消费列表区域]：
  - 单列卡片布局
  - 每个消费项一个大圆角卡片
  - 卡片内容：消费项目 + 数量 + 单价 + 小计

底部操作区：
- 结账按钮
```

**关键设计要点**：
- 总金额使用 `48px` 超大字号，确保清晰可见
- 消费列表卡片使用单列布局
- 消费项目使用 `24px` 字号
- 小计金额使用 `28px` 字号突出
- 结账按钮使用 `btn-primary` 样式

---

## 四、技术实施细节

### 4.1 技术栈保持不变

- 前端框架：uni-app + Vue 3
- 样式语言：SCSS
- 组件库：自定义组件（基于设计系统）

### 4.2 实施策略

#### 4.2.1 组件重构优先级

1. **第一步**：创建统一的基础组件
   - 创建 `PageHeader` 组件（统一头部）
   - 创建 `CardBase` 组件（卡片基础）
   - 创建 `ButtonPrimary`、`ButtonSecondary`、`ButtonDanger` 组件（按钮系统）
   - 创建 `ModalBase` 组件（弹窗基础）

2. **第二步**：创建样式系统
   - 创建 `styles/design-system.scss`（设计系统样式）
   - 定义字体层级、间距系统、颜色变量
   - 定义卡片、按钮、弹窗基础样式

3. **第三步**：逐页重构
   - 优先重构首页（验证设计系统）
   - 重构商品点单页面
   - 重构智能计分页面
   - 重构教练预约页面
   - 重构开台页面
   - 重构账单页面

4. **第四步**：创建弹窗组件
   - 创建各类弹窗组件（信息展示、操作确认、表单输入）
   - 替换现有弹窗实现

#### 4.2.2 保持功能逻辑

- 所有页面功能逻辑保持不变
- 仅调整布局结构和样式
- 可以适度拆分组件，提高复用性

### 4.3 文件结构

```
src/
├── components/
│   ├── common/
│   │   ├── PageHeader.vue         # 统一头部组件
│   │   ├── CardBase.vue           # 卡片基础组件
│   │   ├── ButtonPrimary.vue      # 主要按钮组件
│   │   ├── ButtonSecondary.vue    # 次要按钮组件
│   │   ├── ButtonDanger.vue       # 危险按钮组件
│   │   ├── ModalBase.vue          # 弹窗基础组件
│   │   ├── StatusBadge.vue        # 状态徽章组件
│   │   └── ModalConfirm.vue       # 确认弹窗组件
│   │   └── ModalInfo.vue          # 信息弹窗组件
│   │   └── ModalForm.vue          # 表单弹窗组件
│   └── ...
├── styles/
│   ├── design-system.scss         # 设计系统样式
│   ├── variables.scss             # 颜色、间距变量
│   ├── global.scss                # 全局样式（更新）
│   └── ...
├── pages/
│   ├── index/
│   │   └── index.vue              # 首页（重构）
│   ├── product/
│   │   └── index.vue              # 商品点单（重构）
│   ├── score/
│   │   └── index.vue              # 智能计分（重构）
│   ├── assistant/
│   │   └── index.vue              # 教练预约（重构）
│   ├── bill/
│   │   ├── index.vue              # 开台（重构）
│   │   └── index.vue              # 账单（重构）
│   └── ...
```

### 4.4 关键样式文件

#### 4.4.1 design-system.scss

```scss
// 字体系统
.text-page-title { font-size: 48px; font-weight: 700; }
.text-card-title { font-size: 28px; font-weight: 600; }
.text-primary { font-size: 24px; font-weight: 500; }
.text-secondary { font-size: 22px; font-weight: 400; }
.text-auxiliary { font-size: 18px; font-weight: 400; }
.text-label { font-size: 16px; font-weight: 500; }

// 间距系统
$spacing-xs: 8px;
$spacing-sm: 16px;
$spacing-md: 24px;
$spacing-lg: 32px;
$spacing-xl: 48px;

// 圆角系统
$rounded-sm: 8px;
$rounded-md: 12px;
$rounded-lg: 16px;
$rounded-xl: 20px;
$rounded-full: 9999px;

// 卡片基础样式
.card-base {
  border-radius: $rounded-lg;
  padding: $spacing-md;
  margin-bottom: $spacing-lg;
  background: #242424;
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

// 弹窗基础样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  width: 85%;
  max-width: 800px;
  max-height: 90vh;
  border-radius: $rounded-xl;
  background: #2a2a2a;
  border: 1px solid rgba(255,255,255,0.15);
  box-shadow: 0 8px 32px rgba(0,0,0,0.3);
  overflow: hidden;
}

// 按钮样式
.btn-primary {
  font-size: 24px;
  padding: 16px 48px;
  border-radius: $rounded-md;
  background: #007aff;
  color: #fff;
  font-weight: 600;
  min-height: 56px;
}

.btn-secondary {
  font-size: 24px;
  padding: 16px 48px;
  border-radius: $rounded-md;
  background: transparent;
  border: 1px solid rgba(255,255,255,0.2);
  color: #b0b0b0;
  font-weight: 500;
  min-height: 56px;
}

.btn-danger {
  font-size: 24px;
  padding: 16px 48px;
  border-radius: $rounded-md;
  background: #ff3b30;
  color: #fff;
  font-weight: 600;
  min-height: 56px;
}

.btn-sm {
  font-size: 20px;
  padding: 12px 32px;
  border-radius: $rounded-sm;
  min-height: 44px;
}
```

---

## 五、验收标准

### 5.1 视觉验收

- 所有页面采用统一的三段式布局结构
- 所有页面头部保持一致的设计风格
- 所有卡片使用大圆角设计（16px）
- 所有字体适配27寸屏幕（放大约40%）
- 所有按钮便于触屏操作（最小高度56px）
- 整体视觉呈现高级感、现代化

### 5.2 功能验收

- 所有原有功能保持不变
- 所有操作流程保持不变
- 所有数据展示保持不变
- 所有弹窗交互保持不变

### 5.3 体验验收

- 信息层次清晰，一目了然
- 操作按钮大小合适，便于触屏点击
- 字体大小适中，远距离可读
- 页面切换流畅，无性能问题

---

## 六、实施时间线

### 6.1 实施步骤

**第1步**：创建基础组件（1-2天）
- 创建 PageHeader、CardBase、Button 组件
- 创建 design-system.scss 样式文件

**第2步**：重构首页（1天）
- 应用新布局结构
- 验证设计系统效果
- 调整细节

**第3步**：重构商品点单页面（1-2天）
- 重构商品列表布局
- 重构购物车逻辑

**第4步**：重构智能计分页面（1天）
- 重构比分显示
- 重构计分操作

**第5步**：重构教练预约、开台、账单页面（2-3天）
- 统一布局结构
- 应用卡片系统

**第6步**：创建弹窗组件（1-2天）
- 创建各类弹窗组件
- 替换现有弹窗

**第7步**：整体测试和调整（1天）
- 测试所有页面功能
- 调整视觉细节
- 性能优化

**预计总时间**：8-10天

---

## 七、备注

### 7.1 设计原则

- **一致性优于独特性**：所有页面采用统一设计，确保整体体验一致
- **标准化优于个性化**：建立系统化的设计规范，便于维护和扩展
- **功能优先于视觉**：视觉优化服务于功能，不改变原有功能逻辑
- **适配优先于美观**：优先适配27寸竖屏，确保远距离可读和触屏操作便利

### 7.2 可调整项

如果在实际实施中发现某些设计细节不够理想，以下项目可以快速调整：
- 字体大小（可以微调放大/缩小）
- 间距大小（可以微调增大/减小）
- 卡片圆角（可以调整为12px或20px）
- 按钮尺寸（可以调整最小高度）
- 颜色层级（可以微调对比度）

---

**文档编写完成日期**：2026-06-29
**下一步**：用户 Review 设计文档，确认后开始实施