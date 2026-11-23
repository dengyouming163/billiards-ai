<template>
  <view class="container page-layout">
    <view class="page-header-section">
      <PageHeader
        icon="⚙️"
        title="设置"
        subtitle="桌台系统设置"
      >
        <template #right>
          <view class="back-btn" @click="goBack"><text>← 返回</text></view>
        </template>
      </PageHeader>
    </view>

    <view class="content page-content-section">
      <!-- 桌台信息卡片 -->
      <view class="info-card">
        <view class="card-title">当前桌台</view>
        <view class="info-row">
          <text class="info-label">台号</text>
          <text class="info-value">{{ authStore.tableName || '未知' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">台码</text>
          <text class="info-value">{{ authStore.tableCode || '未知' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">门店</text>
          <text class="info-value">{{ authStore.storeId || '未知' }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">状态</text>
          <text class="info-value status">{{ authStore.tableStatus || '未知' }}</text>
        </view>
      </view>

      <!-- 退出登录 -->
      <view class="action-card">
        <view class="logout-btn" @tap="handleLogout">
          <text class="logout-icon">🚪</text>
          <text class="logout-text">退出登录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { authStore } from '@/stores/auth'
import PageHeader from '@/components/standard/PageHeader.vue'

function goBack() {
  uni.navigateBack()
}

async function handleLogout() {
  uni.showModal({
    title: '确认退出',
    content: '退出后需要重新输入台码登录，确定退出吗？',
    confirmText: '确定退出',
    cancelText: '取消',
    success: async (res: any) => {
      if (res.confirm) {
        uni.showLoading({ title: '退出中...', mask: true })
        await authStore.logout()
        uni.hideLoading()
        uni.reLaunch({ url: '/pages/login/index' })
      }
    },
  })
}
</script>

<style lang="scss" scoped>
@use '@/styles/layout-system.scss';

$gold: #c9a962;
$bg: #0f0f16;

.back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 88rpx;
  padding: 0 36rpx;
  background: rgba($gold, 0.1);
  border-radius: 44rpx;
  border: 2rpx solid rgba($gold, 0.25);
  transition: all 0.3s;

  text {
    font-size: 40rpx;
    font-weight: 600;
    color: $gold;
  }

  &:active {
    transform: scale(0.95);
    background: rgba($gold, 0.2);
  }
}

.container {
  min-height: 100vh;
  background: linear-gradient(180deg, $bg 0%, #12121a 30%, #1a1a2e 70%, $bg 100%);
}

.content {
  display: flex;
  flex-direction: column;
  gap: 56rpx;
}

.info-card {
  background: linear-gradient(145deg, rgba(35, 35, 65, 0.95), rgba(25, 25, 50, 0.98));
  border-radius: 48rpx;
  padding: 64rpx;
  border: 3rpx solid rgba($gold, 0.2);
  box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.4), 0 0 40rpx rgba($gold, 0.08);
}

.card-title {
  font-size: 64rpx;
  font-weight: 700;
  color: $gold;
  margin-bottom: 48rpx;
  letter-spacing: 3rpx;
  text-shadow: 0 0 30rpx rgba($gold, 0.3);
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 0;
  border-bottom: 2rpx solid rgba(255, 255, 255, 0.06);

  &:last-child {
    border-bottom: none;
  }
}

.info-label {
  font-size: 48rpx;
  color: rgba(255, 255, 255, 0.5);
}

.info-value {
  font-size: 48rpx;
  color: #f1f5f9;
  font-weight: 600;

  &.status {
    color: #4ade80;
  }
}

.action-card {
  background: linear-gradient(145deg, rgba(35, 35, 65, 0.95), rgba(25, 25, 50, 0.98));
  border-radius: 48rpx;
  padding: 40rpx;
  border: 3rpx solid rgba(239, 68, 68, 0.25);
  box-shadow: 0 16rpx 60rpx rgba(0, 0, 0, 0.4);
}

.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 28rpx;
  min-height: 140rpx;
  background: rgba(239, 68, 68, 0.12);
  border-radius: 36rpx;
  border: 3rpx solid rgba(239, 68, 68, 0.3);
  transition: all 0.3s;

  &:active {
    transform: scale(0.97);
    background: rgba(239, 68, 68, 0.22);
  }
}

.logout-icon {
  font-size: 72rpx;
}

.logout-text {
  font-size: 56rpx;
  font-weight: 700;
  color: #ef4444;
  letter-spacing: 4rpx;
}
</style>
