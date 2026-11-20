<template>
  <view class="page">
    <view class="page-content">
      <!-- Search -->
      <view class="search-bar">
        <input v-model="keyword" class="search-input" placeholder="输入手机号或姓名搜索会员"
          @confirm="doSearch" />
        <view class="search-btn" @click="doSearch">搜索</view>
      </view>

      <!-- Member List -->
      <view v-if="members.length > 0 && !selectedMember" class="member-list">
        <view v-for="m in members" :key="m.member_id" class="member-card"
          @click="selectMember(m)">
          <view class="mem-avatar">{{ m.name[0] }}</view>
          <view class="mem-info">
            <text class="mem-name">{{ m.name }}</text>
            <text class="mem-phone">{{ m.phone }}</text>
          </view>
          <view class="mem-right">
            <text class="mem-balance">¥{{ Number(m.balance || 0).toFixed(2) }}</text>
            <text class="mem-level">{{ m.level }}</text>
          </view>
        </view>
      </view>

      <!-- Selected Member -->
      <view v-if="selectedMember" class="selected-card">
        <view class="sel-header">
          <view class="sel-avatar">{{ selectedMember.name[0] }}</view>
          <view class="sel-info">
            <text class="sel-name">{{ selectedMember.name }}</text>
            <text class="sel-phone">{{ selectedMember.phone }}</text>
          </view>
          <text class="sel-balance">余额 ¥{{ Number(selectedMember.balance || 0).toFixed(2) }}</text>
        </view>

        <!-- Quick Amounts -->
        <view class="quick-section">
          <text class="section-label">快捷金额</text>
          <view class="quick-grid">
            <view v-for="a in quickAmounts" :key="a" class="quick-chip"
              :class="{ active: amount === a }" @click="amount = a">¥{{ a }}</view>
          </view>
        </view>

        <!-- Custom Amount -->
        <view class="custom-row">
          <text class="section-label">自定义金额</text>
          <input v-model="amount" type="digit" class="amount-input" placeholder="输入金额" />
        </view>

        <!-- Confirm -->
        <button class="btn-confirm" :disabled="!canSubmit || submitting" @click="handleRecharge">
          {{ submitting ? '处理中...' : `确认收款 ¥${amount || 0}` }}
        </button>
        <view class="operator-hint">操作员：{{ operatorName }}</view>

        <!-- Change selection -->
        <view class="change-link" @click="selectedMember = null; members = []">← 重新选择会员</view>
      </view>

      <StateView :loading="searching" :empty="members.length === 0 && searched" empty-msg="未找到会员" />
    </view>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { searchMembers, cashRecharge } from '@/api/modules/recharge'
import { authStore } from '@/stores/auth'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'

const quickAmounts = [100, 200, 500, 1000, 2000, 5000]
const keyword = ref('')
const members = ref<any[]>([])
const selectedMember = ref<any>(null)
const amount = ref<number>(0)
const searching = ref(false)
const searched = ref(false)
const submitting = ref(false)
const operatorName = computed(() => authStore.userInfo?.name || '当前员工')

const canSubmit = computed(() => selectedMember.value && Number(amount.value) > 0 && Number(amount.value) <= 50000)

async function doSearch() {
  if (!keyword.value.trim()) return
  searching.value = true
  searched.value = false
  try {
    members.value = await searchMembers(keyword.value.trim())
    searched.value = true
  } catch {
    uni.showToast({ title: '搜索失败', icon: 'none' })
  } finally {
    searching.value = false
  }
}

function selectMember(m: any) {
  selectedMember.value = m
  amount.value = 0
}

async function handleRecharge() {
  if (!canSubmit.value) return
  submitting.value = true
  try {
    await cashRecharge({
      member_id: selectedMember.value.id,
      amount: Number(amount.value),
      operator_id: String(authStore.userInfo?.id || ''),
      operator_name: authStore.userInfo?.name || '',
    })
    uni.showToast({ title: '充值成功', icon: 'success' })
    selectedMember.value = null
    members.value = []
    amount.value = 0
    keyword.value = ''
  } catch (e: any) {
    uni.showToast({ title: e.message || '充值失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f7f7f7; }
.page-content { padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx); }

.search-bar { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.search-input { flex: 1; height: 88rpx; background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 20rpx; padding: 0 24rpx; font-size: 28rpx; color: #333333; }
.search-btn { width: 140rpx; height: 88rpx; background: #07C160; border-radius: 20rpx; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 28rpx; font-weight: 600; }

.member-list { display: flex; flex-direction: column; gap: 16rpx; }
.member-card { display: flex; align-items: center; gap: 20rpx; background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 20rpx; padding: 24rpx; }
.mem-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #07C160; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32rpx; font-weight: 700; }
.mem-info { flex: 1; }
.mem-name { font-size: 30rpx; font-weight: 700; color: #000000; display: block; }
.mem-phone { font-size: 24rpx; color: #999999; }
.mem-right { text-align: right; }
.mem-balance { font-size: 28rpx; font-weight: 700; color: #07C160; display: block; }
.mem-level { font-size: 22rpx; color: #999999; }

.selected-card { background: #ffffff; border: 1rpx solid #e5e5e5; border-radius: 24rpx; padding: 28rpx; }
.sel-header { display: flex; align-items: center; gap: 16rpx; margin-bottom: 28rpx; }
.sel-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #07C160; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 32rpx; font-weight: 700; }
.sel-info { flex: 1; }
.sel-name { font-size: 30rpx; font-weight: 700; color: #000000; display: block; }
.sel-phone { font-size: 24rpx; color: #999999; }
.sel-balance { font-size: 26rpx; font-weight: 700; color: #07C160; }

.section-label { font-size: 24rpx; color: #999999; display: block; margin-bottom: 16rpx; }
.quick-section { margin-bottom: 24rpx; }
.quick-grid { display: flex; flex-wrap: wrap; gap: 16rpx; }
.quick-chip { padding: 16rpx 28rpx; background: #f7f7f7; border-radius: 16rpx; font-size: 28rpx; font-weight: 600; color: #333333; }
.quick-chip.active { background: #07C160; color: #ffffff; }

.custom-row { margin-bottom: 32rpx; }
.amount-input { width: 100%; height: 100rpx; background: #f7f7f7; border-radius: 20rpx; padding: 0 24rpx; font-size: 40rpx; font-weight: 700; color: #07C160; text-align: center; }

.btn-confirm { width: 100%; padding: 30rpx; background: #07C160; color: #ffffff; border-radius: 20rpx; font-size: 32rpx; font-weight: 700; border: none; }
.btn-confirm[disabled] { opacity: .5; }

.operator-hint { text-align: center; font-size: 22rpx; color: #999999; margin-top: 16rpx; }
.change-link { text-align: center; font-size: 26rpx; color: #07C160; margin-top: 24rpx; }
</style>
