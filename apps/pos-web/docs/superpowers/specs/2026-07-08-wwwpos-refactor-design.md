# wwwpos 前端产品化重构设计文档

## 一、项目概述

### 1.1 项目背景
wwwpos 是台球厅收银系统的前端项目，基于 Next.js 16 + React 19 + Tailwind CSS 4 + Lucide React Icons 技术栈。本次重构旨在实现视觉上的颠覆性变化，采用微信 UI 风格，保持所有功能逻辑不变。

### 1.2 重构目标
- 不改任何功能逻辑，只修改布局和风格
- 采用微信 UI 风格（微信绿主题、浅灰背景、大圆角）
- 实现颠覆性视觉变化，与原有产品完全不同
- 布局重构：快捷操作栏从右侧移至左侧
- 大组件大圆角，现代简约风格

### 1.3 重构范围
- **所有页面**：登录页、选择门店页、POS主页面、所有模态框
- **所有组件**：HeaderBar、QuickPanel、TableBoard、TableDrawer、按钮、输入框等

---

## 二、设计规范

### 2.1 色彩规范

| 颜色名称 | 色值 | 用途 |
|---------|------|------|
| 主色（微信绿） | #07C160 | 按钮、链接、选中状态 |
| 主色深色 | #06AD56 | 按钮悬停、渐变 |
| 背景色 | #f7f7f7 | 页面背景 |
| 卡片背景 | #ffffff | 卡片、面板背景 |
| 支付宝蓝 | #06B6D4 | 支付宝支付相关 |
| 橙色 | #FF976A | 现金/会员卡、重点提示 |
| 标题文字 | #333333 | 标题、正文 |
| 辅助文字 | #999999 | 说明文字、占位符 |
| 边框色 | #e5e5e5 | 分隔线、卡片边框 |

### 2.2 字体规范

| 类型 | 大小 | 字重 | 颜色 |
|------|------|------|------|
| 标题 | 30rpx | 700 | #333333 |
| 正文 | 28rpx | regular | #333333 |
| 辅助文字 | 22-24rpx | regular | #999999 |
| 小文字 | 20rpx | regular | #e5e5e5 |

### 2.3 间距规范

| 类型 | 大小 |
|------|------|
| 页面边距 | 32rpx |
| 卡片间距 | 16rpx |
| 内容间距 | 16rpx |
| 列表项高度 | 96rpx |

### 2.4 圆角规范

| 元素 | 圆角 |
|------|------|
| 卡片 | 24rpx (rounded-2xl) |
| 按钮 | 999rpx (rounded-full, 胶囊形) |
| 输入框 | 24rpx (rounded-2xl) |
| 模态框 | 32rpx (rounded-3xl) |

### 2.5 阴影规范

| 元素 | 阴影 |
|------|------|
| 卡片 | 0 2rpx 8rpx rgba(0,0,0,0.04) |
| 按钮 | 0 4rpx 12rpx rgba(7, 193, 96, 0.2) |
| 悬浮组件 | 0 8rpx 24rpx rgba(0,0,0,0.08) |

---

## 三、布局重构方案

### 3.1 整体布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  HeaderBar (顶部导航栏)                                         │
│  ┌──────────────┬─────────────────────────────────────────────┐│
│  │ 客稻云 Logo  │  时间日期  │  网络状态  │  用户信息/班次    ││
│  └──────────────┴─────────────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  Main Content                                                   │
│  ┌──────────────────────┬─────────────────────────────────────┐│
│  │                      │                                     ││
│  │  QuickPanel (左侧)   │    TableBoard (右侧主区域)          ││
│  │  宽度: 340px         │    台桌网格/列表展示                ││
│  │  - 快捷操作按钮       │                                     ││
│  │  - 班次统计          │                                     ││
│  │  - 网络状态          │                                     ││
│  │                      │                                     ││
│  └──────────────────────┴─────────────────────────────────────┘│
├─────────────────────────────────────────────────────────────────┤
│  StatusBar (底部状态栏)                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 布局变化对比

| 区域 | 重构前 | 重构后 |
|------|--------|--------|
| 快捷操作栏 | 右侧（宽度340px） | 左侧（宽度340px） |
| 台桌区域 | 左侧（flex-1） | 右侧（flex-1） |
| HeaderBar | 深色渐变背景 | 白色背景 |
| 整体风格 | 翡翠绿/青色主题 | 微信绿主题 |

---

## 四、核心组件设计

### 4.1 HeaderBar（顶部导航栏）

**设计要点：**
- 白色背景，高度 96rpx
- 底部浅灰分隔线（#e5e5e5）
- 左侧：Logo + "客稻云" 品牌名
- 中间：实时时间日期显示
- 右侧：网络状态、通知徽章、用户头像/班次状态

**样式规范：**
```css
.header-bar {
  background: #ffffff;
  height: 96rpx;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32rpx;
}
```

### 4.2 QuickPanel（左侧快捷操作栏）

**设计要点：**
- 固定宽度 340px
- 白色背景，顶部圆角 24rpx
- 网格布局的快捷操作按钮（2列）
- 班次统计卡片（绿色主题）
- 网络状态显示

