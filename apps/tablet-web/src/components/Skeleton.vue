<template>
  <view class="skeleton-container">
    <view class="skeleton-header" v-if="showHeader">
      <view class="skeleton-avatar"></view>
      <view class="skeleton-title-row">
        <view class="skeleton-title"></view>
        <view class="skeleton-subtitle"></view>
      </view>
    </view>

    <view class="skeleton-card" v-for="n in cardCount" :key="n">
      <view class="skeleton-card-header">
        <view class="skeleton-line short"></view>
        <view class="skeleton-line tiny"></view>
      </view>
      <view class="skeleton-card-content">
        <view class="skeleton-image"></view>
        <view class="skeleton-info">
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line short"></view>
          <view class="skeleton-line tiny"></view>
        </view>
      </view>
    </view>

    <view class="skeleton-list" v-if="showList">
      <view class="skeleton-list-item" v-for="n in listCount" :key="n">
        <view class="skeleton-circle"></view>
        <view class="skeleton-list-content">
          <view class="skeleton-line medium"></view>
          <view class="skeleton-line short"></view>
        </view>
        <view class="skeleton-line tiny"></view>
      </view>
    </view>

    <view class="skeleton-footer" v-if="showFooter">
      <view class="skeleton-button"></view>
    </view>
  </view>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  showHeader?: boolean
  showList?: boolean
  showFooter?: boolean
  cardCount?: number
  listCount?: number
}>(), {
  showHeader: true,
  showList: false,
  showFooter: false,
  cardCount: 3,
  listCount: 5
})
</script>

<style lang="scss" scoped>
.skeleton-container {
  padding: 32rpx;
}

.skeleton-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 48rpx;
  
  .skeleton-avatar {
    width: 120rpx;
    height: 120rpx;
    background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 50%;
  }
  
  .skeleton-title-row {
    flex: 1;
    
    .skeleton-title {
      height: 56rpx;
      background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 12rpx;
      margin-bottom: 16rpx;
      width: 60%;
    }
    
    .skeleton-subtitle {
      height: 32rpx;
      background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8rpx;
      width: 40%;
    }
  }
}

.skeleton-card {
  background: #1a1a2e;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  border: 2rpx solid #374151;
  
  .skeleton-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 28rpx;
    
    .skeleton-line {
      background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8rpx;
      
      &.short {
        height: 36rpx;
        width: 200rpx;
      }
      
      &.tiny {
        height: 28rpx;
        width: 100rpx;
      }
    }
  }
  
  .skeleton-card-content {
    display: flex;
    gap: 24rpx;
    
    .skeleton-image {
      width: 200rpx;
      height: 200rpx;
      background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 24rpx;
    }
    
    .skeleton-info {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 16rpx;
      
      .skeleton-line {
        background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8rpx;
        
        &.medium {
          height: 40rpx;
          width: 80%;
        }
        
        &.short {
          height: 32rpx;
          width: 60%;
        }
        
        &.tiny {
          height: 28rpx;
          width: 40%;
        }
      }
    }
  }
}

.skeleton-list {
  background: #1a1a2e;
  border-radius: 32rpx;
  padding: 16rpx 28rpx;
  border: 2rpx solid #374151;
  margin-bottom: 32rpx;
  
  .skeleton-list-item {
    display: flex;
    align-items: center;
    gap: 24rpx;
    padding: 24rpx 0;
    
    &:not(:last-child) {
      border-bottom: 1rpx solid #374151;
    }
    
    .skeleton-circle {
      width: 80rpx;
      height: 80rpx;
      background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 50%;
    }
    
    .skeleton-list-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12rpx;
      
      .skeleton-line {
        background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
        background-size: 200% 100%;
        animation: shimmer 1.5s infinite;
        border-radius: 8rpx;
        
        &.medium {
          height: 36rpx;
          width: 70%;
        }
        
        &.short {
          height: 28rpx;
          width: 50%;
        }
      }
    }
    
    .skeleton-line.tiny {
      height: 32rpx;
      width: 120rpx;
      background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 8rpx;
    }
  }
}

.skeleton-footer {
  padding: 24rpx 0;
  
  .skeleton-button {
    height: 130rpx;
    background: linear-gradient(90deg, #252542 25%, #1a1a2e 50%, #252542 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 32rpx;
    width: 100%;
  }
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}
</style>