<template>
  <view v-if="visible" class="modal-overlay" @click="$emit('close')">
    <view class="modal-panel" @click.stop>
      <view class="modal-header">
        <text class="modal-title">套餐验券开台</text>
        <text class="modal-close" @click="$emit('close')">✕</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <!-- 成功页面 -->
        <view v-if="done" class="success-section">
          <view class="success-icon">✅</view>
          <text class="success-title">开台成功</text>
          <view class="success-info">
            <view class="info-row"><text>订单号</text><text>{{ done.order_no || '' }}</text></view>
            <view class="info-row"><text>套餐</text><text>{{ selectedPkg?.name }}</text></view>
            <view class="info-row"><text>时长</text><text class="emerald">{{ selectedPkg?.duration_hours }}小时</text></view>
          </view>
          <view class="success-actions">
            <button class="btn-outline" @click="reset">继续验券</button>
            <button class="btn-done" @click="$emit('close')">完成</button>
          </view>
        </view>

        <!-- 加载中 -->
        <view v-else-if="loading" class="center-hint"><text>加载中...</text></view>

        <!-- 无可选套餐 -->
        <view v-else-if="packages.length === 0" class="center-hint">
          <text class="hint-icon">🎫</text>
          <text class="hint-text">暂无可用的套餐券</text>
        </view>

        <!-- 选择流程 -->
        <template v-else>
          <!-- Step 1: 选择套餐券 -->
          <view class="step-label">选择套餐券</view>
          <view v-for="pkg in packages" :key="pkg.id" class="pkg-item"
            :class="{ selected: selectedPkg?.id === pkg.id }"
            @click="selectPkg(pkg)">
            <text class="pkg-name">{{ pkg.name }}</text>
            <view class="pkg-meta">
              <text>⏱ {{ pkg.duration_hours }}小时</text>
              <text>💰 ¥{{ pkg.price }}</text>
              <text v-if="pkg.original_price > 0" class="pkg-original">¥{{ pkg.original_price }}</text>
            </view>
          </view>

          <!-- Step 2: 选择空闲台桌 + 人数 -->
          <template v-if="selectedPkg">
            <view class="step-label">选择空闲台桌</view>
            <view v-if="idleTables.length === 0" class="empty-tip">暂无可用的空闲台桌</view>
            <view v-else class="table-grid">
              <view v-for="t in idleTables" :key="t.id" class="table-chip"
                :class="{ selected: selectedTableId === t.id }"
                @click="selectedTableId = t.id">
                {{ t.name || t.number || t.id }}
              </view>
            </view>

            <view class="step-label">选择人数</view>
            <view class="player-row">
              <view v-for="n in 6" :key="n" class="player-chip"
                :class="{ selected: playerCount === n }"
                @click="playerCount = n">{{ n }}人</view>
            </view>

            <!-- 支付步骤 -->
            <template v-if="showPayStep">
              <view class="step-label">支付方式</view>
              <view class="pay-methods">
                <view v-for="m in [{k:'cash',l:'现金'},{k:'wechat',l:'微信'},{k:'meituan',l:'美团验券'},{k:'douyin',l:'抖音验券'}]" :key="m.k"
                  class="pay-chip" :class="{ selected: paymentMethod === m.k }"
                  @click="paymentMethod = m.k">{{ m.l }}</view>
              </view>
              <view v-if="paymentMethod === 'cash'" class="pay-input">
                <text>收款金额</text>
                <input type="number" v-model="cashAmount" :placeholder="'应收 ¥' + selectedPkg?.price" />
                <text v-if="parseFloat(cashAmount) >= (selectedPkg?.price||0)" class="change-note">
                  找零: ¥{{ (parseFloat(cashAmount) - (selectedPkg?.price || 0)).toFixed(2) }}
                </text>
              </view>
              <view v-if="paymentMethod === 'wechat'" class="wechat-pay">
                <image v-if="payUrl" class="qr-code"
                  :src="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(payUrl)"
                  mode="aspectFit" />
                <text v-if="payUrl" class="qr-hint">请引导客户微信扫码支付 ¥{{ selectedPkg?.price }}</text>
                <text v-else class="qr-hint">点击确认后生成支付二维码</text>
              </view>
              <view v-if="['meituan','douyin'].includes(paymentMethod)" class="pay-input">
                <text>{{ paymentMethod === 'meituan' ? '美团券码' : '抖音券码' }}</text>
                <input v-model="verifyCode" :placeholder="paymentMethod === 'meituan' ? '输入12位数字券码' : '输入券码'" />
                <text v-if="verifyStatus === 'verifying'" class="verify-hint verifying">验券中...</text>
                <text v-if="verifyStatus === 'success'" class="verify-hint success">✓ 验券成功</text>
                <text v-if="verifyStatus === 'failed'" class="verify-hint failed">✗ 验券失败</text>
              </view>
              <view v-if="error" class="error-msg">{{ error }}</view>
              <button class="btn-submit" :disabled="submitting" @click="handleConfirm">
                {{ submitting ? '处理中...' : `确认支付并开台 · ¥${selectedPkg?.price}` }}
              </button>
              <text class="back-link" @click="showPayStep = false">← 返回</text>
            </template>

            <!-- 去支付按钮 -->
            <template v-else>
              <view v-if="error" class="error-msg">{{ error }}</view>
              <button class="btn-submit" :disabled="!selectedTableId" @click="goToPay">
                去支付 · ¥{{ selectedPkg?.price || 0 }}
              </button>
            </template>
          </template>
        </template>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { getCouponPackageList, couponApi, type CouponPackage } from '@/api/modules/coupon'
