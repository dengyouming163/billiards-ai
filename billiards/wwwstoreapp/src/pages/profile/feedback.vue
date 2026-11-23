<template>
  <view class="page">
    <view class="form-container">
      <view class="section-card">
        <text class="section-title">提交工单</text>

        <view class="form-item">
          <text class="form-label">工单类型</text>
          <view class="type-options">
            <view class="type-option" :class="{ active: form.type === 'bug' }" @click="form.type = 'bug'">
              <text>🐛 问题反馈</text>
            </view>
            <view class="type-option" :class="{ active: form.type === 'feature' }" @click="form.type = 'feature'">
              <text>✨ 功能需求</text>
            </view>
            <view class="type-option" :class="{ active: form.type === 'question' }" @click="form.type = 'question'">
              <text>💬 使用咨询</text>
            </view>
            <view class="type-option" :class="{ active: form.type === 'other' }" @click="form.type = 'other'">
              <text>📋 其他</text>
            </view>
          </view>
        </view>

        <view class="form-item">
          <text class="form-label">工单标题</text>
          <input v-model="form.title" class="form-input" placeholder="请输入工单标题" maxlength="50" />
        </view>

        <view class="form-item">
          <text class="form-label">详细描述</text>
          <textarea v-model="form.content" class="form-textarea" placeholder="请详细描述您的问题或建议..." maxlength="1000" auto-height />
          <text class="form-tip">{{ (form.content || '').length }}/1000</text>
        </view>
      </view>

      <view class="submit-area">
        <button class="submit-btn" :class="{ disabled: !canSubmit || submitting }" :disabled="!canSubmit || submitting" @click="handleSubmit">
          <text>{{ submitting ? '提交中...' : '提交工单' }}</text>
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { post } from '@/api/request'

const form = reactive({ type: '', title: '', content: '' })
const submitting = ref(false)

const canSubmit = computed(() => form.type && form.title.trim() && form.content.trim())

async function handleSubmit() {
  if (!canSubmit.value || submitting.value) return
  submitting.value = true
  try {
    await post('/support.Support/submitTicket', {
      type: form.type,
      title: form.title.trim(),
      content: form.content.trim(),
    })
    uni.showToast({ title: '工单提交成功', icon: 'success' })
    setTimeout(() => { uni.navigateBack() }, 1500)
  } catch {
    uni.showToast({ title: '提交失败，请稍后重试', icon: 'none' })
  } finally { submitting.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f5f5f5; }
.form-container { padding: 24rpx; }
.section-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1a1a1a; display: block; margin-bottom: 20rpx; }
.form-item { margin-bottom: 20rpx; }
.form-label { font-size: 26rpx; color: #6b7280; display: block; margin-bottom: 12rpx; }
.type-options { display: flex; flex-wrap: wrap; gap: 12rpx; }
.type-option { padding: 12rpx 24rpx; background: #f3f4f6; border-radius: 12rpx; font-size: 26rpx; color: #6b7280; border: 2rpx solid transparent; transition: all .15s; }
.type-option.active { background: rgba(5,150,105,.08); color: #059669; border-color: #059669; }
.form-input { width: 100%; height: 80rpx; padding: 0 20rpx; background: #f9fafb; border-radius: 12rpx; font-size: 28rpx; color: #1a1a1a; box-sizing: border-box; }
.form-textarea { width: 100%; min-height: 200rpx; padding: 20rpx; background: #f9fafb; border-radius: 12rpx; font-size: 28rpx; color: #1a1a1a; box-sizing: border-box; }
.form-tip { font-size: 22rpx; color: #9ca3af; text-align: right; display: block; margin-top: 8rpx; }
.submit-area { margin-top: 32rpx; }
.submit-btn { width: 100%; height: 88rpx; background: linear-gradient(135deg, #059669, #047857); color: #fff; font-size: 30rpx; font-weight: 600; border-radius: 44rpx; border: none; display: flex; align-items: center; justify-content: center; }
.submit-btn.disabled { background: #e5e5e5; color: #999; }
</style>
