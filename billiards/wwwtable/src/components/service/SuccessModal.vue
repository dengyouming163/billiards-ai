<template>
  <view class="success-overlay" v-if="visible">
    <view class="success-content">
      <view class="success-icon">✓</view>
      <text class="success-title">{{ title }}</text>
      <text class="success-desc">{{ description }}</text>
      <view class="success-btn" @click="handleClose">
        <text>确定</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
interface Props {
  visible: boolean
  title?: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  title: '操作成功',
  description: '您的请求已提交成功'
})

const emit = defineEmits<{
  close: []
}>()

function handleClose() {
  emit('close')
}
</script>

<style lang="scss" scoped>
.success-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1001;
}

.success-content {
  width: 480rpx;
  background: linear-gradient(135deg, #1a1a2e, #252542);
  border-radius: 24rpx;
  padding: 48rpx;
  text-align: center;
  border: 1rpx solid rgba(201, 169, 98, 0.2);
  
  .success-icon {
    width: 120rpx;
    height: 120rpx;
    background: linear-gradient(135deg, #2ed573, #1dd1a1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24rpx;
    font-size: 64rpx;
    color: #fff;
    animation: successBounce 0.5s ease;
  }
  
  .success-title {
    display: block;
    font-size: 36rpx;
    font-weight: 600;
    color: #fff;
    margin-bottom: 12rpx;
  }
  
  .success-desc {
    display: block;
    font-size: 26rpx;
    color: #8a8a9a;
    margin-bottom: 32rpx;
  }
  
  .success-btn {
    height: 88rpx;
    background: linear-gradient(135deg, #c9a962, #8a6d3b);
    border-radius: 16rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &:active {
      opacity: 0.8;
    }
    
    text {
      font-size: 28rpx;
      color: #fff;
      font-weight: 600;
    }
  }
}

@keyframes successBounce {
  0% { 
    transform: scale(0); 
  }
  50% { 
    transform: scale(1.2); 
  }
  70% { 
    transform: scale(0.9); 
  }
  100% { 
    transform: scale(1); 
  }
}
</style>
