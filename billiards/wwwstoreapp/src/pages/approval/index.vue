<template>
	<view class="page">
		<view class="hero-card">
			<view class="hero-copy">
				<text class="hero-eyebrow">审批中心</text>
				<text class="hero-title">待办和申请统一收口</text>
				<text class="hero-desc">快速查看待我审批、我的申请和处理状态，右下角可直接发起新的审批单。</text>
			</view>
		</view>

		<view class="panel-card mode-panel">
			<view class="segment-bar">
				<view
					v-for="seg in segments"
					:key="seg.key"
					class="segment-item"
					:class="{ active: activeMode === seg.key }"
					@click="switchMode(seg.key)"
				>
					<text>{{ seg.label }}</text>
					<text class="segment-badge" v-if="seg.count > 0">{{ seg.count }}</text>
				</view>
			</view>

			<scroll-view class="filter-bar" scroll-x enhanced show-scrollbar="false">
				<view class="filter-track">
					<view
						v-for="f in currentFilters"
						:key="f.key"
						class="filter-chip"
						:class="{ active: activeFilter === f.key }"
						@click="activeFilter = f.key"
					>
						{{ f.label }}
					</view>
				</view>
			</scroll-view>
		</view>

		<StateView class="approval-state" :loading="loading" :empty="list.length === 0 && !loading" :error="hasError" :empty-msg="emptyTitle" error-msg="加载失败" @retry="loadData(true)">
			<template #empty>
				<view class="empty-card">
					<text class="empty-title">{{ emptyTitle }}</text>
					<text class="empty-desc">{{ emptyDesc }}</text>
					<view class="empty-action" @click="goCreate">发起申请</view>
				</view>
			</template>

			<scroll-view class="content-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh" @scrolltolower="onLoadMore">
				<view class="page-content">
					<view class="card-list">
						<view
							class="card-item"
							v-for="item in list"
							:key="item.id"
							@click="goToDetail(item.id)"
						>
							<view class="card-icon-wrap">
								<Icon class="card-icon" :name="getIcon(item.type)" size="42" />
							</view>
							<view class="card-body">
								<view class="card-row">
									<text class="card-title">{{ item.title || getTypeLabel(item.type) }}</text>
									<view class="card-status" :class="getStatusClass(item.status)">
										{{ getStatusText(item.status) }}
									</view>
								</view>
								<view class="card-row sub">
									<text class="card-meta">{{ activeMode === 'pending' ? (item.applicant_name || item.employee_name) : getTypeLabel(item.type) }}</text>
									<text class="card-time">{{ formatDate(item.created_at) }}</text>
								</view>
								<text class="card-reason" v-if="item.reason">{{ item.reason }}</text>
							</view>
							<text class="card-arrow">›</text>
						</view>
					</view>
					<view class="load-more" v-if="loadingMore && list.length > 0">加载中...</view>
					<view class="load-end" v-if="noMore && list.length > 0">没有更多了</view>
				</view>
			</scroll-view>
		</StateView>

		<view class="fab" @click="goCreate">
			<text class="fab-icon">+</text>
		</view>

		<TabBar />
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { getApprovalLists, getMyApprovalList, getApprovalCount } from '@/api/modules/approval'
import { usePermission } from '@/composables/usePermission'
import { onLoad, onShow } from '@dcloudio/uni-app'
import TabBar from '@/components/TabBar.vue'
import Header from '@/components/Header.vue'
import StateView from '@/components/StateView.vue'
import Icon from '@/components/Icon.vue'
import { formatDateTimeFixed } from '@/utils/date'

const { canAccessModule } = usePermission()

const activeMode = ref<'pending' | 'my'>('pending')
const activeFilter = ref('pending')
const list = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const loadingMore = ref(false)
const hasError = ref(false)
const pageNo = ref(1)
const noMore = ref(false)

const segments = reactive([
	{ key: 'pending' as const, label: '待我审批', count: 0 },
	{ key: 'my' as const, label: '我的申请', count: 0 },
])

const pendingFilters = [
	{ key: 'pending', label: '待处理' },
	{ key: 'approved', label: '已通过' },
	{ key: 'rejected', label: '已拒绝' },
]

const myFilters = [
	{ key: '', label: '全部' },
	{ key: 'pending', label: '审批中' },
	{ key: 'approved', label: '已通过' },
	{ key: 'rejected', label: '已拒绝' },
]

const currentFilters = computed(() => {
	return activeMode.value === 'pending' ? pendingFilters : myFilters
})

const emptyTitle = computed(() => {
	return activeMode.value === 'pending' ? '暂无待处理的审批' : '暂无申请记录'
})

const emptyDesc = computed(() => {
	return activeMode.value === 'pending' ? '当有新的审批申请时，将显示在这里' : '点击右下角按钮发起新的申请'
})

