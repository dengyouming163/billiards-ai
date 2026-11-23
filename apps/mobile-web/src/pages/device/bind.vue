<template>
  <view class="page">
    <view class="hero-card">
      <view class="hero-copy">
        <text class="hero-eyebrow">设备管理</text>
        <text class="hero-title">通道绑定台桌</text>
        <text class="hero-desc">选择灯光设备，将通道绑定到对应的球台上，实现灯光与台桌联动控制。</text>
      </view>

      <!-- Device Selector -->
      <view class="device-selector">
        <picker mode="selector" :range="deviceLabels" @change="onDeviceChange" :value="selectedDeviceIndex">
          <view class="device-picker-card" :class="{ empty: devices.length === 0 }">
            <view class="device-picker-left">
              <text class="device-picker-label">{{ devices.length > 0 ? deviceLabels[selectedDeviceIndex] || '请选择设备' : '暂无设备' }}</text>
              <text class="device-picker-hint">点击切换设备</text>
            </view>
            <view class="device-picker-right" v-if="selectedDevice">
              <view class="device-status-badge" :class="selectedDevice.status === 1 ? 'online' : 'offline'">
                <text class="status-dot"></text>
                <text>{{ selectedDevice.status === 1 ? '在线' : '离线' }}</text>
              </view>
              <text class="device-channel-count">{{ selectedDevice.channel_count || 0 }}通道</text>
            </view>
            <text class="chip-arrow" v-if="devices.length > 1">▾</text>
          </view>
        </picker>
      </view>
    </view>

    <StateView :loading="loading && tables.length === 0" :error="hasError" :empty="!loading && tables.length === 0" empty-msg="暂无可绑定的台桌" error-msg="加载失败" @retry="loadData">
      <!-- Table List -->
      <view class="table-list">
        <view class="table-card" v-for="table in tables" :key="table.id">
          <view class="table-card-header">
            <view class="table-info">
              <text class="table-number">{{ table.number }}号桌</text>
              <text class="table-name" v-if="table.name && table.name !== table.number">{{ table.name }}</text>
            </view>
            <view class="table-bind-status">
              <template v-if="getBoundChannel(table.id)">
                <text class="bind-label">已绑定</text>
                <text class="bind-channel-name">: {{ getBoundChannel(table.id)!.channel_name }}</text>
                <text class="bind-unbind-btn" @click="handleUnbind(table.id)">解绑</text>
              </template>
              <template v-else>
                <text class="bind-label unbound">未绑定</text>
              </template>
            </view>
          </view>

          <!-- Unbound: show channel picker -->
          <view class="table-card-body" v-if="!getBoundChannel(table.id)">
            <view class="bind-row" v-if="unboundChannels.length > 0">
              <picker mode="selector" :range="unboundChannelLabels" @change="(e: any) => onChannelPick(table.id, e.detail.value)">
                <view class="channel-select-chip">
                  <text>{{ getSelectedChannelLabel(table.id) }}</text>
                  <text class="chip-arrow">▾</text>
                </view>
              </picker>
              <view class="bind-btn" @click="handleBind(table.id)">
                <text>绑定</text>
              </view>
            </view>
            <view class="bind-row" v-else>
              <text class="no-channel-tip">所选设备暂无可用的空闲通道</text>
            </view>
          </view>
        </view>
      </view>
    </StateView>

    <!-- Bottom action -->
    <view class="bottom-bar" v-if="selectedDevice">
      <view class="bottom-btn" @click="goChannelManage">
        <text>通道管理</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { deviceApi, type LightDevice, type LightChannel, type TableItem } from '@/api/modules/device'
import StateView from '@/components/StateView.vue'

const devices = ref<LightDevice[]>([])
const tables = ref<TableItem[]>([])
const channels = ref<LightChannel[]>([])
const loading = ref(false)
const hasError = ref(false)
const selectedDeviceIndex = ref(0)
const channelPickIndexes = ref<Record<string, number>>({})

const deviceLabels = computed(() => devices.value.map((d) => d.device_name || d.device_sn || '未知设备'))

const selectedDevice = computed(() => devices.value[selectedDeviceIndex.value] || null)

const unboundChannels = computed(() =>
  channels.value.filter((ch) => !ch.table_id)
)

