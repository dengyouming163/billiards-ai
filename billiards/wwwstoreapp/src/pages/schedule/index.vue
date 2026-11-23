<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">排班管理</text>
        <text class="hero-title">本周排班一屏查看</text>
        <text class="hero-desc">按周查看助教班次，空日期也可以直接补排，不再需要先有记录才能新增。</text>
      </view>

      <view class="week-bar">
        <view class="week-nav" @click="prevWeek"><text>‹</text></view>
        <text class="week-label">{{ weekLabel }}</text>
        <view class="week-nav" @click="nextWeek"><text>›</text></view>
      </view>
    </view>

    <view class="emp-filter">
      <picker mode="selector" :range="employeeLabels" @change="onEmployeeFilterChange" :value="employeeFilterIndex">
        <view class="filter-chip">
          <text>{{ employeeLabels[employeeFilterIndex] || '全部员工' }}</text>
          <text class="chip-arrow">▾</text>
        </view>
      </picker>
    </view>

    <!-- Week Grid -->
    <scroll-view class="content-scroll" scroll-y enhanced show-scrollbar="false"
      :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
      <StateView :loading="loading && schedules.length === 0"
        :error="hasError" error-msg="加载失败" @retry="loadData">
        <view v-if="!loading && schedules.length === 0" class="empty-tip-card">
          <text class="empty-tip-title">本周暂无排班</text>
          <text class="empty-tip-desc">下方日期列仍可直接点击 + 新增排班</text>
        </view>
        <view class="week-grid" v-if="!loading || schedules.length > 0">
          <view class="day-column" v-for="day in weekDays" :key="day.date">
            <view class="day-head" :class="{ today: day.isToday }">
              <text class="day-name">{{ day.label }}</text>
              <text class="day-date">{{ day.dateText }}</text>
            </view>
            <view class="day-slots">
              <view class="slot-card" v-for="s in day.schedules" :key="s.id" @click="goEdit(s.id)" @longpress="handleDelete(s.id, s.employee_name)">
                <text class="slot-name">{{ s.employee_name || '?' }}</text>
                <text class="slot-time">{{ s.start_time || '--' }} - {{ s.end_time || '--' }}</text>
              </view>
              <view class="slot-add" @click="goAdd(day.date)"><text>+</text></view>
            </view>
          </view>
        </view>
      </StateView>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getScheduleList, deleteSchedule } from '@/api/modules/schedule'
import { getAssistantList } from '@/api/modules/table'
import StateView from '@/components/StateView.vue'

function formatLocalDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

// Find Monday of current week
const today = new Date()
const currentMonday = new Date(today)
currentMonday.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))

const weekOffset = ref(0)
const weekStart = computed(() => {
  const d = new Date(currentMonday)
  d.setDate(d.getDate() + weekOffset.value * 7)
  return d
})
const weekEnd = computed(() => {
  const d = new Date(weekStart.value)
  d.setDate(d.getDate() + 6)
  return d
})
const weekLabel = computed(() => `${formatLocalDate(weekStart.value)} - ${formatLocalDate(weekEnd.value)}`)

const weekNames = ['一', '二', '三', '四', '五', '六', '日']
const weekDays = computed(() => {
  const days = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(weekStart.value)
    d.setDate(d.getDate() + i)
    days.push({
      date: formatLocalDate(d),
      label: `周${weekNames[i]}`,
      dateText: `${d.getMonth()+1}/${d.getDate()}`,
      isToday: formatLocalDate(d) === formatLocalDate(today),
      schedules: [] as any[],
    })
  }
  // Attach schedules to their dates
  for (const s of schedules.value) {
    const day = days.find(d => d.date === (s.date || s.work_date))
    if (day) day.schedules.push(s)
  }
  return days
})

const employeeOptions = ref<{ value: string; label: string }[]>([])
const employeeLabels = computed(() => employeeOptions.value.map(e => e.label))
const employeeFilterIndex = ref(0)
const schedules = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)

onMounted(() => { loadEmployees() })
onShow(() => { loadData() })

async function loadEmployees() {
  try {
    const result: any = await getAssistantList()
    const list = Array.isArray(result) ? result : (result?.list || result?.data || [])
    employeeOptions.value = [
      { value: '', label: '全部助教' },
      ...list.map((e: any) => ({ value: e.id, label: e.name || '未知' }))
    ]
    loadData()
  } catch {}
}

async function loadData() {
  hasError.value = false; loading.value = true
  try {
    const emp = employeeOptions.value[employeeFilterIndex.value]
    const dates = { start_date: formatLocalDate(weekStart.value), end_date: formatLocalDate(weekEnd.value) }
    if (emp?.value) {
      // Single assistant
      const result: any = await getScheduleList({ assistant_id: emp.value, ...dates })
      schedules.value = Array.isArray(result) ? result : (result?.list || result?.data || [])
    } else {
      // All assistants - parallel fetch
      const assistants = employeeOptions.value.filter(e => e.value !== '')
      const allResults = await Promise.all(
        assistants.map(a => getScheduleList({ assistant_id: a.value, ...dates }).catch(() => []))
      )
      schedules.value = allResults.flat().filter(Boolean)
    }
  } catch {
    hasError.value = true; schedules.value = []
  } finally { loading.value = false }
}

