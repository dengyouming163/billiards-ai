<template>
  <view class="pending-section" v-if="items.length > 0">
    <view class="section-header">
      <view class="section-icon">⏳</view>
      <text class="section-title">待处理商品</text>
      <text class="section-count">({{ items.length }}件)</text>
    </view>
    
    <view class="pending-list">
      <view 
        class="pending-item" 
        v-for="item in items" 
        :key="item.id"
      >
        <view class="item-emoji">{{ item.emoji }}</view>
        <view class="item-info">
          <text class="item-name">{{ item.name }}</text>
          <text class="item-qty">x{{ item.quantity }}</text>
        </view>
        <view class="item-status" :class="item.status">
          <text class="status-icon">{{ item.statusIcon }}</text>
          <text class="status-text">{{ item.statusText }}</text>
        </view>
        <view class="item-actions" v-if="showActions">
          <view
            v-if="item.status === 'pending'"
            class="action-btn accept"
            @click.stop="handleAccept(item.id)"
          >接单</view>
          <view
            v-if="item.status === 'processing'"
            class="action-btn deliver"
            @click.stop="handleDeliver(item.id)"
          >送达</view>
        </view>
        <text class="item-price">¥{{ formatPrice(item.price) }}</text>
      </view>
    </view>
    
    <view class="section-footer">
      <view class="status-summary">
        <view class="summary-item">
          <text class="summary-dot pending"></text>
          <text class="summary-text">待接单 {{ pendingCount }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-dot processing"></text>
          <text class="summary-text">处理中 {{ processingCount }}</text>
        </view>
        <view class="summary-item">
          <text class="summary-dot delivered"></text>
          <text class="summary-text">已送达 {{ deliveredCount }}</text>
        </view>
      </view>
      <view class="view-detail-btn" @click="goToDetail">查看详情</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatPrice } from '@/utils/format'

interface PendingItem {
  id: string
  product_id: string
  name: string
  emoji: string
  quantity: number
  price: number
  status: 'pending' | 'processing' | 'delivered'
  statusText: string
  statusIcon: string
  created_at: string
}

const props = defineProps<{
  items: PendingItem[]
  showActions?: boolean
}>()

const emit = defineEmits<{
  (e: 'viewDetail'): void
  (e: 'accept', itemId: string): void
  (e: 'deliver', itemId: string): void
}>()

const pendingCount = computed(() => props.items.filter(i => i.status === 'pending').length)
const processingCount = computed(() => props.items.filter(i => i.status === 'processing').length)
const deliveredCount = computed(() => props.items.filter(i => i.status === 'delivered').length)

function goToDetail() {
  emit('viewDetail')
}

function handleAccept(itemId: string) {
  emit('accept', itemId)
}

function handleDeliver(itemId: string) {
  emit('deliver', itemId)
}
</script>

<style lang="scss" scoped>
.pending-section {
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.1), rgba(138, 109, 59, 0.05));
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  border: 2rpx solid rgba(201, 169, 98, 0.2);
  
  .section-header {
    display: flex;
    align-items: center;
    gap: 16rpx;
    margin-bottom: 24rpx;
    
    .section-icon {
      font-size: 60rpx;
    }
    
    .section-title {
      font-size: 54rpx;
      font-weight: 700;
      color: #fff;
    }
    
    .section-count {
      font-size: 42rpx;
      color: #8a8a9a;
    }
  }
  
  .pending-list {
    .pending-item {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 20rpx 0;
      border-bottom: 2rpx solid rgba(255, 255, 255, 0.05);
      
      &:last-child {
        border-bottom: none;
      }
      
      .item-emoji {
        width: 80rpx;
        height: 80rpx;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20rpx;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 60rpx;
      }
      
      .item-info {
        flex: 1;
        
        .item-name {
          display: block;
          font-size: 48rpx;
          color: #fff;
          margin-bottom: 4rpx;
        }
        
        .item-qty {
          font-size: 39rpx;
          color: #8a8a9a;
        }
      }
      
      .item-status {
        display: flex;
        align-items: center;
        gap: 8rpx;
        
        .status-icon {
          font-size: 42rpx;
        }
        
        .status-text {
          font-size: 39rpx;
          color: #f59e0b;
        }
        
        &.processing {
          .status-text {
            color: #3b82f6;
          }
        }
        
        &.delivered {
          .status-text {
            color: #22c55e;
          }
        }
      }
      
      .item-actions {
        display: flex;
        align-items: center;
        gap: 12rpx;
        margin-right: 16rpx;

        .action-btn {
          padding: 8rpx 20rpx;
          border-radius: 12rpx;
          font-size: 33rpx;
          font-weight: 600;
          min-width: 70rpx;
          text-align: center;

          &.accept {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            border: 2rpx solid rgba(245, 158, 11, 0.3);
          }

          &.deliver {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
            border: 2rpx solid rgba(34, 197, 94, 0.3);
          }
        }
      }

      .item-price {
        font-size: 48rpx;
        font-weight: 600;
        color: #feca57;
      }
    }
  }
  
  .section-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 24rpx;
    padding-top: 24rpx;
    border-top: 2rpx solid rgba(255, 255, 255, 0.05);
    
    .status-summary {
      display: flex;
      gap: 24rpx;
      
      .summary-item {
        display: flex;
        align-items: center;
        gap: 8rpx;
        
        .summary-dot {
          width: 16rpx;
          height: 16rpx;
          border-radius: 50%;
          
          &.pending {
            background: #f59e0b;
          }
          &.processing {
            background: #3b82f6;
          }
          &.delivered {
            background: #22c55e;
          }
        }
        
        .summary-text {
          font-size: 36rpx;
          color: #8a8a9a;
        }
      }
    }
    
    .view-detail-btn {
      padding: 16rpx 32rpx;
      background: rgba(201, 169, 98, 0.2);
      border-radius: 20rpx;
      font-size: 42rpx;
      color: #c9a962;
      font-weight: 600;
    }
  }
}
</style>