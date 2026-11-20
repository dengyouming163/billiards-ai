<template>
	<view class="login-page">
		<view class="bg-orb bg-orb-a"></view>
		<view class="bg-orb bg-orb-b"></view>
		<view class="bg-grid"></view>
		<!-- Logo -->
		<view class="logo-area">
			<view class="logo-shell">
				<view class="logo-ring"></view>
				<view class="logo-glow"></view>
				<view class="logo-box">K</view>
			</view>
			<text class="brand-name">客稻云</text>
			<view class="brand-line"></view>
			<text class="brand-sub">PREMIUM BILLIARDS</text>
		</view>

		<!-- Form -->
		<view class="form-area">
			<view class="form-head">
				<text class="form-title">欢迎回来</text>
				<text class="form-desc">登录后台，查看门店、台桌与服务动态</text>
			</view>
			<view class="input-row">
				<Icon name="phone" :size="28" />
				<input v-model="form.phone" class="f-input" placeholder="手机号" type="number" @input="handlePhoneInput" />
			</view>
			<view class="input-row">
				<Icon name="lock" :size="28" />
				<input v-model="form.password" class="f-input" :type="showPassword ? 'text' : 'password'" placeholder="密码" />
			</view>

			<button class="btn-login" :disabled="!canLogin || loading" @click="handleLogin">
				<text v-if="loading" class="btn-loading"><view class="spin"></view>登录中...</text>
				<text v-else>登 录</text>
			</button>
		</view>

		<!-- Agreement -->
		<view class="agree-row">
			<text class="agree-text">登录即同意</text>
			<text class="agree-link" @click="showUserAgreement">《服务协议》</text>
			<text class="agree-text">和</text>
			<text class="agree-link" @click="showPrivacyPolicy">《隐私政策》</text>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { authStore } from '@/stores/auth'
import Icon from '@/components/Icon.vue'

const form = ref({ phone: '', password: '' })
const showPassword = ref(false)
const loading = ref(false)

const canLogin = computed(() => /^1[3-9]\d{9}$/.test(form.value.phone) && form.value.password.length >= 6)

function handlePhoneInput() { form.value.phone = form.value.phone.replace(/\D/g, '') }

function showUserAgreement() { uni.navigateTo({ url: '/pages/legal/service-agreement' }) }
function showPrivacyPolicy() { uni.navigateTo({ url: '/pages/legal/privacy-policy' }) }

async function handleLogin() {
	if (!canLogin.value || loading.value) return
	loading.value = true
	try {
		const result = await authStore.login({ phone: form.value.phone, password: form.value.password })
		if (result) { await authStore.loadPermissions(); uni.showToast({ title: '登录成功', icon: 'success' }); setTimeout(() => uni.reLaunch({ url: '/pages/index/index' }), 1500) }
		else { uni.showToast({ title: '登录失败', icon: 'none' }) }
	} catch (err: any) { uni.showToast({ title: err.message || '登录失败', icon: 'none' }) }
	finally { loading.value = false }
}
</script>

<style lang="scss" scoped>
.login-page {
	height: 100vh;
	position: relative;
	background: linear-gradient(180deg, #07C160 0%, #10B981 45%, #059669 100%);
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: flex-start;
	padding: 120rpx 48rpx 48rpx;
	overflow: hidden;
}

.bg-orb {
	position: absolute;
	border-radius: 50%;
	filter: blur(40rpx);
	pointer-events: none;
}

.bg-orb-a {
	top: 48rpx;
	left: -80rpx;
	width: 400rpx;
	height: 400rpx;
	background: rgba(255, 255, 255, 0.15);
}

.bg-orb-b {
	top: 120rpx;
	right: -60rpx;
	width: 300rpx;
	height: 300rpx;
	background: rgba(255, 255, 255, 0.1);
}

.bg-grid {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 420rpx;
	background-image: linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
	background-size: 28rpx 28rpx;
	mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 88%);
	opacity: 0.5;
	pointer-events: none;
}

