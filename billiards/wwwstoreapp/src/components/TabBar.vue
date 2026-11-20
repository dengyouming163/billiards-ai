<template>
  <view class="tabbar-area">
    <view class="tabbar-inner">
      <view
        v-for="(item, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: currentPath === item.path }"
        @click="handleTabClick(item.path)"
      >
        <view class="tab-icon" :style="{ color: currentPath === item.path ? '#07C160' : '#999999' }">
          <Icon :name="item.iconName" :size="44" :color="currentPath === item.path ? '#07C160' : '#999999'" />
        </view>
        <text class="tab-text">{{ item.text }}</text>
        <view class="badge" v-if="item.badgeKey === 'notification' && notificationStore.unreadCount > 0">
          {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { notificationStore, authStore } from '@/stores'
import Icon from './Icon.vue'

const tabs = computed(() => {
  const perms = new Set(authStore.permissionCodes)

  const allTabs = [
    { path: '/pages/index/index',       iconName: 'home',      text: '首页',   visible: perms.has('mobile:dashboard') || perms.has('mobile:orders') || perms.has('mobile:checkin') },
    { path: '/pages/table/index',       iconName: 'table',     text: '台桌',   visible: perms.has('mobile:table') },
    { path: '/pages/work/index',        iconName: 'briefcase', text: '工作台', visible: perms.has('mobile:work') },
    { path: '/pages/checkin/index',     iconName: 'mapPin',    text: '打卡',   visible: perms.has('mobile:checkin') },
    { path: '/pages/performance/index', iconName: 'barChart',  text: '业绩',   visible: perms.has('mobile:performance') },
    { path: '/pages/profile/index',     iconName: 'user',      text: '我',     visible: perms.has('mobile:profile') },
  ]

  return allTabs.filter(t => t.visible).map(item => ({
    ...item,
    badgeKey: item.path.includes('notification') ? 'notification' : '',
  }))
})

const currentPath = ref('')
const navigating = ref(false)

function updateCurrentPath() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  if (currentPage) {
    const route = currentPage.route || (currentPage as any).$page?.fullPath
    if (route) {
      currentPath.value = '/' + route.replace(/^\//, '')
    }
  }
}

function handleTabClick(path: string) {
  if (currentPath.value === path || navigating.value) return
  navigating.value = true
  currentPath.value = path

  uni.redirectTo({
    url: path,
    complete: (res) => {
      const errMsg = (res as any)?.errMsg || ''
      if (errMsg.includes('fail')) {
        uni.reLaunch({
          url: path,
          complete: () => {
            setTimeout(() => { navigating.value = false }, 120)
          }
        })
        return
      }
      setTimeout(() => { navigating.value = false }, 120)
    }
  })
}

onMounted(() => { updateCurrentPath() })
onShow(() => { updateCurrentPath() })
</script>

<style lang="scss" scoped>
.tabbar-area {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 999;
  background: #ffffff;
  padding: 24rpx 0 calc(32rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #e5e5e5;
}

.tabbar-inner {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 8rpx;
  padding: 12rpx 0;
  transition: all 0.2s;
  
  &.active {    
    .tab-icon {
      color: #07C160;
    }
    
    .tab-text {
      color: #07C160;
      font-weight: 600;
    }
  }
}

.tab-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999999;
  transition: color 0.2s;
}

.tab-text {
  font-size: 22rpx;
  color: #999999;
  line-height: 1;
  transition: color 0.2s;
}

.badge {
  position: absolute;
  top: 0;
  right: calc(50% - 48rpx);
  background: #ef4444;
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  min-width: 28rpx;
  text-align: center;
  line-height: 1.4;
}
</style>
