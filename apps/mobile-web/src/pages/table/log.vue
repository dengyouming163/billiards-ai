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
  background: #fafafa;
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
    color: #09090b;
  }
}

.log-list {
  background: #fff;
  border-radius: 24rpx;
  box-shadow: 0 1px 3px rgba(0,0,0,.06);
}

.log-item {
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f4f4f5;
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  align-items: center;
}

.log-action {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 6rpx;
  background: #dbeafe;
  color: #1e40af;

  &.create {
    background: #d1fae5;
    color: #065f46;
  }

  &.checkout {
    background: #ede9fe;
    color: #5b21b6;
  }

  &.transfer_to {
    background: #d1fae5;
    color: #065f46;
  }

  &.merge_to {
    background: #e0f2fe;
    color: #0369a1;
  }

  &.transfer_from, &.merge_from {
    background: #fef3c7;
    color: #92400e;
  }
}

.log-time {
  font-size: 22rpx;
  color: #71717a;
  flex: 1;
  text-align: right;
}

.log-operator {
  font-size: 22rpx;
  color: #374151;
  font-weight: 500;
}

.log-remark {
  font-size: 22rpx;
  color: #a1a1aa;
  width: 100%;
}
</style>
