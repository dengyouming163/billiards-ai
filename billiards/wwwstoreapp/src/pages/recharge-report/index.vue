<template>
  <view class="page">
    <view class="page-content">
      <view class="date-bar">
        <view v-for="d in dateOptions" :key="d.key" class="date-chip"
          :class="{ active: range === d.key }" @click="switchRange(d.key)">{{ d.label }}</view>
      </view>

      <view class="summary-card">
        <view class="sum-item"><text class="sum-num">¥{{ formatNum(data.summary.total_amount) }}</text><text class="sum-lbl">充值总额</text></view>
        <view class="sum-item"><text class="sum-num">{{ data.summary.total_count }}</text><text class="sum-lbl">笔数</text></view>
      </view>

      <StateView :loading="loading" :empty="data.list.length === 0 && !loading" :error="hasError" empty-msg="暂无充值记录" error-msg="加载失败" @retry="loadData">
        <view class="day-list">
          <view v-for="d in data.list" :key="d.recharge_date" class="day-card" @click="toggleExpand(d.recharge_date)">
            <view class="day-header">
              <view class="day-left">
                <text class="day-date">{{ formatDate(d.recharge_date) }}</text>
                <text class="day-weekday">{{ weekday(d.recharge_date) }}</text>
              </view>
              <view class="day-right">
                <text class="day-amount">¥{{ formatNum(d.total_amount) }}</text>
                <text class="day-meta">{{ d.recharge_count }}笔 · {{ d.operator_count }}人</text>
              </view>
            </view>

            <view v-if="expandedDate === d.recharge_date" class="day-detail">
              <StateView :loading="detailLoading" :empty="details.length === 0 && !detailLoading" empty-msg="暂无明细">
                <view v-for="r in details" :key="r.id" class="detail-row">
                  <view class="detail-left">
                    <text class="detail-member">{{ r.member_name }}</text>
                    <text class="detail-op">操作：{{ r.operator_name || '-' }}</text>
                  </view>
                  <view class="detail-right">
                    <text class="detail-amount">¥{{ Number(r.amount || 0).toFixed(2) }}</text>
                    <view class="detail-meta-row">
                      <text class="detail-method">{{ payMethod(r.payment_method) }}</text>
                      <text class="detail-time">{{ r.created_at?.substring(11, 16) }}</text>
                    </view>
                  </view>
                </view>
              </StateView>
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
import { getEmployeeRecharge, getRechargeRecords } from '@/api/modules/recharge'
import type { EmployeeRechargeData, RechargeRecord } from '@/api/modules/recharge'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'

const dateOptions = [
  { key: 'month', label: '本月' },
  { key: 'lastMonth', label: '上月' },
]
const range = ref('month')
const data = ref<EmployeeRechargeData>({ summary: { total_amount: 0, total_count: 0 }, list: [] })
const loading = ref(false)
const hasError = ref(false)
const expandedDate = ref('')
const details = ref<RechargeRecord[]>([])
const detailLoading = ref(false)

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function formatNum(n: number) { return n.toLocaleString('zh-CN', { minimumFractionDigits: 2 }) }
function formatDate(d: string) { const p = d.split('-'); return `${Number(p[1])}月${Number(p[2])}日` }
function weekday(d: string) { return WEEKDAYS[new Date(d).getDay()] }
function payMethod(m: string) {
  const map: Record<string, string> = { cash: '现金', wechat: '微信', alipay: '支付宝', balance: '余额', adjustment: '余额调整' }
  return map[m] || m
}

function getDateRange(): { start: string; end: string } {
  const now = new Date()
  if (range.value === 'lastMonth') {
    const y = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    const m = now.getMonth() === 0 ? 12 : now.getMonth()
    return { start: `${y}-${String(m).padStart(2,'0')}-01`, end: `${y}-${String(m).padStart(2,'0')}-${new Date(y,m,0).getDate()}` }
  }
  return { start: `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-01`, end: now.toISOString().substring(0,10) }
}

function switchRange(key: string) { range.value = key; expandedDate.value = ''; loadData() }

async function toggleExpand(date: string) {
  if (expandedDate.value === date) { expandedDate.value = ''; return }
  expandedDate.value = date
  detailLoading.value = true
  try {
    const result = await getRechargeRecords({ pageSize: 100 })
    details.value = (result.lists || []).filter(r => r.created_at?.startsWith(date))
  } catch { details.value = [] }
  finally { detailLoading.value = false }
}

async function loadData() {
  loading.value = true; hasError.value = false
  try {
    const { start, end } = getDateRange()
    data.value = await getEmployeeRecharge(start, end)
  } catch { hasError.value = true }
  finally { loading.value = false }
}

onMounted(() => loadData())
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f7f7f7; }
.page-content { padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx); }
.date-bar { display: flex; gap: 14rpx; margin-bottom: 20rpx; }
.date-chip { padding: 14rpx 28rpx; background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 999rpx; font-size: 24rpx; font-weight: 600; color: #999999; }
.date-chip.active { background: #07C160; border-color: #07C160; color: #ffffff; }
.summary-card { display: flex; justify-content: space-around; background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 24rpx; padding: 28rpx; margin-bottom: 20rpx; }
.sum-item { text-align: center; }
.sum-num { font-size: 40rpx; font-weight: 800; color: #333333; display: block; }
.sum-lbl { font-size: 22rpx; color: #999999; }

.day-list { display: flex; flex-direction: column; gap: 16rpx; }
.day-card { background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 20rpx; padding: 24rpx; }
.day-header { display: flex; justify-content: space-between; align-items: center; }
.day-date { font-size: 30rpx; font-weight: 700; color: #333333; }
.day-weekday { font-size: 22rpx; color: #999999; margin-left: 12rpx; }
.day-right { text-align: right; }
.day-amount { font-size: 30rpx; font-weight: 800; color: #07C160; display: block; }
.day-meta { font-size: 22rpx; color: #999999; }

.day-detail { margin-top: 20rpx; padding-top: 20rpx; border-top: 1rpx solid #e5e5e5; }
.detail-row { display: flex; justify-content: space-between; align-items: center; padding: 14rpx 0; border-bottom: 1rpx solid #e5e5e5; }
.detail-row:last-child { border-bottom: none; }
.detail-left { flex: 1; }
.detail-member { font-size: 26rpx; color: #333333; display: block; }
.detail-op { font-size: 22rpx; color: #999999; }
.detail-right { text-align: right; }
.detail-amount { font-size: 28rpx; font-weight: 700; color: #07C160; display: block; }
.detail-meta-row { display: flex; gap: 12rpx; justify-content: flex-end; }
.detail-method { font-size: 22rpx; color: #999999; }
.detail-time { font-size: 22rpx; color: #999999; }
</style>
