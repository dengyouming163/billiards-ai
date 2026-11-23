<script setup lang="ts">
import { ref } from 'vue'
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { authStore } from '@/stores/auth'

const isOffline = ref(false)

// Page permission map
const pagePermission: Record<string, string | string[]> = {
	'/pages/table/index': 'mobile:table',
	'/pages/table/detail': 'mobile:table',
	'/pages/table/checkout': 'mobile:table',
	'/pages/table/log': 'mobile:table',
	'/pages/table/pending-products': 'mobile:table',
	'/pages/table/pending-assistants': 'mobile:table',
	'/pages/work/index': 'mobile:work',
	'/pages/orders/index': 'mobile:orders',
	'/pages/orders/detail': 'mobile:orders',
	'/pages/employee/list': 'mobile:employee',
	'/pages/employee/detail': 'mobile:employee',
	'/pages/employee/add': 'mobile:employee',
	'/pages/employee/edit': 'mobile:employee',
	'/pages/schedule/index': 'mobile:schedule',
	'/pages/schedule/add': 'mobile:schedule',
	'/pages/schedule/edit': 'mobile:schedule',
	'/pages/approval/index': ['mobile:approval', 'mobile:apply'],
	'/pages/approval/detail': ['mobile:approval', 'mobile:apply'],
	'/pages/approval/create': 'mobile:apply',
	'/pages/approval/my-records': 'mobile:apply',
	'/pages/checkin/index': 'mobile:checkin',
	'/pages/checkin/record': 'mobile:checkin',
	'/pages/checkin/report': 'mobile:report',
	'/pages/performance/index': 'mobile:performance',
	'/pages/performance/orders': 'mobile:performance',
}

// Navigation interceptor for page-level permission guards
uni.addInterceptor('navigateTo', {
	invoke(args) {
		const required = pagePermission[args.url]
		if (required) {
			const codes = authStore.permissionCodes
			const hasAccess = Array.isArray(required)
				? required.some(r => codes.includes(r))
				: codes.includes(required)
			if (!hasAccess) {
				uni.showToast({ title: '无访问权限', icon: 'none', duration: 1500 })
				setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1500)
				return false
			}
		}
	}
})

onLaunch(() => {
	authStore.initFromStorage()

	if (authStore.token && authStore.permissionCodes.length === 0) {
		authStore.loadPermissions()
		return
	}

	const permissionsTime = uni.getStorageSync('permissionsTime')
	if (authStore.token && permissionsTime) {
		const elapsed = Date.now() - permissionsTime
		const oneHour = 60 * 60 * 1000
		if (elapsed > oneHour) {
			authStore.loadPermissions()
		}
	}

	uni.onNetworkStatusChange((res) => {
		isOffline.value = !res.isConnected
		if (!res.isConnected) {
			uni.showToast({ title: '网络已断开', icon: 'none', duration: 3000 })
		}
	})

	// #ifdef H5
	if (process.env.NODE_ENV === 'development') {
		const startTime = Date.now()
		console.log(`[App] Launch: ${startTime}ms`)
	}
	// #endif
})

onShow(() => {
})

onHide(() => {
})
</script>

<template>
	<view>
		<view v-if="isOffline" class="offline-bar">
			<text>网络连接已断开，部分功能不可用</text>
		</view>
	</view>
</template>

<style lang="scss">
@import './uni.scss';

page {
	background-color: #fafafa;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* 修复 uni-app 框架注入的 width:100% 导致内容溢出边框问题 */
uni-scroll-view {
	width: auto !important;
}

.offline-bar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	z-index: 9999;
	background: #ef4444;
	color: #fff;
	text-align: center;
	padding: 12rpx 0;
	font-size: 24rpx;
	padding-top: var(--status-bar-height, 20px);
}
</style>
