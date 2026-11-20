<template>
  <view class="coupon-verify-page">
    <view class="page-content">
      <!-- Platform selector -->
      <view class="platform-selector">
        <view
          class="platform-btn"
          :class="{ active: platform === 'meituan' }"
          @tap="platform = 'meituan'"
        >
          <text class="platform-icon">&#x1f7e2;</text>
          <text>美团</text>
        </view>
        <view
          class="platform-btn"
          :class="{ active: platform === 'douyin' }"
          @tap="platform = 'douyin'"
        >
          <text class="platform-icon">&#x1f3b5;</text>
          <text>抖音</text>
        </view>
      </view>

      <!-- Coupon code input -->
      <view class="input-section">
        <view class="input-label">券码</view>
        <view class="input-row">
          <input
            class="code-input"
            v-model="couponCode"
            placeholder="输入或扫描团购券码"
            :focus="true"
            @confirm="handlePrepare"
          />
          <view class="scan-btn" @tap="handleScan">
            <text class="scan-icon">&#x1f4f7;</text>
          </view>
        </view>
        <button
          class="prepare-btn"
          :disabled="loading || !couponCode"
          @tap="handlePrepare"
          :loading="loading"
        >
          {{ loading ? '查询中...' : '查券' }}
        </button>
        <text v-if="errorMsg" class="error-msg">{{ errorMsg }}</text>
      </view>

      <!-- Prepare result -->
      <view v-if="prepareResult" class="result-card">
        <view class="result-row">
          <text class="result-label">套餐</text>
          <text class="result-value">{{ prepareResult.package_name }}</text>
        </view>
        <view class="result-row">
          <text class="result-label">时长</text>
          <text class="result-value accent">{{ prepareResult.duration_minutes }}分钟</text>
        </view>
        <view class="result-row">
          <text class="result-label">金额</text>
          <text class="result-value price">¥{{ prepareResult.price }}</text>
        </view>
      </view>

      <!-- Table selector -->
      <view v-if="prepareResult && !verified" class="table-section">
        <view class="section-title">选择球台</view>
        <view class="table-grid" v-if="idleTables.length > 0">
          <view
            v-for="t in idleTables"
            :key="t.id"
            class="table-item"
            :class="{ selected: selectedTableId === t.id }"
            @tap="selectedTableId = t.id"
          >
            {{ t.name || t.number || t.code }}
          </view>
        </view>
        <text v-else class="empty-hint">暂无可用的空闲球台</text>

        <button
          class="confirm-btn"
          :disabled="!selectedTableId || confirming"
          @tap="handleConfirm"
          :loading="confirming"
        >
          确认核销并开台
        </button>
      </view>

      <!-- Success -->
      <view v-if="verified" class="success-card">
        <text class="success-icon">&#x2705;</text>
        <text class="success-title">核销成功</text>
        <view class="success-details">
          <view class="detail-row">
            <text class="detail-label">订单号</text>
            <text class="detail-value">{{ verifyResult?.order_no }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">球台</text>
            <text class="detail-value">{{ verifyResult?.table_name }}</text>
          </view>
          <view class="detail-row">
            <text class="detail-label">时长</text>
            <text class="detail-value accent">{{ verifyResult?.duration_minutes }}分钟</text>
          </view>
        </view>
        <view class="btn-row">
          <button class="reset-btn" @tap="handleReset">继续验券</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { couponApi, PrepareResult, VerifyResult } from '@/api/modules/coupon'
import { getTableList } from '@/api/modules/table'
import type { Table } from '@/api/modules/table'

const platform = ref<'meituan' | 'douyin'>('meituan')
const couponCode = ref('')
const loading = ref(false)
const confirming = ref(false)
const errorMsg = ref('')
const prepareResult = ref<PrepareResult | null>(null)
const selectedTableId = ref('')
const verified = ref(false)
const verifyResult = ref<VerifyResult | null>(null)

const tables = ref<Table[]>([])

const idleTables = computed(() =>
  tables.value.filter((t) => t.status === 'idle')
)

onMounted(async () => {
  try {
    const res = await getTableList({ status: 'idle' })
    tables.value = res.data || []
  } catch (e) {
    console.error('[coupon/verify] Failed to load tables:', e)
  }
})

const handleScan = () => {
  // #ifdef APP-PLUS || H5
  uni.scanCode({
    scanType: ['qrCode', 'barCode'],
    success: (res: any) => {
      couponCode.value = res.result || ''
      handlePrepare()
    },
    fail: (err: any) => {
      console.log('[coupon/verify] Scan failed:', err)
    },
  })
  // #endif
}

const handlePrepare = async () => {
  if (!couponCode.value || couponCode.value.length < 8) {
    errorMsg.value = '请输入有效券码'
    return
  }
  loading.value = true
  errorMsg.value = ''
  prepareResult.value = null
  verified.value = false
  verifyResult.value = null
  selectedTableId.value = ''

  try {
    const result = await couponApi.prepare(platform.value, couponCode.value)
    prepareResult.value = result
  } catch (err: any) {
    errorMsg.value = err?.message || '查券失败'
  } finally {
    loading.value = false
  }
}

const handleConfirm = async () => {
  if (!selectedTableId.value) return
  confirming.value = true
  errorMsg.value = ''

  try {
    const result = await couponApi.confirm({
      platform: platform.value,
      coupon_code: couponCode.value,
      table_id: selectedTableId.value,
      verify_token: prepareResult.value?.verify_token,
      package_name: prepareResult.value?.package_name,
      price: prepareResult.value?.price,
      duration_minutes: prepareResult.value?.duration_minutes,
      platform_order_id: prepareResult.value?.platform_order_id,
      package_id: prepareResult.value?.package_id,
      _prepared_raw: prepareResult.value?.raw,
    })
    verifyResult.value = result
    verified.value = true
    uni.showToast({ title: '核销成功', icon: 'success' })
  } catch (err: any) {
    errorMsg.value = err?.message || '核销失败'
  } finally {
    confirming.value = false
  }
}

const handleReset = () => {
  couponCode.value = ''
  prepareResult.value = null
  selectedTableId.value = ''
  verified.value = false
  verifyResult.value = null
  errorMsg.value = ''
}
</script>

<style lang="scss" scoped>
.coupon-verify-page {
  min-height: 100vh;
  background: #f7f7f7;
}

.page-content {
  padding: 32rpx;
}

.platform-selector {
  display: flex;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.platform-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12rpx;
  padding: 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
  border: 2rpx solid #e5e5e5;
  font-size: 30rpx;
  color: #999999;
  transition: all 0.2s;
}

.platform-btn.active {
  border-color: #07C160;
  background: rgba(7, 193, 96, 0.1);
  color: #07C160;
}

.platform-icon {
  font-size: 36rpx;
}

.input-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #e5e5e5;
}

