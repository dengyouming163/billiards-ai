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
				<view class="logo-box">8</view>
			</view>
			<text class="brand-name">VenueIQ</text>
			<view class="brand-line"></view>
			<text class="brand-sub">SMART VENUE OPERATIONS</text>
		</view>

		<!-- Form -->
		<view class="form-area">
			<view class="form-head">
				<text class="form-title">欢迎回来</text>
				<text class="form-desc">登录后台，查看门店、台桌与服务动态</text>
			</view>
			<view class="input-row">
				<text class="input-emoji">📱</text>
				<input v-model="form.phone" class="f-input" placeholder="手机号" type="number" @input="handlePhoneInput" />
			</view>
			<view class="input-row">
				<text class="input-emoji">🔒</text>
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
	background:
		radial-gradient(circle at top left, rgba(86, 190, 163, 0.28), transparent 34%),
		radial-gradient(circle at top right, rgba(251, 191, 36, 0.16), transparent 28%),
		linear-gradient(180deg, #f4fffb 0%, #eefbf7 22%, #f7faf9 55%, #f8f8f6 100%);
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
	filter: blur(24rpx);
	pointer-events: none;
}

.bg-orb-a {
	top: 48rpx;
	left: -80rpx;
	width: 320rpx;
	height: 320rpx;
	background: rgba(16, 185, 129, 0.18);
}

.bg-orb-b {
	top: 120rpx;
	right: -60rpx;
	width: 240rpx;
	height: 240rpx;
	background: rgba(245, 158, 11, 0.14);
}

.bg-grid {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 420rpx;
	background-image: linear-gradient(rgba(5, 150, 105, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(5, 150, 105, 0.05) 1px, transparent 1px);
	background-size: 28rpx 28rpx;
	mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.9), transparent 88%);
	opacity: 0.75;
	pointer-events: none;
}

/* Logo */
.logo-area { position: relative; z-index: 1; text-align: center; margin-bottom: 72rpx; }
.logo-shell { position: relative; width: 170rpx; height: 170rpx; margin: 0 auto 28rpx; display: flex; align-items: center; justify-content: center; }
.logo-ring {
	position: absolute;
	width: 170rpx;
	height: 170rpx;
	border-radius: 50rpx;
	border: 1px solid rgba(5, 150, 105, 0.18);
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.42));
	box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
	transform: rotate(12deg);
}
.logo-glow {
	position: absolute;
	width: 126rpx;
	height: 126rpx;
	border-radius: 36rpx;
	background: rgba(245, 158, 11, 0.18);
	filter: blur(18rpx);
}
.logo-box {
	position: relative;
	width: 112rpx;
	height: 112rpx;
	background: linear-gradient(135deg, #f8d77a, #d8a739 58%, #bb8721);
	border-radius: 32rpx;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 52rpx;
	font-weight: 800;
	color: #163128;
	box-shadow: 0 18rpx 42rpx rgba(212, 168, 83, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.5);
}
.brand-name { display: block; font-size: 50rpx; font-weight: 800; color: #12392d; letter-spacing: 10rpx; margin-bottom: 16rpx; }
.brand-line { width: 92rpx; height: 6rpx; border-radius: 999rpx; background: linear-gradient(90deg, rgba(16, 185, 129, 0.1), #d4a853, rgba(16, 185, 129, 0.1)); margin: 0 auto 18rpx; }
.brand-sub { display: block; font-size: 22rpx; color: #5f766d; letter-spacing: 6rpx; }

/* Form */
.form-area {
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 620rpx;
	padding: 42rpx 34rpx 36rpx;
	border-radius: 36rpx;
	background: rgba(255, 255, 255, 0.84);
	backdrop-filter: blur(18rpx);
	-webkit-backdrop-filter: blur(18rpx);
	box-shadow: 0 20rpx 70rpx rgba(18, 57, 45, 0.12);
	border: 1px solid rgba(255, 255, 255, 0.72);
}
.form-head { margin-bottom: 30rpx; }
.form-title { display: block; font-size: 40rpx; font-weight: 800; color: #163128; margin-bottom: 10rpx; }
.form-desc { display: block; font-size: 24rpx; line-height: 1.7; color: #6b7d76; }
.input-row {
	display: flex;
	align-items: center;
	background: rgba(248, 250, 249, 0.96);
	border: 1px solid rgba(16, 88, 66, 0.08);
	border-radius: 26rpx;
	padding: 34rpx 28rpx;
	margin-bottom: 24rpx;
	box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}
.input-emoji { font-size: 34rpx; margin-right: 20rpx; opacity: 0.58; }
.f-input { flex: 1; border: none; outline: none; font-size: 32rpx; color: #163128; background: transparent; }
.f-input::placeholder { color: #93a49d; }

.btn-login {
	width: 100%;
	height: 104rpx;
	line-height: 104rpx;
	background: linear-gradient(135deg, #10b981, #0f9f72 45%, #f1bd59 130%);
	color: #ffffff;
	border: none;
	border-radius: 28rpx;
	font-size: 34rpx;
	font-weight: 800;
	margin-top: 18rpx;
	padding: 0;
	text-align: center;
	box-shadow: 0 18rpx 36rpx rgba(16, 185, 129, 0.24);
}
.btn-login[disabled] { opacity: 0.45; box-shadow: none; }
.btn-loading { display: flex; align-items: center; justify-content: center; gap: 12rpx; }
.spin { width: 28rpx; height: 28rpx; border: 3rpx solid rgba(255,255,255,.24); border-top-color: #fff; border-radius: 50%; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Agreement */
.agree-row { position: relative; z-index: 1; display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8rpx; margin-top: 42rpx; }
.agree-text { font-size: 22rpx; color: #71847d; }
.agree-link { font-size: 22rpx; color: #0f9f72; font-weight: 600; }
</style>