function onRefresh() { refreshing.value = true; loadData().finally(() => refreshing.value = false) }
function prevWeek() { weekOffset.value--; loadData() }
function nextWeek() { weekOffset.value++; loadData() }
function onEmployeeFilterChange(e: any) { employeeFilterIndex.value = e.detail.value; loadData() }

function goAdd(date?: string) {
  const url = date ? `/pages/schedule/add?date=${date}` : '/pages/schedule/add'
  uni.navigateTo({ url })
}
function goEdit(id: string) { uni.navigateTo({ url: `/pages/schedule/edit?id=${id}` }) }

function handleDelete(id: string, name: string) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除 ${name || '该助教'} 的排班吗？`,
    confirmColor: '#dc2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteSchedule(id)
          uni.showToast({ title: '已删除', icon: 'success' })
          loadData()
        } catch (e: any) { uni.showToast({ title: e.message || '删除失败', icon: 'none' }) }
      }
    }
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  padding: 30rpx 24rpx calc(env(safe-area-inset-bottom) + 24rpx);
}

.hero-card {
  margin-top: 12rpx;
  padding: 34rpx 30rpx;
  border-radius: 34rpx;
  background: linear-gradient(180deg, rgba(255,255,255,.95) 0%, rgba(255,255,255,.86) 100%);
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
  border: 1rpx solid rgba(255,255,255,.78);
}

.hero-copy { display: flex; flex-direction: column; gap: 10rpx; margin-bottom: 28rpx; }
.hero-eyebrow { font-size: 22rpx; color: #059669; font-weight: 700; letter-spacing: 2rpx; }
.hero-title { font-size: 42rpx; line-height: 1.25; color: #0f172a; font-weight: 800; }
.hero-desc { font-size: 24rpx; line-height: 1.7; color: #64748b; }

.week-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0;
  flex-shrink: 0;
}
.week-nav {
  width: 68rpx; height: 68rpx;
  background: #f3f6f5; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 36rpx; color: #374151;
}
.week-label {
  font-size: 30rpx; font-weight: 800; color: #0f172a;
}

.emp-filter {
  padding: 18rpx 2rpx 8rpx;
  flex-shrink: 0;
}
.filter-chip {
  display: inline-flex; align-items: center; gap: 6rpx;
  padding: 16rpx 24rpx; background: #f3f6f5; border-radius: 999rpx;
  font-size: 24rpx; color: #374151; font-weight: 600;
}
.chip-arrow { font-size: 20rpx; color: #9ca3af; }

.content-scroll { flex: 1; }

.empty-tip-card {
  margin: 8rpx 0 18rpx;
  padding: 26rpx 24rpx;
  background: rgba(255,255,255,.95);
  border-radius: 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(15,23,42,.04);
}
.empty-tip-title { display: block; font-size: 28rpx; font-weight: 700; color: #0f172a; margin-bottom: 8rpx; }
.empty-tip-desc { display: block; font-size: 22rpx; color: #64748b; }

.week-grid {
  display: flex; padding: 8rpx 0 120rpx; gap: 12rpx;
}

.day-column {
  flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 10rpx;
}

.day-head {
  text-align: center; padding: 18rpx 8rpx; border-radius: 22rpx; background: rgba(255,255,255,.95); box-shadow: 0 8rpx 24rpx rgba(15,23,42,.04);
  &.today { background: linear-gradient(135deg, #059669, #10b981); .day-name,.day-date { color: #fff } }
}
.day-name { font-size: 22rpx; color: #6b7280; display: block; font-weight: 700; }
.day-date { font-size: 20rpx; color: #9ca3af; margin-top: 4rpx; }

.day-slots { display: flex; flex-direction: column; gap: 8rpx; }

.slot-card {
  background: rgba(255,255,255,.95); border-radius: 18rpx; padding: 16rpx 8rpx; text-align: center;
  border-left: 4rpx solid #059669; box-shadow: 0 8rpx 22rpx rgba(15,23,42,.04);
}
.slot-name { font-size: 22rpx; font-weight: 700; color: #1a1a1a; display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.slot-time { display: block; margin-top: 6rpx; font-size: 18rpx; color: #9ca3af; }

.slot-add {
  background: rgba(255,255,255,.82); border-radius: 18rpx; padding: 16rpx 8rpx;
  text-align: center; border: 2rpx dashed #cbd5e1; box-shadow: 0 8rpx 22rpx rgba(15,23,42,.03);
  &:active { background: #ecfdf5; }
  text { font-size: 30rpx; color: #94a3b8; font-weight: 700; }
}
</style>
