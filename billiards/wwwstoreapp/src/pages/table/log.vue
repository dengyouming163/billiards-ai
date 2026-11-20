<template>
  <view class="log-page">
    <view class="log-header">
      <text class="log-title">操作日志</text>
    </view>
    <StateView :loading="loading" :empty="list.length === 0 && !loading" :error="hasError" empty-msg="暂无操作日志" error-msg="加载失败" @retry="loadData">
      <scroll-view class="content-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
        <view class="log-list">
          <view v-for="item in list" :key="item.id" class="log-item">
            <text class="log-action" :class="item.action">{{ actionLabel(item.action) }}</text>
            <text class="log-time">{{ item.operated_at }}</text>
            <text class="log-operator">{{ item.operator_name }}</text>
            <text class="log-remark" v-if="item.remark">{{ item.remark }}</text>
          </view>
        </view>
      </scroll-view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getTableLog } from '@/api/modules/table'
import StateView from '@/components/StateView.vue'

const list = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)

function actionLabel(a: string): string {
  const map: Record<string, string> = {
    create: '开台',
    checkout: '结账',
    transfer_from: '换出',
    transfer_to: '换入',
    merge_from: '并出',
    merge_to: '并入',
  }
  return map[a] || a
}

onMounted(() => {
  loadData()
})

function onRefresh() {
  refreshing.value = true
  loadData()
}

async function loadData() {
  const pages = getCurrentPages()
  const page = pages[pages.length - 1] as any
  const tableId = page?.options?.table_id || ''
  const orderId = page?.options?.order_id || ''
  loading.value = true
  hasError.value = false
  try {
    const res = await getTableLog({ table_id: tableId, order_id: orderId })
    list.value = res.data || []
  } catch (e) {
    console.error('加载操作日志失败', e)
    hasError.value = true
  } finally {
    loading.value = false
    refreshing.value = false
  }
}
</script>

<style lang="scss" scoped>
.log-page {
  min-height: 100vh;
  background: #f7f7f7;
  padding: 24rpx;
  display: flex;
  flex-direction: column;
}

.content-scroll {
  flex: 1;
}

.log-header {
  margin-bottom: 24rpx;

  .log-title {
    font-size: 32rpx;
    font-weight: 700;
    color: #000000;
  }
}

.log-list {
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 16rpx;
}

.log-item {
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #e5e5e5;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;

  &:last-child {
    border-bottom: none;
  }
}

.log-action {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  background: rgba(7, 193, 96, 0.1);
  color: #07C160;

  &.create {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.checkout {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
  }

  &.transfer_to {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.merge_to {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
  }

  &.transfer_from, &.merge_from {
    background: rgba(239, 68, 68, 0.1);
    color: #ef4444;
  }
}

.log-time {
  font-size: 22rpx;
  color: #999999;
  flex: 1;
  text-align: right;
}

.log-operator {
  font-size: 22rpx;
  color: #333333;
  font-weight: 500;
}

.log-remark {
  font-size: 22rpx;
  color: #999999;
  width: 100%;
}
</style>