.input-label {
  font-size: 28rpx;
  color: #999999;
  margin-bottom: 16rpx;
}

.input-row {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.code-input {
  flex: 1;
  height: 88rpx;
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 34rpx;
  color: #333333;
}

.scan-btn {
  width: 88rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f7f7f7;
  border-radius: 16rpx;
  flex-shrink: 0;
}

.scan-icon {
  font-size: 40rpx;
}

.prepare-btn {
  margin-top: 24rpx;
  height: 88rpx;
  background: #07C160;
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
}

.error-msg {
  display: block;
  color: #ef4444;
  font-size: 26rpx;
  margin-top: 16rpx;
}

.result-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #e5e5e5;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 12rpx 0;
}

.result-label {
  font-size: 28rpx;
  color: #999999;
}

.result-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.result-value.accent {
  color: #07C160;
}

.result-value.price {
  color: #07C160;
  font-weight: 700;
}

.table-section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  margin-bottom: 24rpx;
  border: 1rpx solid #e5e5e5;
}

.section-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20rpx;
}

.table-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.table-item {
  width: calc(25% - 12rpx);
  padding: 24rpx 0;
  text-align: center;
  background: #f7f7f7;
  border-radius: 16rpx;
  font-size: 28rpx;
  color: #999999;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.table-item.selected {
  border-color: #07C160;
  background: rgba(7, 193, 96, 0.1);
  color: #07C160;
  font-weight: 600;
}

.empty-hint {
  display: block;
  text-align: center;
  padding: 48rpx 0;
  font-size: 28rpx;
  color: #999999;
}

.confirm-btn {
  margin-top: 24rpx;
  height: 88rpx;
  background: #07C160;
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
}

.success-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 48rpx 32rpx;
  text-align: center;
  border: 1rpx solid #e5e5e5;
}

.success-icon {
  font-size: 80rpx;
  display: block;
  margin-bottom: 16rpx;
}

.success-title {
  font-size: 40rpx;
  font-weight: 700;
  color: #07C160;
  display: block;
  margin-bottom: 32rpx;
}

.success-details {
  text-align: left;
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 8rpx 0;
}

.detail-label {
  font-size: 28rpx;
  color: #999999;
}

.detail-value {
  font-size: 28rpx;
  color: #333333;
  font-weight: 500;
}

.detail-value.accent {
  color: #07C160;
}

.btn-row {
  display: flex;
  gap: 16rpx;
}

.reset-btn {
  flex: 1;
  height: 88rpx;
  background: #07C160;
  color: #fff;
  border-radius: 16rpx;
  font-size: 32rpx;
}
</style>