import { getTableList } from '@/api/modules/table'
import type { Table } from '@/api/modules/table'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits(['close', 'opened'])

const packages = ref<CouponPackage[]>([])
const selectedPkg = ref<CouponPackage | null>(null)
const idleTables = ref<Table[]>([])
const selectedTableId = ref('')
const playerCount = ref(2)
const loading = ref(true)
const submitting = ref(false)
const done = ref<Record<string, unknown> | null>(null)
const error = ref('')
const payUrl = ref('')
const verifyStatus = ref<'idle' | 'verifying' | 'success' | 'failed'>('idle')

// Payment step
const showPayStep = ref(false)
const paymentMethod = ref('cash')
const verifyCode = ref('')
const cashAmount = ref('')

async function loadPackages() {
  loading.value = true
  try {
    const result = await getCouponPackageList()
    const list = Array.isArray(result) ? result : (result?.lists || result?.data || []) as CouponPackage[]
    packages.value = list
  } catch { packages.value = [] }
  finally { loading.value = false }
}

async function selectPkg(pkg: CouponPackage) {
  selectedPkg.value = pkg
  selectedTableId.value = ''
  error.value = ''
  try {
    const result = await getTableList({ status: 'idle', page_size: 100 })
    idleTables.value = (result?.data || []).filter((t: Table) => t.status === 'idle')
  } catch { idleTables.value = [] }
}

function goToPay() {
  if (!selectedPkg.value || !selectedTableId.value) return
  cashAmount.value = String(selectedPkg.value.price || 0)
  error.value = ''
  showPayStep.value = true
}

async function handleConfirm() {
  if (!selectedPkg.value || !selectedTableId.value) return
  submitting.value = true
  error.value = ''
  try {
    if (['meituan', 'douyin'].includes(paymentMethod.value)) verifyStatus.value = 'verifying'
    const result = await couponApi.payAndOpen({
      package_id: selectedPkg.value.id,
      table_id: selectedTableId.value,
      player_count: playerCount.value,
      payment_method: paymentMethod.value,
      verify_code: verifyCode.value || undefined,
      cash_amount: parseFloat(cashAmount.value) || undefined,
    })
    if (['meituan', 'douyin'].includes(paymentMethod.value)) verifyStatus.value = 'success'
    if (paymentMethod.value === 'wechat' && result?.data?.pay_url) payUrl.value = result.data.pay_url
    done.value = result
    emit('opened')
  } catch (e: any) {
    if (['meituan', 'douyin'].includes(paymentMethod.value)) verifyStatus.value = 'failed'
    error.value = e?.msg || e?.message || '开台失败'
  } finally {
    submitting.value = false
  }
}

function reset() {
  selectedPkg.value = null
  selectedTableId.value = ''
  showPayStep.value = false
  paymentMethod.value = 'cash'
  verifyCode.value = ''
  cashAmount.value = ''
  done.value = null
  error.value = ''
}

defineExpose({ loadPackages })

// visible 变化时自动加载套餐列表，替代父组件的 setTimeout hack
watch(() => props.visible, (v) => { if (v) { reset(); loadPackages() } })
</script>

