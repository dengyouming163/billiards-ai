<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">通道管理</text>
        <text class="hero-title">{{ deviceName }}</text>
        <text class="hero-desc">管理灯光通道的开/关、重命名以及台桌绑定关系。</text>
      </view>

      <view class="device-status-row" v-if="deviceInfo">
        <view class="device-status-badge" :class="deviceInfo.status === 1 ? 'online' : 'offline'">
          <text class="status-dot"></text>
          <text>{{ deviceInfo.status === 1 ? '在线' : '离线' }}</text>
        </view>
        <text class="device-meta">{{ deviceInfo.channel_count || 0 }}通道</text>
        <text class="device-meta" v-if="deviceInfo.addr">{{ deviceInfo.addr }}</text>
      </view>
    </view>

    <!-- Batch Toggle -->
    <view class="batch-bar">
      <view class="batch-btn on" @click="handleToggleAll('on')">
        <text class="batch-btn-icon">☀</text>
        <text>一键全开</text>
      </view>
      <view class="batch-btn off" @click="handleToggleAll('off')">
        <text class="batch-btn-icon">☾</text>
        <text>一键全关</text>
      </view>
    </view>

    <!-- Channel List -->
    <StateView :loading="loading && channels.length === 0" :error="hasError" :empty="!loading && channels.length === 0" empty-msg="该设备暂无通道数据" error-msg="加载失败" @retry="loadChannels">
      <view class="channel-list">
        <view class="channel-card" v-for="channel in channels" :key="channel.id">
          <!-- Header: Channel label + toggle -->
          <view class="channel-header">
            <view class="channel-label">
              <text class="channel-no">通道{{ channel.channel_no }}</text>
            </view>
            <view class="channel-toggle" :class="channel.status === 1 ? 'on' : 'off'" @click="handleToggle(channel)">
              <text class="toggle-dot"></text>
              <text class="toggle-text">{{ channel.status === 1 ? '开' : '关' }}</text>
            </view>
          </view>

          <!-- Rename Row -->
          <view class="channel-rename-row">
            <input
              class="name-input"
              :value="getEditingName(channel.id)"
              @input="(e: any) => onNameInput(channel.id, e.detail.value)"
              placeholder="请输入通道名称"
              :maxlength="20"
            />
            <view class="save-btn" @click="handleRename(channel)">
              <text>保存</text>
            </view>
          </view>

          <!-- Binding Status -->
          <view class="channel-binding">
            <template v-if="channel.table_id">
              <text class="binding-icon">🔗</text>
              <text class="binding-text">{{ channel.table_number || channel.table_name || '已绑定台桌' }}</text>
              <text class="unbind-btn" @click="handleUnbind(channel)">解绑</text>
            </template>
            <template v-else>
              <text class="binding-text unbound">未绑定</text>
            </template>
          </view>
        </view>
      </view>
    </StateView>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { deviceApi, type LightChannel, type LightDevice } from '@/api/modules/device'
import StateView from '@/components/StateView.vue'

const deviceId = ref('')
const deviceName = ref('设备通道')
const deviceInfo = ref<LightDevice | null>(null)
const channels = ref<LightChannel[]>([])
const loading = ref(false)
const hasError = ref(false)
const editingNames = ref<Record<string, string>>({})

function getEditingName(channelId: string): string {
  if (editingNames.value[channelId] !== undefined) {
    return editingNames.value[channelId]
  }
  const ch = channels.value.find((c) => c.id === channelId)
  return ch?.channel_name || `通道${ch?.channel_no || ''}`
}

onLoad((options: any) => {
  deviceId.value = options?.device_id || ''
  deviceName.value = options?.device_name || '设备通道'
  if (deviceId.value) {
    loadChannels()
  } else {
    hasError.value = true
  }
})

