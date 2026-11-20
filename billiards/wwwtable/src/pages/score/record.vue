<template>
  <view class="record-page">
    <view class="sticky-header">
      <view class="header-card">
        <view class="header-row">
          <view class="header-left">
            <button class="back-btn" @click="handleBack">‹</button>
            <text class="header-title">比赛记录</text>
          </view>
          <view class="header-right">
            <button class="clear-btn" @click="handleClear">清空记录</button>
          </view>
        </view>
      </view>
    </view>

    <scroll-view class="main-content" scroll-y>
      <view v-if="groupedRecords.length === 0" class="empty-state">
        <text class="empty-icon">📝</text>
        <text class="empty-text">暂无比赛记录</text>
      </view>

      <view v-for="group in groupedRecords" :key="group.mode" class="record-group">
        <view class="group-header">
          <text class="group-title">{{ getGameName(group.mode) }}</text>
          <text class="group-date">{{ formatDate(group.records[0]?.startTime) }}</text>
        </view>

        <view class="summary-bar">
          <view class="summary-item">
            <text class="winner-icon">👑</text>
            <text class="player-name">{{ group.records[0]?.players[0]?.name }}</text>
            <text class="win-count">({{ group.player1Wins }}胜)</text>
          </view>
          <view class="summary-center">
            <text class="trophy">🏆</text>
            <text class="total-rounds">共{{ group.totalRounds }}局</text>
          </view>
          <view class="summary-item">
            <text class="player-name">{{ group.records[0]?.players[1]?.name }}</text>
            <text class="win-count">({{ group.player2Wins }}胜)</text>
          </view>
        </view>

        <view class="round-list">
          <view v-for="record in group.records" :key="record.id" class="round-item">
            <text class="round-number">第{{ record.matchNumber }}局</text>
            <view class="round-scores">
              <text class="score">{{ record.roundDetails[0]?.player1Score }}</text>
              <text class="separator">-</text>
              <text class="score">{{ record.roundDetails[0]?.player2Score }}</text>
            </view>
            <text class="round-time">{{ formatTime(record.endTime) }}</text>
          </view>
        </view>
      </view>
    </scroll-view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { MatchRecord, GameMode } from '../../types/score'
import { getScoreRecordsNew, clearAllScoreRecords } from '../../utils/score-storage'

const records = ref<MatchRecord[]>([])

const gameNames: Record<GameMode, string> = {
  eight_ball: '中八玩法',
  chasing_2: '两人追分',
  chasing_3: '三人追分',
  chasing_4: '四人追分',
  snooker: '斯诺克'
}

const groupedRecords = computed(() => {
  const groups: Record<string, {
    mode: GameMode
    records: MatchRecord[]
    player1Wins: number
    player2Wins: number
    totalRounds: number
  }> = {}

  records.value.forEach(record => {
    if (!groups[record.gameMode]) {
      groups[record.gameMode] = {
        mode: record.gameMode,
        records: [],
        player1Wins: 0,
        player2Wins: 0,
        totalRounds: 0
      }
    }
    groups[record.gameMode].records.push(record)
    if (record.winnerId === 1) groups[record.gameMode].player1Wins++
    if (record.winnerId === 2) groups[record.gameMode].player2Wins++
    groups[record.gameMode].totalRounds++
  })

  return Object.values(groups).sort((a, b) => (b.records[0]?.startTime || 0) - (a.records[0]?.startTime || 0))
})

function getGameName(mode: GameMode) {
  return gameNames[mode] || mode
}

function formatDate(timestamp?: number) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

function formatTime(timestamp?: number) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
}

function handleBack() {
  uni.navigateBack()
}

function handleClear() {
  uni.showModal({
    title: '确认清空',
    content: '确定要删除所有比赛记录吗？',
    success: (res) => {
      if (res.confirm) {
        clearAllScoreRecords()
        records.value = []
        uni.showToast({ title: '已清空', icon: 'success' })
      }
    }
  })
}

function loadRecords() {
  records.value = getScoreRecordsNew()
}

onMounted(() => {
  loadRecords()
})
</script>

<style lang="scss" scoped>
.record-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0fdf4 0%, #f7f7f7 40%, #f0fdf4 100%);
}

.sticky-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  width: 100vw;
  padding: 20rpx 24rpx;
}

.header-card {
  background: rgba(255,255,255,0.95);
  border-radius: 40rpx;
  padding: 32rpx 36rpx;
  border: 2rpx solid rgba(7,193,96,0.08);
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.05), 0 0 20rpx rgba(7,193,96,0.04);
}

.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 28rpx;
}

.header-right {
  display: flex;
  justify-content: flex-end;
}

.back-btn {
  width: 80rpx;
  height: 80rpx;
  background: rgba(7,193,96,0.06);
  border-radius: 50%;
  color: #07C160;
  font-size: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2rpx solid rgba(7,193,96,0.1);
  
  &:active {
    background: rgba(7,193,96,0.12);
  }
}

.header-title {
  font-size: 52rpx;
  font-weight: 700;
  color: #333333;
}

.clear-btn {
  padding: 20rpx 32rpx;
  background: rgba(239, 68, 68, 0.06);
  border-radius: 24rpx;
  color: #ef4444;
  font-size: 36rpx;
  font-weight: 600;
  border: 2rpx solid rgba(239, 68, 68, 0.12);
  
  &:active {
    opacity: 0.7;
  }
}

.main-content {
  margin-top: 200rpx;
  padding: 0 24rpx;
  height: calc(100vh - 120rpx);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 200rpx 0;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: 32rpx;
  }
  
  .empty-text {
    font-size: 44rpx;
    color: #999999;
  }
}

.record-group {
  background: #ffffff;
  border-radius: 40rpx;
  padding: 40rpx;
  margin-bottom: 32rpx;
  border: 2rpx solid rgba(7,193,96,0.06);
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  
  .group-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32rpx;
    
    .group-title {
      font-size: 48rpx;
      font-weight: 700;
      color: #333333;
    }
    
    .group-date {
      font-size: 36rpx;
      color: #999999;
    }
  }
  
  .summary-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 32rpx;
    background: rgba(7,193,96,0.04);
    border-radius: 28rpx;
    margin-bottom: 32rpx;
    
    .summary-item {
      display: flex;
      align-items: center;
      gap: 12rpx;
      
      .winner-icon {
        font-size: 40rpx;
      }
      
      .player-name {
        font-size: 40rpx;
        font-weight: 600;
        color: #333333;
      }
      
      .win-count {
        font-size: 36rpx;
        color: #999999;
      }
    }
    
    .summary-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      
      .trophy {
        font-size: 48rpx;
        margin-bottom: 12rpx;
      }
      
      .total-rounds {
        font-size: 36rpx;
        color: #999999;
      }
    }
  }
  
  .round-list {
    .round-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 28rpx 0;
      border-bottom: 2rpx solid rgba(7,193,96,0.04);
      
      &:last-child {
        border-bottom: none;
      }
      
      .round-number {
        font-size: 40rpx;
        color: #999999;
      }
      
      .round-scores {
        display: flex;
        align-items: center;
        gap: 20rpx;
        
        .score {
          font-size: 56rpx;
          font-weight: 900;
          color: #333333;
        }
        
        .separator {
          font-size: 40rpx;
          color: #cccccc;
        }
      }
      
      .round-time {
        font-size: 36rpx;
        color: #999999;
      }
    }
  }
}
</style>