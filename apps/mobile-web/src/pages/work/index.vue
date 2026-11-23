<template>
  <view class="work-page">
    <view class="header-bg">
      <Header />
    </view>
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
              <Icon :name="card.iconName" :size="40" />
            </view>
            <text class="card-name">{{ card.name }}</text>
          </view>
        </view>
      </view>
      <view v-if="workCards.length === 0" class="empty-state">
        <text class="empty-icon">🔒</text>
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
  background: #f2f3f5;
  padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.header-bg {
  background:
    radial-gradient(circle at top right, rgba(255,255,255,.18) 0, rgba(255,255,255,0) 34%),
    radial-gradient(circle at left bottom, rgba(255,255,255,.14) 0, rgba(255,255,255,0) 28%),
    linear-gradient(135deg, #0f766e 0%, #059669 52%, #047857 100%);
  border-bottom-left-radius: 48rpx;
  border-bottom-right-radius: 48rpx;
}

.page-content { padding: 0 24rpx; margin-top: -32rpx; position: relative; z-index: 2; }

.work-card-container {
  background: linear-gradient(180deg, rgba(255,255,255,.97) 0%, rgba(255,255,255,.91) 100%);
  border-radius: 48rpx;
  padding: 36rpx;
  box-shadow: 0 12rpx 36rpx rgba(15,23,42,.06);
  border: 1rpx solid rgba(255,255,255,.82);
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28rpx;
}

.work-title {
  font-size: 36rpx;
  font-weight: 800;
  color: #0f172a;
}

.work-count {
  font-size: 24rpx;
  color: #64748b;
  padding: 8rpx 20rpx;
  background: #f1f5f9;
  border-radius: 999rpx;
}

.card-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 18rpx;
}

.work-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 28rpx 20rpx;
  background: #f7faf9;
  border-radius: 36rpx;
  border: 1rpx solid #edf2ef;
  transition: transform .15s ease;

  &:active {
    transform: scale(.96);
    background: #ebf7f2;
  }
}

.card-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  background: rgba(5,150,105,.08);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14rpx;
}

.card-name {
  font-size: 26rpx;
  font-weight: 600;
  color: #374151;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 160rpx;
}

.empty-icon { font-size: 80rpx; margin-bottom: 20rpx; }
.empty-text { font-size: 28rpx; color: #9ca3af; margin-bottom: 8rpx; }
.empty-desc { font-size: 24rpx; color: #d1d5db; }
</style>
