<template>
  <view class="records-page">
    <view class="page-content">
      <view class="list">
        <view v-for="r in records" :key="r.id" class="record-card">
          <view class="record-header">
            <text class="record-platform">
              {{ r.platform === 'meituan' ? '🟢 美团' : '🎵 抖音' }}
            </text>
            <text class="record-status" :class="r.status">
              {{ r.status === 'verified' ? '已核销' : '已撤销' }}
            </text>
          </view>
          <view class="record-body">
            <text class="record-name">{{ r.package_name }}</text>
            <text class="record-price">¥{{ r.verify_price }}</text>
          </view>
          <view class="record-footer">
            <text class="record-time">{{ r.verified_at }}</text>
          </view>
        </view>
        <view v-if="records.length === 0 && !loading" class="empty">
          <text class="empty-text">暂无核销记录</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { couponApi } from '@/api/modules/coupon'

const records = ref<Record<string, any>[]>([])
const loading = ref(false)

onMounted(async () => {
  loading.value = true
  try {
    const res = await couponApi.getRecords()
    records.value = res.lists || []
  } catch (e) {
    console.error('[coupon/records] Failed to load records:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style lang="scss" scoped>
.records-page {
  min-height: 100vh;
  background: #f5f5f5;
}

.page-content {
  padding: 32rpx;
}

.record-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx;
  margin-bottom: 20rpx;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.record-platform {
  font-size: 28rpx;
  color: #666;
}

.record-status {
  font-size: 24rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.record-status.verified {
  background: #f0fdf6;
  color: #059669;
}

.record-status.revoked {
  background: #fef2f2;
  color: #ef4444;
}

.record-body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.record-name {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.record-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #f59e0b;
}

.record-footer {
  margin-top: 12rpx;
}

.record-time {
  font-size: 24rpx;
  color: #ccc;
}

.empty {
  text-align: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #ccc;
}
</style>