async function loadChannels() {
  if (!deviceId.value) return
  loading.value = true
  hasError.value = false
  try {
    const result = await deviceApi.getChannels(deviceId.value)
    channels.value = Array.isArray(result) ? result : (result as any)?.list || (result as any)?.data || []

    // Also try to get device info for status display
    try {
      const devicesResult = await deviceApi.getDevices()
      const devices = Array.isArray(devicesResult) ? devicesResult : (devicesResult as any)?.list || (devicesResult as any)?.data || []
      const device = (devices as LightDevice[]).find((d) => d.id === deviceId.value)
      if (device) {
        deviceInfo.value = device
        deviceName.value = device.device_name || device.device_sn || '设备通道'
      }
    } catch {
      // Device info is non-critical
    }

    // Initialize editing names from channel data
    const names: Record<string, string> = {}
    for (const ch of channels.value) {
      names[ch.id] = ch.channel_name || `通道${ch.channel_no}`
    }
    editingNames.value = names
  } catch {
    hasError.value = true
  } finally {
    loading.value = false
  }
}

function onNameInput(channelId: string, value: string) {
  editingNames.value[channelId] = value
}

async function handleRename(channel: LightChannel) {
  const newName = editingNames.value[channel.id]
  if (!newName || !newName.trim()) {
    uni.showToast({ title: '名称不能为空', icon: 'none' })
    return
  }
  if (newName.trim() === channel.channel_name) {
    uni.showToast({ title: '名称未变化', icon: 'none' })
    return
  }
  try {
    await deviceApi.renameChannel(channel.id, newName.trim())
    uni.showToast({ title: '已保存', icon: 'success' })
    // Update local channel data
    channel.channel_name = newName.trim()
  } catch (e: any) {
    uni.showToast({ title: e.message || '保存失败', icon: 'none' })
  }
}

async function handleToggle(channel: LightChannel) {
  const action = channel.status === 1 ? 'off' : 'on'
  const newStatus = action === 'on' ? 1 : 0

  // Optimistic update
  channel.status = newStatus

  try {
    await deviceApi.toggleChannel(channel.id, deviceId.value, action)

    // Wait 2s then refresh from server to confirm
    setTimeout(async () => {
      try {
        const result = await deviceApi.getChannels(deviceId.value)
        const list = Array.isArray(result) ? result : (result as any)?.list || (result as any)?.data || []
        const updated = (list as LightChannel[]).find((c) => c.id === channel.id)
        if (updated) {
          channel.status = updated.status
        }
      } catch {
        // Silent refresh failure — optimistic state remains
      }
    }, 2000)
  } catch (e: any) {
    // Revert on failure
    channel.status = channel.status === 1 ? 0 : 1
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

async function handleToggleAll(action: 'on' | 'off') {
  const newStatus = action === 'on' ? 1 : 0

  // Optimistic update all channels
  const prevStatuses = channels.value.map((ch) => ch.status)
  channels.value.forEach((ch) => {
    ch.status = newStatus
  })

  try {
    await deviceApi.toggleAll(deviceId.value, action)
    uni.showToast({ title: action === 'on' ? '已全开' : '已全关', icon: 'success' })

    // Wait 2s then refresh from server to confirm
    setTimeout(async () => {
      try {
        const result = await deviceApi.getChannels(deviceId.value)
        const list = Array.isArray(result) ? result : (result as any)?.list || (result as any)?.data || []
        if (Array.isArray(list) && list.length > 0) {
          channels.value = list
        }
      } catch {
        // Silent
      }
    }, 2000)
  } catch (e: any) {
    // Revert all
    channels.value.forEach((ch, i) => {
      ch.status = prevStatuses[i]
    })
    uni.showToast({ title: e.message || '操作失败', icon: 'none' })
  }
}

async function handleUnbind(channel: LightChannel) {
  uni.showModal({
    title: '确认解绑',
    content: `确定要解绑 ${channel.channel_name || '该通道'} 吗？`,
    confirmColor: '#dc2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deviceApi.unbindTable(channel.id)
          uni.showToast({ title: '已解绑', icon: 'success' })
          channel.table_id = ''
          channel.table_name = ''
          channel.table_number = ''
        } catch (e: any) {
          uni.showToast({ title: e.message || '解绑失败', icon: 'none' })
        }
      }
    },
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f7f7f7;
  display: flex;
  flex-direction: column;
  padding: 30rpx 24rpx calc(env(safe-area-inset-bottom) + 40rpx);
}

.hero-card {
  margin-top: 12rpx;
  margin-bottom: 22rpx;
  padding: 34rpx 30rpx;
  border-radius: 16rpx;
  background: #ffffff;
  border: 1rpx solid #e5e5e5;
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 20rpx;
}

.hero-eyebrow {
  font-size: 22rpx;
  color: #07C160;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.hero-title {
  font-size: 42rpx;
  line-height: 1.25;
  color: #000000;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-desc {
  font-size: 24rpx;
  line-height: 1.7;
  color: #999999;
}

.device-status-row {
  display: flex;
  align-items: center;
  gap: 18rpx;
  padding-top: 4rpx;
}

.device-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 18rpx;
  border-radius: 999rpx;
  font-size: 22rpx;
  font-weight: 600;

  &.online {
    background: rgba(7, 193, 96, 0.15);
    color: #07C160;
  }

  &.offline {
    background: rgba(239, 68, 68, 0.15);
    color: #dc2626;
  }
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: currentColor;
}

