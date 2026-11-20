<template>
  <view class="container">
    <PageHeader
      icon="🎱"
      title="开台"
      subtitle="选择桌台，开始游戏"
    >
      <template #right>
        <view class="back-btn" @click="goBack"><text>← 返回</text></view>
      </template>
    </PageHeader>

    <view class="loading-overlay" v-if="isLoading">
      <text class="loading-text">加载台桌中...</text>
    </view>

    <template v-if="!isLoading">

    <view class="action-tabs">
      <view 
        class="tab-item" 
        :class="{ active: mode === 'single' }"
        @click="mode = 'single'"
      >
        <text>单台开台</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ active: mode === 'merge' }"
        @click="mode = 'merge'"
      >
        <text>并台开台</text>
      </view>
    </view>

    <view class="table-section">
      <text class="section-title">选择桌台</text>
      <view class="table-grid">
        <view 
          class="table-card" 
          :class="[table.status, { selected: isSelected(table.id) }]"
          v-for="table in tables" 
          :key="table.id"
          @click="handleTableClick(table)"
        >
          <view class="table-number">{{ table.number }}</view>
          <view class="table-type">{{ table.type_name }}</view>
          <view class="table-status-badge" :class="table.status">
            {{ getStatusText(table.status) }}
          </view>
          <view class="table-check" v-if="mode === 'merge' && isSelected(table.id)">
            <text>✓</text>
          </view>
        </view>
      </view>
    </view>

    <view class="info-section" v-if="selectedTable">
      <text class="section-title">开台信息</text>
      
      <view class="info-card">
        <view class="info-row">
          <text class="info-label">桌台编号</text>
          <text class="info-value">{{ selectedTable.number }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">桌台类型</text>
          <text class="info-value">{{ selectedTable.type_name }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">计费标准</text>
          <text class="info-value highlight">¥{{ selectedTable.hourly_rate }}/小时</text>
        </view>
      </view>
    </view>

    <view class="player-section">
      <text class="section-title">选择人数</text>
      <view class="player-options">
        <view 
          class="player-option" 
          :class="{ selected: playerCount === count }"
          v-for="count in playerOptions" 
          :key="count"
          @click="playerCount = count"
        >
          <text class="player-icon">👤</text>
          <text class="player-count">{{ count }}人</text>
        </view>
      </view>
    </view>

    <view class="time-section">
      <text class="section-title">预计时长</text>
      <view class="time-options">
        <view 
          class="time-option" 
          :class="{ selected: duration === d }"
          v-for="d in durationOptions" 
          :key="d"
          @click="duration = d"
        >
          <text>{{ d }}小时</text>
        </view>
      </view>
    </view>

    <view class="summary-section">
      <view class="summary-card">
        <view class="summary-row">
          <text class="summary-label">预计消费</text>
          <text class="summary-value">¥{{ formatPrice(estimatedAmount) }}</text>
        </view>
        <view class="summary-hint">
          <text>桌费按实际消费时间结算</text>
        </view>
      </view>
    </view>

    <view class="bottom-action">
      <view class="confirm-btn" :class="{ disabled: mode === 'single' ? !selectedTable : selectedTableCount < 2 }" @click="confirmOrder">
        <text>{{ mode === 'merge' ? '确认并台' : '确认开台' }}</text>
      </view>
    </view>

    <ContentModal :visible="showMergeConfirm" title="并台确认" @close="cancelMerge">
        <view class="merge-table-list">
          <view class="merge-table-item" v-for="table in selectedTableInfo" :key="table.id">
            <view class="table-info">
              <text class="table-num">{{ table.number }}</text>
              <text class="table-type">{{ table.type_name }}</text>
            </view>
            <text class="table-rate">¥{{ table.hourly_rate }}/小时</text>
          </view>
        </view>
        <view class="merge-summary">
          <text class="summary-label">预计消费</text>
          <text class="summary-amount">¥{{ formatPrice(estimatedAmount) }}</text>
        </view>
        <template #footer>
          <view class="merge-actions">
            <view class="cancel-btn" @click="cancelMerge"><text>取消</text></view>
            <view class="merge-btn" @click="confirmMergeOrder"><text>确认并台</text></view>
          </view>
        </template>
      </ContentModal>

    <AlertModal :visible="showSuccess" icon="✅" title="开台成功" :message="'桌台 ' + (selectedTable?.number || '') + ' · ' + playerCount + '人'" confirm-text="开始体验" @confirm="goHome" />
    </template>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { tabletApi } from '@/api'
import { TABLE_STATUS } from '@/constants/tableStatus'
import { formatPrice } from '@/utils/format'
import PageHeader from '@/components/standard/PageHeader.vue'

interface Table {
  id: string
  number: string
  type_name: string
  hourly_rate: number
  status: string
}

const tables = ref<Table[]>([])
const selectedTable = ref<Table | null>(null)
const selectedTables = ref<string[]>([])
const mode = ref<'single' | 'merge'>('single')
const playerCount = ref(2)
const duration = ref(1)
const isLoading = ref(true)
const showSuccess = ref(false)
const showMergeConfirm = ref(false)

const playerOptions = [1, 2, 3, 4, 5, 6]
const durationOptions = [1, 2, 3, 4, 5, 6]

const estimatedAmount = computed(() => {
  if (mode.value === 'single' && selectedTable.value) {
    return selectedTable.value.hourly_rate * duration.value
  }
  if (mode.value === 'merge') {
    const selected = tables.value.filter(t => selectedTables.value.includes(t.id))
    return selected.reduce((sum, t) => sum + t.hourly_rate, 0) * duration.value
  }
  return 0
})

const selectedTableCount = computed(() => {
  return selectedTables.value.length
})

const selectedTableInfo = computed(() => {
  return tables.value.filter(t => selectedTables.value.includes(t.id))
})

function getStatusText(status: string) {
  const statusMap: Record<string, string> = {
    [TABLE_STATUS.IDLE]: '空闲',
    [TABLE_STATUS.OCCUPIED]: '使用中',
    [TABLE_STATUS.RESERVED]: '已预订',
    [TABLE_STATUS.MAINTENANCE]: '维护中'
  }
  return statusMap[status] || status
}

function isSelected(tableId: string) {
  if (mode.value === 'single') {
    return selectedTable.value?.id === tableId
  }
  return selectedTables.value.includes(tableId)
}

function handleTableClick(table: Table) {
  if (table.status !== TABLE_STATUS.IDLE) return
  
  if (mode.value === 'single') {
    selectedTable.value = table
    selectedTables.value = []
  } else {
    const index = selectedTables.value.indexOf(table.id)
    if (index > -1) {
      selectedTables.value.splice(index, 1)
    } else {
      selectedTables.value.push(table.id)
    }
  }
}

async function loadTables() {
  isLoading.value = true
  try {
    const data = await tabletApi.getTableStatus()
    if (data && data.tables) {
      tables.value = data.tables
    } else if (data && Array.isArray(data)) {
      tables.value = data
    }
  } catch (e) {
    console.error('加载桌台失败', e)
    uni.showToast({ title: '加载桌台失败，请重试', icon: 'none' })
    tables.value = []
  } finally {
    isLoading.value = false
  }
}

function goBack() {
  uni.navigateBack()
}

async function confirmOrder() {
  if (mode.value === 'single') {
    if (!selectedTable.value) {
      uni.showToast({ title: '请选择桌台', icon: 'none' })
      return
    }
    
    try {
      const res: any = await tabletApi.createOrder({
        table_id: selectedTable.value.id,
        player_count: playerCount.value,
      })

      if (res.code === 1) {
        showSuccess.value = true
      }
    } catch (e) {
      uni.showToast({ title: '开台失败', icon: 'none' })
    }
  } else {
    if (selectedTables.value.length < 2) {
      uni.showToast({ title: '请至少选择2个桌台', icon: 'none' })
      return
    }
    showMergeConfirm.value = true
  }
}

async function confirmMergeOrder() {
  try {
    const promises = selectedTables.value.map(tableId => {
      return tabletApi.createOrder({
        table_id: tableId,
        player_count: playerCount.value,
      })
    })

    const results: any[] = await Promise.all(promises)
    const orderIds = results.filter(r => (r as any).code === 1).map(r => (r as any).data?.id).filter(Boolean)
    
    if (orderIds.length >= 2) {
      await tabletApi.mergeOrders(orderIds as string[])
      showMergeConfirm.value = false
      showSuccess.value = true
    } else {
      uni.showToast({ title: '开台失败', icon: 'none' })
    }
  } catch (e) {
    uni.showToast({ title: '并台失败', icon: 'none' })
  }
}

function cancelMerge() {
  showMergeConfirm.value = false
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

onMounted(() => {
  loadTables()
})
</script>

<style lang="scss" scoped>
@use '@/styles/layout-system.scss';

$primary: #07C160;
$primary-dark: #06AD56;
$bg: #f7f7f7;
$card-bg: #ffffff;
$text-primary: #333333;
$text-secondary: #999999;

.container {
  padding: 0;
  min-height: 100vh;
  padding-bottom: 220rpx;
  background: $bg;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(ellipse at 30% 20%, rgba($primary, 0.05) 0%, transparent 50%),
      radial-gradient(ellipse at 70% 80%, rgba(6, 182, 212, 0.04) 0%, transparent 50%);
    pointer-events: none;
  }
}

.back-btn {
  padding: 20rpx 36rpx;
  background: $card-bg;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba($primary, 0.2);
  transition: all 0.3s;
  min-height: 80rpx;
  
  &:active {
    transform: scale(0.95);
    border-color: $primary;
    background: rgba($primary, 0.05);
  }
  
  text {
    font-size: 42rpx;
    color: $primary;
  }
}

.action-tabs {
  display: flex;
  background: $card-bg;
  border-radius: 28rpx;
  padding: 16rpx;
  margin: 40rpx 40rpx 56rpx;
  border: 2rpx solid rgba($primary, 0.1);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  
  .tab-item {
    flex: 1;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 24rpx;
    transition: all 0.35s ease;
    min-height: 80rpx;
    
    &.active {
      background: linear-gradient(135deg, $primary, $primary-dark);
      box-shadow: 0 8rpx 32rpx rgba($primary, 0.3);
      
      text {
        color: #fff;
        font-weight: 600;
      }
    }
    
    &:not(.active) {
      text {
        color: $text-secondary;
      }
    }
    
    text {
      font-size: 56rpx;
    }
  }
}

.section-title {
  display: block;
  font-size: 60rpx;
  font-weight: 700;
  color: $text-primary;
  margin-bottom: 36rpx;
  margin-left: 40rpx;
  margin-right: 40rpx;
  padding-left: 24rpx;
  border-left: 10rpx solid $primary;
}

.table-section {
  margin-bottom: 56rpx;
  
  .table-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 32rpx;
    padding: 0 40rpx;
    
    .table-card {
      position: relative;
      background: $card-bg;
      border-radius: 48rpx;
      padding: 40rpx 24rpx;
      min-height: 280rpx;
      text-align: center;
      border: 3rpx solid rgba($primary, 0.08);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
      
      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: inherit;
        background: linear-gradient(135deg, rgba($primary, 0.06), transparent 50%);
        opacity: 0;
        transition: opacity 0.4s;
      }
      
      &::after {
        content: '';
        position: absolute;
        top: 0;
        left: 10%;
        right: 10%;
        height: 4rpx;
        background: linear-gradient(90deg, transparent, rgba($primary, 0.3), transparent);
        border-radius: 4rpx;
        opacity: 0;
        transition: opacity 0.4s;
      }
      
      &.idle {
        &:active, &.selected {
          border-color: $primary;
          background: rgba($primary, 0.05);
          box-shadow: 
            0 0 60rpx rgba($primary, 0.2),
            0 12rpx 40rpx rgba($primary, 0.08);
          transform: translateY(-6rpx) scale(1.03);
          
          &::before {
            opacity: 1;
          }
          
          &::after {
            opacity: 1;
            animation: highlightSlide 1.5s ease-in-out infinite;
          }
        }
        
        &.selected::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 8rpx;
          background: linear-gradient(90deg, $primary, lighten($primary, 10%), $primary);
          border-radius: 4rpx 4rpx 0 0;
        }
      }
      
      &.occupied, &.reserved {
        opacity: 0.6;
        pointer-events: none;
        filter: grayscale(0.2);
      }
      
      .table-number {
        position: relative;
        z-index: 1;
        font-size: 100rpx;
        font-weight: 800;
        color: $text-primary;
        margin-bottom: 16rpx;
        transition: all 0.3s;
      }
      
      .table-type {
        position: relative;
        z-index: 1;
        font-size: 42rpx;
        color: $text-secondary;
        margin-bottom: 24rpx;
        display: block;
      }
      
      .table-status-badge {
        position: relative;
        z-index: 1;
        display: inline-block;
        padding: 16rpx 32rpx;
        border-radius: 24rpx;
        font-size: 40rpx;
        font-weight: 600;
        transition: all 0.3s;
        
        &.idle {
          background: rgba($primary, 0.1);
          color: $primary;
          border: 2rpx solid rgba($primary, 0.15);
        }
        &.occupied {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 2rpx solid rgba(245, 158, 11, 0.15);
        }
        &.reserved {
          background: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 2rpx solid rgba(59, 130, 246, 0.15);
        }
      }
      
      .table-check {
        position: absolute;
        top: 20rpx;
        right: 20rpx;
        width: 72rpx;
        height: 72rpx;
        background: linear-gradient(135deg, $primary, $primary-dark);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 0 28rpx rgba($primary, 0.4);
        animation: checkPop 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        
        text {
          font-size: 56rpx;
          color: #fff;
          font-weight: 700;
        }
      }
    }
  }
}

