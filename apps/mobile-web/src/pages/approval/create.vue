<template>
	<view class="page">
		<view class="form-content">
			<view class="form-item">
				<text class="form-label">申请类型 *</text>
				<view class="type-selector">
					<view 
						v-for="item in approvalTypes" 
						:key="item.type"
						class="type-item"
						:class="{ selected: form.type === item.type }"
						@click="selectType(item.type)"
					>
						<text class="type-icon">{{ getIcon(item.type) }}</text>
						<text class="type-name">{{ item.name }}</text>
					</view>
				</view>
			</view>

			<view class="form-item">
				<text class="form-label">申请理由 *</text>
				<textarea 
					class="form-textarea"
					v-model="form.reason"
					placeholder="请输入申请理由..."
					:maxlength="500"
				/>
				<text class="textarea-count">{{ form.reason.length }}/500</text>
			</view>

			<view class="form-item" v-if="form.type === 'leave'">
				<text class="form-label">请假类型 *</text>
				<view class="type-selector">
					<view 
						v-for="item in leaveTypes" 
						:key="item"
						class="type-item small"
						:class="{ selected: form.extraData.leaveType === item }"
						@click="form.extraData.leaveType = item"
					>
						<text>{{ item }}</text>
					</view>
				</view>
			</view>

			<view class="form-item" v-if="form.type === 'leave' || form.type === 'overtime'">
				<view class="date-row">
					<view class="date-item">
						<text class="form-label">开始时间 *</text>
						<view class="date-picker" @click="pickDateTime('startTime')">
							<text>{{ form.extraData.startTime || '请选择' }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</view>
					<view class="date-item">
						<text class="form-label">结束时间 *</text>
						<view class="date-picker" @click="pickDateTime('endTime')">
							<text>{{ form.extraData.endTime || '请选择' }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</view>
				</view>
			</view>

			<view class="form-item" v-if="form.type === 'exchange'">
				<text class="form-label">原日期 *</text>
				<view class="date-picker" @click="pickDate('sourceDate')">
					<text>{{ form.extraData.sourceDate || '请选择日期' }}</text>
					<text class="picker-arrow">›</text>
				</view>
			</view>

			<view class="form-item" v-if="form.type === 'exchange'">
				<text class="form-label">目标日期 *</text>
				<view class="date-picker" @click="pickDate('targetDate')">
					<text>{{ form.extraData.targetDate || '请选择日期' }}</text>
					<text class="picker-arrow">›</text>
				</view>
			</view>

			<view class="form-item" v-if="form.type === 'exchange'">
				<text class="form-label">换班人员</text>
				<view class="date-picker" @click="selectAssistant">
					<text>{{ form.extraData.targetEmployeeName || '请选择换班人员' }}</text>
					<text class="picker-arrow">›</text>
				</view>
			</view>

			<view class="form-item" v-if="form.type === 'outwork'">
				<text class="form-label">外勤地点</text>
				<input 
					class="form-input"
					v-model="form.extraData.location"
					placeholder="请输入外勤地点"
				/>
			</view>

			<view class="form-item" v-if="form.type === 'outwork'">
				<view class="date-row">
					<view class="date-item">
						<text class="form-label">开始时间 *</text>
						<view class="date-picker" @click="pickDateTime('outworkStartTime')">
							<text>{{ form.extraData.outworkStartTime || '请选择' }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</view>
					<view class="date-item">
						<text class="form-label">结束时间 *</text>
						<view class="date-picker" @click="pickDateTime('outworkEndTime')">
							<text>{{ form.extraData.outworkEndTime || '请选择' }}</text>
							<text class="picker-arrow">›</text>
						</view>
					</view>
				</view>
			</view>
		</view>

		<view class="submit-area">
			<view class="submit-btn" @click="submitForm">
				<text>提交申请</text>
			</view>
		</view>

		<DatePickerModal 
			:visible="showDatePicker"
			:title="datePickerTitle"
			:mode="datePickerMode"
			:default-value="form.extraData[datePickerField]"
			@close="handleDateClose"
			@confirm="handleDateConfirm"
		/>

		<view class="assistant-modal" v-if="showAssistantPicker" @click="showAssistantPicker = false">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">选择换班人员</text>
					<text class="modal-close" @click="showAssistantPicker = false">×</text>
				</view>
				<view class="modal-list">
					<view 
						v-for="item in assistantList" 
						:key="item.id"
						class="modal-item"
						:class="{ selected: form.extraData.targetEmployeeId === item.id }"
						@click="selectAssistantItem(item)"
					>
						<text class="item-name">{{ item.name }}</text>
						<view class="item-check" v-if="form.extraData.targetEmployeeId === item.id">✓</view>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { createApproval, getApprovalTypes, getAssistantListForExchange } from '@/api/modules/approval'
import DatePickerModal from '@/components/DatePickerModal.vue'

const approvalTypes = ref([
	{ type: 'leave', name: '请假申请' },
	{ type: 'checkin', name: '补卡申请' },
	{ type: 'outwork', name: '外勤申请' },
	{ type: 'exchange', name: '换班申请' },
	{ type: 'overtime', name: '加班申请' },
])

const leaveTypes = ['事假', '病假', '年假', '婚假', '产假', '其他']

const form = reactive({
	type: '',
	reason: '',
	extraData: {
		leaveType: '事假',
		startTime: '',
		endTime: '',
		checkDate: '',
		checkTime: '',
		sourceDate: '',
		targetDate: '',
		targetEmployeeId: '',
		targetEmployeeName: '',
		location: '',
		outworkStartTime: '',
		outworkEndTime: '',
	}
})

const showAssistantPicker = ref(false)
const assistantList = ref<any[]>([])

const showDatePicker = ref(false)
const datePickerMode = ref<'date' | 'time' | 'datetime'>('datetime')
const datePickerField = ref('')
const datePickerTitle = ref('选择日期时间')

function getIcon(type: string): string {
	const icons: Record<string, string> = {
		leave: '🏖️',
		checkin: '📍',
		outwork: '🌐',
		exchange: '🔄',
		overtime: '⏰'
	}
	return icons[type] || '📋'
}

function selectType(type: string) {
	form.type = type
	resetExtraData()
}

function resetExtraData() {
	form.extraData = {
		leaveType: '事假',
		startTime: '',
		endTime: '',
		checkDate: '',
		checkTime: '',
		sourceDate: '',
		targetDate: '',
		targetEmployeeId: '',
		targetEmployeeName: '',
		location: '',
		outworkStartTime: '',
		outworkEndTime: '',
	}
}

function pickDateTime(field: string) {
	datePickerField.value = field
	datePickerMode.value = 'datetime'
	datePickerTitle.value = '选择日期时间'
	showDatePicker.value = true
}

function pickDate(field: string) {
	datePickerField.value = field
	datePickerMode.value = 'date'
	datePickerTitle.value = '选择日期'
	showDatePicker.value = true
}

function pickTime(field: string) {
	datePickerField.value = field
	datePickerMode.value = 'time'
	datePickerTitle.value = '选择时间'
	showDatePicker.value = true
}

function handleDateConfirm(value: string) {
	form.extraData[datePickerField.value] = value
	showDatePicker.value = false
}

function handleDateClose() {
	showDatePicker.value = false
}

async function selectAssistant() {
	try {
		const result = await getAssistantListForExchange()
			assistantList.value = result.list || []
			showAssistantPicker.value = true
	} catch {
		uni.showToast({ title: '获取人员列表失败', icon: 'none' })
	}
}

function selectAssistantItem(item: any) {
	form.extraData.targetEmployeeId = item.id
	form.extraData.targetEmployeeName = item.name
	showAssistantPicker.value = false
}

function validateForm(): boolean {
	if (!form.type) {
		uni.showToast({ title: '请选择申请类型', icon: 'none' })
		return false
	}

	if (form.extraData.startTime && form.extraData.endTime && new Date(form.extraData.startTime) >= new Date(form.extraData.endTime)) {
			uni.showToast({ title: "开始时间必须早于结束时间", icon: "none" })
			return false
		}
		if (!form.reason.trim()) {
		uni.showToast({ title: '请填写申请理由', icon: 'none' })
		return false
	}

	if (form.type === 'leave') {
		if (!form.extraData.startTime) {
			uni.showToast({ title: '请选择开始时间', icon: 'none' })
			return false
		}
		if (!form.extraData.endTime) {
			uni.showToast({ title: '请选择结束时间', icon: 'none' })
			return false
		}
	}

	if (form.type === 'exchange') {
		if (!form.extraData.sourceDate) {
			uni.showToast({ title: '请选择原日期', icon: 'none' })
			return false
		}
		if (!form.extraData.targetDate) {
			uni.showToast({ title: '请选择目标日期', icon: 'none' })
			return false
		}
	}

	if (form.type === 'outwork') {
		if (!form.extraData.outworkStartTime) {
			uni.showToast({ title: '请选择开始时间', icon: 'none' })
			return false
		}
		if (!form.extraData.outworkEndTime) {
			uni.showToast({ title: '请选择结束时间', icon: 'none' })
			return false
		}
	}

	if (form.type === 'overtime') {
		if (!form.extraData.startTime) {
			uni.showToast({ title: '请选择开始时间', icon: 'none' })
			return false
		}
		if (!form.extraData.endTime) {
			uni.showToast({ title: '请选择结束时间', icon: 'none' })
			return false
		}
	}

	return true
}

function buildExtraData(): Record<string, any> {
	const data: Record<string, any> = {}
	
	if (form.type === 'leave') {
		data.leaveType = form.extraData.leaveType
		data.startTime = form.extraData.startTime
		data.endTime = form.extraData.endTime
	} else if (form.type === 'exchange') {
		data.sourceDate = form.extraData.sourceDate
		data.targetDate = form.extraData.targetDate
		data.targetEmployeeId = form.extraData.targetEmployeeId
		data.targetEmployeeName = form.extraData.targetEmployeeName
	} else if (form.type === 'outwork') {
		data.location = form.extraData.location
		data.startTime = form.extraData.outworkStartTime
		data.endTime = form.extraData.outworkEndTime
	} else if (form.type === 'overtime') {
		data.startTime = form.extraData.startTime
		data.endTime = form.extraData.endTime
	}

	return data
}

async function submitForm() {
	if (!validateForm()) return

	uni.showLoading({ title: '提交中...' })

	try {
		const result = await createApproval({
			type: form.type,
			reason: form.reason.trim(),
			extra_data: buildExtraData()
		})

		uni.hideLoading()
			uni.showToast({ title: '提交成功', icon: 'success' })
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
	} catch {
		uni.hideLoading()
		uni.showToast({ title: '提交失败', icon: 'none' })
	}
}

function goBack() {
	uni.navigateBack()
}
</script>

<style lang="scss" scoped>
.page {
	min-height: 100vh;
	background: #f5f5f5;
	padding-bottom: calc(env(safe-area-inset-bottom) + 120rpx);
}

.form-content {
	padding: 24rpx;
}

.submit-area {
	position: fixed;
	bottom: 0;
	left: 0;
	right: 0;
	padding: 20rpx 32rpx;
	padding-bottom: calc(env(safe-area-inset-bottom) + 20rpx);
	background: #fff;
	border-top: 1rpx solid #f0f0f0;
}

.submit-btn {
	height: 88rpx;
	background: linear-gradient(135deg, #059669 0%, #059669 100%);
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(16, 185, 129, 0.3);
	
	text {
		font-size: 32rpx;
		font-weight: 600;
		color: #fff;
	}
	
	&:active {
		opacity: 0.9;
	}
}

.form-item {
	background: #fff;
	border-radius: 24rpx;
	padding: 24rpx;
	margin-bottom: 20rpx;
}

.form-label {
	font-size: 28rpx;
	color: #333;
	font-weight: 500;
	margin-bottom: 16rpx;
	display: block;
}

.type-selector {
	display: flex;
	flex-wrap: wrap;
	gap: 16rpx;
}

.type-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 20rpx 24rpx;
	background: #fafafa;
	border-radius: 12rpx;
	border: 2rpx solid transparent;
	min-width: 140rpx;
	
	&.selected {
		background: rgba(16, 185, 129, 0.1);
		border-color: #059669;
	}
	
	&.small {
		min-width: 100rpx;
		padding: 16rpx 20rpx;
		
		text {
			font-size: 26rpx;
		}
	}
}

.type-icon {
	font-size: 40rpx;
	margin-bottom: 8rpx;
}

.type-name {
	font-size: 26rpx;
	color: #333;
}

.form-textarea {
	width: 100%;
	height: 200rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 20rpx;
	font-size: 28rpx;
	color: #333;
	box-sizing: border-box;
}

.textarea-count {
	display: block;
	text-align: right;
	font-size: 24rpx;
	color: #999;
	margin-top: 12rpx;
}

.form-input {
	width: 100%;
	height: 88rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	box-sizing: border-box;
}

.date-row {
	display: flex;
	gap: 24rpx;
}

.date-item {
	flex: 1;
}

.date-picker {
	display: flex;
	align-items: center;
	justify-content: space-between;
	height: 88rpx;
	background: #fafafa;
	border-radius: 12rpx;
	padding: 0 24rpx;
	font-size: 28rpx;
	color: #333;
}

.picker-arrow {
	font-size: 32rpx;
	color: #999;
}

.assistant-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	z-index: 999;
}

.modal-content {
	width: 100%;
	background: #fff;
	border-radius: 32rpx 32rpx 0 0;
	max-height: 70vh;
	overflow: hidden;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 32rpx;
	border-bottom: 1rpx solid #f0f0f0;
}

.modal-title {
	font-size: 32rpx;
	font-weight: 600;
	color: #333;
}

.modal-close {
	font-size: 48rpx;
	color: #999;
	line-height: 1;
}

.modal-list {
	padding: 16rpx 0;
	max-height: 60vh;
	overflow-y: auto;
}

.modal-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 28rpx 32rpx;
	border-bottom: 1rpx solid #f5f5f5;
	
	&.selected {
		background: rgba(16, 185, 129, 0.05);
	}
}

.item-name {
	font-size: 30rpx;
	color: #333;
}

.item-check {
	width: 40rpx;
	height: 40rpx;
	background: #059669;
	color: #fff;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24rpx;
}
</style>
