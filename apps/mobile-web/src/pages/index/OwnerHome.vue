<template>
  <view class="owner-home page-content">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">门店总览</text>
        <text class="hero-title">经营数据一目了然</text>
      </view>
    </view>

    <!-- 日期筛选 -->
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
      <!-- ① 收入总览 -->
      <view class="section-card section-card-primary">
        <view class="section-head">
          <text class="section-title section-title-light">收入总览</text>
        </view>
        <view class="total-big">¥{{ fmt(revenue.total_revenue) }}</view>
        <view class="revenue-grid">
          <view class="rv-item"><text class="rv-val">¥{{ fmt(revenue.table_revenue) }}</text><text class="rv-lbl">台费</text></view>
          <view class="rv-item"><text class="rv-val">¥{{ fmt(revenue.product_revenue) }}</text><text class="rv-lbl">商品</text></view>
          <view class="rv-item"><text class="rv-val">¥{{ fmt(revenue.assistant_revenue) }}</text><text class="rv-lbl">助教</text></view>
          <view class="rv-item"><text class="rv-val">¥{{ fmt(revenue.charging_revenue) }}</text><text class="rv-lbl">充电</text></view>
        </view>
      </view>

      <!-- ② 收入渠道 -->
      <view class="section-card">
        <view class="section-head">
          <text class="section-title">收入渠道</text>
        </view>
        <view class="channel-grid">
          <view v-for="ch in defaultChannels" :key="ch.channel" class="ch-item" @click="goChannelDetail(ch.channel, ch.label)">
            <text class="ch-val">¥{{ fmt(ch.revenue) }}</text>
            <text class="ch-lbl">{{ ch.label }} ›</text>
          </view>
        </view>
      </view>

      <!-- ③ 收入项目 -->
      <view class="section-card">
        <view class="section-head">
          <text class="section-title">收入项目</text>
        </view>
        <view class="channel-grid">
          <view v-for="it in defaultItemTypes" :key="it.item_type" class="ch-item" @click="goItemDetail(it.item_type, it.label)">
            <text class="ch-val">¥{{ fmt(it.revenue) }}</text>
            <text class="ch-lbl">{{ it.label }} ›</text>
          </view>
        </view>
      </view>

      <!-- ④ 充值报表 -->
      <view class="section-card">
        <view class="section-head">
          <text class="section-title">充值报表</text>
        </view>
        <view class="channel-grid">
          <view class="ch-item" @click="goRechargeDetail('cash', '现金充值')"><text class="ch-val">¥{{ fmt(rechargeCash) }}</text><text class="ch-lbl">现金充值 ›</text></view>
          <view class="ch-item" @click="goRechargeDetail('wechat', '微信充值')"><text class="ch-val">¥{{ fmt(rechargeWechat) }}</text><text class="ch-lbl">微信充值 ›</text></view>
          <view class="ch-item" @click="goRechargeDetail('balance', '余额调整')"><text class="ch-val">¥{{ fmt(rechargeAdjust) }}</text><text class="ch-lbl">余额调整 ›</text></view>
          <view class="ch-item"><text class="ch-val">{{ rechargeCount }}</text><text class="ch-lbl">充值笔数</text></view>
        </view>
      </view>

      <!-- ⑤ 运营指标 -->
      <view class="section-card">
        <view class="section-head">
          <text class="section-title">运营指标</text>
        </view>
        <view class="kpi-grid">
          <view class="kpi-item">
            <text class="kpi-val">{{ operation.occupancy_rate || 0 }}%</text>
            <text class="kpi-lbl">开台率</text>
            <text class="kpi-sub">{{ operation.occupied_tables || 0 }}/{{ operation.total_tables || 0 }} 桌</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ operation.turnover_rate || 0 }}</text>
            <text class="kpi-lbl">翻台率</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">¥{{ operation.avg_customer_spend || 0 }}</text>
            <text class="kpi-lbl">客单价</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ operation.avg_order_amount || 0 }}</text>
            <text class="kpi-lbl">均单金额</text>
          </view>
        </view>
        <view class="kpi-grid" style="margin-top:16rpx">
          <view class="kpi-item">
            <text class="kpi-val">{{ operation.order_count || 0 }}</text>
            <text class="kpi-lbl">订单数</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ operation.product_sales_count || 0 }}</text>
            <text class="kpi-lbl">商品销售件数</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ formatDuration(operation.table_duration_minutes || 0) }}</text>
            <text class="kpi-lbl">台费时长</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ formatDuration(operation.assistant_duration_minutes || 0) }}</text>
            <text class="kpi-lbl">助教时长</text>
          </view>
        </view>
        <view class="kpi-grid" style="margin-top:16rpx">
          <view class="kpi-item">
            <text class="kpi-val">{{ formatDuration(operation.outwork_duration_minutes || 0) }}</text>
            <text class="kpi-lbl">外勤时长</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ formatDuration(operation.meituan_duration_minutes || 0) }}</text>
            <text class="kpi-lbl">美团时长</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ formatDuration(operation.douyin_duration_minutes || 0) }}</text>
            <text class="kpi-lbl">抖音时长</text>
          </view>
          <view class="kpi-item">
            <text class="kpi-val">{{ formatDuration(operation.total_duration_minutes || 0) }}</text>
            <text class="kpi-lbl">总经营时长</text>
          </view>
        </view>
      </view>

      <!-- 热销商品 -->
      <view class="section-card" v-if="products.length > 0">
        <view class="section-head">
          <text class="section-title">热销商品</text>
        </view>
        <view v-for="p in products" :key="p.rank" class="product-row">
          <view class="pr-left">
            <text class="pr-rank" :class="'r'+p.rank">{{ p.rank }}</text>
            <text class="pr-name">{{ p.name }}</text>
          </view>
          <view class="pr-right">
            <text class="pr-qty">×{{ p.quantity }}</text>
            <text class="pr-revenue">¥{{ p.revenue }}</text>
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

