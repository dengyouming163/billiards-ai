<template>
  <view class="owner-home page-content">
    <view class="page-header">
      <view class="header-left">
        <view class="header-icon-wrap">
          <text class="header-icon">📊</text>
        </view>
        <view class="header-info">
          <text class="header-label">门店总览</text>
          <text class="header-title">经营数据一目了然</text>
        </view>
      </view>
      <view class="header-right">
        <text class="header-date">{{ currentDate }}</text>
      </view>
    </view>

    <view class="date-picker-bar">
      <view class="quick-dates">
        <view v-for="d in dateOptions" :key="d.key" class="date-chip" :class="{ active: dateType === d.key }" @click="switchDate(d.key)">
          <text>{{ d.label }}</text>
        </view>
        <view class="date-chip" :class="{ active: dateType === 'custom' }" @click="openCustomDate">
          <text>自定义</text>
        </view>
      </view>
      <view v-if="showCustomDate" class="custom-range">
        <picker mode="date" :value="customStart" :end="todayStr()" @change="onStartChange" class="date-picker">
          <view class="date-pick-box">{{ customStart || '开始日期' }}</view>
        </picker>
        <text class="date-sep">至</text>
        <picker mode="date" :value="customEnd" :end="todayStr()" @change="onEndChange" class="date-picker">
          <view class="date-pick-box">{{ customEnd || '结束日期' }}</view>
        </picker>
      </view>
    </view>

    <StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadAll">
      <view class="revenue-section">
        <view class="section-header">
          <text class="section-title">收入总览</text>
        </view>
        <view class="revenue-card">
          <view class="revenue-main">
            <text class="revenue-total">¥{{ fmt(revenue.total_revenue) }}</text>
          </view>
          <view class="revenue-grid">
            <view class="revenue-item" @click="goItemDetail('table', '台费')">
              <text class="ri-icon">🎱</text>
              <text class="ri-val">¥{{ fmt(revenue.table_revenue) }}</text>
              <text class="ri-lbl">台费</text>
            </view>
            <view class="revenue-item" @click="goItemDetail('product', '商品')">
              <text class="ri-icon">🛒</text>
              <text class="ri-val">¥{{ fmt(revenue.product_revenue) }}</text>
              <text class="ri-lbl">商品</text>
            </view>
            <view class="revenue-item" @click="goItemDetail('assistant', '助教')">
              <text class="ri-icon">👤</text>
              <text class="ri-val">¥{{ fmt(revenue.assistant_revenue) }}</text>
              <text class="ri-lbl">助教</text>
            </view>
            <view class="revenue-item" @click="goItemDetail('charging', '充电')">
              <text class="ri-icon">🔋</text>
              <text class="ri-val">¥{{ fmt(revenue.charging_revenue) }}</text>
              <text class="ri-lbl">充电</text>
            </view>
          </view>
        </view>
      </view>

      <view class="metrics-section">
        <view class="section-header">
          <text class="section-title">核心指标</text>
        </view>
        <view class="metrics-grid">
          <view class="metric-card">
            <text class="metric-val">{{ operation.order_count || 0 }}</text>
            <text class="metric-lbl">订单数</text>
          </view>
          <view class="metric-card highlight">
            <text class="metric-val">{{ operation.occupancy_rate || 0 }}%</text>
            <text class="metric-lbl">开台率</text>
          </view>
          <view class="metric-card">
            <text class="metric-val">{{ operation.turnover_rate || 0 }}</text>
            <text class="metric-lbl">翻台率</text>
          </view>
          <view class="metric-card">
            <text class="metric-val">¥{{ operation.avg_customer_spend || 0 }}</text>
            <text class="metric-lbl">客单价</text>
          </view>
          <view class="metric-card">
            <text class="metric-val">¥{{ operation.avg_order_amount || 0 }}</text>
            <text class="metric-lbl">均单金额</text>
          </view>
          <view class="metric-card">
            <text class="metric-val">{{ operation.product_sales_count || 0 }}</text>
            <text class="metric-lbl">商品销量</text>
          </view>
        </view>
      </view>

      <view class="channel-section">
        <view class="section-header">
          <text class="section-title">收入渠道</text>
        </view>
        <view class="channel-grid">
          <view v-for="ch in defaultChannels" :key="ch.channel" class="channel-item" @click="goChannelDetail(ch.channel, ch.label)">
            <text class="channel-icon">{{ getChannelIcon(ch.channel) }}</text>
            <text class="channel-amount">¥{{ fmt(ch.revenue) }}</text>
            <text class="channel-name">{{ ch.label }}</text>
          </view>
        </view>
      </view>

      <view class="recharge-section">
        <view class="section-header">
          <text class="section-title">充值报表</text>
        </view>
        <view class="recharge-grid">
          <view class="recharge-item" @click="goRechargeDetail('cash', '现金充值')">
            <text class="recharge-icon">💵</text>
            <text class="recharge-val">¥{{ fmt(rechargeCash) }}</text>
            <text class="recharge-lbl">现金充值</text>
          </view>
          <view class="recharge-item" @click="goRechargeDetail('wechat', '微信充值')">
            <text class="recharge-icon">💬</text>
            <text class="recharge-val">¥{{ fmt(rechargeWechat) }}</text>
            <text class="recharge-lbl">微信充值</text>
          </view>
          <view class="recharge-item" @click="goRechargeDetail('balance', '余额调整')">
            <text class="recharge-icon">📊</text>
            <text class="recharge-val">¥{{ fmt(rechargeAdjust) }}</text>
            <text class="recharge-lbl">余额调整</text>
          </view>
          <view class="recharge-item">
            <text class="recharge-icon">✏️</text>
            <text class="recharge-val">{{ rechargeCount }}</text>
            <text class="recharge-lbl">充值笔数</text>
          </view>
        </view>
      </view>

      <view class="product-section" v-if="products.length > 0">
        <view class="section-header">
          <text class="section-title">热销商品</text>
        </view>
        <view class="product-list">
          <view v-for="p in products" :key="p.rank" class="product-item">
            <view class="pi-rank" :class="'rank-'+p.rank">{{ p.rank }}</view>
            <view class="pi-info">
              <text class="pi-name">{{ p.name }}</text>
              <text class="pi-qty">售出 {{ p.quantity }} 件</text>
            </view>
            <text class="pi-revenue">¥{{ p.revenue }}</text>
          </view>
        </view>
      </view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getRevenueSummary, getOperationOverview, getProductRank,
  getRevenueByChannel, getRevenueByItemType, getRechargeReport,
} from '@/api/modules/dashboard'
import type {
  ReportRevenue, ReportOperation, ReportProduct,
  ChannelRevenue, ItemTypeRevenue, RechargeItem,
} from '@/api/modules/dashboard'
import StateView from '@/components/StateView.vue'

