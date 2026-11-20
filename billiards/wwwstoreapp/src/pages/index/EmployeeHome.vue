<template>
  <view class="employee-home">
    <StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadAllData">
      <view class="home-header">
        <view class="header-content">
          <text class="header-label">工作总览</text>
          <text class="header-title">日常办公一屏处理</text>
        </view>
      </view>

      <view class="stats-row">
        <view class="stat-card checked">
          <text class="stat-num">{{ monthStats.checkedDays }}</text>
          <text class="stat-lbl">已签到<text class="stat-unit">天</text></text>
        </view>
        <view class="stat-card late">
          <text class="stat-num">{{ monthStats.lateCount }}</text>
          <text class="stat-lbl">迟到<text class="stat-unit">次</text></text>
        </view>
        <view class="stat-card absent">
          <text class="stat-num">{{ monthStats.absentCount }}</text>
          <text class="stat-lbl">缺勤<text class="stat-unit">天</text></text>
        </view>
      </view>

      <view class="action-section">
        <view class="section-header">
          <text class="section-title">快捷操作</text>
        </view>
        <view class="action-grid">
          <view class="action-card" @click="goToApply('leave')">
            <view class="action-icon-wrap leave">
              <text class="action-emoji">🏖</text>
            </view>
            <text class="action-title">请假申请</text>
            <text class="action-desc">提交休假审批</text>
          </view>
          <view class="action-card" @click="goToApply('outwork')">
            <view class="action-icon-wrap outwork">
              <text class="action-emoji">🏢</text>
            </view>
            <text class="action-title">外勤申请</text>
            <text class="action-desc">登记外出工作</text>
          </view>
        </view>
      </view>

      <view class="approval-section">
        <view class="section-header">
          <text class="section-title">我的审批</text>
          <text class="section-more" @click="goToApproval">查看全部 ›</text>
        </view>

        <view v-if="myApprovals.length > 0" class="approval-list">
          <view v-for="item in myApprovals" :key="item.id" class="approval-card" @click="goToApprovalDetail(item.id)">
            <view class="approval-header">
              <view class="approval-type-wrap">
                <text class="approval-type">{{ item.type_name || item.type }}</text>
              </view>
              <view class="approval-status" :class="item.status">
                <text>{{ item.status_text }}</text>
              </view>
            </view>
            <text class="approval-reason">{{ item.reason }}</text>
            <view class="approval-footer">
              <text class="approval-time">{{ item.create_time_text || item.created_at }}</text>
            </view>
          </view>
        </view>

        <view v-else class="empty-approvals">
          <text class="empty-icon">📄</text>
          <text class="empty-text">暂无审批记录</text>
        </view>
      </view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getCheckinRecords } from '@/api/modules/checkin'
import { getMyApprovalList } from '@/api/modules/approval'
import StateView from '@/components/StateView.vue'

const monthStats = ref({ checkedDays: 0, lateCount: 0, absentCount: 0 })
const myApprovals = ref<any[]>([])
const loading = ref(false)
const hasError = ref(false)

onMounted(() => { loadAllData() })

function loadAllData() {
	loading.value = true; hasError.value = false
	Promise.all([loadMonthStats(), loadMyApprovals()])
		.catch(() => { hasError.value = true })
		.finally(() => { loading.value = false })
}

async function loadMonthStats() {
	try {
		const result = await getCheckinRecords(1, 30)
		const records = result.lists || []
		const days = records.filter((r: any) => r.check_in_time).length
		const workDays = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
		monthStats.value = { checkedDays: days, lateCount: records.filter((r: any) => r.is_late).length, absentCount: Math.max(0, workDays - days) }
	} catch { monthStats.value = { checkedDays: 0, lateCount: 0, absentCount: 0 } }
}

async function loadMyApprovals() {
	try {
		const result = await getMyApprovalList({ page: 1, page_size: 5 })
		myApprovals.value = result.list || []
	} catch { myApprovals.value = [] }
}