// 默认渠道列表（无数据时显示 0）
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
    // 渠道加中文标签
    const channelLabelMap: Record<string,string> = { cash:'现金', wechat:'微信', meituan:'美团', douyin:'抖音', coupon:'团券', member_balance:'会员卡', member:'会员卡' }
    channels.value = (ch || []).map((c: any) => ({ ...c, channel_label: channelLabelMap[c.channel] || c.channel }))
    // 收入项目加中文标签
    const itemLabelMap: Record<string,string> = { table:'台费', product:'商品', assistant:'助教', charging:'充电', merge_fee:'并入台费' }
    itemTypes.value = (it || []).map((i: any) => ({ ...i, item_label: itemLabelMap[i.item_type] || i.item_type }))
    // 充值报表：数组 → 分类汇总
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
  padding: 30rpx 24rpx 0;
  display: flex;
  flex-direction: column;
  gap: 22rpx;
}
.page-content { padding-bottom: calc(env(safe-area-inset-bottom) + 132rpx); }

.hero-card {
  background: linear-gradient(135deg, #059669, #10b981);
  border-radius: 28rpx;
  padding: 32rpx 28rpx;
}
.hero-eyebrow { font-size: 22rpx; color: rgba(255,255,255,.7); text-transform: uppercase; letter-spacing: 2rpx; }
.hero-title { font-size: 36rpx; font-weight: 800; color: #fff; margin-top: 6rpx; display: block; }
.hero-desc { font-size: 24rpx; color: rgba(255,255,255,.7); margin-top: 6rpx; display: block; }

/* 日期筛选 */
.date-picker-bar { background: #fff; border-radius: 20rpx; padding: 20rpx 20rpx 16rpx; box-shadow: 0 4rpx 16rpx rgba(15,23,42,.04); }
.quick-dates { display: flex; gap: 12rpx; flex-wrap: wrap; }
.date-chip { padding: 12rpx 24rpx; border-radius: 20rpx; font-size: 24rpx; background: #f1f5f9; color: #64748b; }
.date-chip.active { background: linear-gradient(135deg, #059669, #10b981); color: #fff; font-weight: 600; }
.custom-range { display: flex; align-items: center; gap: 12rpx; margin-top: 16rpx; }
.date-picker { flex: 1; }
.date-pick-box { padding: 16rpx 20rpx; background: #f8fafc; border: 1rpx solid #e2e8f0; border-radius: 16rpx; font-size: 24rpx; color: #1e293b; text-align: center; }
.date-sep { font-size: 24rpx; color: #94a3b8; flex-shrink: 0; }

/* 卡片 — 白色背景，加大间距 */
.section-card { background: #fff; border-radius: 24rpx; padding: 32rpx 28rpx; margin-bottom: 22rpx; box-shadow: 0 4rpx 20rpx rgba(15,23,42,.06); }
.section-card-primary { background: linear-gradient(135deg, #059669, #10b981); }
.section-head { margin-bottom: 22rpx; display: flex; justify-content: space-between; align-items: center; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1e293b; }
.section-title-light { color: #fff; }
.section-subtitle { font-size: 24rpx; color: #94a3b8; display: block; }

/* 收入总览 */
.total-big { font-size: 56rpx; font-weight: 800; color: #fff; margin-bottom: 20rpx; }
.revenue-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; }
.rv-item { text-align: center; }
.rv-val { font-size: 26rpx; font-weight: 700; color: #fff; display: block; }
.rv-lbl { font-size: 20rpx; color: rgba(255,255,255,.7); margin-top: 4rpx; display: block; }
.rv-val-dark { font-size: 26rpx; font-weight: 700; color: #1e293b; display: block; }
.rv-lbl-dark { font-size: 20rpx; color: #64748b; margin-top: 4rpx; display: block; }

/* 渠道 / 项目 */
.channel-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; }
.ch-item { text-align: center; padding: 20rpx 0; background: #f8fafc; border-radius: 16rpx; }
.ch-val { font-size: 30rpx; font-weight: 700; color: #1e293b; display: block; }
.ch-lbl { font-size: 22rpx; color: #64748b; margin-top: 6rpx; display: block; }
.empty-hint { text-align: center; color: #94a3b8; font-size: 24rpx; padding: 24rpx 0; }

/* KPI */
.kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16rpx; margin-top: 16rpx; }
.kpi-item { text-align: left; background: #f8fafc; border-radius: 16rpx; padding: 20rpx 16rpx; }
.kpi-val { font-size: 30rpx; font-weight: 700; color: #1e293b; display: block; }
.kpi-lbl { font-size: 22rpx; color: #64748b; margin-top: 4rpx; display: block; }
.kpi-sub { font-size: 20rpx; color: #94a3b8; margin-top: 2rpx; display: block; }

/* 热销 */
.product-row { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #f1f5f9; }
.product-row:last-child { border-bottom: none; }
.pr-left { display: flex; align-items: center; gap: 16rpx; }
.pr-rank { width: 40rpx; height: 40rpx; border-radius: 10rpx; display: flex; align-items: center; justify-content: center; font-size: 22rpx; font-weight: 700; background: #f1f5f9; color: #94a3b8; }
.pr-rank.r1 { background: #fef3c7; color: #b45309; }
.pr-rank.r2 { background: #e2e8f0; color: #64748b; }
.pr-rank.r3 { background: #fed7aa; color: #9a3412; }
.pr-name { font-size: 26rpx; color: #1e293b; }
.pr-right { display: flex; align-items: center; gap: 16rpx; }
.pr-qty { font-size: 24rpx; color: #94a3b8; }
.pr-revenue { font-size: 26rpx; font-weight: 600; color: #059669; }
</style>
