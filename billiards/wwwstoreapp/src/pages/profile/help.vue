<template>
  <view class="page">
    <StateView :loading="loading" :error="hasError" empty-msg="暂无帮助文档" error-msg="加载失败" @retry="loadArticles">
      <scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false">
        <view class="article-list" v-if="articles.length > 0">
          <view class="article-card" v-for="item in articles" :key="item.id" @click="goDetail(item)">
            <text class="article-title">{{ item.title || '帮助文档' }}</text>
            <view class="article-foot">
              <text class="article-category" v-if="item.category">{{ item.category }}</text>
              <text class="article-arrow">查看详情 ›</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import StateView from '@/components/StateView.vue'

const articles = ref<any[]>([])
const loading = ref(true)
const hasError = ref(false)
const HELP_API = 'https://poolapi.kyyp.cn/api/help.php'

onMounted(() => { loadArticles() })

async function loadArticles() {
  loading.value = true; hasError.value = false
  try {
    const resp = await uni.request({ url: `${HELP_API}?type=articles`, method: 'GET' })
    const body = resp.data as any
    const list = body?.data?.list || body?.list || []
    articles.value = Array.isArray(list) ? list : []
  } catch { hasError.value = true
  } finally { loading.value = false }
}

function goDetail(item: any) {
  uni.navigateTo({ url: `/pages/profile/help-detail?id=${item.id}` })
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; max-width: 100vw; overflow-x: hidden; box-sizing: border-box; background: #f7f7f7; }
.content-scroll { padding: 16rpx 24rpx 80rpx; width: auto; }
.article-list { display: flex; flex-direction: column; gap: 12rpx; }
.article-card { background: #ffffff; border-radius: 12rpx; padding: 28rpx 24rpx; border: 1rpx solid #e5e5e5; }
.article-title { font-size: 30rpx; font-weight: 600; color: #333333; display: block; margin-bottom: 14rpx; }
.article-foot { display: flex; justify-content: space-between; align-items: center; }
.article-category { font-size: 22rpx; color: #07C160; background: rgba(7, 193, 96, 0.1); padding: 2rpx 12rpx; border-radius: 8rpx; }
.article-arrow { font-size: 24rpx; color: #07C160; }
</style>
