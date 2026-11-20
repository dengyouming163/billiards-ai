<template>
  <view class="page">
    <StateView :loading="loading" :empty="!loading && listEmpty && !hasError" :error="hasError" empty-msg="暂无考勤数据" error-msg="加载失败" @retry="retryLoad">
      <scroll-view class="content-scroll" scroll-y>
        <view class="page-content">
          <!-- View Mode Toggle -->
          <view class="view-toggle">
            <view class="toggle-chip" :class="{ active: viewMode === 'day' }" @click="switchMode('day')">日视图</view>
            <view class="toggle-chip" :class="{ active: viewMode === 'month' }" @click="switchMode('month')">月视图</view>
          </view>

          <!-- Day View: Date Navigation -->
          <view v-if="viewMode === 'day'" class="date-nav">
            <view class="date-arrow" @click="goDay(-1)"><text>‹ 前一天</text></view>
            <view class="date-center">
              <text class="date-text">{{ displayDate }}</text>
              <text class="date-weekday">{{ weekday }}</text>
            </view>
            <view class="date-arrow" :class="{ disabled: isToday }" @click="goDay(1)">
              <text>{{ isToday ? '今天' : '后一天 ›' }}</text>
            </view>
          </view>

          <!-- Month View: Month Selector -->
          <view v-if="viewMode === 'month'" class="month-selector">
            <view class="selector-btn" @click="prevMonth">
              <text>‹</text>
            </view>
            <text class="month-text">{{ currentMonth }}</text>
            <view class="selector-btn" @click="nextMonth">
              <text>›</text>
            </view>
          </view>

          <!-- ===== DAY VIEW ===== -->
          <template v-if="viewMode === 'day'">
            <!-- Summary Strip -->
            <view class="summary-strip">
              <view class="sum-item"><text class="sum-num">{{ dayData.summary.total }}</text><text class="sum-label">应到</text></view>
              <view class="sum-item checked"><text class="sum-num">{{ dayData.summary.checked_in }}</text><text class="sum-label">已打卡</text></view>
              <view class="sum-item not-checked"><text class="sum-num">{{ dayData.summary.not_checked }}</text><text class="sum-label">未打卡</text></view>
              <view class="sum-item off"><text class="sum-num">{{ dayData.summary.off }}</text><text class="sum-label">休息</text></view>
            </view>

            <!-- Employee Cards -->
            <view class="emp-list-day">
              <view v-for="emp in dayData.list" :key="emp.employee_id" class="emp-card-day" :class="'status-' + emp.status">
                <view class="ecd-header">
                  <image v-if="emp.avatar" :src="emp.avatar" class="ecd-avatar" mode="aspectFill" />
                  <view v-else class="ecd-avatar-placeholder">{{ emp.employee_name[0] }}</view>
                  <view class="ecd-info">
                    <text class="ecd-name">{{ emp.employee_name }}</text>
                    <view class="ecd-tags">
                      <text class="ecd-tag role">{{ emp.role_name }}</text>
                      <text v-if="emp.shift" class="ecd-tag shift">{{ emp.shift.label }} {{ emp.shift.start }}-{{ emp.shift.end }}</text>
                    </view>
                  </view>
                  <view class="ecd-badge" :class="emp.status">
                    <text>{{ dayStatusLabel(emp.status) }}</text>
                  </view>
                </view>

                <view v-if="emp.status === 'off' && !emp.sign_in && !emp.sign_out" class="ecd-off">今日休息 · 无打卡要求</view>

                <view v-if="emp.sign_in || emp.sign_out" class="ecd-records">
                  <view class="ecd-col">
                    <text class="ecd-label">签到</text>
                    <template v-if="emp.sign_in">
                      <text class="ecd-time">{{ emp.sign_in.time }}</text>
                      <view v-if="emp.sign_in.photos.length" class="ecd-photos">
                        <image v-for="(p, idx) in emp.sign_in.photos" :key="'si'+idx" :src="p" class="ecd-photo" mode="aspectFill" @click.stop="previewPhotos(emp.sign_in.photos, idx)" />
                      </view>
                      <text v-if="emp.sign_in.late_minutes > 0" class="ecd-tag-late">迟到{{ emp.sign_in.late_minutes }}分</text>
                    </template>
                    <text v-else class="ecd-empty">-</text>
                  </view>
                  <view class="ecd-divider"></view>
                  <view class="ecd-col">
                    <text class="ecd-label">签退</text>
                    <template v-if="emp.sign_out">
                      <text class="ecd-time">{{ emp.sign_out.time }}</text>
                      <view v-if="emp.sign_out.photos.length" class="ecd-photos">
                        <image v-for="(p, idx) in emp.sign_out.photos" :key="'so'+idx" :src="p" class="ecd-photo" mode="aspectFill" @click.stop="previewPhotos(emp.sign_out.photos, idx)" />
                      </view>
                    </template>
                    <text v-else class="ecd-empty">-</text>
                    <text v-if="emp.status === 'checked_in' && !emp.sign_out" class="ecd-tag-missing">未签退</text>
                  </view>
                </view>
              </view>
            </view>
          </template>

          <!-- ===== MONTH VIEW (existing, unchanged) ===== -->
          <template v-if="viewMode === 'month'">
            <!-- 汇总卡片 -->
            <view class="summary-card">
              <view class="summary-row">
                <view class="summary-item">
                  <text class="summary-value primary">{{ reportData.total_scheduled_days }}</text>
                  <text class="summary-label">应出勤天</text>
                </view>
                <view class="summary-item">
                  <text class="summary-value success">{{ reportData.total_sign_in_days }}</text>
                  <text class="summary-label">实际签到天</text>
                </view>
                <view class="summary-item">
                  <text class="summary-value" :class="attendanceRateClass">{{ reportData.overall_attendance_rate }}%</text>
                  <text class="summary-label">出勤率</text>
                </view>
                <view class="summary-item">
                  <text class="summary-value info">{{ reportData.total_employees }}</text>
                  <text class="summary-label">总人数</text>
                </view>
              </view>
            </view>

            <!-- 员工类型筛选 -->
            <view class="type-filter">
              <view
                v-for="t in typeOptions"
                :key="t.key"
                class="filter-chip"
                :class="{ active: employeeType === t.key }"
                @click="switchType(t.key)"
              >
                {{ t.label }}
              </view>
            </view>

            <!-- 员工列表 -->
            <view class="employee-list">
              <view class="employee-card" v-for="emp in employees" :key="emp.employee_id" @click="toggleExpand(emp.employee_id)">
                <view class="emp-header">
                  <view class="emp-left">
                    <image v-if="emp.avatar" :src="emp.avatar" class="emp-avatar" mode="aspectFill" />
                    <view v-else class="emp-avatar-placeholder">
                      <text>{{ (emp.employee_name || '?')[0] }}</text>
                    </view>
                    <view class="emp-info">
                      <text class="emp-name">{{ emp.employee_name }}</text>
                      <text class="emp-role">{{ roleLabel(emp.role || emp.role_name) }}</text>
                    </view>
                  </view>
                  <view class="emp-right">
                    <view class="emp-stats">
                      <text class="emp-stat-val">{{ emp.sign_in_days }}/{{ emp.scheduled_days }}</text>
                      <text class="emp-stat-lbl">签到/应出勤</text>
                    </view>
                    <view class="emp-rate" :class="getRateClass(emp.attendance_rate)">
                      {{ emp.attendance_rate }}%
                    </view>
                    <view v-if="emp.has_photos" class="photo-badge">
                      <text>📷</text>
                    </view>
                  </view>
                </view>

                <!-- 展开详情 -->
                <view v-if="expandedId === emp.employee_id" class="emp-detail">
                  <view class="detail-stats-row">
                    <view class="detail-stat">
                      <text class="ds-val green">{{ emp.sign_in_days }}</text>
                      <text class="ds-lbl">签到</text>
                    </view>
                    <view class="detail-stat">
                      <text class="ds-val amber">{{ emp.late_days }}</text>
                      <text class="ds-lbl">迟到</text>
                    </view>
                    <view class="detail-stat">
                      <text class="ds-val red">{{ emp.absent_days }}</text>
                      <text class="ds-lbl">缺勤</text>
                    </view>
                  </view>

                  <view v-if="emp.daily_records && emp.daily_records.length > 0" class="daily-list">
                    <view class="daily-item" v-for="day in emp.daily_records" :key="day.date">
                      <view class="daily-left">
                        <text class="daily-date">{{ formatDay(day.date) }}</text>
                        <text class="daily-week">{{ day.week_day }}</text>
                      </view>
                      <view class="daily-middle">
                        <view class="daily-times">
                          <text class="dt-label">签到</text>
                          <text class="dt-value">{{ day.sign_in_time || '--:--' }}</text>
                        </view>
                        <view class="daily-divider"></view>
                        <view class="daily-times">
                          <text class="dt-label">签退</text>
                          <text class="dt-value">{{ day.sign_out_time || '--:--' }}</text>
                        </view>
                      </view>
                      <view class="daily-right">
                        <view class="daily-status" :class="'status-' + day.status">
                          <text>{{ statusMap[day.status] }}</text>
                        </view>
                      </view>
                      <!-- 照片缩略图 -->
                      <view v-if="day.photos && day.photos.length > 0" class="daily-photos">
                        <image
                          v-for="(p, idx) in day.photos"
                          :key="idx"
                          :src="p"
                          class="photo-thumb"
                          mode="aspectFill"
                          @click.stop="previewPhoto(p)"
                        />
                      </view>
                    </view>
                  </view>
                  <view v-else class="no-detail">
                    <text>暂无详细打卡记录</text>
                  </view>
                </view>
              </view>
            </view>
          </template>
        </view>
      </scroll-view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAttendanceReport } from '@/api/modules/dashboard'
