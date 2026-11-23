<template>
  <view class="page">
    <view class="header">
      <text class="title">{{ channelLabel }} 充值明细</text>
      <text class="sub">{{ startDate }} ~ {{ endDate }}</text>
    </view>
    <view class="summary-card">
      <text class="sum-label">合计</text>
      <text class="sum-value">¥{{ totalAmount.toFixed(2) }}</text>
      <text class="sum-count">{{ list.length }} 笔</text>
    </view>
    <view class="list">
      <view v-for="item in list" :key="item.id" class="item">
        <view class="item-left">
          <text class="item-order">{{ item.description || '充值' }}</text>
          <text class="item-desc">会员: {{ item.member_id || '-' }}</text>
        </view>
        <view class="item-right">
          <text class="item-amount">¥{{ Number(item.amount || 0).toFixed(2) }}</text>
          <text class="item-time">{{ formatTime(item.paid_at) }}</text>
        </view>
      </view>
      <view v-if="list.length === 0" class="empty">暂无记录</view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '@/api/request'

const channel = ref('')
const channelLabel = ref('')
const startDate = ref('')
const endDate = ref('')
const list = ref<any[]>([])
const totalAmount = ref(0)

function formatTime(t: string) { if (!t) return ''; return t.replace('T', ' ').substring(0, 16) }

onLoad((opts: any) => {
  channel.value = opts.channel || 'cash'
  channelLabel.value = decodeURIComponent(opts.label || opts.channel || '')
  startDate.value = opts.start || ''
  endDate.value = opts.end || ''
  get(`/report.Report/rechargeReportDetail?channel=${channel.value}&start_date=${startDate.value}&end_date=${endDate.value}`)
    .then((data: any) => { list.value = data || []; totalAmount.value = (data||[]).reduce((s:number,i:any)=>s+Number(i.amount||0),0) })
    .catch(() => { list.value = [] })
})
</script>

<style lang="scss" scoped>
.page { padding: 24rpx; min-height: 100vh; background: #f8fafc; }
.header { padding: 32rpx 24rpx; background: linear-gradient(135deg, #059669, #10b981); border-radius: 24rpx; margin-bottom: 20rpx; }
.title { font-size: 36rpx; font-weight: 800; color: #fff; display: block; }
.sub { font-size: 24rpx; color: #94a3b8; margin-top: 8rpx; display: block; }
.summary-card { background: #fff; border-radius: 20rpx; padding: 28rpx; margin-bottom: 20rpx; display: flex; justify-content: space-between; align-items: center; }
.sum-label { font-size: 26rpx; color: #64748b; }
.sum-value { font-size: 40rpx; font-weight: 800; color: #059669; }
.sum-count { font-size: 24rpx; color: #94a3b8; }
.list { background: #fff; border-radius: 20rpx; overflow: hidden; }
.item { display: flex; justify-content: space-between; align-items: center; padding: 24rpx; border-bottom: 1rpx solid #f1f5f9; }
.item:last-child { border-bottom: none; }
.item-left { flex: 1; }
.item-order { font-size: 26rpx; color: #1e293b; font-weight: 600; display: block; }
.item-desc { font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; display: block; }
.item-right { text-align: right; }
.item-amount { font-size: 28rpx; font-weight: 700; color: #1e293b; display: block; }
.item-time { font-size: 22rpx; color: #94a3b8; margin-top: 4rpx; display: block; }
.empty { text-align: center; padding: 80rpx 0; color: #94a3b8; font-size: 28rpx; }
</style>
