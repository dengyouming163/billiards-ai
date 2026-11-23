<template>
  <view v-if="visible" class="aom-overlay" @click="$emit('close')">
    <view class="aom-panel" @click.stop>
      <!-- Header -->
      <view class="aom-header">
        <text class="aom-title">加钟 · {{ item?.assistant_name || item?.item_name || '助教' }}</text>
        <text class="aom-close" @click="$emit('close')">✕</text>
      </view>

      <!-- Body -->
      <view class="aom-body">
        <!-- 时长选择 -->
        <view class="aom-section">
          <text class="aom-section-title">选择时长</text>
          <view class="aom-duration-row">
            <view
              v-for="h in [0.5, 1, 2, 3]"
              :key="h"
              class="aom-dur-card"
              :class="{ active: hours === h && !customInput }"
              @click="selectPreset(h)"
            >
              <text class="aom-dur-val">{{ h }}h</text>
              <text class="aom-dur-price">¥{{ ((rate || 0) * h).toFixed(0) }}</text>
            </view>
            <view class="aom-dur-card aom-dur-custom" :class="{ active: !!customInput }">
              <input
                type="digit"
                v-model="customInput"
                placeholder="自定义"
                class="aom-dur-input"
                @input="onCustomInput"
                @focus="onCustomFocus"
              />
            </view>
          </view>
        </view>

        <!-- 价格预览 -->
        <view class="aom-preview">
          <view class="aom-preview-row">
            <text class="aom-preview-label">时长</text>
            <text class="aom-preview-val">{{ hours }}小时</text>
          </view>
          <view class="aom-preview-row">
            <text class="aom-preview-label">单价</text>
            <text class="aom-preview-val">¥{{ rate }}/小时</text>
          </view>
          <view class="aom-preview-divider" />
          <view class="aom-preview-row aom-preview-total">
            <text class="aom-preview-label">应付</text>
            <text class="aom-preview-val">¥{{ total.toFixed(2) }}</text>
          </view>
        </view>
      </view>

      <!-- Footer -->
      <view class="aom-footer">
        <button class="aom-btn-cancel" @click="$emit('close')">取消</button>
        <button class="aom-btn-confirm" :disabled="submitting || hours <= 0" @click="handleSubmit">
          {{ submitting ? '提交中...' : `确认 · ¥${total.toFixed(2)}` }}
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface AssistantItem {
  id: string
  assistant_name?: string
  item_name?: string
  hourly_rate?: number
  unit_price?: number
}

const props = defineProps<{
  visible: boolean
  item: AssistantItem | null
  orderId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'success'): void
}>()

const hours = ref(1)
const customInput = ref('')
const submitting = ref(false)

const rate = computed(() => (props.item?.hourly_rate || props.item?.unit_price || 0) as number)
const total = computed(() => (hours.value || 0) * rate.value)

function selectPreset(h: number) {
  hours.value = h
  customInput.value = ''
}

function onCustomInput(e: any) {
  customInput.value = e.detail?.value || e.target?.value || ''
  const v = parseFloat(customInput.value)
  if (v > 0) hours.value = v
}

function onCustomFocus() {
  // 点击自定义输入框时，清除预设选中态
}

watch(() => props.visible, (v) => {
  if (v) {
    hours.value = 1
    customInput.value = ''
  }
})

async function handleSubmit() {
  const h = hours.value
  if (!h || h <= 0 || h > 24) {
    uni.showToast({ title: '请输入1-24小时', icon: 'none' })
    return
  }
  submitting.value = true
  try {
    const { addGiftHours } = await import('@/api/modules/table')
    await addGiftHours({
      item_id: props.item!.id,
      gift_hours: 0,
      overtime_hours: h,
      hourly_rate: rate.value,
    })
    uni.showToast({ title: `加钟 ${h}h`, icon: 'success' })
    emit('close')
    emit('success')
  } catch (e: any) {
    uni.showToast({ title: e?.msg || e?.message || '加钟失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.aom-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.5); z-index: 500;
  display: flex; align-items: flex-end;
}
.aom-panel {
  width: 100%; background: #fff;
  border-radius: 40rpx 40rpx 0 0; overflow: hidden; padding-bottom: env(safe-area-inset-bottom);
}

// Header
.aom-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 36rpx 36rpx 24rpx;
}
.aom-title { font-size: 36rpx; font-weight: 800; color: #0f172a; }
.aom-close {
  width: 60rpx; height: 60rpx; border-radius: 50%; background: #f1f5f9;
  display: flex; align-items: center; justify-content: center;
  font-size: 28rpx; color: #64748b;
}

// Body
.aom-body { padding: 0 36rpx 32rpx; }

// 分组
.aom-section { margin-bottom: 28rpx; }
.aom-section-title {
  font-size: 28rpx; font-weight: 700; color: #334155; margin-bottom: 18rpx; display: block;
}

// 时长卡片
.aom-duration-row { display: flex; gap: 14rpx; align-items: stretch; }
.aom-dur-card {
  flex: 1; padding: 28rpx 12rpx; border-radius: 22rpx;
  border: 2rpx solid #e5e7eb; background: #fff; text-align: center;
  &.active { border-color: #059669; background: #ecfdf5; }
}
.aom-dur-val { display: block; font-size: 30rpx; font-weight: 800; color: #1e293b; }
.aom-dur-price { display: block; font-size: 22rpx; color: #059669; margin-top: 6rpx; font-weight: 600; }

.aom-dur-custom {
  display: flex; align-items: center; justify-content: center;
  min-width: 140rpx;
}
.aom-dur-input {
  width: 100%; text-align: center; font-size: 28rpx; font-weight: 700; color: #64748b;
  background: transparent; border: none; outline: none;
}

// 价格预览
.aom-preview {
  background: #f8fafc; border-radius: 24rpx; padding: 28rpx 32rpx;
  border: 1rpx solid #e2e8f0;
}
.aom-preview-row { display: flex; justify-content: space-between; align-items: center; padding: 8rpx 0; }
.aom-preview-label { font-size: 26rpx; color: #64748b; }
.aom-preview-val { font-size: 26rpx; font-weight: 600; color: #1e293b; }
.aom-preview-divider { height: 1rpx; background: #e2e8f0; margin: 14rpx 0; }
.aom-preview-total {
  .aom-preview-label { font-size: 30rpx; font-weight: 700; color: #1e293b; }
  .aom-preview-val { font-size: 34rpx; font-weight: 800; color: #059669; }
}

// Footer
.aom-footer { display: flex; gap: 22rpx; padding: 0 36rpx 36rpx; }
.aom-btn-cancel {
  flex: 1; padding: 30rpx; border-radius: 36rpx; background: #f1f5f9;
  color: #64748b; font-size: 30rpx; font-weight: 600; text-align: center; border: none;
}
.aom-btn-confirm {
  flex: 2; padding: 30rpx; border-radius: 36rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; font-size: 30rpx; font-weight: 800; text-align: center; border: none;
  box-shadow: 0 8rpx 24rpx rgba(5,150,105,.25);
  &[disabled] { opacity: .5; box-shadow: none; }
}
</style>