import type { AttendanceReportData, AttendanceReportEmployee } from '@/api/modules/dashboard'
import { getDailyAttendance } from '@/api/modules/checkin'
import type { DailyAttendanceData } from '@/api/modules/checkin'
import StateView from '@/components/StateView.vue'
''
import { authStore } from '@/stores/auth'

const currentYear = ref(new Date().getFullYear())
const currentMonthNum = ref(new Date().getMonth() + 1)
const employeeType = ref('all')
const reportData = ref<AttendanceReportData>({
  month: '',
  total_employees: 0,
  total_scheduled_days: 0,
  total_sign_in_days: 0,
  overall_attendance_rate: 0,
  employees: [],
})
const loading = ref(false)
const hasError = ref(false)
const expandedId = ref('')
const viewMode = ref<'day' | 'month'>('day')
const currentDate = ref(new Date())
const dayData = ref<DailyAttendanceData>({
  date: '',
  summary: { total: 0, checked_in: 0, not_checked: 0, off: 0 },
  list: [],
})

const typeOptions = [
  { key: 'all', label: '全部' },
  { key: 'assistant', label: '助教' },
  { key: 'employee', label: '员工' },
]

const ROLE_LABEL: Record<string, string> = {
  assistant: '助教',
  employee: '员工',
  boss: '老板',
  manager: '经理',
  finance: '财务',
  coach: '教练',
  cashier: '收银员',
  waiter: '服务员',
  admin: '管理员',
  owner: '老板',
}