.device-meta {
  font-size: 22rpx;
  color: #999999;
  font-weight: 500;
}

/* Batch bar */
.batch-bar {
  display: flex;
  gap: 18rpx;
  margin-bottom: 22rpx;
  flex-shrink: 0;
}

.batch-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10rpx;
  padding: 24rpx 0;
  border-radius: 16rpx;
  font-size: 26rpx;
  font-weight: 700;

  &.on {
    background: rgba(7, 193, 96, 0.1);
    color: #07C160;
    border: 1rpx solid #e5e5e5;
  }

  &.off {
    background: #f5f5f5;
    color: #333333;
    border: 1rpx solid #e5e5e5;
  }

  &:active {
    opacity: 0.8;
  }
}

.batch-btn-icon {
  font-size: 28rpx;
}

/* Channel list */
.channel-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 40rpx;
}

.channel-card {
  background: #ffffff;
  border-radius: 16rpx;
  padding: 26rpx 28rpx;
  border: 1rpx solid #e5e5e5;
}

.channel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18rpx;
}

.channel-label {
  display: flex;
  align-items: center;
  gap: 10rpx;
}

.channel-no {
  font-size: 28rpx;
  font-weight: 800;
  color: #000000;
}

/* Toggle switch */
.channel-toggle {
  display: flex;
  align-items: center;
  gap: 10rpx;
  padding: 10rpx 24rpx;
  border-radius: 999rpx;
  transition: all 0.2s;

  &.on {
    background: rgba(7, 193, 96, 0.1);
  }

  &.off {
    background: #f5f5f5;
  }
}

.toggle-dot {
  width: 20rpx;
  height: 20rpx;
  border-radius: 50%;

  .channel-toggle.on & {
    background: #07C160;
    box-shadow: 0 0 10rpx rgba(7, 193, 96, 0.4);
  }

  .channel-toggle.off & {
    background: #cccccc;
  }
}

.toggle-text {
  font-size: 22rpx;
  font-weight: 600;

  .channel-toggle.on & {
    color: #07C160;
  }

  .channel-toggle.off & {
    color: #999999;
  }
}

/* Rename row */
.channel-rename-row {
  display: flex;
  align-items: center;
  gap: 14rpx;
  margin-bottom: 16rpx;
}

.name-input {
  flex: 1;
  height: 72rpx;
  padding: 0 22rpx;
  background: #f5f5f5;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #000000;
  border: 1rpx solid #e5e5e5;
}

.save-btn {
  padding: 14rpx 28rpx;
  background: #07C160;
  border-radius: 999rpx;
  flex-shrink: 0;

  &:active {
    opacity: 0.85;
  }

  text {
    font-size: 24rpx;
    font-weight: 700;
    color: #fff;
  }
}

/* Binding row */
.channel-binding {
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding-top: 12rpx;
  border-top: 1rpx solid #e5e5e5;
}

.binding-icon {
  font-size: 22rpx;
}

.binding-text {
  font-size: 22rpx;
  color: #333333;
  font-weight: 500;

  &.unbound {
    color: #999999;
  }
}

.unbind-btn {
  font-size: 20rpx;
  color: #dc2626;
  font-weight: 600;
  padding: 4rpx 14rpx;
  margin-left: auto;
  background: rgba(239, 68, 68, 0.1);
  border-radius: 999rpx;

  &:active {
    background: rgba(239, 68, 68, 0.1);
  }
}
</style>
