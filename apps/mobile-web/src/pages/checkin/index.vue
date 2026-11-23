<template>
  <view class="checkin-page">
    <Header />
    <view class="page-content">
      <StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadAllStatus">
        <view class="checkin-card">
          <view class="checkin-header">
            <text class="checkin-date">{{ currentDate }}</text>
            <text class="checkin-time">{{ currentTime }}</text>
          </view>

          <view class="checkin-status">
            <view class="status-left">
              <view class="status-dot" :class="statusClass"></view>
              <text class="status-text">{{ statusText }}</text>
            </view>
            <view class="status-right">
              <text class="attendance-tag">{{ attendanceRate }}%</text>
              <text class="attendance-label">出勤率</text>
            </view>
          </view>

          <view v-if="lastCheckinTime" class="checkin-detail">
            <text class="detail-text">签到 {{ formatTime(lastCheckinTime) }}</text>
            <text v-if="lastCheckoutTime" class="detail-text">签退 {{ formatTime(lastCheckoutTime) }}</text>
          </view>

          <view v-if="isAssistant" class="photo-section">
            <text class="photo-section-title">打卡照片 · {{ photoUrls.length }}/5</text>
            <view class="photo-grid">
              <view v-for="(url, idx) in photoUrls" :key="'u' + idx" class="photo-item uploaded">
                <image :src="url" mode="aspectFill" class="photo-img" @click="previewPhoto(idx)" />
                <view class="photo-badge uploaded-badge">✓</view>
                <view class="photo-delete" @click.stop="removePhoto(idx)">
                  <text class="delete-icon">✕</text>
                </view>
              </view>
              <view v-if="uploadingCount > 0" class="photo-item uploading">
                <text class="uploading-text">上传中...</text>
              </view>
              <view v-if="photoUrls.length < 5 && uploadingCount === 0" class="photo-add" @click="takePhoto">
                <text class="add-icon">＋</text>
              </view>
            </view>
            <text v-if="photoUrls.length > 0 && photoUrls.length < 3" class="photo-hint">需{{ 3 - photoUrls.length }}张</text>
            <text v-if="photoUrls.length >= 3" class="photo-hint ready">✓ 已就绪</text>
          </view>

          <button class="checkin-btn" :class="{ signed: hasCheckedIn, done: checkinStatus.type === 'done' }" :disabled="submitting || uploadingCount > 0"
            @click="handleCheckIn">
            {{ submitting ? '提交中...' : checkinStatus.text }}
          </button>
        </view>

        <view class="stats-section">
          <view class="section-header">
            <text class="section-title">本月统计</text>
          </view>
          <view class="stats-grid">
            <view class="stat-card">
              <text class="stat-value primary">{{ monthStats.checkedDays }}</text>
              <text class="stat-label">已打卡</text>
            </view>
            <view class="stat-card">
              <text class="stat-value warning">{{ monthStats.lateCount }}</text>
              <text class="stat-label">迟到</text>
            </view>
            <view class="stat-card">
              <text class="stat-value danger">{{ monthStats.absentCount }}</text>
              <text class="stat-label">缺勤</text>
            </view>
            <view class="stat-card">
              <text class="stat-value success">{{ attendanceRate }}%</text>
              <text class="stat-label">出勤率</text>
            </view>
          </view>
        </view>

        <view class="quick-actions">
          <view class="section-header">
            <text class="section-title">快捷入口</text>
          </view>
          <scroll-view class="action-scroll" scroll-x :show-scrollbar="false">
            <view class="action-grid">
              <view class="action-card" v-for="item in approvalTypes" :key="item.type" @click="goToApply(item.type)">
                <view class="action-icon-wrap">
                  <text class="action-icon">{{ item.icon }}</text>
                </view>
                <text class="action-text">{{ item.label }}</text>
              </view>
            </view>
          </scroll-view>
        </view>
      </StateView>
    </view>
    <TabBar />
  </view>
</template>

<script setup lang="ts">
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'
import { useCheckin } from '@/composables/useCheckin'

const approvalTypes = [
  { type: 'checkin', icon: '📍', label: '补卡申请' },
  { type: 'exchange', icon: '🔄', label: '换班申请' },
  { type: 'leave', icon: '🏖️', label: '请假申请' },
  { type: 'outwork', icon: '🌐', label: '外勤申请' },
  { type: 'overtime', icon: '⏰', label: '加班申请' },
]

const {
  currentDate, currentTime,
  isAssistant,
  checkinStatus, hasCheckedIn, lastCheckinTime, lastCheckoutTime,
  statusClass, statusText,
  loading, hasError, submitting, loadAllStatus,
  monthStats, attendanceRate,
  photoUrls, uploadingCount, takePhoto, removePhoto, previewPhoto,
  handleCheckIn, loadCheckinStatus,
} = useCheckin()

function formatTime(timeStr: string): string {
  if (!timeStr) return ''
  return timeStr.replace('T', ' ').substring(11, 16)
}
function goToApply(type: string) { uni.navigateTo({ url: `/pages/approval/create?type=${type}` }) }
</script>

<style lang="scss" scoped>
.checkin-page { min-height: 100vh; background: #f2f3f5; }
.page-content { padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx); }

.stats-section, .quick-actions {
  background: linear-gradient(180deg, rgba(255,255,255,.96) 0%, rgba(255,255,255,.9) 100%);
  border-radius: 36rpx; box-shadow: 0 12rpx 36rpx rgba(15,23,42,.06);
  border: 1rpx solid rgba(255,255,255,.82);
}