function roleLabel(code: string): string {
  return ROLE_LABEL[code] || code
}

const statusMap: Record<string, string> = {
  normal: '正常',
  late: '迟到',
  absent: '缺勤',
  off: '休息',
}

const employees = computed(() => reportData.value.employees || [])

const currentMonth = computed(() => {
  return `${currentYear.value}年${currentMonthNum.value}月`
})

const apiMonth = computed(() => {
  return `${currentYear.value}-${String(currentMonthNum.value).padStart(2, '0')}`
})

const attendanceRateClass = computed(() => {
  const rate = reportData.value.overall_attendance_rate
  if (rate >= 95) return 'success'
  if (rate >= 80) return 'warning'
  return 'danger'
})

const displayDate = computed(() => {
  const d = currentDate.value
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const weekday = computed(() => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return days[currentDate.value.getDay()]
})

const isToday = computed(() => {
  const now = new Date()
  const d = currentDate.value
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
})

const listEmpty = computed(() => {
  if (viewMode.value === 'day') return dayData.value.list.length === 0
  return employees.value.length === 0
})

// 权限检查: 有 mobile:report 权限 或 管理员角色（兼容角色模式）
const canAccess = computed(() => {
  const codes = authStore.permissionCodes
  if (codes.includes('mobile:report')) return true
  const role = authStore.role
  return role === 'owner' || role === 'manager' || role === 'admin'
})

onMounted(() => {
  if (!canAccess.value) {
    uni.showToast({ title: '无权限访问', icon: 'none' })
    setTimeout(() => uni.navigateBack(), 1500)
    return
  }
  loadDayData()
})

async function loadData() {
  loading.value = true
  hasError.value = false
  try {
    const raw = await getAttendanceReport({
      month: apiMonth.value,
      employee_type: employeeType.value,
    })
    // 后端返回扁平数组，前端转换为 AttendanceReportData 结构
    const list: AttendanceReportEmployee[] = (raw as any[]).map((item: Record<string, any>) => ({
      employee_id: item.employee_id || '',
      employee_name: item.employee_name || '',
      role: item.employee_type || '',
      role_name: item.role_name || item.employee_type || '',
      avatar: item.avatar || '',
      scheduled_days: Number(item.scheduled_days ?? 0),
      sign_in_days: Number(item.sign_in_days ?? 0),
      absent_days: Number(item.absent_days ?? 0),
      late_days: Number(item.late_days ?? 0),
      attendance_rate: Number(item.attendance_rate ?? ((item.scheduled_days > 0 ? (item.sign_in_days / item.scheduled_days * 100) : 0))),
      has_photos: !!(item.has_photos || (item.photos && item.photos.length > 0)),
      daily_records: item.daily_records || [],
    }))
    const totalSignIn = list.reduce((s, e) => s + e.sign_in_days, 0)
    const totalScheduled = list.reduce((s, e) => s + e.scheduled_days, 0)
    reportData.value = {
      month: apiMonth.value,
      total_employees: list.length,
      total_scheduled_days: totalScheduled,
      total_sign_in_days: totalSignIn,
      overall_attendance_rate: totalScheduled > 0 ? Math.round(totalSignIn / totalScheduled * 100) : 0,
      employees: list,
    }
  } catch {
    reportData.value = {
      month: apiMonth.value,
      total_employees: 0,
      total_scheduled_days: 0,
      total_sign_in_days: 0,
      overall_attendance_rate: 0,
      employees: [],
    }
    hasError.value = true
  } finally {
    loading.value = false
  }
}

function prevMonth() {
  if (currentMonthNum.value === 1) {
    currentMonthNum.value = 12
    currentYear.value--
  } else {
    currentMonthNum.value--
  }
  expandedId.value = ''
  loadData()
}

function nextMonth() {
  if (currentMonthNum.value === 12) {
    currentMonthNum.value = 1
    currentYear.value++
  } else {
    currentMonthNum.value++
  }
  expandedId.value = ''
  loadData()
}

function switchType(key: string) {
  employeeType.value = key
  expandedId.value = ''
  loadData()
}

function toggleExpand(employeeId: string) {
  expandedId.value = expandedId.value === employeeId ? '' : employeeId
}

function getRateClass(rate: number): string {
  if (rate >= 95) return 'rate-good'
  if (rate >= 80) return 'rate-warn'
  return 'rate-bad'
}

function formatDay(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.getDate().toString()
}

function previewPhoto(url: string) {
  uni.previewImage({
    urls: [url],
    current: url,
  })
}

function switchMode(mode: 'day' | 'month') {
  viewMode.value = mode
  if (mode === 'day') loadDayData()
  else loadData()
}

function goDay(delta: number) {
  if (delta > 0 && isToday.value) return
  const d = new Date(currentDate.value)
  d.setDate(d.getDate() + delta)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (d > today) return
  currentDate.value = d
  loadDayData()
}

function dayStatusLabel(status: string): string {
  const map: Record<string, string> = { checked_in: '已打卡', not_checked: '未打卡', off: '休息' }
  return map[status] || status
}

async function loadDayData() {
  loading.value = true
  hasError.value = false
  try {
    const dateStr = currentDate.value.toISOString().substring(0, 10)
    dayData.value = await getDailyAttendance(dateStr)
  } catch {
    hasError.value = true
  } finally {
    loading.value = false
  }
}

function previewPhotos(photos: string[], index: number) {
  uni.previewImage({ current: photos[index], urls: photos })
}

function retryLoad() {
  if (viewMode.value === 'day') loadDayData()
  else loadData()
}
</script>

<style lang="scss">
.page {
  min-height: 100vh;
  background: #f7f7f7;
}

.content-scroll {
  flex: 1;
}

.page-content {
  padding: 20rpx 24rpx;
}

.month-selector {
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40rpx;
}

.selector-btn {
  width: 72rpx;
  height: 72rpx;
  background: #f7f7f7;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #999999;
}

.month-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #000000;
}

