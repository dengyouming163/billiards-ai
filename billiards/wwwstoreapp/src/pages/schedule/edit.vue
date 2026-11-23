<template>
	<view class="page">
		<StateView :loading="loading" :error="hasError" error-msg="加载失败" @retry="loadScheduleDetail">
			<scroll-view v-if="!loading" scroll-y class="form-scroll" :style="{ height: scrollHeight }">
				<view class="form-container">
					<view class="section-card">
						<view class="section-header"><text class="section-title">基本信息</text></view>
						<view class="form-item">
							<text class="form-label required">选择员工</text>
							<picker mode="selector" :range="employeeOptions" range-key="label" :value="employeeIndex" @change="onEmployeeChange">
								<view class="picker-display" :class="{ active: form.employee_id }">
									<text v-if="form.employee_id" class="picker-chip">{{ employeeLabel }}</text>
									<text v-else class="picker-placeholder">请选择员工</text>
									<text class="picker-arrow">›</text>
								</view>
							</picker>
						</view>
						<view class="form-item">
							<text class="form-label required">排班日期</text>
							<picker mode="date" @change="onDateChange" :value="form.work_date">
								<view class="picker-display" :class="{ active: form.work_date }">
									<text v-if="form.work_date" class="picker-chip">{{ form.work_date }}</text>
									<text v-else class="picker-placeholder">请选择排班日期</text>
									<text class="picker-arrow">›</text>
								</view>
							</picker>
						</view>
					</view>

					<view class="section-card">
						<view class="section-header"><text class="section-title">班次设置</text></view>
						<view class="form-item">
							<text class="form-label required">班次类型</text>
							<picker mode="selector" :range="shiftOptionLabels" @change="onShiftChange" :value="shiftIndex">
								<view class="picker-display" :class="{ active: form.shift_type }">
									<text v-if="form.shift_type" class="picker-chip">{{ shiftLabel }}</text>
									<text v-else class="picker-placeholder">请选择班次类型</text>
									<text class="picker-arrow">›</text>
								</view>
							</picker>
						</view>
						<view class="form-item">
							<text class="form-label">开始时间</text>
							<input v-model="form.start_time" class="form-input" placeholder="如：09:00" maxlength="8" />
						</view>
						<view class="form-item">
							<text class="form-label">结束时间</text>
							<input v-model="form.end_time" class="form-input" placeholder="如：17:00" maxlength="8" />
						</view>
					</view>

					<view class="section-card">
						<view class="section-header"><text class="section-title">备注</text></view>
						<view class="form-item textarea-item">
							<textarea v-model="form.remark" class="form-textarea" placeholder="请输入备注信息（选填）" maxlength="200" auto-height />
							<text class="textarea-count">{{ (form.remark || '').length }}/200</text>
						</view>
					</view>

					<view class="submit-area">
						<button class="btn-submit" :loading="submitting" @click="handleSubmit">保存修改</button>
					</view>
				</view>
			</scroll-view>
		</StateView>
	</view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getScheduleList, updateSchedule, getShiftConfigs } from '@/api/modules/schedule'
import { getAssistantList } from '@/api/modules/table'
import StateView from '@/components/StateView.vue'

const loading = ref(true)
const submitting = ref(false)
const hasError = ref(false)
const scheduleId = ref('')
const scrollHeight = ref('auto')

const shiftOptions = ref<{ value: string; label: string; start: string; end: string }[]>([])
const employeeOptions = ref<any[]>([])

const form = reactive({
	employee_id: '', work_date: '', shift_type: '', start_time: '', end_time: '', remark: ''
})

const shiftOptionLabels = computed(() => shiftOptions.value.map(item => item.label))
const shiftIndex = computed(() => {
	const idx = shiftOptions.value.findIndex(item => item.value === form.shift_type)
	return idx >= 0 ? idx : 0
})
const shiftLabel = computed(() => {
	const found = shiftOptions.value.find(item => item.value === form.shift_type)
	return found ? found.label : ''
})

const employeeIndex = computed(() => {
	const idx = employeeOptions.value.findIndex(item => String(item.value) === String(form.employee_id))
	return idx >= 0 ? idx : 0
})
const employeeLabel = computed(() => {
	const found = employeeOptions.value.find(item => String(item.value) === String(form.employee_id))
	return found ? found.label : ''
})

function onEmployeeChange(e: any) { form.employee_id = employeeOptions.value[e.detail.value].value }
function onShiftChange(e: any) {
	const idx = e.detail.value
	form.shift_type = shiftOptions.value[idx].value
	form.start_time = shiftOptions.value[idx].start
	form.end_time = shiftOptions.value[idx].end
}
function onDateChange(e: any) { form.work_date = e.detail.value }
function handleBack() { uni.navigateBack() }

