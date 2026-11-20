<template>
  <view class="modal-overlay" v-if="visible" @click="handleClose">
    <view class="modal-content" @click.stop>
      <view class="modal-header">
        <text class="modal-title">{{ service?.name }}</text>
        <view class="close-btn" @click="handleClose">✕</view>
      </view>

      <view class="modal-body">
        <view
          class="modal-icon"
          :style="{ background: 'linear-gradient(135deg, ' + service?.color + ', ' + service?.color + '80)' }"
        >
          <text>{{ service?.icon }}</text>
        </view>
        <text class="modal-desc">{{ service?.description }}</text>

        <view class="input-section" v-if="showRemark">
          <text class="input-label">备注信息</text>
          <textarea
            class="input-textarea"
            v-model="remark"
            placeholder="请输入备注信息（选填）..."
          ></textarea>
        </view>
      </view>

      <view class="modal-footer">
        <view class="cancel-btn" @click="handleClose">
          <text>取消</text>
        </view>
        <view class="confirm-btn" @click="handleConfirm">
          <text>确认呼叫</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ServiceItem } from '@/types'

interface Props {
  visible: boolean
  service: ServiceItem | null
  showRemark?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showRemark: false
})

const emit = defineEmits<{
  close: []
  confirm: [remark: string]
}>()

const remark = ref('')

watch(() => props.visible, (newVal) => {
  if (!newVal) {
    remark.value = ''
  }
})

function handleClose() {
  emit('close')
}

function handleConfirm() {
  emit('confirm', remark.value)
}
</script>

<style lang="scss" scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease;
}

.modal-content {
  width: 560rpx;
  background: linear-gradient(135deg, #1a1a2e, #252542);
  border-radius: 24rpx;
  padding: 40rpx;
  text-align: center;
  border: 1rpx solid rgba(201, 169, 98, 0.2);
  animation: slideUp 0.3s ease;

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24rpx;

    .modal-title {
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

  .modal-body {
    .modal-icon {
      width: 120rpx;
      height: 120rpx;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20rpx;
      font-size: 64rpx;
    }

    .modal-desc {
      display: block;
      font-size: 26rpx;
      color: #6b7280;
      margin-bottom: 24rpx;
    }

    .input-section {
      text-align: left;

      .input-label {
        display: block;
        font-size: 26rpx;
        color: #6b7280;
        margin-bottom: 12rpx;
      }

      .input-textarea {
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

  .modal-footer {
    display: flex;
    gap: 20rpx;
    margin-top: 24rpx;

    .cancel-btn {
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

    .confirm-btn {
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(20rpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
</style>