.logo-area { position: relative; z-index: 1; text-align: center; margin-bottom: 72rpx; }
.logo-shell { position: relative; width: 170rpx; height: 170rpx; margin: 0 auto 28rpx; display: flex; align-items: center; justify-content: center; }
.logo-ring {
	position: absolute;
	width: 170rpx;
	height: 170rpx;
	border-radius: 50rpx;
	border: 1px solid rgba(255, 255, 255, 0.3);
	background: rgba(255, 255, 255, 0.15);
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.15), 0 0 30rpx rgba(255, 255, 255, 0.15);
	transform: rotate(12deg);
}
.logo-glow {
	position: absolute;
	width: 126rpx;
	height: 126rpx;
	border-radius: 36rpx;
	background: rgba(255, 255, 255, 0.3);
	filter: blur(20rpx);
}
.logo-box {
	position: relative;
	width: 112rpx;
	height: 112rpx;
	background: #ffffff;
	border-radius: 32rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 52rpx;
	font-weight: 800;
	color: #07C160;
	box-shadow: 0 18rpx 42rpx rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.8);
}
.brand-name { display: block; font-size: 50rpx; font-weight: 800; color: #ffffff; letter-spacing: 10rpx; margin-bottom: 16rpx; }
.brand-line { width: 92rpx; height: 6rpx; border-radius: 999rpx; background: rgba(255, 255, 255, 0.5); margin: 0 auto 18rpx; }
.brand-sub { display: block; font-size: 22rpx; color: rgba(255, 255, 255, 0.7); letter-spacing: 6rpx; }

.form-area {
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 620rpx;
	padding: 42rpx 34rpx 36rpx;
	border-radius: 36rpx;
	background: #ffffff;
	box-shadow: 0 20rpx 70rpx rgba(0, 0, 0, 0.15);
}
.form-head { margin-bottom: 30rpx; }
.form-title { display: block; font-size: 40rpx; font-weight: 800; color: #000000; margin-bottom: 10rpx; }
.form-desc { display: block; font-size: 24rpx; line-height: 1.7; color: #999999; }
.input-row {
	display: flex;
	align-items: center;
	background: #f7f7f7;
	border: 1px solid #e5e5e5;
	border-radius: 26rpx;
	padding: 34rpx 28rpx;
	margin-bottom: 24rpx;
	transition: border-color 0.2s;
	
	&:focus-within {
		border-color: #07C160;
	}

	:deep(.svg-icon) {
		font-size: 34rpx;
		margin-right: 20rpx;
		opacity: 0.6;
		color: #999999;
	}
}
.f-input { flex: 1; border: none; outline: none; font-size: 32rpx; color: #000000; background: transparent; }
.f-input::placeholder { color: #cccccc; }

.btn-login {
	width: 100%;
	height: 104rpx;
	line-height: 104rpx;
	background: #07C160;
	color: #ffffff;
	border: none;
	border-radius: 28rpx;
	font-size: 34rpx;
	font-weight: 800;
	margin-top: 18rpx;
	padding: 0;
	text-align: center;
	box-shadow: 0 18rpx 36rpx rgba(7, 193, 96, 0.3);
	transition: transform 0.2s, box-shadow 0.2s;
	
	&:active:not([disabled]) {
		transform: scale(0.98);
		box-shadow: 0 10rpx 20rpx rgba(7, 193, 96, 0.2);
	}
}
.btn-login[disabled] { opacity: 0.45; box-shadow: none; }
.btn-loading { display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.spin { width: 28rpx; height: 28rpx; border: 3rpx solid rgba(255, 255, 255, 0.3); border-top-color: #ffffff; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.agree-row { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8rpx; margin-top: 42rpx; }
.agree-text { font-size: 22rpx; color: rgba(255, 255, 255, 0.7); }
.agree-link { font-size: 22rpx; color: #ffffff; font-weight: 600; }
</style>