<style lang="scss" scoped>
.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; flex-direction: column; justify-content: flex-end; }
.modal-panel { background: #fff; border-radius: 24rpx 24rpx 0 0; max-height: 80vh; display: flex; flex-direction: column; }
.modal-header { display: flex; align-items: center; padding: 28rpx; border-bottom: 1rpx solid #f3f4f6; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #111827; }
.modal-close { margin-left: auto; font-size: 32rpx; color: #9ca3af; padding: 8rpx; }
.modal-body { flex: 1; overflow-y: auto; padding: 24rpx; padding-bottom: calc(env(safe-area-inset-bottom) + 48rpx); }
.step-label { font-size: 26rpx; color: #6b7280; margin: 20rpx 0 12rpx; }
.pkg-item { padding: 24rpx; margin-bottom: 12rpx; border-radius: 16rpx; border: 2rpx solid #e5e7eb; background: #f9fafb; }
.pkg-item.selected { border-color: #059669; background: #ecfdf5; }
.pkg-name { display: block; font-size: 28rpx; font-weight: 600; color: #111827; margin-bottom: 8rpx; }
.pkg-meta { display: flex; gap: 16rpx; font-size: 24rpx; color: #6b7280; }
.pkg-original { text-decoration: line-through; color: #d1d5db; }
.table-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; }
.table-chip { padding: 18rpx; border-radius: 12rpx; border: 2rpx solid #e5e7eb; text-align: center; font-size: 26rpx; font-weight: 500; color: #374151; background: #f9fafb; }
.table-chip.selected { border-color: #059669; background: #ecfdf5; color: #059669; font-weight: 700; }
.player-row { display: flex; gap: 12rpx; }
.player-chip { width: 80rpx; height: 80rpx; border-radius: 50%; border: 2rpx solid #e5e7eb; display: flex; align-items: center; justify-content: center; font-size: 24rpx; font-weight: 500; color: #374151; background: #f9fafb; }
.player-chip.selected { border-color: #059669; background: #059669; color: #fff; font-weight: 700; }
.empty-tip { color: #d97706; font-size: 26rpx; }
.error-msg { color: #ef4444; font-size: 24rpx; margin-top: 16rpx; }
.btn-submit { width: 100%; margin-top: 28rpx; padding: 30rpx; background: #059669; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 700; border: none; }
.btn-submit[disabled] { background: #d1d5db; }
/* success */
.success-section { text-align: center; padding: 48rpx 0; }
.success-icon { font-size: 80rpx; margin-bottom: 16rpx; }
.success-title { display: block; font-size: 36rpx; font-weight: 700; color: #059669; margin-bottom: 32rpx; }
.success-info { background: #f9fafb; border-radius: 16rpx; padding: 24rpx; text-align: left; margin-bottom: 32rpx; }
.info-row { display: flex; justify-content: space-between; padding: 8rpx 0; font-size: 26rpx; color: #6b7280; }
.info-row .emerald { color: #059669; font-weight: 600; }
.success-actions { display: flex; gap: 16rpx; }
.btn-outline { flex: 1; padding: 24rpx; background: #f3f4f6; color: #374151; border-radius: 16rpx; font-size: 28rpx; border: none; }
.btn-done { flex: 1; padding: 24rpx; background: #059669; color: #fff; border-radius: 16rpx; font-size: 28rpx; font-weight: 600; border: none; }
.center-hint { display: flex; flex-direction: column; align-items: center; padding: 120rpx 0; color: #9ca3af; }
.hint-icon { font-size: 64rpx; margin-bottom: 16rpx; }
.hint-text { font-size: 28rpx; }
.pay-methods { display: flex; gap: 12rpx; flex-wrap: wrap; }
.pay-chip { padding: 16rpx 24rpx; background: #f3f4f6; border-radius: 16rpx; font-size: 26rpx; border: 2rpx solid transparent; &.selected { border-color: #059669; background: #ecfdf5; color: #059669; font-weight: 600; } }
.pay-input { margin-top: 16rpx;
  text { font-size: 26rpx; color: #6b7280; }
  input { width: 100%; padding: 20rpx; border: 1rpx solid #e5e7eb; border-radius: 12rpx; font-size: 32rpx; margin-top: 8rpx; }
  .change-note { font-size: 24rpx; color: #059669; margin-top: 8rpx; display: block; }
}
.wechat-pay { margin-top: 16rpx; text-align: center; }
.qr-code { width: 360rpx; height: 360rpx; margin: 0 auto; border-radius: 16rpx; }
.qr-hint { display: block; font-size: 24rpx; color: #9ca3af; margin-top: 12rpx; }
.verify-hint { font-size: 24rpx; margin-top: 8rpx; display: block; &.verifying { color: #3b82f6; } &.success { color: #059669; } &.failed { color: #ef4444; } }
.back-link { display: block; text-align: center; color: #9ca3af; font-size: 26rpx; margin-top: 12rpx; }
</style>