.summary-card {
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 36rpx;
  padding: 32rpx 24rpx;
  margin-bottom: 20rpx;
}

.summary-row {
  display: flex;
  justify-content: space-around;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.summary-value {
  font-size: 36rpx;
  font-weight: 800;

  &.primary {
    color: #07C160;
  }

  &.success {
    color: #07C160;
  }

  &.warning {
    color: #f59e0b;
  }

  &.danger {
    color: #dc2626;
  }

  &.info {
    color: #07C160;
  }
}

.summary-label {
  font-size: 22rpx;
  color: #999999;
}

.type-filter {
  display: flex;
  gap: 14rpx;
  margin-bottom: 20rpx;
}

.filter-chip {
  padding: 12rpx 28rpx;
  border-radius: 999rpx;
  font-size: 24rpx;
  font-weight: 600;
  color: #999999;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  transition: all 0.2s;

  &.active {
    background: #07C160;
    color: #ffffff;
    border-color: #07C160;
  }
}

.employee-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.employee-card {
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 24rpx;
  padding: 24rpx;
  transition: all 0.2s;
}

.emp-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.emp-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.emp-avatar {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #f7f7f7;
}

.emp-avatar-placeholder {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  background: #07C160;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
  color: #ffffff;
}

.emp-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.emp-name {
  font-size: 28rpx;
  font-weight: 700;
  color: #000000;
}

.emp-role {
  font-size: 22rpx;
  color: #999999;
}

.emp-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.emp-stats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.emp-stat-val {
  font-size: 26rpx;
  font-weight: 700;
  color: #333333;
}

.emp-stat-lbl {
  font-size: 20rpx;
  color: #999999;
}

.emp-rate {
  font-size: 24rpx;
  font-weight: 700;
  padding: 6rpx 14rpx;
  border-radius: 16rpx;

  &.rate-good {
    background: rgba(7, 193, 96, 0.15);
    color: #07C160;
  }

  &.rate-warn {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.rate-bad {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }
}

.photo-badge {
  font-size: 28rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.emp-detail {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #e5e5e5;
}

.detail-stats-row {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20rpx;
}

.detail-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4rpx;
}

.ds-val {
  font-size: 32rpx;
  font-weight: 800;

  &.green {
    color: #07C160;
  }

  &.amber {
    color: #f59e0b;
  }

  &.red {
    color: #dc2626;
  }
}

.ds-lbl {
  font-size: 20rpx;
  color: #999999;
}

.daily-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.daily-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 16rpx;
  background: #f7f7f7;
  border-radius: 16rpx;
  flex-wrap: wrap;
}

.daily-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 72rpx;
}

