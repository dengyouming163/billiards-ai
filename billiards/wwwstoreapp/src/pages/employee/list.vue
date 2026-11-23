<template>
  <view class="page">
    <!-- Search Bar -->
    <view class="search-bar">
      <view class="search-inner">
        <text class="search-icon">🔍</text>
        <input
          class="search-input"
          v-model="searchKeyword"
          placeholder="搜索姓名或手机号"
          @input="onSearchInput"
        />
        <text v-if="searchKeyword" class="search-clear" @click="clearSearch">✕</text>
      </view>
    </view>

    <scroll-view
      class="content-scroll"
      scroll-y
      enhanced
      show-scrollbar="false"
      :refresher-enabled="true"
      :refresher-triggered="refreshing"
      @refresherrefresh="onRefresh"
    >
      <StateView
        :loading="loading && list.length === 0"
        :empty="list.length === 0 && !loading && !hasError"
        :error="hasError"
        empty-msg="暂无员工"
        error-msg="加载失败"
        @retry="loadData"
      >
        <view class="card-list">
          <view class="emp-card" v-for="item in list" :key="item.id" @click="goDetail(item.id)">
            <view class="card-avatar" :style="{ background: avatarBg(item.role) }">
              <text class="avatar-text">{{ item.name?.charAt(0) || '?' }}</text>
            </view>
            <view class="card-info">
              <view class="card-name-row">
                <text class="emp-name">{{ item.name }}</text>
                <view class="role-tag" :style="{ background: roleColor(item.role) + '18', color: roleColor(item.role) }">
                  {{ roleLabel(item.role) }}
                </view>
              </view>
              <text class="emp-phone">📱 {{ item.phone || '-' }}</text>
              <text class="emp-extra" v-if="item.position || item.hire_date">
                {{ [item.position, formatDate(item.hire_date)].filter(Boolean).join(' · ') }}
              </text>
            </view>
            <view class="card-status" :class="item.status === 1 ? 'on' : 'off'" />
          </view>
        </view>
      </StateView>
    </scroll-view>

    <!-- FAB Add Button -->
    <view class="fab" @click="goAdd">
      <text class="fab-icon">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getEmployeeList } from '@/api/modules/employee'
import type { Employee } from '@/types'
import StateView from '@/components/StateView.vue'

const ROLE_LABELS: Record<string, string> = {
  boss: '老板', manager: '经理', finance: '财务',
  coach: '教练', cashier: '收银员', assistant: '助教', waiter: '服务员',
}

const ROLE_COLORS: Record<string, string> = {
  boss: '#ef4444', manager: '#f59e0b', finance: '#8b5cf6',
  coach: '#06b6d4', cashier: '#10b981', assistant: '#059669', waiter: '#6366f1',
}

function roleLabel(role: string) { return ROLE_LABELS[role] || role || '未知' }
function roleColor(role: string) { return ROLE_COLORS[role] || '#94a3b8' }
function avatarBg(role: string) { return `linear-gradient(135deg, ${roleColor(role)}22, ${roleColor(role)}44)` }

function formatDate(dateStr?: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr.replace(/-/g, '/'))
  if (isNaN(d.getTime())) return dateStr
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`
}

const list = ref<Employee[]>([])
const searchKeyword = ref('')
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => loadData(), 300)
}

function clearSearch() {
  searchKeyword.value = ''
  loadData()
}

onMounted(() => { loadData() })
onShow(() => { loadData() })

async function onRefresh() {
  refreshing.value = true
  await loadData()
  refreshing.value = false
}

async function loadData() {
  hasError.value = false
  loading.value = true
  try {
    const params: any = {}
    if (searchKeyword.value.trim()) params.keyword = searchKeyword.value.trim()
    const result: any = await getEmployeeList(params)
    const data = Array.isArray(result) ? result : (result.list || result.data || [])
    list.value = data
  } catch (e: any) {
    hasError.value = true
    list.value = []
  } finally {
    loading.value = false
  }
}

function goDetail(id: string | number) {
  uni.navigateTo({ url: `/pages/employee/detail?id=${id}` })
}

function goAdd() {
  uni.navigateTo({ url: '/pages/employee/add' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  max-width: 100vw;
  overflow-x: hidden;
  box-sizing: border-box;
  background: #f5f5f5;
  display: flex;
  flex-direction: column;
}

/* Search */
.search-bar {
  padding: 16rpx 24rpx;
  background: #fff;
  flex-shrink: 0;
}

.search-inner {
  display: flex;
  align-items: center;
  background: #f3f4f6;
  border-radius: 40rpx;
  padding: 0 24rpx;
  height: 72rpx;
}

.search-icon { font-size: 28rpx; margin-right: 12rpx; }

.search-input {
  flex: 1;
  font-size: 28rpx;
  color: #1a1a1a;
  height: 72rpx;
}

.search-clear {
  font-size: 28rpx;
  color: #9ca3af;
  padding: 8rpx;
}

/* Content */
.content-scroll {
  flex: 1;
  width: auto;
  padding: 16rpx 24rpx 120rpx;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

/* Card */
.emp-card {
  display: flex;
  align-items: center;
  gap: 20rpx;
  padding: 24rpx;
  background: #fff;
  border-radius: 20rpx;
  transition: transform .15s;

  &:active { transform: scale(.98); }
}

.card-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #374151;
}

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.card-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.emp-name {
  font-size: 30rpx;
  font-weight: 700;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tag {
  font-size: 20rpx;
  font-weight: 600;
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.emp-phone {
  font-size: 24rpx;
  color: #6b7280;
}

.emp-extra {
  font-size: 22rpx;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-status {
  width: 14rpx;
  height: 14rpx;
  border-radius: 50%;
  flex-shrink: 0;

  &.on { background: #10b981; box-shadow: 0 0 8rpx rgba(16,185,129,.4); }
  &.off { background: #d1d5db; }
}

/* FAB */
.fab {
  position: fixed;
  right: 32rpx;
  bottom: calc(env(safe-area-inset-bottom) + 48rpx);
  width: 96rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #059669, #047857);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(5,150,105,.35);
  z-index: 100;

  &:active { transform: scale(.9); }
}

.fab-icon {
  font-size: 44rpx;
  color: #fff;
  font-weight: 300;
  line-height: 1;
}
</style>