@keyframes highlightSlide {
  0% { left: 10%; right: 10%; opacity: 0.5; }
  50% { left: 5%; right: 5%; opacity: 1; }
  100% { left: 10%; right: 10%; opacity: 0.5; }
}

@keyframes checkPop {
  0% { transform: scale(0); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.info-section {
  margin-bottom: 48rpx;
  padding: 0 40rpx;
  
  .info-card {
    background: $card-bg;
    border-radius: 32rpx;
    padding: 40rpx;
    border: 2rpx solid rgba($primary, 0.08);
    box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
    
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 24rpx 0;
      
      &:not(:last-child) {
        border-bottom: 2rpx solid rgba($primary, 0.06);
      }
      
      .info-label {
        font-size: 48rpx;
        color: $text-secondary;
      }
      
      .info-value {
        font-size: 48rpx;
        color: $text-primary;
        
        &.highlight {
          color: $primary;
          font-weight: 600;
          font-size: 52rpx;
        }
      }
    }
  }
}

.player-section {
  margin-bottom: 56rpx;
  padding: 0 40rpx;
  
  .player-options {
    display: flex;
    flex-wrap: wrap;
    gap: 28rpx;
    
    .player-option {
      display: flex;
      align-items: center;
      gap: 20rpx;
      padding: 36rpx 48rpx;
      background: $card-bg;
      border-radius: 32rpx;
      border: 2rpx solid rgba($primary, 0.08);
      transition: all 0.35s ease;
      min-height: 120rpx;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
      
      &.selected {
        border-color: $primary;
        background: rgba($primary, 0.05);
        box-shadow: 0 0 28rpx rgba($primary, 0.15);
        
        .player-count {
          color: $primary;
        }
      }
      
      .player-icon {
        font-size: 72rpx;
      }
      
      .player-count {
        font-size: 56rpx;
        color: $text-primary;
        font-weight: 600;
      }
    }
  }
}

.time-section {
  margin-bottom: 56rpx;
  padding: 0 40rpx;
  
  .time-options {
    display: flex;
    flex-wrap: wrap;
    gap: 28rpx;
    
    .time-option {
      padding: 36rpx 56rpx;
      background: $card-bg;
      border-radius: 32rpx;
      border: 2rpx solid rgba($primary, 0.08);
      transition: all 0.35s ease;
      min-height: 120rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
      
      &.selected {
        border-color: $primary;
        background: rgba($primary, 0.05);
        box-shadow: 0 0 28rpx rgba($primary, 0.15);
        
        text {
          color: $primary;
        }
      }
      
      text {
        font-size: 56rpx;
        color: $text-primary;
        font-weight: 600;
      }
    }
  }
}

.summary-section {
  margin-bottom: 56rpx;
  padding: 0 40rpx;
  
  .summary-card {
    position: relative;
    background: linear-gradient(135deg, rgba($primary, 0.08), rgba($primary, 0.04));
    border-radius: 36rpx;
    padding: 48rpx;
    border: 2rpx solid rgba($primary, 0.15);
    overflow: hidden;
    
    .summary-glow {
      display: none;
    }
    
    .summary-row {
      position: relative;
      z-index: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .summary-label {
        font-size: 60rpx;
        color: $text-secondary;
      }
      
      .summary-value {
        font-size: 96rpx;
        font-weight: 700;
        color: $primary;
      }
    }
    
    .summary-hint {
      position: relative;
      z-index: 1;
      margin-top: 24rpx;
      
      text {
        font-size: 44rpx;
        color: $text-secondary;
      }
    }
  }
}

.bottom-action {
  position: fixed;
  bottom: 48rpx;
  left: 40rpx;
  right: 40rpx;
  
  .confirm-btn {
    height: 160rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 40rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 16rpx 48rpx rgba($primary, 0.35);
    transition: all 0.3s;
    min-height: 80rpx;
    
    &:not(.disabled):active {
      transform: scale(0.98);
      box-shadow: 0 8rpx 24rpx rgba($primary, 0.25);
    }
    
    &.disabled {
      background: #e5e5e5;
      box-shadow: none;
    }
    
    text {
      font-size: 72rpx;
      font-weight: 700;
      color: #fff;
    }
  }
}

.success-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.success-modal-content {
  width: 600rpx;
  background: $card-bg;
  border-radius: 40rpx;
  padding: 60rpx;
  text-align: center;
  box-shadow: 0 20rpx 80rpx rgba(0, 0, 0, 0.15);
  
  .success-icon {
    width: 160rpx;
    height: 160rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 32rpx;
    font-size: 120rpx;
    color: #fff;
  }
  
  .success-title {
    display: block;
    font-size: 72rpx;
    font-weight: 700;
    color: $text-primary;
    margin-bottom: 40rpx;
  }
  
  .success-info {
    display: flex;
    justify-content: space-between;
    padding: 20rpx 0;
    border-bottom: 2rpx solid rgba($primary, 0.08);
    
    &:last-child {
      border-bottom: none;
    }
    
    .success-label {
      font-size: 48rpx;
      color: $text-secondary;
    }
    
    .success-value {
      font-size: 48rpx;
      color: $text-primary;
      font-weight: 500;
    }
  }
  
  .success-btn {
    margin-top: 40rpx;
    height: 120rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80rpx;
    
    text {
      font-size: 56rpx;
      font-weight: 600;
      color: #fff;
    }
  }
}

.merge-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.merge-modal-content {
  width: 700rpx;
  background: $card-bg;
  border-radius: 40rpx;
  padding: 60rpx;
  border: 2rpx solid rgba($primary, 0.08);
  box-shadow: 0 20rpx 80rpx rgba(0, 0, 0, 0.15);
}

.merge-modal-header {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 40rpx;
  
  .merge-icon {
    width: 96rpx;
    height: 96rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    text {
      font-size: 72rpx;
    }
  }
  
  .merge-title {
    font-size: 64rpx;
    font-weight: 700;
    color: $text-primary;
  }
}

.merge-table-list {
  background: rgba($primary, 0.04);
  border-radius: 28rpx;
  padding: 32rpx;
  margin-bottom: 40rpx;
  
  .merge-table-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24rpx 0;
    
    &:not(:last-child) {
      border-bottom: 2rpx solid rgba($primary, 0.08);
    }
    
    .table-info {
      display: flex;
      align-items: center;
      gap: 20rpx;
      
      .table-num {
        font-size: 56rpx;
        font-weight: 600;
        color: $text-primary;
      }
      
      .table-type {
        font-size: 44rpx;
        color: $text-secondary;
      }
    }
    
    .table-rate {
      font-size: 48rpx;
      color: $primary;
    }
  }
}

.merge-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
  padding: 32rpx;
  background: rgba($primary, 0.08);
  border-radius: 28rpx;
  
  .summary-label {
    font-size: 56rpx;
    color: $text-secondary;
  }
  
  .summary-amount {
    font-size: 72rpx;
    font-weight: 700;
    color: $primary;
  }
}

.merge-actions {
  display: flex;
  gap: 28rpx;
  
  .merge-btn {
    flex: 1;
    height: 120rpx;
    background: linear-gradient(135deg, $primary, $primary-dark);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80rpx;
    
    text {
      font-size: 56rpx;
      font-weight: 600;
      color: #fff;
    }
  }
  
  .cancel-btn {
    flex: 1;
    height: 120rpx;
    background: rgba($text-secondary, 0.1);
    border-radius: 28rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 80rpx;
    
    text {
      font-size: 56rpx;
      font-weight: 600;
      color: $text-secondary;
    }
  }
}

.loading-overlay {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 240rpx 0;

  .loading-text {
    font-size: 56rpx;
    color: $text-secondary;
  }
}
</style>