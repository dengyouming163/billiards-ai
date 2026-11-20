<template>
	<view class="my-records-page" :class="{ embedded }">
		<Header v-if="!embedded" />
		<view class="page-header">
			<text class="page-title">申请记录</text>
		</view>

		<view class="tabs">
			<view 
				class="tab-item" 
				:class="{ active: activeTab === tab.key }"
				v-for="tab in tabs" 
				:key="tab.key"
				@click="activeTab = tab.key"
			>
				<text>{{ tab.label }}</text>
			</view>
		</view>

		<StateView :loading="loading" :empty="records.length === 0 && !loading" :error="hasError" :empty-msg="'暂无' + (tabs.find(t => t.key === activeTab)?.label || '') + '申请'" error-msg="加载失败" @retry="loadData(true)">
			<scroll-view class="content-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh" @scrolltolower="onLoadMore">
				<view class="page-content">
					<view class="record-list">
						<view 
							class="record-item" 
							v-for="item in records" 
							:key="item.id"
						>
							<Icon class="record-icon" :name="getIcon(item.type)" size="48" />
							<view class="record-content">
								<view class="record-header">
									<text class="record-title">{{ getTypeText(item.type) }}</text>
									<text class="record-status" :class="getStatusClass(item.status)">
										{{ getStatusText(item.status) }}
									</text>
								</view>
								<view class="record-info">
									<text class="record-date">{{ formatDate(item.created_at) }}</text>
								</view>
								<text class="record-reason">{{ item.reason }}</text>
							</view>
						</view>
					</view>
					<view class="load-more" v-if="loadingMore && records.length > 0">加载中...</view>
					<view class="load-end" v-if="noMore && records.length > 0">没有更多了</view>
				</view>
			</scroll-view>
		</StateView>
		<TabBar v-if="!embedded" />
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { getApplyRecords } from '@/api/modules/apply'
import Header from '@/components/Header.vue'
import TabBar from '@/components/TabBar.vue'
import StateView from '@/components/StateView.vue'
import Icon from '@/components/Icon.vue'

const props = defineProps<{
	embedded?: boolean
}>()

const activeTab = ref('all')
const records = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const hasError = ref(false)
const pageNo = ref(1)
const noMore = ref(false)
const tabs = ref([
	{ key: 'all', label: '全部' },
	{ key: 'pending', label: '待审批' },
	{ key: 'approved', label: '已通过' },
	{ key: 'rejected', label: '已拒绝' }
])

onMounted(() => {
	loadData(true)
})

watch(activeTab, () => {
	loadData(true)
})

async function loadData(reset = false) {
	if (reset) {
		pageNo.value = 1
		noMore.value = false
	}
	hasError.value = false
	if (reset) {
		loading.value = true
	} else {
		loadingMore.value = true
	}
	const type = activeTab.value === 'all' ? undefined : activeTab.value
	try {
		const dataList = (await getApplyRecords(type, reset ? 1 : pageNo.value, 20)).list || []
			if (reset) {
				records.value = dataList
			} else {
				records.value = [...records.value, ...dataList]
			}
			noMore.value = dataList.length < 20
			if (!noMore.value) pageNo.value++
	} catch {
		if (reset) records.value = []
		hasError.value = true
	} finally {
		loading.value = false
		refreshing.value = false
		loadingMore.value = false
	}
}

function goDetail(id: string) {
	uni.navigateTo({ url: '/pages/approval/detail?id=' + id })
}

function onRefresh() {
	refreshing.value = true
	loadData(true)
}

function onLoadMore() {
	if (loadingMore.value || noMore.value) return
	loadData(false)
}

function getIcon(type: string): string {
	const icons: Record<string, string> = {
		checkin: 'location',
		leave: 'leave',
		outwork: 'outwork'
	}
	return icons[type] || 'fileText'
}

function getTypeText(type: string): string {
	const texts: Record<string, string> = {
		checkin: '补签申请',
		leave: '请假申请',
		outwork: '外勤申请'
	}
	return texts[type] || '其他申请'
}

function getStatusClass(status: string): string {
	const classes: Record<string, string> = {
		pending: 'pending',
		approved: 'approved',
		rejected: 'rejected'
	}
	return classes[status] || 'pending'
}

function getStatusText(status: string): string {
	const texts: Record<string, string> = {
		pending: '待审批',
		approved: '已通过',
		rejected: '已拒绝'
	}
	return texts[status] || '未知'
}

function formatDate(timeStr: string): string {
	if (!timeStr) return ''
	return new Date(timeStr.replace('T', ' ')).toLocaleDateString()
}
</script>

<style lang="scss">
.my-records-page {
	min-height: 100vh;
	background: #f7f7f7;
	padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.my-records-page.embedded {
	min-height: auto;
	padding-bottom: 0;
}

.page-header {
	padding: 24rpx;
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
}

.page-title {
	font-size: 34rpx;
	font-weight: 600;
	color: #333333;
}

.tabs {
	display: flex;
	background: #ffffff;
	padding: 0 24rpx;
	border-bottom: 1rpx solid #e5e5e5;
}

.tab-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	height: 88rpx;
	position: relative;
	font-size: 28rpx;
	color: #999999;
}

.tab-item.active {
	font-weight: 600;
	color: #07C160;
}

.tab-item.active::after {
	content: '';
	position: absolute;
	bottom: 0;
	left: 50%;
	transform: translateX(-50%);
	width: 48rpx;
	height: 6rpx;
	background: #07C160;
	border-radius: 3rpx;
}

.content-scroll {
	flex: 1;
}

.page-content {
	padding: 24rpx;
}

.load-more,
.load-end {
	display: flex;
	justify-content: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #999999;
}

.record-list {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
}

.record-item {
	display: flex;
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 24rpx;
}

.record-icon {
	font-size: 48rpx;
	margin-right: 20rpx;
	color: #07C160;
}

.record-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.record-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.record-title {
	font-size: 30rpx;
	font-weight: 600;
	color: #333333;
}

.record-status {
	font-size: 24rpx;
	padding: 8rpx 16rpx;
	border-radius: 20rpx;
}

.record-status.pending {
	background: rgba(255, 149, 0, 0.1);
	color: #ff9500;
}

.record-status.approved {
	background: rgba(7, 193, 96, 0.1);
	color: #07C160;
}

.record-status.rejected {
	background: rgba(239, 68, 68, 0.1);
	color: #dc2626;
}

.record-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
}

.record-date {
	font-size: 24rpx;
	color: #999999;
}

.record-reason {
	font-size: 26rpx;
	color: #999999;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}
</style>
