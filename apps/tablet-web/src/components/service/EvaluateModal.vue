<template>
  <view class="evaluate-overlay" v-if="visible">
    <view class="evaluate-content">
      <view class="evaluate-header">
        <text class="evaluate-title">服务评价</text>
        <view class="close-btn" @click="handleClose">✕</view>
      </view>

      <view class="evaluate-body">
        <view class="evaluate-item">
          <text class="item-label">服务态度</text>
          <view class="star-row">
            <text
              v-for="i in 5"
              :key="i"
              class="star"
              :class="{ active: i <= serviceAttitude }"
              @click="serviceAttitude = i"
            >⭐</text>
          </view>
        </view>

        <view class="evaluate-item">
          <text class="item-label">服务速度</text>
          <view class="star-row">
            <text
              v-for="i in 5"
              :key="i"
              class="star"
              :class="{ active: i <= serviceSpeed }"
              @click="serviceSpeed = i"
            >⭐</text>
          </view>
        </view>

        <view class="evaluate-item">
          <text class="item-label">专业程度</text>
          <view class="star-row">
            <text
              v-for="i in 5"
              :key="i"
              class="star"
              :class="{ active: i <= serviceProfessional }"
              @click="serviceProfessional = i"
            >⭐</text>
          </view>
        </view>

        <view class="feedback-section">
          <text class="feedback-label">文字评价（选填）</text>
          <textarea
            class="feedback-textarea"
            v-model="feedback"
            placeholder="请输入您的宝贵意见..."
          ></textarea>
        </view>
      </view>

      <view class="evaluate-footer">
        <view class="skip-btn" @click="handleSkip">
          <text>跳过</text>
        </view>
        <view class="submit-btn" @click="handleSubmit">
          <text>提交评价</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Props {
  visible: boolean
}

defineProps<Props>()

const emit = defineEmits<{
  close: []
  skip: []
  submit: [data: {
    serviceAttitude: number
    serviceSpeed: number
    serviceProfessional: number
    feedback: string
  }]
}>()

const serviceAttitude = ref(0)
const serviceSpeed = ref(0)
const serviceProfessional = ref(0)
const feedback = ref('')

function handleClose() {
  emit('close')
}

function handleSkip() {
  emit('skip')
}

function handleSubmit() {
  if (serviceAttitude.value === 0 && serviceSpeed.value === 0 && serviceProfessional.value === 0) {
    uni.showToast({
      title: '请至少选择一个评分',
      icon: 'none'
    })
    return
  }

  emit('submit', {
    serviceAttitude: serviceAttitude.value,
    serviceSpeed: serviceSpeed.value,
    serviceProfessional: serviceProfessional.value,
    feedback: feedback.value
  })
}
</script>

<style lang="scss" scoped>
.evaluate-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1002;
}

.evaluate-content {
  width: 600rpx;
  max-height: 80vh;
  background: linear-gradient(135deg, #1a1a2e, #252542);
  border-radius: 24rpx;
  padding: 40rpx;
  border: 1rpx solid rgba(201, 169, 98, 0.2);
  overflow-y: auto;

  .evaluate-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;

    .evaluate-title {
      font-size: 32rpx;
      font-weight: 600;
      color: #fff;
    }

    .close-btn {
      width: 56rpx;
      height: 56rpx;
      background: #252542;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24rpx;
      color: #6b7280;

      &:active {
        background: #374151;
      }
    }
  }

  .evaluate-body {
    .evaluate-item {
      margin-bottom: 32rpx;

      .item-label {
        display: block;
        font-size: 28rpx;
        color: #9ca3af;
        margin-bottom: 16rpx;
      }

      .star-row {
        display: flex;
        gap: 16rpx;

        .star {
          font-size: 48rpx;
          color: #374151;
          transition: all 0.2s;

          &.active {
            color: #f59e0b;
            transform: scale(1.2);
          }

          &:active {
            transform: scale(1.4);
          }
        }
      }
    }

    .feedback-section {
      margin-top: 32rpx;

      .feedback-label {
        display: block;
        font-size: 28rpx;
        color: #9ca3af;
        margin-bottom: 12rpx;
      }

      .feedback-textarea {
        width: 100%;
        height: 160rpx;
        background: #252542;
        border-radius: 16rpx;
        padding: 20rpx;
        font-size: 28rpx;
        color: #fff;
        border: 1rpx solid #374151;
        box-sizing: border-box;
      }
    }
  }

  .evaluate-footer {
    display: flex;
    gap: 20rpx;
    margin-top: 32rpx;

    .skip-btn {
      flex: 1;
      height: 88rpx;
      background: #252542;
      border-radius: 16rpx;
      display: flex;
      align-items: center;
      justify-content: center;

      &:active {
        background: #374151;
      }

      text {
        font-size: 28rpx;
        color: #fff;
      }
    }

    .submit-btn {
      flex: 1;
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
}
</style>