const unboundChannelLabels = computed(() =>
  unboundChannels.value.map((ch) => ch.channel_name || `通道${ch.channel_no}`)
)

function getBoundChannel(tableId: string): LightChannel | undefined {
  return channels.value.find((ch) => ch.table_id === tableId)
}

function getSelectedChannelLabel(tableId: string): string {
  const idx = channelPickIndexes.value[tableId]
  if (idx !== undefined && unboundChannelLabels.value[idx]) {
    return unboundChannelLabels.value[idx]
  }
  return '请选择通道'
}

function getSelectedChannelId(tableId: string): string | null {
  const idx = channelPickIndexes.value[tableId]
  if (idx !== undefined && unboundChannels.value[idx]) {
    return unboundChannels.value[idx].id
  }
  return null
}

onMounted(() => {
  loadDevices()
})

async function loadDevices() {
  loading.value = true
  hasError.value = false
  try {
    const result = await deviceApi.getDevices()
    devices.value = Array.isArray(result) ? result : (result as any)?.list || (result as any)?.data || []
    if (devices.value.length > 0) {
      selectedDeviceIndex.value = 0
      await Promise.all([loadTables(), loadChannels()])
    }
  } catch {
    hasError.value = true
  } finally {
    loading.value = false
  }
}

async function loadTables() {
  try {
    const result = await deviceApi.getTables()
    tables.value = Array.isArray(result) ? result : (result as any)?.list || (result as any)?.data || []
  } catch {
    tables.value = []
  }
}

async function loadChannels() {
  if (!selectedDevice.value) return
  try {
    const deviceId = selectedDevice.value.id
    const result = await deviceApi.getChannels(deviceId)
    channels.value = Array.isArray(result) ? result : (result as any)?.list || (result as any)?.data || []
  } catch {
    channels.value = []
  }
}

async function loadData() {
  hasError.value = false
  loading.value = true
  try {
    await Promise.all([loadTables(), loadChannels()])
  } catch {
    hasError.value = true
  } finally {
    loading.value = false
  }
}

async function onDeviceChange(e: any) {
  selectedDeviceIndex.value = e.detail.value
  channelPickIndexes.value = {}
  await loadData()
}

function onChannelPick(tableId: string, idx: number) {
  channelPickIndexes.value[tableId] = idx
}

async function handleBind(tableId: string) {
  const channelId = getSelectedChannelId(tableId)
  if (!channelId) {
    uni.showToast({ title: '请先选择通道', icon: 'none' })
    return
  }
  try {
    await deviceApi.bindTable(channelId, tableId)
    uni.showToast({ title: '绑定成功', icon: 'success' })
    channelPickIndexes.value[tableId] = undefined as any
    await loadChannels()
  } catch (e: any) {
    uni.showToast({ title: e.message || '绑定失败', icon: 'none' })
  }
}

async function handleUnbind(tableId: string) {
  const channel = getBoundChannel(tableId)
  if (!channel) return

  uni.showModal({
    title: '确认解绑',
    content: `确定要解绑 ${channel.channel_name || '该通道'} 吗？`,
    confirmColor: '#dc2626',
    success: async (res) => {
      if (res.confirm) {
        try {
          await deviceApi.unbindTable(channel.id)
          uni.showToast({ title: '已解绑', icon: 'success' })
          await loadChannels()
        } catch (e: any) {
          uni.showToast({ title: e.message || '解绑失败', icon: 'none' })
        }
      }
    },
  })
}

function goChannelManage() {
  if (!selectedDevice.value) return
  uni.navigateTo({
    url: `/pages/device/channel?device_id=${selectedDevice.value.id}`,
  })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: #f2f3f5;
  display: flex;
  flex-direction: column;
  padding: 30rpx 24rpx calc(env(safe-area-inset-bottom) + 120rpx);
}

.hero-card {
  margin-top: 12rpx;
  margin-bottom: 22rpx;
  padding: 34rpx 30rpx;
  border-radius: 34rpx;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.86) 100%);
  box-shadow: 0 12rpx 36rpx rgba(15, 23, 42, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.78);
}

.hero-copy {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  margin-bottom: 28rpx;
}

