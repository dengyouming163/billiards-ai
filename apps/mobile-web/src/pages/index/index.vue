<template>
	<view class="index-page">
		<Header />
		<view v-if="isLoading" class="loading-state">
			<text class="loading-icon">🔄</text>
			<text class="loading-text">加载中...</text>
		</view>
		<view v-else-if="authStore.isOwner && storeStore.storeList.length === 0" class="no-store-state">
			<text class="no-store-icon">🏪</text>
			<text class="no-store-title">暂无门店</text>
			<text class="no-store-desc">请先在PC管理后台添加门店</text>
		</view>
		<view v-else>
			<AssistantHome v-if="authStore.role === 'assistant'" />
			<OwnerHome v-else-if="authStore.canViewDashboard" />
			<EmployeeHome v-else-if="authStore.canCheckin || authStore.canApprove" />
			<view v-else class="empty-home">
				<text class="empty-icon">🏠</text>
				<text class="empty-title">欢迎使用场馆智能运营平台</text>
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
    radial-gradient(circle at top left, rgba(16, 185, 129, 0.12), transparent 28%),
    radial-gradient(circle at top right, rgba(56, 189, 248, 0.08), transparent 24%),
    linear-gradient(180deg, #f3fcf8 0%, #f8fafc 24%, #f5f7f9 100%);
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
	background: rgba(255,255,255,.9);
	box-shadow: 0 12rpx 36rpx rgba(15,23,42,.05);
}

.loading-icon { font-size: 80rpx; animation: spin 1s linear infinite; margin-bottom: 24rpx; }
.loading-text { font-size: 28rpx; color: #64748b; }

@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

.no-store-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 32rpx 24rpx 0;
	padding: 140rpx 40rpx;
	border-radius: 34rpx;
	background: rgba(255,255,255,.92);
	box-shadow: 0 12rpx 36rpx rgba(15,23,42,.05);
}

.no-store-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.no-store-title { font-size: 36rpx; font-weight: 700; color: #0f172a; margin-bottom: 12rpx; }
.no-store-desc { font-size: 28rpx; color: #64748b; }

.empty-home {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	margin: 32rpx 24rpx 0;
	padding: 140rpx 40rpx;
	border-radius: 34rpx;
	background: rgba(255,255,255,.92);
	box-shadow: 0 12rpx 36rpx rgba(15,23,42,.05);
}

.empty-icon { font-size: 120rpx; margin-bottom: 24rpx; }
.empty-title { font-size: 36rpx; font-weight: 700; color: #0f172a; margin-bottom: 12rpx; }
.empty-desc { font-size: 26rpx; color: #64748b; margin-bottom: 48rpx; }

.login-btn {
  width: 400rpx;
  height: 96rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff;
  font-size: 32rpx;
  font-weight: 700;
  border-radius: 999rpx;
  border: none;
  box-shadow: 0 14rpx 28rpx rgba(5,150,105,.2);
}
</style>