const todayStr = () => { const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0') }
const dateType = ref('today')
const customStart = ref(todayStr())
const customEnd = ref(todayStr())
const showCustomDate = ref(false)
const loading = ref(false)
const hasError = ref(false)
const currentDate = computed(() => {
  const d = new Date()
  return `${d.getMonth() + 1}月${d.getDate()}日`
})

const revenue = ref<ReportRevenue>({ table_revenue:0,assistant_revenue:0,product_revenue:0,charging_revenue:0,package_revenue:0,total_revenue:0,order_count:0,last_period_revenue:0,revenue_change:0 })
const operation = ref<ReportOperation>({ order_count:0,total_duration_minutes:0,avg_order_amount:0,avg_customer_spend:0,avg_duration_minutes:0,total_customers:0,total_tables:0,occupied_tables:0,occupancy_rate:0,turnover_rate:0,table_utilization:0,product_sales_count:0,table_duration_minutes:0,assistant_duration_minutes:0,outwork_duration_minutes:0 })
const products = ref<ReportProduct[]>([])
const channels = ref<ChannelRevenue[]>([])
const itemTypes = ref<ItemTypeRevenue[]>([])
const rechargeCash = ref(0)
const rechargeWechat = ref(0)
const rechargeAdjust = ref(0)
const rechargeTotal = ref(0)
const rechargeCount = ref(0)

const defaultChannels = computed(() => {
  const map: Record<string, { channel: string; label: string; revenue: number }> = {
    cash: { channel: 'cash', label: '现金', revenue: 0 },
    wechat: { channel: 'wechat', label: '微信', revenue: 0 },
    member_balance: { channel: 'member_balance', label: '会员卡', revenue: 0 },
    coupon_meituan: { channel: 'coupon_meituan', label: '美团', revenue: 0 },
    coupon_douyin: { channel: 'coupon_douyin', label: '抖音', revenue: 0 },
  }
  channels.value.forEach((ch: any) => { if (map[ch.channel]) map[ch.channel].revenue = Number(ch.revenue || 0) })
  return Object.values(map)
})

const defaultItemTypes = computed(() => {
  const map: Record<string, { item_type: string; label: string; revenue: number }> = {
    table: { item_type: 'table', label: '台费', revenue: 0 },
    product: { item_type: 'product', label: '商品', revenue: 0 },
    assistant: { item_type: 'assistant', label: '助教', revenue: 0 },
    charging: { item_type: 'charging', label: '充电', revenue: 0 },
  }
  itemTypes.value.forEach((it: any) => { if (map[it.item_type]) map[it.item_type].revenue = Number(it.revenue || 0) })
  return Object.values(map)
})

const dateOptions = [
  { key: 'today', label: '今日' },
  { key: 'yesterday', label: '昨日' },
  { key: 'week', label: '近7天' },
  { key: 'month', label: '本月' },
]

function fmt(n: number | undefined): string { return (n || 0).toFixed(2) }

function getChannelIcon(channel: string): string {
  const icons: Record<string, string> = {
    cash: '💵', wechat: '💬', member_balance: '💳',
    coupon_meituan: '🥡', coupon_douyin: '🎵'
  }
  return icons[channel] || '📊'
}

function getItemIcon(itemType: string): string {
  const icons: Record<string, string> = {
    table: '🎱', product: '🛒', assistant: '👤', charging: '🔋'
  }
  return icons[itemType] || '📦'
}

function getDateRange(): { start: string; end: string } {
  const now = new Date()
  const fd = (d: Date) => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')
  switch (dateType.value) {
    case 'today': return { start: fd(now), end: fd(now) }
    case 'yesterday': { const y=new Date(now); y.setDate(y.getDate()-1); return { start: fd(y), end: fd(y) } }
    case 'week': { const w=new Date(now); w.setDate(w.getDate()-6); return { start: fd(w), end: fd(now) } }
    case 'month': return { start: now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-01', end: fd(new Date(now.getFullYear(),now.getMonth()+1,0)) }
    case 'custom': return { start: customStart.value, end: customEnd.value }
    default: return { start: fd(now), end: fd(now) }
  }
}

function switchDate(key: string) { dateType.value = key; showCustomDate.value = false; loadAll() }

function goChannelDetail(channel: string, label: string) {
  const { start, end } = getDateRange()
  uni.navigateTo({
    url: `/pages/reports/channel-detail?channel=${channel}&label=${encodeURIComponent(label || channel)}&start=${start}&end=${end}`
  })
}

function goItemDetail(itemType: string, label: string) {
  const { start, end } = getDateRange()
  uni.navigateTo({
    url: `/pages/reports/item-detail?item_type=${itemType}&label=${encodeURIComponent(label || itemType)}&start=${start}&end=${end}`
  })
}

function goRechargeDetail(channel: string, label: string) {
  const { start, end } = getDateRange()
  uni.navigateTo({
    url: `/pages/reports/recharge-detail?channel=${channel}&label=${encodeURIComponent(label || channel)}&start=${start}&end=${end}`
  })
}
function openCustomDate() { dateType.value = 'custom'; showCustomDate.value = true }
function onStartChange(e: any) { customStart.value = e.detail.value; dateType.value = 'custom'; if (customEnd.value) loadAll() }
function onEndChange(e: any) { customEnd.value = e.detail.value; dateType.value = 'custom'; if (customStart.value) loadAll() }

function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0h'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h${m}m` : `${m}m`
}

async function loadAll() {
  loading.value = true; hasError.value = false
  const { start, end } = getDateRange()
  const params = { start_date: start, end_date: end }
  try {
    const [r, o, p, ch, it, rc] = await Promise.all([
      getRevenueSummary(params),
      getOperationOverview(params),
      getProductRank({ ...params, limit: 8 }),
      getRevenueByChannel(params),
      getRevenueByItemType(params),
      getRechargeReport(params),
    ])
    revenue.value = r; operation.value = o; products.value = p
    const channelLabelMap: Record<string,string> = { cash:'现金', wechat:'微信', meituan:'美团', douyin:'抖音', coupon:'团券', member_balance:'会员卡', member:'会员卡' }
    channels.value = (ch || []).map((c: any) => ({ ...c, channel_label: channelLabelMap[c.channel] || c.channel }))
    const itemLabelMap: Record<string,string> = { table:'台费', product:'商品', assistant:'助教', charging:'充电', merge_fee:'并入台费' }
    itemTypes.value = (it || []).map((i: any) => ({ ...i, item_label: itemLabelMap[i.item_type] || i.item_type }))
    const rcArr = rc || []
    rechargeCash.value = rcArr.filter((r: any) => r.channel === 'cash').reduce((s:number, r:any) => s + Number(r.amount||0), 0)
    rechargeWechat.value = rcArr.filter((r: any) => r.channel === 'wechat').reduce((s:number, r:any) => s + Number(r.amount||0), 0)
    rechargeAdjust.value = rcArr.filter((r: any) => r.channel === 'balance').reduce((s:number, r:any) => s + Number(r.amount||0), 0)
    rechargeTotal.value = rcArr.reduce((s:number, r:any) => s + Number(r.amount||0), 0)
    rechargeCount.value = rcArr.reduce((s:number, r:any) => s + Number(r.count||0), 0)
  } catch { hasError.value = true }
  finally { loading.value = false }
}

onMounted(() => loadAll())
</script>

<style lang="scss" scoped>
.owner-home {
  padding: 24rpx;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
  background: #f7f7f7;
}
.page-content { padding-bottom: calc(env(safe-area-inset-bottom) + 132rpx); }

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx;
  background: #ffffff;
  border-radius: 20rpx;
  border: 1rpx solid #e5e5e5;
}
.header-left { display: flex; align-items: center; gap: 16rpx; }
.header-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  background: rgba(7, 193, 96, 0.08);
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.header-icon { font-size: 36rpx; }
.header-info { display: flex; flex-direction: column; gap: 4rpx; }
.header-label { font-size: 22rpx; color: #07C160; font-weight: 600; }
.header-title { font-size: 32rpx; font-weight: 700; color: #000000; }
.header-right { text-align: right; }
.header-date { font-size: 24rpx; color: #999999; }

.date-picker-bar { 
  background: #ffffff; 
  border-radius: 24rpx; 
  padding: 20rpx; 
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06); 
  border: 1rpx solid #e5e5e5; 
}
.quick-dates { display: flex; gap: 10rpx; flex-wrap: wrap; }
.date-chip { padding: 12rpx 22rpx; border-radius: 999rpx; font-size: 24rpx; background: #f7f7f7; color: #999999; transition: all 0.2s; }
.date-chip.active { background: rgba(7, 193, 96, 0.1); color: #07C160; font-weight: 600; border: 1rpx solid #07C160; }
.custom-range { display: flex; align-items: center; gap: 12rpx; margin-top: 16rpx; }
.date-picker { flex: 1; }
.date-pick-box { padding: 14rpx 18rpx; background: #f7f7f7; border: 1rpx solid #e5e5e5; border-radius: 14rpx; font-size: 24rpx; color: #000000; text-align: center; }
.date-sep { font-size: 24rpx; color: #999999; flex-shrink: 0; }

.section-header { margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #000000; }

.revenue-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.revenue-card {
  background: rgba(7, 193, 96, 0.04);
  border-radius: 16rpx;
  padding: 24rpx;
  position: relative;
  overflow: hidden;
}

.revenue-main { margin-bottom: 24rpx; }
.revenue-total { font-size: 56rpx; font-weight: 800; color: #07C160; }

.revenue-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12rpx;
}

.revenue-item {
  background: #ffffff;
  border-radius: 12rpx;
  padding: 16rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
    background: rgba(7, 193, 96, 0.08);
  }
}

.ri-icon { font-size: 32rpx; }
.ri-val { font-size: 26rpx; font-weight: 700; color: #000000; }
.ri-lbl { font-size: 20rpx; color: #999999; }

.metrics-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16rpx;
}

.metric-card {
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 20rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6rpx;
  
  &.highlight {
    background: rgba(7, 193, 96, 0.06);
    border: 1rpx solid rgba(7, 193, 96, 0.2);
  }
}

.metric-val { font-size: 36rpx; font-weight: 800; color: #000000; }
.metric-card.highlight .metric-val { color: #07C160; }
.metric-lbl { font-size: 22rpx; color: #999999; }

.channel-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12rpx;
}

.channel-item {
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 16rpx 12rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
    background: rgba(7, 193, 96, 0.08);
  }
}

.channel-icon { font-size: 36rpx; }
.channel-amount { font-size: 24rpx; font-weight: 700; color: #FF976A; }
.channel-name { font-size: 20rpx; color: #999999; }

.recharge-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.recharge-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.recharge-item {
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
    background: rgba(7, 193, 96, 0.08);
  }
}

.recharge-icon { font-size: 36rpx; }
.recharge-val { font-size: 32rpx; font-weight: 700; color: #000000; }
.recharge-lbl { font-size: 22rpx; color: #999999; }

.product-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 14rpx;
}

.product-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
}

.pi-rank {
  width: 40rpx;
  height: 40rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  font-weight: 700;
  background: #e5e5e5;
  color: #999999;
}
.pi-rank.rank-1 { background: rgba(7, 193, 96, 0.15); color: #07C160; }
.pi-rank.rank-2 { background: rgba(158, 158, 158, 0.15); color: #666666; }
.pi-rank.rank-3 { background: rgba(255, 151, 106, 0.15); color: #FF976A; }

.pi-info { flex: 1; display: flex; flex-direction: column; gap: 4rpx; }
.pi-name { font-size: 28rpx; color: #000000; font-weight: 600; }
.pi-qty { font-size: 22rpx; color: #999999; }

.pi-revenue { font-size: 30rpx; font-weight: 700; color: #FF976A; }
</style>