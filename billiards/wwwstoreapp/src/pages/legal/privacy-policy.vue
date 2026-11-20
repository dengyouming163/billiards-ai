<template>
	<scroll-view class="page" scroll-y>
		<view class="hero">
			<text class="hero-title">隐私政策</text>
			<text class="hero-subtitle">更新日期：2026-05-29</text>
		</view>

		<view class="content-card">
			<view v-for="section in sections" :key="section.title" class="section">
				<text class="section-title">{{ section.title }}</text>
				<text v-for="paragraph in section.paragraphs" :key="paragraph" class="section-text">{{ paragraph }}</text>
			</view>
		</view>
	</scroll-view>
</template>

<script setup lang="ts">
const sections = [
	{
		title: '一、我们如何收集和使用信息',
		paragraphs: [
			'为了向你提供登录认证、消息通知、工作台展示、资料维护、图片上传等基础功能，我们会在最小必要范围内收集账号信息、设备信息、操作日志和你主动提交的业务数据。',
			'当你使用上传头像、相册或宣传资料等功能时，我们会在你主动触发该功能后申请访问相机或相册权限，仅用于完成图片选择、拍摄与上传。'
		]
	},
	{
		title: '二、我们可能收集的信息类型',
		paragraphs: [
			'账号与身份信息：包括手机号、登录凭证、门店归属、角色权限以及你在资料页中主动填写或上传的信息。',
			'设备与日志信息：包括设备型号、系统版本、应用版本、网络状态、异常日志、操作记录等，用于保障服务稳定运行、问题排查和体验优化。',
			'图片信息：包括你主动选择或拍摄并上传的图片内容，仅用于你发起的头像、相册、宣传页等相关业务。'
		]
	},
	{
		title: '三、权限使用说明',
		paragraphs: [
			'相机权限：用于在你选择拍照上传图片时调用设备摄像头。',
			'相册/存储读取权限：用于在你选择从相册上传图片时读取你指定的图片内容。',
			'网络权限：用于访问业务接口、同步数据和接收服务响应。',
			'若你拒绝授权相关权限，仅会影响对应功能的使用，不影响其他基础功能。'
		]
	},
	{
		title: '四、信息的存储与保护',
		paragraphs: [
			'我们会采取合理可行的安全措施保护你的信息，包括访问控制、传输保护、日志审计和必要的数据隔离措施。',
			'我们仅在实现本政策所述目的所必要的期限内保留你的个人信息，法律法规另有规定或监管要求的除外。'
		]
	},
	{
		title: '五、信息的共享、转让与公开披露',
		paragraphs: [
			'除法律法规要求、履行法定义务、保障公共安全，或取得你的单独同意外，我们不会向无关第三方出售、出租或非法共享你的个人信息。',
			'在业务确有必要的情况下，我们可能与提供技术支持、存储托管、短信服务等合作方共享必要信息，并要求其履行严格的保密与安全义务。'
		]
	},
	{
		title: '六、你的权利',
		paragraphs: [
			'你有权依法查询、更正、补充你提交的相关信息，并可通过应用内功能或联系管理员申请处理。',
			'在符合法律法规和平台规则的前提下，你可以申请删除相关信息、撤回部分授权或注销账号，但这可能导致部分服务无法继续使用。'
		]
	},
	{
		title: '七、未成年人保护',
		paragraphs: [
			'本应用主要面向球房经营管理相关从业人员和合作人员，不以未成年人为主要服务对象。若你为未成年人，应在监护人指导下阅读并决定是否同意本政策。'
		]
	},
	{
		title: '八、政策更新',
		paragraphs: [
			'当业务功能、适用法律法规或个人信息处理方式发生变化时，我们可能会更新本政策，并通过应用内页面、公示或其他合理方式通知你。',
			'政策更新后，若你继续使用本应用，即视为你已阅读并接受更新后的隐私政策。'
		]
	}
]
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f7f7f7;
	padding: 24rpx;
	box-sizing: border-box;
}

.hero {
	padding: 24rpx 8rpx 28rpx;
}

.hero-title {
	display: block;
	font-size: 42rpx;
	font-weight: 700;
	color: #07C160;
	margin-bottom: 12rpx;
}

.hero-subtitle {
	display: block;
	font-size: 24rpx;
	color: #999999;
}

.content-card {
	background: #ffffff;
	border-radius: 16rpx;
	padding: 32rpx 28rpx;
	border: 1rpx solid #e5e5e5;
}

.section {
	margin-bottom: 32rpx;
}

.section:last-child {
	margin-bottom: 0;
}

.section-title {
	display: block;
	font-size: 30rpx;
	font-weight: 700;
	color: #000000;
	margin-bottom: 16rpx;
}

.section-text {
	display: block;
	font-size: 28rpx;
	line-height: 1.8;
	color: #333333;
	margin-bottom: 12rpx;
}

.section-text:last-child {
	margin-bottom: 0;
}
</style>
