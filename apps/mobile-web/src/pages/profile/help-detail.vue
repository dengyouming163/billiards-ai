<template>
  <view class="page">
    <StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadDetail">
      <view class="content-card" v-if="!loading">
        <text class="detail-title">{{ detail.title || '帮助详情' }}</text>
        <text class="detail-category" v-if="detail.category">{{ detail.category }}</text>
        <view class="detail-body">
          <text class="detail-text">{{ detail.content || '' }}</text>
        </view>
      </view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import StateView from '@/components/StateView.vue'

const detail = ref<any>({})
const loading = ref(true)
const hasError = ref(false)
const HELP_API = 'https://api.tpzl88.com/api/help.php'

onMounted(() => {
  const pages = getCurrentPages()
  const opts = (pages[pages.length - 1] as any)?.$page?.options || {}
  loadDetail(opts.id)
})

async function loadDetail(id: string) {
  if (!id) return
  loading.value = true; hasError.value = false
  try {
    const resp = await uni.request({ url: `${HELP_API}?type=article&id=${id}`, method: 'GET' })
    const body = resp.data as any
    detail.value = body?.data || {}
  } catch { hasError.value = true
  } finally { loading.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f5f5f5; padding: 24rpx; }
.content-card { background: #fff; border-radius: 20rpx; padding: 32rpx 28rpx; }
.detail-title { font-size: 36rpx; font-weight: 700; color: #1a1a1a; display: block; margin-bottom: 12rpx; }
.detail-category { font-size: 24rpx; color: #059669; background: #ecfdf5; padding: 4rpx 14rpx; border-radius: 8rpx; display: inline-block; margin-bottom: 24rpx; }
.detail-body { padding-top: 20rpx; border-top: 1rpx solid #f0f0f0; }
.detail-text { font-size: 28rpx; color: #374151; line-height: 1.8; white-space: pre-wrap; }
</style>
