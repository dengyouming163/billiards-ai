<template>
  <view class="overlay" v-if="visible" @click.self="close">
    <view class="selector-popup">
      <view class="popup-header">
        <text class="popup-title">选择会员</text>
        <view class="popup-close" @click="close" v-html="Icons.x" />
      </view>
      <view class="search-box">
        <input class="search-input" v-model="keyword" placeholder="搜索会员姓名/手机号" @confirm="search" />
        <text class="search-btn" @click="search">搜索</text>
      </view>
      <scroll-view scroll-y class="member-list">
        <view v-for="m in results" :key="m.id" class="member-item" @click="select(m)">
          <view class="member-main">
            <text class="member-name">{{ m.nickname || m.name }}</text>
            <text class="member-phone">{{ m.mobile || m.account }}</text>
          </view>
          <view class="member-right">
            <text class="member-level">{{ m.level_name || '普通会员' }}</text>
            <text class="member-balance">余额 ¥{{ m.balance || 0 }}</text>
          </view>
        </view>
        <view class="empty" v-if="loading">
          <text>搜索中...</text>
        </view>
        <view class="empty" v-if="!results.length && searched && !loading">
          <text>暂无匹配会员</text>
        </view>
        <view class="empty" v-if="!results.length && !searched">
          <text>请输入关键词搜索</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { searchMembers } from '@/api/modules/table'
import { Icons } from '@/utils/icons'

interface MemberOption {
  id: string
  name?: string
  nickname?: string
  mobile?: string
  account?: string
  phone?: string
  level_name?: string
  balance?: number
}

const emit = defineEmits<{
  (e: 'select', member: MemberOption): void
}>()

const visible = ref(false)
const keyword = ref('')
const results = ref<MemberOption[]>([])
const searched = ref(false)
const loading = ref(false)

function open() {
  keyword.value = ''
  results.value = []
  searched.value = false
  loading.value = false
  visible.value = true
}

function close() {
  visible.value = false
}

async function search() {
  if (!keyword.value.trim()) return
  loading.value = true
  searched.value = true
  try {
    const res = await searchMembers(keyword.value.trim())
    const data = (res as unknown as { data?: MemberOption[] })?.data
      || (res as unknown as MemberOption[])
    results.value = Array.isArray(data) ? data : []
  } catch (e) {
    console.error('会员搜索失败', e)
    results.value = []
  } finally {
    loading.value = false
  }
}

function select(member: MemberOption) {
  emit('select', member)
  close()
}

defineExpose({ open, close })
</script>

<style lang="scss" scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .4);
  z-index: 300;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
}

.selector-popup {
  background: #fff;
  border-radius: 24rpx 24rpx 0 0;
  padding: 24rpx;
  max-height: 60vh;
  display: flex;
  flex-direction: column;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.popup-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1f2937;
}

.popup-close {
  width: 32rpx;
  height: 32rpx;
  color: #9ca3af;
  padding: 8rpx;
}

.search-box {
  display: flex;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.search-input {
  flex: 1;
  padding: 16rpx 20rpx;
  background: #f3f4f6;
  border-radius: 12rpx;
  font-size: 26rpx;
}

.search-btn {
  padding: 16rpx 24rpx;
  background: #059669;
  color: #fff;
  border-radius: 12rpx;
  font-size: 24rpx;
}

.member-list {
  flex: 1;
  overflow: hidden;
}

.member-item {
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f4f4f5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.member-main {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.member-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #1f2937;
}

.member-phone {
  font-size: 22rpx;
  color: #9ca3af;
}

.member-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.member-level {
  font-size: 20rpx;
  padding: 2rpx 12rpx;
  background: #ecfdf5;
  color: #059669;
  border-radius: 6rpx;
}

.member-balance {
  font-size: 26rpx;
  color: #ef4444;
  font-weight: 600;
}

.empty {
  padding: 40rpx;
  text-align: center;
  color: #9ca3af;
}
</style>
