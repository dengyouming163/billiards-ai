<template>
	<view class="index-page">
		<Header />
		<view v-if="isLoading" class="loading-state">
			<Icon class="loading-icon" name="refresh" size="80" />
			<text class="loading-text">加载中...</text>
		</view>
		<view v-else-if="authStore.isOwner && storeStore.storeList.length === 0" class="no-store-state">
			<Icon class="no-store-icon" name="store" size="120" />
			<text class="no-store-title">暂无门店</text>
			<text class="no-store-desc">请先在PC管理后台添加门店</text>
		</view>
		<view v-else>
			<AssistantHome v-if="authStore.role === 'assistant'" />
			<OwnerHome v-else-if="authStore.canViewDashboard" />
			<EmployeeHome v-else-if="authStore.canCheckin || authStore.canApprove" />
			<view v-else class="empty-home">
				<Icon class="empty-icon" name="home" size="120" />
				<text class="empty-title">欢迎使用球房管理系统</text>
				<text class="empty-desc">请登录后查看您的专属功能</text>
				<button class="login-btn" @click="goToLogin">去登录</button>
			</view>
		</view>
		<TabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { authStore, storeStore } from '@/stores'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import OwnerHome from './OwnerHome.vue'
import AssistantHome from './AssistantHome.vue'
import EmployeeHome from './EmployeeHome.vue'
import Icon from '@/components/Icon.vue'

const isLoading = ref(true)

onMounted(() => { checkLogin() })

async function checkLogin() {
	authStore.initFromStorage()
	if (!authStore.token) {
		uni.reLaunch({ url: '/pages/login/index' })
		return
	}
	if (authStore.permissionCodes.length === 0) {
		await authStore.loadPermissions()
	}
	await ensureStoreSelected()
	isLoading.value = false
}

async function ensureStoreSelected() {
	if (!storeStore.isStoreListLoaded || storeStore.storeList.length === 0) {
		try {
			await storeStore.loadStoreList()
			if (storeStore.storeList.length > 0 && !storeStore.currentStore) {
				await storeStore.selectFirstStore()
			}
		} catch {}
	}
}

function goToLogin() {
	uni.reLaunch({ url: '/pages/login/index' })
}
</script>

<style lang="scss" scoped>
.index-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(245, 158, 11, 0.08), transparent 30%),
    radial-gradient(circle at top right, rgba(71, 85, 105, 0.06), transparent 26%),
    linear-gradient(180deg, #0f172a 0%, #1e293b 26%, #0f172a 100%);
  padding-bottom: calc(env(safe-area-inset-bottom) + 156rpx);
}

.loading-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 32rpx 24rpx 0;
	padding: 160rpx 40rpx;
	border-radius: 34rpx;
	box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.2);
}

.loading-icon { font-size: 80rpx; animation: spin 1s linear infinite; margin-bottom: 24rpx; }
.loading-text { font-size: 28rpx; color: #94a3b8; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.no-store-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 32rpx 24rpx 0;
	padding: 140rpx 40rpx;
	border-radius: 34rpx;
	background: rgba(30, 41, 59, 0.7);
	box-shadow: 0 12rpx 36rpx rgba(0, 0, 0, 0.2);
	border: 1rpx solid rgba(71, 85, 105, 0.3);
}

.no-store-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.no-store-title { font-size: 36rpx; font-weight: 700; color: #f8fafc; margin-bottom: 12rpx; }
.no-store-desc { font-size: 28rpx; color: #94a3b8; }

.empty-home {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 32rpx 24rpx 0;
	padding: 140rpx 40rpx;
	border-radius: 24rpx;
	background: #ffffff;
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
	border: 1rpx solid #e5e5e5;
}

.empty-icon { font-size: 100rpx; margin-bottom: 24rpx; color: #cccccc; }
.empty-title { font-size: 32rpx; font-weight: 700; color: #333333; margin-bottom: 12rpx; }
.empty-desc { font-size: 26rpx; color: #999999; margin-bottom: 48rpx; }

.login-btn {
  width: 400rpx;
  height: 88rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  color: #ffffff;
  font-size: 30rpx;
  font-weight: 700;
  border-radius: 999rpx;
  border: none;
  box-shadow: 0 8rpx 20rpx rgba(7, 193, 96, 0.3);
}
</style>
