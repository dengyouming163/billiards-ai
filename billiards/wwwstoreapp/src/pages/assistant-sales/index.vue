<template>
  <view class="page">
    <view class="page-content">
      <view class="date-bar">
        <view v-for="d in dateOptions" :key="d.key" class="date-chip"
          :class="{ active: range === d.key }" @click="switchRange(d.key)">{{ d.label }}</view>
      </view>

      <view class="summary-card">
        <view class="sum-item"><text class="sum-num">¥{{ formatNum(data.summary.total_amount) }}</text><text class="sum-lbl">销售总额</text></view>
        <view class="sum-item"><text class="sum-num">{{ data.summary.assistant_count }}</text><text class="sum-lbl">助教人数</text></view>
      </view>

      <StateView :loading="loading" :empty="data.list.length === 0 && !loading" :error="hasError" empty-msg="暂无销售数据" error-msg="加载失败" @retry="loadData">
        <view class="a-list">
          <view v-for="a in data.list" :key="a.assistant_id" class="a-card"
            @click="toggleExpand(a.assistant_id)">
            <view class="a-header">
              <view class="a-avatar">{{ a.employee_name[0] }}</view>
              <view class="a-info">
                <text class="a-name">{{ a.employee_name }}</text>
                <text class="a-role">{{ roleMap[a.role] || a.role }}</text>
              </view>
              <view class="a-right">
                <text class="a-amount">¥{{ formatNum(a.total_amount) }}</text>
                <text class="a-count">{{ a.product_count }}件</text>
              </view>
            </view>

            <view v-if="expandedId === a.assistant_id" class="a-detail">
              <view v-for="(p, idx) in a.products" :key="idx" class="prod-row">
                <view class="prod-left">
                  <text class="prod-name">{{ p.product_name }}</text>
                  <text class="prod-qty">×{{ p.quantity }}  ¥{{ p.unit_price }}/件</text>
                </view>
                <view class="prod-right">
                  <text class="prod-total">¥{{ formatNum(p.split_amount) }}</text>
                  <text v-if="p.split_label" class="prod-split">{{ p.split_label }}</text>
                </view>
              </view>
            </view>
          </view>
        </view>
      </StateView>
    </view>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getAssistantProductSales } from '@/api/modules/recharge'
import type { AssistantSalesData } from '@/api/modules/recharge'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'

const dateOptions = [
  { key: 'month', label: '本月' },
  { key: 'lastMonth', label: '上月' },
]
const range = ref('month')
const data = ref<AssistantSalesData>({ summary: { total_amount: 0, assistant_count: 0 }, list: [] })
const loading = ref(false)
const hasError = ref(false)
const expandedId = ref('')

const roleMap: Record<string, string> = { boss:'老板',manager:'经理',assistant:'助教',employee:'员工',finance:'财务',cashier:'收银员',coach:'教练',waiter:'服务员',owner:'老板',admin:'管理员' }

function formatNum(n: number) { return n.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }

function getDateRange(): { start: string; end: string } {
  const now = new Date()
  if (range.value === 'lastMonth') {
    const y = now.getMonth()===0 ? now.getFullYear()-1 : now.getFullYear()
    const m = now.getMonth()===0 ? 12 : now.getMonth()
    return { start: `${y}-${String(m).padStart(2,'0')}-01`, end: `${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}` }
  }
  return { start: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, end: now.toISOString().substring(0,10) }
}

function switchRange(key: string) { range.value = key; loadData() }
function toggleExpand(id: string) { expandedId.value = expandedId.value === id ? '' : id }

async function loadData() {
  loading.value = true; hasError.value = false
  try {
    const { start, end } = getDateRange()
    data.value = await getAssistantProductSales(start, end)
  } catch { hasError.value = true }
  finally { loading.value = false }
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f7f7f7; }
.page-content { padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx); }
.date-bar { display: flex; gap: 14rpx; margin-bottom: 20rpx; }
.date-chip { padding: 14rpx 28rpx; background: #e5e5e5; border-radius: 999rpx; font-size: 24rpx; font-weight: 600; color: #666666; }
.date-chip.active { background: #07C160; color: #ffffff; }
.summary-card { display: flex; justify-content: space-around; background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx; }
.sum-item { text-align: center; }
.sum-num { font-size: 40rpx; font-weight: 800; color: #333333; display: block; }
.sum-lbl { font-size: 22rpx; color: #999999; }
.a-list { display: flex; flex-direction: column; gap: 16rpx; }
.a-card { background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 20rpx; padding: 24rpx; }
.a-header { display: flex; align-items: center; gap: 16rpx; }
.a-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #07C160; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32rpx; font-weight: 700; flex-shrink: 0; }
.a-info { flex: 1; }
.a-name { font-size: 30rpx; font-weight: 700; color: #333333; display: block; }
.a-role { font-size: 24rpx; color: #999999; }
.a-right { text-align: right; }
.a-amount { font-size: 30rpx; font-weight: 800; color: #07C160; display: block; }
.a-count { font-size: 22rpx; color: #999999; }
.a-detail { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #e5e5e5; }
.prod-row { display: flex; justify-content: space-between; align-items: center; padding: 12rpx 0; }
.prod-name { font-size: 26rpx; color: #333333; display: block; }
.prod-qty { font-size: 22rpx; color: #999999; }
.prod-right { text-align: right; }
.prod-total { font-size: 28rpx; font-weight: 700; color: #07C160; display: block; }
.prod-split { font-size: 20rpx; color: #07C160; background: rgba(7, 193, 96, 0.1); padding: 2rpx 10rpx; border-radius: 8rpx; margin-top: 4rpx; display: inline-block; }
</style>