function goToApply(type: string) { uni.navigateTo({ url: `/pages/approval/create?type=${type}` }) }
function goToApproval() { uni.navigateTo({ url: '/pages/approval/index' }) }
function goToApprovalDetail(id: string) { uni.navigateTo({ url: `/pages/approval/detail?id=${id}&type=my` }) }
</script>

<style lang="scss" scoped>
.employee-home { 
  min-height: 100vh; 
  background: #f7f7f7;
  padding: 20rpx; 
  padding-bottom: calc(env(safe-area-inset-bottom) + 156rpx);
  display: flex; 
  flex-direction: column; 
  gap: 24rpx; 
}

.employee-home :deep(.state-content) { 
  display: flex; 
  flex-direction: column; 
  gap: 24rpx; 
}

.home-header {
  padding: 20rpx 0;
}
.header-content { display: flex; flex-direction: column; gap: 8rpx; }
.header-label { font-size: 22rpx; color: #07C160; font-weight: 600; letter-spacing: 2rpx; }
.header-title { font-size: 36rpx; font-weight: 700; color: #000000; }

.stats-row {
  display: flex;
  gap: 12rpx;
}

.stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 28rpx 12rpx 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 6rpx;
}
.stat-card.checked::before { background: #07C160; }
.stat-card.late::before { background: #FF976A; }
.stat-card.absent::before { background: #FF5252; }

.stat-num {
  font-size: 48rpx;
  font-weight: 800;
  color: #000000;
  line-height: 1.1;
  margin-bottom: 8rpx;
}

.stat-lbl {
  font-size: 24rpx;
  color: #666666;
}

.stat-unit {
  font-size: 20rpx;
  color: #cccccc;
}

.action-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
}

.section-more {
  font-size: 24rpx;
  color: #07C160;
  font-weight: 600;
}

.action-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16rpx;
}

.action-card {
  background: #f7f7f7;
  border-radius: 16rpx;
  padding: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  transition: all 0.2s;
  
  &:active {
    transform: scale(0.96);
    background: rgba(7, 193, 96, 0.08);
  }
}

.action-icon-wrap {
  width: 72rpx;
  height: 72rpx;
  border-radius: 18rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.action-icon-wrap.leave { background: rgba(0, 122, 255, 0.1); }
.action-icon-wrap.outwork { background: rgba(7, 193, 96, 0.1); }

.action-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #000000;
}

.action-desc {
  font-size: 22rpx;
  color: #999999;
}

.approval-section {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
}

.approval-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.approval-card {
  background: #f7f7f7;
  border-radius: 14rpx;
  padding: 22rpx;
  display: flex;
  flex-direction: column;
  gap: 12rpx;
  transition: all 0.2s;
  
  &:active {
    background: rgba(7, 193, 96, 0.08);
  }
}

.approval-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.approval-type-wrap {
  background: #e5e5e5;
  padding: 8rpx 16rpx;
  border-radius: 12rpx;
}
.approval-type {
  font-size: 26rpx;
  font-weight: 600;
  color: #000000;
}

.approval-status {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 999rpx;
  font-weight: 600;
}
.approval-status.pending { background: rgba(255, 151, 106, 0.1); color: #FF976A; }
.approval-status.approved { background: rgba(7, 193, 96, 0.1); color: #07C160; }
.approval-status.rejected { background: rgba(255, 82, 82, 0.1); color: #FF5252; }

.approval-reason {
  font-size: 26rpx;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.approval-footer {
  display: flex;
  justify-content: flex-end;
}
.approval-time {
  font-size: 22rpx;
  color: #999999;
}

.empty-approvals {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40rpx 0;
  gap: 16rpx;
}

.empty-icon {
  font-size: 64rpx;
  opacity: 0.4;
}

.empty-text {
  font-size: 26rpx;
  color: #999999;
}
</style>