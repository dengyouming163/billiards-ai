<template>
	<view class="page">
		<StateView :loading="loading" :empty="records.length === 0 && !loading" :error="hasError" empty-msg="本月暂无打卡记录" error-msg="加载失败" @retry="loadData">
			<scroll-view class="content-scroll" scroll-y :refresher-enabled="true" :refresher-triggered="refreshing" @refresherrefresh="onRefresh">
				<view class="page-content">
					<view class="month-selector">
						<view class="selector-btn" @click="prevMonth">
							<text>‹</text>
						</view>
						<text class="month-text">{{ currentMonth }}</text>
						<view class="selector-btn" @click="nextMonth">
							<text>›</text>
						</view>
					</view>

					<view class="summary-card">
						<view class="summary-row">
							<view class="summary-item">
								<text class="summary-value primary">{{ summary.normal }}</text>
								<text class="summary-label">正常</text>
							</view>
							<view class="summary-item">
								<text class="summary-value warning">{{ summary.late }}</text>
								<text class="summary-label">迟到</text>
							</view>
							<view class="summary-item">
								<text class="summary-value danger">{{ summary.absent }}</text>
								<text class="summary-label">缺勤</text>
							</view>
							<view class="summary-item">
								<text class="summary-value success">{{ summary.avgHours }}h</text>
								<text class="summary-label">平均工时</text>
							</view>
						</view>
					</view>

					<view class="record-list">
						<view class="record-item" v-for="item in records" :key="item.id">
							<view class="record-left">
								<view class="date-day">{{ getDay(item.check_in_time || item.created_at) }}</view>
								<view class="date-week">{{ getWeek(item.check_in_time || item.created_at) }}</view>
							</view>
							<view class="record-middle">
								<view class="record-header">
									<view class="record-status" :class="getStatusClass(item)">
										<text>{{ getStatusText(item) }}</text>
									</view>
									<view v-if="item.is_late" class="late-tag">
										<text>迟到 {{ item.late_minutes || 0 }} 分钟</text>
									</view>
								</view>
								<view class="record-times">
									<view class="time-block">
										<text class="time-label">签到</text>
										<text class="time-value">{{ formatTime(item.check_in_time || item.created_at) }}</text>
									</view>
									<view class="time-divider"></view>
									<view class="time-block">
										<text class="time-label">签退</text>
										<text class="time-value">{{ formatTime(item.check_out_time || item.created_at) }}</text>
									</view>
								</view>
								<view v-if="item.work_hours" class="work-hours">
									<text>⏱️ 工时 {{ item.work_hours }} 小时</text>
								</view>
							</view>
							<view v-if="canApplyCheckin(item)" class="record-right">
								<view class="apply-btn" @click="goToApply(item)">
									<text>补卡</text>
								</view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
		</StateView>
	</view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getCheckinRecords } from '@/api/modules/checkin'
import Header from '@/components/Header.vue'
import StateView from '@/components/StateView.vue'

const currentYear = ref(new Date().getFullYear())
const currentMonthNum = ref(new Date().getMonth() + 1)
const records = ref<any[]>([])
const loading = ref(false)
const refreshing = ref(false)
const hasError = ref(false)

const currentMonth = computed(() => {
	return `${currentYear.value}年${currentMonthNum.value}月`
})

const summary = computed(() => {
	let normal = 0
	let late = 0
	let absent = 0
	let totalHours = 0

	records.value.forEach(item => {
		if (!item.check_in_time) {
			absent++
		} else if (item.is_late) {
			late++
		} else {
			normal++
		}
		if (item.work_hours) {
			totalHours += item.work_hours
		}
	})

	const avgHours = records.value.length > 0 ? (totalHours / records.value.length).toFixed(1) : '0.0'

	return {
		normal,
		late,
		absent,
		avgHours
	}
})

onMounted(() => {
	loadData()
})

function onRefresh() {
	refreshing.value = true
	loadData()
}

async function loadData() {
	loading.value = true
	hasError.value = false
	try {
		const result = await getCheckinRecords(1, 200)
			const allRecords: any[] = result.lists || []
			// 按年月过滤（不过滤缺勤记录，保留用于 summary 计算）
			const monthRecords = allRecords.filter(r => {
				const timeStr = r.check_in_time || r.check_out_time || r.created_at
				if (!timeStr) return false
				const date = new Date(timeStr.replace('T', ' '))
				return date.getFullYear() === currentYear.value && date.getMonth() + 1 === currentMonthNum.value
			}).sort((a, b) => {
				const ta = a.check_in_time || a.check_out_time || a.created_at || ''
				const tb = b.check_in_time || b.check_out_time || b.created_at || ''
				return new Date(tb.replace('T', ' ')).getTime() - new Date(ta.replace('T', ' ')).getTime()
			})

			records.value = monthRecords
	} catch {
		records.value = []
		hasError.value = true
	} finally {
		loading.value = false
		refreshing.value = false
	}
}

