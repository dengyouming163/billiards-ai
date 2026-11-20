import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
	getTodayStatus,
	signIn,
	signOut,
	getCheckinRecords,
	signInWithPhotos,
	signOutWithPhotos,
	uploadCheckinPhotos,
} from '@/api/modules/checkin'
import { authStore } from '@/stores'

export function useCheckin() {
	// ── Clock ──
	const currentDate = ref('')
	const currentTime = ref('')
	let timer: ReturnType<typeof setInterval> | null = null

	function updateDateTime() {
		const now = new Date()
		currentDate.value = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日`
		currentTime.value = [now.getHours(), now.getMinutes(), now.getSeconds()]
			.map(n => String(n).padStart(2, '0'))
			.join(':')
	}

	// ── Role ──
	const isAssistant = computed(() => {
		const role = authStore.userInfo?.role
		if (role === 'assistant' || role === '6' || Number(role) === 6) return true
		return authStore.isAssistant
	})

	// ── Status ──
	const checkinStatus = ref<{ text: string; type: string }>({ text: '签到', type: 'signIn' })
	const hasCheckedIn = ref(false)
	const lastCheckinTime = ref('')
	const lastCheckoutTime = ref('')
	const loading = ref(false)
	const hasError = ref(false)
	const submitting = ref(false)

	const statusClass = computed(() => {
		if (checkinStatus.value.type === 'done') return 'success'
		if (checkinStatus.value.type === 'signOut') return 'info'
		return 'pending'
	})
	const statusText = computed(() => {
		if (checkinStatus.value.type === 'done') return '已完成打卡'
		if (checkinStatus.value.type === 'signOut') return '已签到，请签退'
		return '待签到'
	})

	async function loadCheckinStatus() {
		try {
			const status = await getTodayStatus()
			if (status?.is_signed_in) {
				checkinStatus.value = status.is_signed_out
					? { text: '已完成', type: 'done' }
					: { text: '签退', type: 'signOut' }
				hasCheckedIn.value = true
				lastCheckinTime.value = status.sign_in?.created_at || ''
				lastCheckoutTime.value = status.sign_out?.created_at || ''
			} else {
				checkinStatus.value = { text: '签到', type: 'signIn' }
				hasCheckedIn.value = false
			}
		} catch {
			checkinStatus.value = { text: '签到', type: 'signIn' }
			hasCheckedIn.value = false
		}
	}

	// ── Monthly stats ──
	const monthStats = ref({ checkedDays: 0, lateCount: 0, absentCount: 0 })
	const attendanceRate = computed(() => {
		const now = new Date()
		const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
		const workDays = Math.round(daysInMonth * 0.73)
		if (workDays === 0) return 0
		return Math.round((monthStats.value.checkedDays / workDays) * 100)
	})

	async function loadMonthStats() {
		try {
			const result = await getCheckinRecords(1, 100)
			const records = (result as any).lists || []
			const signIns = records.filter((r: any) => r.type === 'sign_in' && r.checkin_time)
			const dates = new Set(signIns.map((r: any) => r.checkin_time?.substring(0, 10)))
			monthStats.value = {
				checkedDays: dates.size,
				lateCount: records.filter((r: any) => r.is_late).length,
				absentCount: Math.max(
					0,
					new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() - dates.size,
				),
			}
		} catch {
			monthStats.value = { checkedDays: 0, lateCount: 0, absentCount: 0 }
		}
	}

	async function loadAllStatus() {
		loading.value = true
		hasError.value = false
		try {
			await Promise.all([loadCheckinStatus(), loadMonthStats()])
		} catch {
			hasError.value = true
		} finally {
			loading.value = false
		}
	}

	// ── Photos — upload independently from check-in ──
	const photoUrls = ref<string[]>([])      // uploaded URLs (ready for sign-in)
	const uploadingCount = ref(0)            // currently uploading count

	/** Take photos and upload immediately. Returns count of successfully uploaded. */
	async function takePhoto() {
		const remaining = 5 - photoUrls.value.length
		if (remaining <= 0) {
			uni.showToast({ title: '最多拍摄5张照片', icon: 'none' })
			return
		}
		uni.chooseImage({
			count: remaining,
			sourceType: ['camera'],
			success: async (res) => {
				if (res.tempFilePaths.length === 0) return

				uploadingCount.value = res.tempFilePaths.length
				uni.showLoading({ title: '上传中...', mask: true })

				try {
					const urls = await uploadCheckinPhotos(res.tempFilePaths)
					photoUrls.value = [...photoUrls.value, ...urls]
					uni.showToast({ title: `已上传${urls.length}张`, icon: 'success' })
				} catch (e: any) {
					uni.showToast({ title: e.message || '上传失败', icon: 'none' })
				} finally {
					uni.hideLoading()
					uploadingCount.value = 0
				}
			},
		})
	}

	function removePhoto(index: number) {
		photoUrls.value.splice(index, 1)
	}

	function previewPhoto(index: number) {
		uni.previewImage({ current: photoUrls.value[index], urls: photoUrls.value })
	}

	// ── Sign in / Sign out ──
	async function handleCheckIn() {
		if (checkinStatus.value.type === 'done') {
			uni.showToast({ title: '今日已完成打卡', icon: 'none' })
			return
		}

		submitting.value = true
		try {
			if (isAssistant.value) {
				if (photoUrls.value.length < 3 || photoUrls.value.length > 5) {
					uni.showToast({ title: '请先上传3-5张打卡照片', icon: 'none' })
					return
				}

				if (checkinStatus.value.type === 'signIn') {
					await signInWithPhotos({ photo_urls: photoUrls.value })
					uni.showToast({ title: '签到成功', icon: 'success' })
					checkinStatus.value = { text: '签退', type: 'signOut' }
					hasCheckedIn.value = true
					lastCheckinTime.value = new Date().toISOString()
				} else {
					await signOutWithPhotos({ photo_urls: photoUrls.value })
					uni.showToast({ title: '签退成功', icon: 'success' })
					checkinStatus.value = { text: '已完成', type: 'done' }
					lastCheckoutTime.value = new Date().toISOString()
				}
				photoUrls.value = []
			} else {
				if (checkinStatus.value.type === 'signIn') {
					const result = await signIn({})
					uni.showToast({ title: '签到成功', icon: 'success' })
					checkinStatus.value = { text: '签退', type: 'signOut' }
					hasCheckedIn.value = true
					lastCheckinTime.value = result?.created_at || new Date().toISOString()
				} else {
					const result = await signOut({})
					uni.showToast({ title: '签退成功', icon: 'success' })
					checkinStatus.value = { text: '已完成', type: 'done' }
					lastCheckoutTime.value = result?.created_at || new Date().toISOString()
				}
			}
			loadCheckinStatus()
		} catch (error: any) {
			uni.showToast({ title: error.message || error.msg || '操作失败', icon: 'none' })
		} finally {
			submitting.value = false
		}
	}

	// ── Lifecycle ──
	onMounted(() => {
		updateDateTime()
		timer = setInterval(updateDateTime, 1000)
		loadAllStatus()
	})

	onUnmounted(() => {
		if (timer) { clearInterval(timer); timer = null }
	})

	return {
		// Clock
		currentDate,
		currentTime,
		// Role
		isAssistant,
		// Status
		checkinStatus,
		hasCheckedIn,
		lastCheckinTime,
		lastCheckoutTime,
		statusClass,
		statusText,
		loading,
		hasError,
		submitting,
		loadAllStatus,
		// Stats
		monthStats,
		attendanceRate,
		// Photos (independent from check-in)
		photoUrls,
		uploadingCount,
		takePhoto,
		removePhoto,
		previewPhoto,
		// Actions
		handleCheckIn,
		loadCheckinStatus,
	}
}