**样式规范：**
```css
.quick-panel {
  width: 340px;
  background: #ffffff;
  border-radius: 0 24rpx 24rpx 0;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.action-card {
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  align-items: center;
  gap: 16rpx;
  transition: all 0.2s;
}

.action-card:active {
  transform: scale(0.98);
  background: #07C160;
  color: #ffffff;
}
```

### 4.3 TableBoard（台桌区域）

**设计要点：**
- 微信风格卡片设计
- 白色背景 + 圆角 24rpx + 轻微阴影
- 状态标签：空闲/使用中/预约/维护
- 网格/列表两种视图
- 台桌卡片状态颜色差异化

**台桌状态颜色：**

| 状态 | 边框颜色 | 标签颜色 | 背景色 |
|------|---------|---------|--------|
| 空闲 | #3b82f6 | #3b82f6 | #eff6ff |
| 使用中 | #10b981 | #10b981 | #ecfdf5 |
| 预约 | #f97316 | #f97316 | #fff7ed |
| 维护 | #6b7280 | #6b7280 | #f3f4f6 |

**样式规范：**
```css
.table-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  border: 2rpx solid #e5e5e5;
  transition: all 0.2s;
  cursor: pointer;
}

.table-card:hover {
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.06);
}

.table-card.selected {
  border-color: #07C160;
  box-shadow: 0 0 0 4rpx rgba(7, 193, 96, 0.1);
}
```

### 4.4 TableDrawer（台桌详情抽屉）

**设计要点：**
- 右侧抽屉式布局
- 白色背景，顶部圆角 32rpx
- 微信绿主题按钮
- 内容分区展示

### 4.5 按钮组件

**设计要点：**
- 微信绿渐变背景（#07C160 → #06AD56）
- 白色文字，胶囊形圆角（999rpx）
- 悬停时阴影加深
- 禁用状态透明度降低

**样式规范：**
```css
.btn-primary {
  background: linear-gradient(135deg, #07C160 0%, #06AD56 100%);
  color: #ffffff;
  border-radius: 999rpx;
  padding: 20rpx 48rpx;
  font-weight: 600;
  box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.2);
  transition: all 0.2s;
}

.btn-primary:hover {
  box-shadow: 0 6rpx 20rpx rgba(7, 193, 96, 0.3);
}

.btn-primary:active {
  transform: scale(0.98);
}
```

### 4.6 输入框组件

**设计要点：**
- 白色背景，圆角 24rpx
- 浅灰边框，聚焦时微信绿边框
- 左侧图标位置预留

**样式规范：**
```css
.input {
  background: #ffffff;
  border: 2rpx solid #e5e5e5;
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
  font-size: 28rpx;
  transition: all 0.2s;
}

.input:focus {
  border-color: #07C160;
  box-shadow: 0 0 0 4rpx rgba(7, 193, 96, 0.1);
  outline: none;
}
```

---

## 五、页面重构详情

### 5.1 登录页（/login）

**设计要点：**
- 微信风格登录界面
- 白色卡片式登录表单
- 微信绿渐变按钮
- 大圆角设计

**布局结构：**
- 左侧：品牌展示区（Logo + 品牌名 + 标语）
- 右侧：登录表单（手机号输入 + 密码输入 + 登录按钮）

### 5.2 选择门店页（/select-store）

**设计要点：**
- 微信风格门店列表
- 卡片式门店项
- 绿色选中状态

### 5.3 POS主页面（/）

**设计要点：**
- 左侧：快捷操作栏（340px）
- 右侧：台桌区域（flex-1）
- 顶部：HeaderBar
- 底部：StatusBar

### 5.4 模态框组件

**设计要点：**
- 大圆角（32rpx）
- 微信绿主题按钮
- 深色半透明遮罩

---

## 六、全局样式更新

### 6.1 CSS 变量更新

```css
@theme inline {
  --color-primary: #07C160;
  --color-primary-dark: #06AD56;
  --color-bg-primary: #f7f7f7;
  --color-bg-secondary: #ffffff;
  --color-text-primary: #333333;
  --color-text-secondary: #999999;
  --color-border: #e5e5e5;
  --color-wechat: #07C160;
  --color-alipay: #06B6D4;
  --color-cash: #FF976A;
  --radius-card: 1.5rem;
  --radius-button: 999rpx;
  --radius-input: 1.5rem;
  --radius-modal: 2rem;
}
```

### 6.2 基础样式重置

- 页面背景色统一为 #f7f7f7
- 字体统一为 Noto Sans SC
- 滚动条样式优化

---

## 七、品牌替换

所有"客稻云"文字替换为"客稻云"：
- 登录页标题
- HeaderBar 标题
- Footer 版权信息
- 其他页面标题

---

## 八、实施注意事项

1. **功能逻辑不变**：所有重构仅修改样式和布局，不涉及任何功能逻辑代码
2. **响应式适配**：确保在不同屏幕尺寸下正常显示
3. **动画过渡**：添加平滑的过渡动画提升用户体验
4. **性能优化**：避免过度嵌套的 DOM 结构，保持渲染性能
5. **兼容性**：确保在 Electron 环境下正常运行

---

## 九、验证标准

1. 所有页面视觉风格统一为微信风格
2. 快捷操作栏位于左侧（340px）
3. 主色调为微信绿（#07C160）
4. 卡片圆角为 24rpx，按钮为胶囊形
5. 所有功能逻辑与重构前完全一致
6. 构建成功，无错误警告