onMounted(async () => {
	const sysInfo = uni.getSystemInfoSync()
	scrollHeight.value = `${sysInfo.windowHeight - 88}px`

	// Load dynamic shift configs
	try {
		const configs = await getShiftConfigs()
		if (Array.isArray(configs) && configs.length > 0) {
			shiftOptions.value = configs.filter(c => c.status === 1).map(c => ({
				value: c.code, label: c.name,
				start: c.start_time || '', end: c.end_time || ''
			}))
		}
	} catch {}

	const pages = getCurrentPages()
	const currentPage = pages[pages.length - 1] as any
	const options = currentPage?.options || {}

	if (options.id) {
		scheduleId.value = options.id
		await loadEmployeeList()
		loadScheduleDetail()
	} else {
		uni.showToast({ title: '参数错误', icon: 'none' })
		setTimeout(() => { uni.navigateBack() }, 1500)
	}
})

async function loadEmployeeList() {
	try {
		const res = await getAssistantList()
		const list = Array.isArray(res) ? res : (res.list || res.data || [])
		employeeOptions.value = list.map((item) => ({
			value: String(item.id), label: item.name || item.phone || `员工${item.id}`
		}))
	} catch (e) { console.error('获取员工列表失败', e) }
}

async function loadScheduleDetail() {
	loading.value = true; hasError.value = false
	try {
		const result = await getScheduleList({ id: scheduleId.value })
		const list = Array.isArray(result) ? result : (result.list || result.data || [])
		const data = list[0] || null
		if (!data) { hasError.value = true; return }
		form.employee_id = String(data.employee_id || '')
		form.work_date = data.work_date || ''
		form.shift_type = data.shift_type || ''
		form.start_time = data.start_time || ''
		form.end_time = data.end_time || ''
		form.remark = data.remark || ''
	} catch (e: any) { console.error('加载排班详情失败', e); hasError.value = true
	} finally { loading.value = false }
}

async function handleSubmit() {
	if (!form.employee_id) { uni.showToast({ title: '请选择员工', icon: 'none' }); return }
	if (!form.work_date) { uni.showToast({ title: '请选择排班日期', icon: 'none' }); return }
	if (!form.shift_type) { uni.showToast({ title: '请选择班次类型', icon: 'none' }); return }

	submitting.value = true
	try {
		const params: Record<string, string> = { employee_id: form.employee_id, work_date: form.work_date, shift_type: form.shift_type }
		if (form.start_time.trim()) params.start_time = form.start_time.trim()
		if (form.end_time.trim()) params.end_time = form.end_time.trim()
		if (form.remark.trim()) params.remark = form.remark.trim()
		await updateSchedule(scheduleId.value, params)
		uni.showToast({ title: '修改成功', icon: 'success' })
		setTimeout(() => { uni.navigateBack() }, 1500)
	} catch (e: any) { uni.showToast({ title: e.msg || e.message || '修改失败', icon: 'none' })
	} finally { submitting.value = false }
}
</script>

<style lang="scss" scoped>
.page { min-height: 100vh; background: #f5f5f5; display: flex; flex-direction: column; }
.nav-bar { display: flex; align-items: center; justify-content: space-between; padding: 24rpx; background: #fff; }
.nav-back { width: 64rpx; height: 64rpx; display: flex; align-items: center; justify-content: center; }
.nav-back-icon { font-size: 48rpx; color: #374151; }
.nav-title { font-size: 34rpx; font-weight: 700; color: #1a1a1a; }
.nav-placeholder { width: 64rpx; }
.form-scroll { flex: 1; }
.form-container { padding: 24rpx; }
.section-card { background: #fff; border-radius: 20rpx; padding: 24rpx; margin-bottom: 16rpx; }
.section-header { margin-bottom: 16rpx; }
.section-title { font-size: 28rpx; font-weight: 700; color: #1a1a1a; }
.form-item { display: flex; align-items: center; justify-content: space-between; padding: 16rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.form-item:last-child { border-bottom: none; }
.form-label { font-size: 28rpx; color: #374151; width: 160rpx; flex-shrink: 0; }
.form-label.required::before { content: '* '; color: #dc2626; }
.form-input { flex: 1; font-size: 28rpx; color: #1a1a1a; text-align: right; }
.picker-display { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 8rpx; }
.picker-chip { font-size: 28rpx; color: #1a1a1a; }
.picker-placeholder { font-size: 28rpx; color: #9ca3af; }
.picker-arrow { font-size: 28rpx; color: #9ca3af; }
.form-textarea { width: 100%; min-height: 120rpx; font-size: 28rpx; color: #1a1a1a; padding: 12rpx 0; }
.textarea-count { font-size: 22rpx; color: #9ca3af; text-align: right; }
.submit-area { padding: 32rpx 0; }
.btn-submit { width: 100%; height: 88rpx; background: linear-gradient(135deg, #059669, #047857); color: #fff; font-size: 30rpx; font-weight: 600; border-radius: 44rpx; border: none; }
</style>
