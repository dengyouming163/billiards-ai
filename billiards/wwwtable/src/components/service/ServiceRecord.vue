<template>
  <view class="service-record">
    <view class="record-header">
      <text class="record-title">📋 最近评价</text>
      <text class="record-more" @click="handleViewAll">查看全部 ></text>
    </view>
    
    <view class="record-list" v-if="records && records.length > 0">
      <view 
        class="record-item"
        v-for="record in records"
        :key="record.id"
      >
        <view class="record-dot" :class="record.status"></view>
        <view class="record-info">
          <text class="record-name">{{ record.service_name }}</text>
          <text class="record-time">{{ record.created_at }}</text>
        </view>
        <view class="record-status" :class="record.status">
          {{ getStatusText(record.status) }}
        </view>
      </view>
    </view>
    
    <view class="empty-state" v-else>
      <text class="empty-icon">📋</text>
      <text class="empty-text">暂无评价记录</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import type { ServiceCall } from '@/types'

interface Props {
  records?: ServiceCall[]
}

withDefaults(defineProps<Props>(), {
  records: () => []
})

const emit = defineEmits<{
  'view-all': []
}>()

function getStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    pending: '等待中',
    processing: '处理中',
    completed: '已完成'
  }
  return statusMap[status] || status
}

function handleViewAll() {
  emit('view-all')
}
</script>

<style lang="scss" scoped>
.service-record {
  .record-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20rpx;
    
    .record-title {
      font-size: 32rpx;
      font-weight: 700;
      color: #ffffff;
    }
    
    .record-more {
      font-size: 26rpx;
      color: #6b7280;
      
      &:active {
        color: #c9a962;
      }
    }
  }
  
  .record-list {
    background: linear-gradient(145deg, rgba(40, 40, 70, 0.95), rgba(25, 25, 50, 0.95));
    border-radius: 20rpx;
    border: 1rpx solid #374151;
    overflow: hidden;
  }
  
  .record-item {
    display: flex;
    align-items: center;
    padding: 24rpx;
    border-bottom: 1rpx solid #2a2a4a;
    
    &:active {
      background: rgba(255, 255, 255, 0.05);
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    .record-dot {
      width: 16rpx;
      height: 16rpx;
      border-radius: 50%;
      margin-right: 20rpx;
      flex-shrink: 0;
      
      &.pending { 
        background: #f59e0b; 
      }
      &.processing { 
        background: #c9a962; 
      }
      &.completed { 
        background: #10b981; 
      }
    }
    
    .record-info {
      flex: 1;
      
      .record-name {
        display: block;
        font-size: 28rpx;
        color: #9ca3af;
        margin-bottom: 4rpx;
      }
      
      .record-time {
        font-size: 22rpx;
        color: #6b7280;
      }
    }
    
    .record-status {
      font-size: 22rpx;
      padding: 6rpx 16rpx;
      border-radius: 20rpx;
      flex-shrink: 0;
      
      &.pending {
        background: rgba(245, 158, 11, 0.2);
        color: #f59e0b;
      }
      &.processing {
        background: rgba(201, 169, 98, 0.2);
        color: #c9a962;
      }
      &.completed {
        background: rgba(16, 185, 129, 0.2);
        color: #10b981;
      }
    }
  }
  
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 60rpx 0;
    background: linear-gradient(145deg, rgba(40, 40, 70, 0.95), rgba(25, 25, 50, 0.95));
    border-radius: 20rpx;
    border: 1rpx solid #374151;
    
    .empty-icon {
      font-size: 60rpx;
      margin-bottom: 16rpx;
    }
    
    .empty-text {
      font-size: 28rpx;
      color: #6b7280;
    }
  }
}
</style>