function prevMonth() {
	if (currentMonthNum.value === 1) {
		currentMonthNum.value = 12
		currentYear.value--
	} else {
		currentMonthNum.value--
	}
	loadData()
}

function nextMonth() {
	if (currentMonthNum.value === 12) {
		currentMonthNum.value = 1
		currentYear.value++
	} else {
		currentMonthNum.value++
	}
	loadData()
}

function getDay(timeStr: string): string {
	if (!timeStr) return ''
	const date = new Date(timeStr.replace('T', ' '))
	return date.getDate().toString()
}

function getWeek(timeStr: string): string {
	if (!timeStr) return ''
	const weeks = ['日', '一', '二', '三', '四', '五', '六']
	const date = new Date(timeStr.replace('T', ' '))
	return `周${weeks[date.getDay()]}`
}

function formatTime(timeStr: string): string {
	if (!timeStr) return '--:--'
	const date = new Date(timeStr.replace('T', ' '))
	const h = String(date.getHours()).padStart(2, '0')
	const m = String(date.getMinutes()).padStart(2, '0')
	return `${h}:${m}`
}

function getStatusClass(item: any): string {
	if (item.type === "sign_out" && item.created_at) return "normal"
	if (item.type === "sign_in" && item.created_at) return "normal"
	if (item.is_late) return 'late'
	return 'normal'
}

function getStatusText(item: any): string {
	if (item.type === "sign_out" && item.created_at) return "签退"
	if (item.type === "sign_in" && item.created_at) return "签到"
	if (item.is_late) return '迟到'
	return '正常'
}

function canApplyCheckin(item: any): boolean {
	return !item.check_in_time || !item.check_out_time
}

function goToApply(item: any) {
	uni.navigateTo({ url: '/pages/approval/create?type=checkin' })
}
</script>

<style lang="scss">
.page {
	min-height: 100vh;
	background: linear-gradient(180deg, #f9fafb 0%, #f4f4f5 100%);
}

.content-scroll {
	flex: 1;
}

.page-content {
	padding: 20rpx 24rpx;
}

.month-selector {
	background: #ffffff;
	border-radius: 20rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
	display: flex;
	justify-content: center;
	align-items: center;
	gap: 40rpx;
}

.selector-btn {
	width: 72rpx;
	height: 72rpx;
	background: #f4f4f5;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 40rpx;
	color: #71717a;
}

.month-text {
	font-size: 32rpx;
	font-weight: 700;
	color: #09090b;
}

.summary-card {
	background: #ffffff;
	border-radius: 36rpx;
	padding: 32rpx 24rpx;
	margin-bottom: 20rpx;
	box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.05);
}

.summary-row {
	display: flex;
	justify-content: space-around;
}

.summary-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.summary-value {
	font-size: 36rpx;
	font-weight: 800;

	&.primary {
		color: #059669;
	}

	&.warning {
		color: #f59e0b;
	}

	&.danger {
		color: #dc2626;
	}

	&.success {
		color: #059669;
	}
}

.summary-label {
	font-size: 22rpx;
	color: #71717a;
}

.record-list {
	display: flex;
	flex-direction: column;
	gap: 16rpx;
}

.record-item {
	display: flex;
	background: #ffffff;
	border-radius: 32rpx;
	padding: 24rpx;
	box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.03);
}

.record-left {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	width: 100rpx;
	padding-right: 20rpx;
	border-right: 2rpx solid #f4f4f5;
	margin-right: 20rpx;
}

.date-day {
	font-size: 44rpx;
	font-weight: 800;
	color: #09090b;
}

.date-week {
	font-size: 24rpx;
	color: #a1a1aa;
	margin-top: 4rpx;
}

.record-middle {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 12rpx;
}

.record-header {
	display: flex;
	align-items: center;
	gap: 12rpx;
	flex-wrap: wrap;
}

.record-status {
	font-size: 22rpx;
	font-weight: 600;
	padding: 6rpx 14rpx;
	border-radius: 16rpx;

	&.normal {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	&.partial {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	&.late {
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	&.absent {
		background: rgba(156, 163, 175, 0.1);
		color: #71717a;
	}
}

.late-tag {
	font-size: 20rpx;
	padding: 4rpx 10rpx;
	background: rgba(248, 113, 113, 0.1);
	color: #dc2626;
	border-radius: 12rpx;
}

.record-times {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.time-block {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.time-label {
	font-size: 20rpx;
	color: #a1a1aa;
}

.time-value {
	font-size: 28rpx;
	font-weight: 700;
	color: #374151;
}

.time-divider {
	width: 1px;
	height: 32rpx;
	background: #e4e4e7;
}

.work-hours {
	font-size: 22rpx;
	color: #71717a;
}

.record-right {
	display: flex;
	align-items: center;
	margin-left: 16rpx;
}

.apply-btn {
	background: linear-gradient(135deg, #fef3c7, #fde68a);
	color: #92400e;
	padding: 12rpx 24rpx;
	border-radius: 16rpx;
	font-size: 24rpx;
	font-weight: 600;
}
</style>
