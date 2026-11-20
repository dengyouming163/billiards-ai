<template>
  <view class="work-page">
    <Header />
    <view class="page-content">
      <view class="work-card-container">
        <view class="work-header">
          <text class="work-title">工作台</text>
          <text class="work-count">{{ workCards.length }}个功能</text>
        </view>
        <view class="card-grid">
          <view
            v-for="card in workCards"
            :key="card.code"
            class="work-card"
            @click="uni.navigateTo({ url: card.path })"
          >
            <view class="card-icon-wrap">
              <Icon :name="card.iconName" :size="36" />
            </view>
            <text class="card-name">{{ card.name }}</text>
          </view>
        </view>
      </view>
      <view v-if="workCards.length === 0" class="empty-state">
        <Icon class="empty-icon" name="lock" size="80" />
        <text class="empty-text">暂无可用功能模块</text>
        <text class="empty-desc">请联系管理员分配权限</text>
      </view>
    </view>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { usePermission } from '@/composables/usePermission'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import Icon from '@/components/Icon.vue'

const { workCards } = usePermission()
</script>

<style lang="scss" scoped>
.work-page {
  min-height: 100vh;
  background: #f7f7f7;
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.page-content { padding: 0 24rpx; margin-top: 16rpx; position: relative; z-index: 2; }

.work-card-container {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.work-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.work-count {
  font-size: 22rpx;
  color: #999999;
  padding: 6rpx 16rpx;
  background: #f7f7f7;
  border-radius: 999rpx;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20rpx;
}

.work-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 16rpx;
  background: #ffffff;
  border-radius: 20rpx;
  border: 1rpx solid #e5e5e5;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  transition: all .15s ease;

  &:active {
    transform: scale(.98);
    background: rgba(7, 193, 96, 0.04);
    box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.15);
    border-color: rgba(7, 193, 96, 0.3);
  }
}

.card-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: 20rpx;
  background: rgba(7, 193, 96, 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14rpx;
}

.card-icon-wrap :deep(.icon) {
  color: #07C160;
}

.card-name {
  font-size: 24rpx;
  font-weight: 600;
  color: #333333;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #999999; margin-bottom: 8rpx; }
.empty-desc { font-size: 24rpx; color: #999999; }
</style>