.daily-date {
  font-size: 28rpx;
  font-weight: 700;
  color: #000000;
}

.daily-week {
  font-size: 20rpx;
  color: #999999;
}

.daily-middle {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.daily-times {
  display: flex;
  flex-direction: column;
  gap: 2rpx;
}

.dt-label {
  font-size: 18rpx;
  color: #999999;
}

.dt-value {
  font-size: 24rpx;
  font-weight: 600;
  color: #333333;
}

.daily-divider {
  width: 1px;
  height: 28rpx;
  background: #e5e5e5;
}

.daily-right {
  flex-shrink: 0;
}

.daily-status {
  font-size: 20rpx;
  font-weight: 600;
  padding: 4rpx 12rpx;
  border-radius: 12rpx;

  &.status-normal {
    background: rgba(7, 193, 96, 0.15);
    color: #07C160;
  }

  &.status-late {
    background: rgba(245, 158, 11, 0.1);
    color: #f59e0b;
  }

  &.status-absent {
    background: rgba(220, 38, 38, 0.1);
    color: #dc2626;
  }

  &.status-off {
    background: rgba(156, 163, 175, 0.1);
    color: #999999;
  }
}

.daily-photos {
  width: 100%;
  display: flex;
  gap: 8rpx;
  padding-top: 8rpx;
  margin-top: 4rpx;
  border-top: 1rpx dashed #e5e5e5;
}

.photo-thumb {
  width: 80rpx;
  height: 80rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
}

.no-detail {
  text-align: center;
  padding: 20rpx 0;
  font-size: 24rpx;
  color: #999999;
}

/* View Mode Toggle */
.view-toggle {
  display: flex;
  justify-content: center;
  gap: 0;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 6rpx;
  margin-bottom: 20rpx;
  border: 1rpx solid #e5e5e5;
}

.toggle-chip {
  flex: 1;
  text-align: center;
  padding: 14rpx 0;
  font-size: 26rpx;
  font-weight: 600;
  color: #999999;
  border-radius: 16rpx;
  transition: all .2s;

  &.active {
    background: #07C160;
    color: #ffffff;
  }
}

/* Day View: Date Nav */
.date-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 20rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.date-arrow {
  font-size: 26rpx;
  color: #07C160;
  padding: 8rpx 16rpx;

  &.disabled {
    color: #cccccc;
  }
}

.date-center {
  text-align: center;
}

.date-text {
  display: block;
  font-size: 36rpx;
  font-weight: 800;
  color: #000000;
}

.date-weekday {
  display: block;
  font-size: 24rpx;
  color: #999999;
  margin-top: 4rpx;
}

/* Day View: Summary Strip */
.summary-strip {
  display: flex;
  justify-content: space-around;
  padding: 24rpx;
  margin-bottom: 20rpx;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 24rpx;
}

.sum-item {
  text-align: center;

  &.checked .sum-num {
    color: #07C160;
  }

  &.not-checked .sum-num {
    color: #ef4444;
  }

  &.off .sum-num {
    color: #999999;
  }
}

.sum-num {
  display: block;
  font-size: 40rpx;
  font-weight: 800;
  color: #000000;
}

.sum-label {
  display: block;
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
}

/* Day View: Employee Cards */
.emp-list-day {
  display: flex;
  flex-direction: column;
  gap: 18rpx;
}

.emp-card-day {
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
  border-radius: 24rpx;
  padding: 24rpx 28rpx;
  border-left: 6rpx solid #07C160;

  &.status-not_checked {
    border-left-color: #ef4444;
  }

  &.status-off {
    border-left-color: #cccccc;
    opacity: .7;
  }
}

.ecd-header {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 20rpx;
}

.ecd-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.ecd-avatar-placeholder {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #07C160;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ecd-info {
  flex: 1;
}

.ecd-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #000000;
  display: block;
  margin-bottom: 6rpx;
}