function switchMode(key: 'pending' | 'my') {
	activeMode.value = key
	activeFilter.value = currentFilters.value[0]?.key ?? ''
}

onLoad((options: any) => {
	const canApprove = canAccessModule('mobile:approval')
	const canApply = canAccessModule('mobile:apply')

	if (options?.tab === 'my' && canApply) {
		activeMode.value = 'my'
		activeFilter.value = ''
	} else if (!canApprove && canApply) {
		activeMode.value = 'my'
		activeFilter.value = ''
	} else {
		activeMode.value = 'pending'
		activeFilter.value = 'pending'
	}
})

onMounted(() => {
	loadCounts()
	loadData()
})

onShow(() => {
	loadCounts()
	loadData(true)
})

watch([activeMode, activeFilter], () => {
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
	try {
		if (activeMode.value === 'pending') {
			const result = await getApprovalLists(activeFilter.value, reset ? 1 : pageNo.value, 20)
			const dataList = result.list || []
			if (reset) {
				list.value = dataList
			} else {
				list.value = [...list.value, ...dataList]
			}
			noMore.value = dataList.length < 20
		} else {
			const status = activeFilter.value || undefined
			const dataList = (await getMyApprovalList({ status, page: reset ? 1 : pageNo.value, page_size: 20 })).list || []
				if (reset) {
					list.value = dataList
				} else {
					list.value = [...list.value, ...dataList]
				}
				noMore.value = dataList.length < 20
		}
		if (!noMore.value) {
			pageNo.value++
		}
	} catch {
		if (reset) list.value = []
		hasError.value = true
	} finally {
		loading.value = false
		refreshing.value = false
		loadingMore.value = false
	}
}

async function loadCounts() {
	try {
		const result = await getApprovalCount()
		segments[0].count = result.pending || 0
		segments[1].count = result.my || 0
	} catch {
		console.error('Failed to load counts')
	}
}

function onRefresh() {
	refreshing.value = true
	loadData(true)
}

function onLoadMore() {
	if (loadingMore.value || noMore.value) return
	loadData(false)
}

const typeLabelMap: Record<string, string> = {
	leave: '请假申请',
	checkin: '补卡申请',
	outwork: '外勤申请',
	schedule: '排班申请',
	exchange: '换班申请',
	overtime: '加班申请',
}

function getTypeLabel(type: string): string {
	return typeLabelMap[type] || '其他申请'
}

function getIcon(type: string): string {
	const icons: Record<string, string> = {
		leave: 'leave',
		checkin: 'location',
		outwork: 'outwork',
		schedule: 'clock',
		exchange: 'refresh',
		overtime: 'overtime',
	}
	return icons[type] || 'fileText'
}

function getStatusClass(status: string): string {
	return status || 'pending'
}

function getStatusText(status: string): string {
	const texts: Record<string, string> = {
		pending: '待审批',
		approved: '已通过',
		rejected: '已拒绝',
	}
	return texts[status] || status || '未知'
}

function formatDate(timeStr: string): string {
	const formatted = formatDateTimeFixed(timeStr)
	return formatted === '-' ? '' : formatted
}

function goToDetail(id: string) {
	uni.navigateTo({
		url: `/pages/approval/detail?id=${id}&type=${activeMode.value}`
	})
}

function goCreate() {
	uni.navigateTo({ url: '/pages/approval/create' })
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f7f7f7;
	display: flex;
	flex-direction: column;
	padding: 16rpx 24rpx calc(env(safe-area-inset-bottom) + 140rpx);
}


.hero-card,
.panel-card {
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
}

.hero-card {
	margin-top: 18rpx;
	padding: 34rpx 30rpx;
	display: flex;
	flex-direction: column;
	gap: 28rpx;
}

.hero-copy {
	display: flex;
	flex-direction: column;
	gap: 10rpx;
}

.hero-eyebrow {
	font-size: 22rpx;
	font-weight: 700;
	color: #07C160;
	letter-spacing: 2rpx;
}

.hero-title {
	font-size: 40rpx;
	line-height: 1.24;
	font-weight: 800;
	color: #000000;
}

.hero-desc {
	font-size: 24rpx;
	line-height: 1.7;
	color: #999999;
}

.hero-stats {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 18rpx;
}

.hero-stat {
	padding: 24rpx;
	border-radius: 12rpx;
	background: #f7f7f7;
	display: flex;
	flex-direction: column;
	gap: 12rpx;

	&.accent {
		background: #07C160;

		.hero-stat-label,
		.hero-stat-value {
			color: #ffffff;
		}
	}
}

.hero-stat-label {
	font-size: 22rpx;
	color: #999999;
}

.hero-stat-value {
	font-size: 42rpx;
	line-height: 1;
	font-weight: 800;
	color: #333333;
}

.mode-panel {
	margin-top: 20rpx;
	padding: 22rpx;
}

.segment-bar {
	display: flex;
	gap: 12rpx;
}

.segment-item {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 8rpx;
	height: 68rpx;
	font-size: 28rpx;
	font-weight: 500;
	color: #999999;
	background: #f7f7f7;
	border-radius: 34rpx;
	transition: all 0.2s ease;

	&.active {
		background: #07C160;
		color: #fff;
		font-weight: 600;

		.segment-badge {
			background: rgba(255, 255, 255, 0.25);
			color: #fff;
		}
	}
}

.segment-badge {
	font-size: 20rpx;
	background: #e5e5e5;
	color: #999999;
	padding: 2rpx 12rpx;
	border-radius: 20rpx;
	font-weight: 600;
	min-width: 32rpx;
	text-align: center;
}

.filter-bar {
	white-space: nowrap;
	margin-top: 18rpx;

	.filter-track {
		display: inline-flex;
		gap: 12rpx;
		padding-right: 6rpx;
	}

	.filter-chip {
		display: inline-block;
		padding: 14rpx 26rpx;
		font-size: 24rpx;
		color: #999999;
		background: #f7f7f7;
		border-radius: 999rpx;
		font-weight: 500;
		transition: all 0.15s ease;

		&.active {
			background: rgba(7, 193, 96, 0.1);
			color: #07C160;
			font-weight: 600;
		}
	}
}

.content-scroll {
	flex: 1;
	min-height: 0;
}

.page-content {
	padding: 20rpx 0 0;
}

.approval-state {
	flex: 1;
	min-height: 0;
}

.approval-state :deep(.state-content) {
	height: 100%;
}

.approval-state :deep(.state-empty),
.approval-state :deep(.state-error),
.approval-state :deep(.state-loading) {
	padding-top: 24rpx;
}

.load-more,
.load-end {
	display: flex;
	justify-content: center;
	padding: 24rpx 0;
	font-size: 24rpx;
	color: #999999;
}

.card-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.card-item {
	display: flex;
	align-items: flex-start;
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	border-radius: 16rpx;
	padding: 26rpx;
}

.card-icon-wrap {
	width: 88rpx;
	height: 88rpx;
	border-radius: 16rpx;
	background: #f7f7f7;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 18rpx;
	flex-shrink: 0;
}

.card-icon {
	font-size: 42rpx;
	line-height: 1;
	color: #07C160;
}

.card-body {
	flex: 1;
	min-width: 0;
	display: flex;
	flex-direction: column;
	gap: 6rpx;
}

.card-row {
	display: flex;
	justify-content: space-between;
	align-items: center;

	&.sub {
		gap: 12rpx;
	}
}

.card-title {
	font-size: 28rpx;
	font-weight: 600;
	color: #333333;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.card-status {
	font-size: 22rpx;
	padding: 8rpx 18rpx;
	border-radius: 999rpx;
	font-weight: 600;
	flex-shrink: 0;

	&.pending {
		background: rgba(255, 149, 0, 0.1);
		color: #ff9500;
	}

	&.approved {
		background: rgba(7, 193, 96, 0.1);
		color: #07C160;
	}

	&.rejected {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}
}

.card-meta {
	font-size: 24rpx;
	color: #999999;
	max-width: 50%;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.card-time {
	font-size: 22rpx;
	color: #999999;
	margin-left: auto;
	flex-shrink: 0;
}

.card-reason {
	font-size: 24rpx;
	line-height: 1.6;
	color: #999999;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
	margin-top: 2rpx;
}

.card-arrow {
	font-size: 32rpx;
	color: #cccccc;
	margin-left: 12rpx;
	align-self: center;
	flex-shrink: 0;
}

.fab {
	position: fixed;
	bottom: 180rpx;
	right: 32rpx;
	width: 100rpx;
	height: 100rpx;
	background: #07C160;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(7, 193, 96, 0.3);
	z-index: 100;

	.fab-icon {
		font-size: 52rpx;
		color: #fff;
		font-weight: 300;
		line-height: 1;
	}
}

.empty-card {
	width: 100%;
	padding: 44rpx 36rpx;
	border-radius: 16rpx;
	background: #ffffff;
	border: 1rpx solid #e5e5e5;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 16rpx;
	text-align: center;
}

.empty-title {
	font-size: 32rpx;
	font-weight: 700;
	color: #333333;
}

.empty-desc {
	font-size: 24rpx;
	line-height: 1.7;
	color: #999999;
}

.empty-action {
	margin-top: 6rpx;
	padding: 18rpx 34rpx;
	border-radius: 999rpx;
	background: #07C160;
	font-size: 24rpx;
	font-weight: 600;
	color: #ffffff;
}
</style>
