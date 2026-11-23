<template>
  <view class="tabbar-area">
    <view class="tabbar-pill">
      <view
        v-for="(item, index) in tabs"
        :key="index"
        class="tab-item"
        :class="{ active: currentPath === item.path }"
        @click="handleTabClick(item.path)"
      >
        <view class="tab-icon">
          <text class="tab-emoji">{{ item.icon }}</text>
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

const tabs = computed(() => {
  const perms = new Set(authStore.permissionCodes)

  const allTabs = [
    { path: '/pages/index/index',       icon: '🏠', text: '首页',   visible: perms.has('mobile:dashboard') || perms.has('mobile:orders') || perms.has('mobile:checkin') },
    { path: '/pages/table/index',       icon: '🎱', text: '台桌',   visible: perms.has('mobile:table') },
    { path: '/pages/work/index',        icon: '💼', text: '工作台', visible: perms.has('mobile:work') },
    { path: '/pages/checkin/index',     icon: '📍', text: '打卡',   visible: perms.has('mobile:checkin') },
    { path: '/pages/performance/index', icon: '📊', text: '业绩',   visible: perms.has('mobile:performance') },
    { path: '/pages/notification/index',icon: '🔔', text: '消息',   visible: perms.has('mobile:notification') },
    { path: '/pages/profile/index',     icon: '👤', text: '我',     visible: perms.has('mobile:profile') },
  ]

  return allTabs.filter(t => t.visible).map(item => ({
    ...item,
    iconName: '',
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
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(18rpx);
  -webkit-backdrop-filter: blur(18rpx);
  padding: 0 0 env(safe-area-inset-bottom);
  border-top: 1rpx solid rgba(226, 232, 240, 0.88);
  box-shadow: 0 -10rpx 30rpx rgba(15, 23, 42, 0.06);
}

.tabbar-pill {
  display: flex;
  justify-content: space-around;
  align-items: center;
  min-height: 112rpx;
  background: transparent;
}

.tab-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  gap: 6rpx;
  min-height: 92rpx;
}

.tab-item.active .tab-text {
  color: #059669;
  font-weight: 700;
}

.tab-icon {
  width: 56rpx;
  height: 56rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 18rpx;
  transition: all 0.2s ease;
}
.tab-emoji { font-size: 42rpx; line-height: 1; }

.tab-item.active .tab-icon {
  color: #059669;
  background: #ecfdf5;
  box-shadow: 0 10rpx 18rpx rgba(5,150,105,.14);
}

.tab-text {
  font-size: 22rpx;
  color: #94a3b8;
  line-height: 1;
}

.badge {
  position: absolute;
  top: 0;
  right: calc(50% - 48rpx);
  background: #dc2626;
  color: #fff;
  font-size: 18rpx;
  padding: 4rpx 10rpx;
  border-radius: 999rpx;
  min-width: 28rpx;
  text-align: center;
  line-height: 1.4;
}
</style>