.ecd-tags {
  display: flex;
  gap: 8rpx;
  flex-wrap: wrap;
}

.ecd-tag {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;

  &.role {
    background: rgba(7, 193, 96, 0.15);
    color: #07C160;
  }

  &.shift {
    background: #f7f7f7;
    color: #999999;
  }
}

.ecd-badge {
  font-size: 24rpx;
  font-weight: 700;
  padding: 8rpx 20rpx;
  border-radius: 999rpx;
  flex-shrink: 0;

  &.checked_in {
    background: rgba(7, 193, 96, 0.15);
    color: #07C160;
  }

  &.not_checked {
    background: #fef2f2;
    color: #ef4444;
  }

  &.off {
    background: #f7f7f7;
    color: #999999;
  }
}

.ecd-off {
  text-align: center;
  padding: 16rpx;
  font-size: 24rpx;
  color: #999999;
}

.ecd-records {
  display: flex;
  gap: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #e5e5e5;
}

.ecd-col {
  flex: 1;
  text-align: center;
}

.ecd-label {
  font-size: 22rpx;
  color: #999999;
  display: block;
  margin-bottom: 8rpx;
}

.ecd-time {
  font-size: 36rpx;
  font-weight: 800;
  color: #000000;
  display: block;
  margin-bottom: 12rpx;
}

.ecd-photos {
  display: flex;
  justify-content: center;
  gap: 8rpx;
  flex-wrap: wrap;
  margin-bottom: 8rpx;
}

.ecd-photo {
  width: 100rpx;
  height: 100rpx;
  border-radius: 12rpx;
  background: #f7f7f7;
}

.ecd-empty {
  font-size: 28rpx;
  color: #cccccc;
  display: block;
  padding: 16rpx 0;
}

.ecd-tag-late {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-top: 4rpx;
  background: #fef3c7;
  color: #92400e;
}

.ecd-tag-missing {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-top: 4rpx;
  background: #fee2e2;
  color: #dc2626;
}

.ecd-divider {
  width: 1rpx;
  background: #e5e5e5;
}
</style>