.hero-eyebrow {
  font-size: 22rpx;
  color: #059669;
  font-weight: 700;
  letter-spacing: 2rpx;
}

.hero-title {
  font-size: 42rpx;
  line-height: 1.25;
  color: #0f172a;
  font-weight: 800;
}

.hero-desc {
  font-size: 24rpx;
  line-height: 1.7;
  color: #64748b;
}

.device-selector {
  flex-shrink: 0;
}

.device-picker-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 28rpx;
  background: #f7faf9;
  border-radius: 24rpx;
  border: 1rpx solid #edf2ef;
  gap: 16rpx;

  &.empty {
    opacity: 0.6;
  }
}

.device-picker-left {
  display: flex;
  flex-direction: column;
  gap: 6rpx;
  flex: 1;
  min-width: 0;
}

.device-picker-label {
  font-size: 28rpx;
  font-weight: 700;
  color: #0f172a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.device-picker-hint {
  font-size: 22rpx;
  color: #9ca3af;
}

.device-picker-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
  flex-shrink: 0;
}

.device-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 8rpx 16rpx;
  border-radius: 999rpx;
  font-size: 20rpx;
  font-weight: 600;

  &.online {
    background: #ecfdf5;
    color: #059669;
  }

  &.offline {
    background: #fef2f2;
    color: #dc2626;
  }
}

.status-dot {
  width: 12rpx;
  height: 12rpx;
  border-radius: 50%;
  background: currentColor;
}

.device-channel-count {
  font-size: 22rpx;
  color: #64748b;
  font-weight: 600;
}

.chip-arrow {
  font-size: 20rpx;
  color: #9ca3af;
  flex-shrink: 0;
}

/* Table list */
.table-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-bottom: 40rpx;
}

.table-card {
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96) 0%, rgba(255, 255, 255, 0.9) 100%);
  border-radius: 28rpx;
  padding: 26rpx 28rpx;
  box-shadow: 0 8rpx 24rpx rgba(15, 23, 42, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.82);
}

.table-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;
}

.table-info {
  display: flex;
  align-items: baseline;
  gap: 10rpx;
  flex: 1;
  min-width: 0;
}

.table-number {
  font-size: 30rpx;
  font-weight: 800;
  color: #0f172a;
}

.table-name {
  font-size: 22rpx;
  color: #9ca3af;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.table-bind-status {
  display: flex;
  align-items: center;
  gap: 6rpx;
  flex-shrink: 0;
}

.bind-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #059669;

  &.unbound {
    color: #9ca3af;
  }
}

.bind-channel-name {
  font-size: 22rpx;
  color: #374151;
  font-weight: 500;
  max-width: 140rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bind-unbind-btn {
  font-size: 22rpx;
  color: #dc2626;
  font-weight: 600;
  padding: 6rpx 16rpx;
  margin-left: 8rpx;
  background: #fef2f2;
  border-radius: 999rpx;

  &:active {
    background: #fee2e2;
  }
}

.table-card-body {
  padding-top: 12rpx;
  border-top: 1rpx solid #f1f5f9;
}

.bind-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16rpx;
}

.channel-select-chip {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 14rpx 22rpx;
  background: #f3f6f5;
  border-radius: 999rpx;
  font-size: 24rpx;
  color: #374151;
  font-weight: 500;
}

.bind-btn {
  padding: 14rpx 32rpx;
  background: linear-gradient(135deg, #059669, #10b981);
  border-radius: 999rpx;

  &:active {
    opacity: 0.85;
  }

  text {
    font-size: 24rpx;
    font-weight: 700;
    color: #fff;
  }
}

.no-channel-tip {
  font-size: 22rpx;
  color: #9ca3af;
  padding: 8rpx 0;
}

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 24rpx calc(env(safe-area-inset-bottom) + 20rpx);
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(20rpx);
  border-top: 1rpx solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: center;
}

.bottom-btn {
  width: 100%;
  max-width: 600rpx;
  padding: 26rpx 0;
  background: linear-gradient(135deg, #059669, #10b981);
  border-radius: 999rpx;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(5, 150, 105, 0.25);

  &:active {
    opacity: 0.85;
  }

  text {
    font-size: 30rpx;
    font-weight: 800;
    color: #fff;
  }
}
</style>
