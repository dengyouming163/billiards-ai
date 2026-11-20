<template>
	<scroll-view class="page" scroll-y>
		<view class="hero">
			<text class="hero-title">服务协议</text>
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
		title: '一、协议适用范围',
		paragraphs: [
			'本协议适用于你访问、注册、登录和使用球房管理应用及其相关服务时，与运营方之间形成的全部权利义务关系。',
			'当你点击同意、勾选已阅读或继续使用本应用时，即视为你已经充分阅读、理解并接受本协议全部内容。'
		]
	},
	{
		title: '二、账号注册与使用',
		paragraphs: [
			'你应当提供真实、准确、完整且持续有效的身份信息、联系方式和其他必要资料，并对所提交信息的合法性负责。',
			'你应妥善保管账号、密码、验证码及登录凭证，不得出借、出租、转让或以其他方式允许他人使用你的账号。',
			'因你保管不善或主动授权他人使用账号造成的后果，由你自行承担；法律另有规定或因平台原因造成损失的除外。'
		]
	},
	{
		title: '三、服务内容与规则',
		paragraphs: [
			'本应用主要为球房经营管理场景提供员工工作台、订单处理、消息通知、资料维护、图片上传等移动端服务。',
			'你在使用过程中应遵守法律法规、公序良俗、平台规则以及所在门店或组织的管理制度，不得利用本应用从事违法违规活动。',
			'你不得通过技术手段破坏系统安全、干扰应用正常运行，或恶意获取、篡改、删除、传播他人数据。'
		]
	},
	{
		title: '四、知识产权',
		paragraphs: [
			'本应用及其界面设计、程序代码、文档资料、商标标识、数据呈现等内容的知识产权归运营方或相关权利人所有。',
			'未经书面许可，任何个人或组织不得对上述内容实施复制、传播、修改、反向工程、出租、出售或其他超出授权范围的使用。'
		]
	},
	{
		title: '五、责任限制',
		paragraphs: [
			'运营方将尽合理努力保障服务的连续性、安全性与稳定性，但不对因不可抗力、网络故障、系统维护、第三方原因等造成的服务中断承担违约责任。',
			'对于因你违反本协议、操作不当、提供信息失实或超出合理使用范围所导致的损失、纠纷或监管责任，由你自行承担。'
		]
	},
	{
		title: '六、协议变更与终止',
		paragraphs: [
			'运营方有权根据业务发展、法律法规变化或管理需要对本协议内容进行调整，并通过应用内页面、公示或其他合理方式通知你。',
			'若你不同意更新后的协议内容，应停止使用相关服务；你在协议更新后继续使用本应用的，视为接受更新后的协议。',
			'如你存在严重违反法律法规、本协议或平台规则的行为，运营方有权限制、中止或终止向你提供全部或部分服务。'
		]
	},
	{
		title: '七、其他',
		paragraphs: [
			'本协议未尽事宜，按照相关法律法规及平台届时公布的规则执行；如本协议条款与法律法规强制性规定冲突，以法律法规规定为准。',
			'如你对本协议内容有疑问，可通过应用内反馈渠道或联系管理员进一步咨询。'
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