.checkin-card {
  background:
    radial-gradient(circle at top right, rgba(255,255,255,.18) 0, rgba(255,255,255,0) 30%),
    radial-gradient(circle at left bottom, rgba(255,255,255,.14) 0, rgba(255,255,255,0) 26%),
    linear-gradient(135deg, #0f766e 0%, #059669 52%, #047857 100%);
  border-radius: 48rpx; padding: 36rpx 30rpx;
  display: flex; flex-direction: column;
  margin-top: 18rpx; margin-bottom: 22rpx;
  box-shadow: 0 18rpx 40rpx rgba(5,150,105,.22);
  gap: 24rpx;
}
.checkin-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  width: 100%;
}
.checkin-date { font-size: 36rpx; font-weight: 800; color: #fff; }
.checkin-time { font-size: 40rpx; font-weight: 800; color: rgba(255,255,255,.9); font-family: monospace; }
.checkin-status {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14rpx 24rpx; border-radius: 999rpx; background: rgba(255,255,255,.1);
}
.status-left { display: flex; align-items: center; gap: 12rpx; }
.status-dot { width: 18rpx; height: 18rpx; border-radius: 50%; background: #fbbf24; animation: pulse 2s ease-in-out infinite; }
.status-dot.success { background: #34d399; animation: none; }
.status-dot.info { background: #60a5fa; }
.status-text { font-size: 28rpx; font-weight: 600; color: #fff; }
.status-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4rpx; }
.attendance-tag { font-size: 32rpx; font-weight: 800; color: #fff; }
.attendance-label { font-size: 20rpx; color: rgba(255,255,255,.6); }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.1); } }

.checkin-detail {
  display: flex; gap: 32rpx;
}
.detail-text { font-size: 24rpx; color: rgba(255,255,255,.7); font-weight: 500; }

.photo-section {
  padding: 20rpx; background: rgba(255,255,255,.08); border-radius: 24rpx;
}
.photo-section-title { font-size: 24rpx; font-weight: 600; color: rgba(255,255,255,.9); display: block; margin-bottom: 16rpx; }
.photo-grid { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 12rpx; }
.photo-item { position: relative; width: 130rpx; height: 130rpx; border-radius: 12rpx; overflow: hidden; }
.photo-item.uploading { display: flex; align-items: center; justify-content: center; background: rgba(255,255,255,.1); }
.photo-badge {
  position: absolute; top: 6rpx; left: 6rpx; width: 32rpx; height: 32rpx;
  border-radius: 50%; background: rgba(16,185,129,.9); color: #fff; font-size: 20rpx;
  display: flex; align-items: center; justify-content: center;
}
.uploading-text { font-size: 20rpx; color: rgba(255,255,255,.6); }
.photo-img { width: 100%; height: 100%; }
.photo-delete {
  position: absolute; top: 6rpx; right: 6rpx;
  width: 36rpx; height: 36rpx; background: rgba(0,0,0,.5);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.delete-icon { color: #fff; font-size: 22rpx; }
.photo-add {
  width: 130rpx; height: 130rpx; border: 2rpx dashed rgba(255,255,255,.3);
  border-radius: 12rpx; display: flex; align-items: center; justify-content: center;
}
.add-icon { font-size: 48rpx; color: rgba(255,255,255,.5); }
.photo-hint { font-size: 22rpx; color: #fbbf24; display: block; text-align: center; }
.photo-hint.ready { color: #34d399; }

.checkin-btn {
  width: 100%; height: 96rpx; border-radius: 24rpx; background: #fff;
  display: flex; align-items: center; justify-content: center; border: none;
  font-size: 32rpx; font-weight: 800; color: #059669;
  box-shadow: 0 12rpx 24rpx rgba(16,185,129,.25);
}
.checkin-btn.signed { background: rgba(255,255,255,.2); color: #fff; }
.checkin-btn.done { background: rgba(255,255,255,.12); color: rgba(255,255,255,.7); box-shadow: none; }

.stats-section { padding: 34rpx 30rpx; margin-bottom: 22rpx; }
.section-header { display: flex; flex-direction: column; gap: 8rpx; margin-bottom: 26rpx; }
.section-title { font-size: 32rpx; font-weight: 800; color: #0f172a; display: block; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14rpx; }
.stat-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 24rpx 16rpx; background: #f7faf9; border-radius: 24rpx;
  border: 1rpx solid #edf2ef;
}
.stat-value { font-size: 40rpx; font-weight: 800; margin-bottom: 8rpx; }
.stat-value.primary { color: #059669; }
.stat-value.warning { color: #f59e0b; }
.stat-value.danger { color: #dc2626; }
.stat-value.success { color: #059669; }
.stat-label { font-size: 22rpx; color: #71717a; }

.quick-actions { padding: 34rpx 30rpx; }
.action-scroll { width: 100%; white-space: nowrap; }
.action-grid { display: inline-flex; align-items: center; gap: 16rpx; min-width: 100%; }
.action-card {
  display: flex; flex-direction: column; align-items: center;
  background: #f7faf9; border-radius: 24rpx; padding: 24rpx 20rpx;
  border: 1rpx solid #edf2ef;
  flex-shrink: 0;
  width: 160rpx;
}
.action-icon-wrap {
  width: 64rpx; height: 64rpx;
  border-radius: 16rpx;
  background: rgba(5, 150, 105, 0.08);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12rpx;
}
.action-icon { font-size: 32rpx; }
.action-text { font-size: 24rpx; font-weight: 600; color: #374151; text-align: center; }
</style>
