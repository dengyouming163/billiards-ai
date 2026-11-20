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
                <view class="photo-badge uploaded-badge"><text>✓</text></view>
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
          <view class="action-scroll">
            <view class="action-grid">
              <view class="action-card" v-for="item in approvalTypes" :key="item.type" @click="goToApply(item.type)">
                <view class="action-icon-wrap">
                  <text class="action-icon">{{ getActionEmoji(item.type) }}</text>
                </view>
                <text class="action-text">{{ item.label }}</text>
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
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'
import { useCheckin } from '@/composables/useCheckin'

const approvalTypes = [
  { type: 'checkin', icon: 'mapPin', label: '补卡申请' },
  { type: 'exchange', icon: 'arrowRightLeft', label: '换班申请' },
  { type: 'leave', icon: 'calendar', label: '请假申请' },
  { type: 'outwork', icon: 'briefcase', label: '外勤申请' },
  { type: 'overtime', icon: 'clock', label: '加班申请' },
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
function getActionEmoji(type: string): string {
  const map: Record<string, string> = { checkin: '📍', exchange: '🔄', leave: '🏖', outwork: '🏢', overtime: '⏰' }
  return map[type] || '📄'
}
function goToApply(type: string) { uni.navigateTo({ url: `/pages/approval/create?type=${type}` }) }
</script>

<style lang="scss" scoped>
.checkin-page { min-height: 100vh; background: #f7f7f7; }
.page-content { padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx); }

.stats-section, .quick-actions {
  background: #ffffff;
  border-radius: 36rpx; box-shadow: 0 12rpx 36rpx rgba(0,0,0,.08);
}

.checkin-card {
  background: #ffffff;
  border-radius: 32rpx; padding: 20rpx 20rpx;
  display: flex; flex-direction: column;
  margin-top: 8rpx; margin-bottom: 10rpx;
  box-shadow: 0 8rpx 24rpx rgba(0,0,0,.06);
  gap: 12rpx;
  border: 2rpx solid rgba(7,193,96,.15);
}
.checkin-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  width: 100%;
}
.checkin-date { font-size: 32rpx; font-weight: 700; color: #333; }
.checkin-time { font-size: 48rpx; font-weight: 800; color: #07C160; font-family: monospace; }
.checkin-status {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16rpx 24rpx; border-radius: 20rpx; background: rgba(7,193,96,.06);
}
.status-left { display: flex; align-items: center; gap: 12rpx; }
.status-dot { width: 16rpx; height: 16rpx; border-radius: 50%; background: #07C160; animation: pulse 2s ease-in-out infinite; }
.status-dot.success { background: #07C160; animation: none; }
.status-dot.info { background: #07C160; }
.status-text { font-size: 26rpx; font-weight: 600; color: #333; }
.status-right { display: flex; flex-direction: column; align-items: flex-end; gap: 2rpx; }
.attendance-tag { font-size: 30rpx; font-weight: 800; color: #07C160; }
.attendance-label { font-size: 20rpx; color: #999; }
@keyframes pulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .6; transform: scale(1.1); } }

.checkin-detail {
  display: flex; gap: 20rpx;
}
.detail-text { font-size: 24rpx; color: #999; font-weight: 500; }

.photo-section {
  padding: 20rpx; background: #f7f7f7; border-radius: 20rpx;
}
.photo-section-title { font-size: 24rpx; font-weight: 600; color: #666; display: block; margin-bottom: 12rpx; }
.photo-grid { display: flex; flex-wrap: wrap; gap: 12rpx; margin-bottom: 12rpx; }
.photo-item { position: relative; width: 130rpx; height: 130rpx; border-radius: 12rpx; overflow: hidden; }
.photo-item.uploading { display: flex; align-items: center; justify-content: center; background: #e5e5e5; }
.photo-badge {
  position: absolute; top: 6rpx; left: 6rpx; width: 32rpx; height: 32rpx;
  border-radius: 50%; background: #07C160; color: #fff; font-size: 18rpx;
  display: flex; align-items: center; justify-content: center;
}
.uploading-text { font-size: 20rpx; color: #999; }
.photo-img { width: 100%; height: 100%; }
.photo-delete {
  position: absolute; top: 6rpx; right: 6rpx;
  width: 36rpx; height: 36rpx; background: rgba(0,0,0,.45);
  border-radius: 50%; display: flex; align-items: center; justify-content: center;
}
.delete-icon { color: #fff; font-size: 22rpx; line-height: 1; }
.photo-add {
  width: 130rpx; height: 130rpx; border: 2rpx dashed #ccc;
  border-radius: 12rpx; display: flex; align-items: center; justify-content: center;
}
.add-icon { font-size: 48rpx; color: #999; }
.photo-hint { font-size: 22rpx; color: #999; display: block; text-align: center; }
.photo-hint.ready { color: #07C160; font-weight: 600; }

.checkin-btn {
  width: 100%; height: 88rpx; border-radius: 20rpx; background: #07C160;
  border: none;
  display: flex; align-items: center; justify-content: center;
  font-size: 30rpx; font-weight: 700; color: #ffffff;
}
.checkin-btn.signed { background: rgba(7,193,96,.5); color: #fff; }
.checkin-btn.done { background: #e5e5e5; color: #999; }

.stats-section { padding: 20rpx 20rpx; margin-bottom: 10rpx; }
.section-header { display: flex; flex-direction: column; gap: 8rpx; margin-bottom: 12rpx; }
.section-title { font-size: 32rpx; font-weight: 800; color: #000000; display: block; }
.stats-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10rpx; }
.stat-card {
  display: flex; flex-direction: column; align-items: center;
  padding: 24rpx 16rpx; background: #f7f7f7; border-radius: 24rpx;
}
.stat-value { font-size: 40rpx; font-weight: 800; margin-bottom: 8rpx; }
.stat-value.primary { color: #07C160; }
.stat-value.warning { color: #FF9500; }
.stat-value.danger { color: #FF3B30; }
.stat-value.success { color: #07C160; }
.stat-label { font-size: 22rpx; color: #999999; }

.quick-actions { padding: 20rpx 20rpx; }
.action-scroll { width: 100%; overflow-x: auto; }
.action-grid { display: flex; align-items: center; gap: 12rpx; flex-wrap: wrap; }
.action-card {
  display: flex; flex-direction: column; align-items: center;
  background: #f7f7f7; border-radius: 24rpx; padding: 24rpx 20rpx;
  flex-shrink: 0;
  width: 160rpx;
}
.action-icon-wrap {
  width: 64rpx; height: 64rpx;
  border-radius: 16rpx;
  background: rgba(7, 193, 96, 0.1);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 12rpx;
}
.action-icon { font-size: 32rpx; }
.action-text { font-size: 24rpx; font-weight: 600; color: #333333; text-align: center; }
</style>
