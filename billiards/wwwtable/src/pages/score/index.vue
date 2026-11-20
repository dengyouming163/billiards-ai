<template>
  <view class="score-page">
    <view class="page-bg">
      <view class="bg-gradient-1"></view>
      <view class="bg-gradient-2"></view>
      <view class="bg-gradient-3"></view>
    </view>
    
    <view class="header-section">
      <view class="header-card">
        <view class="header-main">
          <GameSelector :current-mode="currentMode" @change="handleModeChange" />
          <view class="header-actions">
            <button v-if="showExtraButtons" class="header-btn" @click="handleViewRecords">
              <text class="btn-icon">📋</text>
              <text class="btn-text">记录</text>
            </button>
            <button class="header-btn reset" @click="handleReset">
              <text class="btn-icon">🔄</text>
              <text class="btn-text">重置</text>
            </button>
          </view>
        </view>
        <view class="header-secondary">
          <button 
            class="action-btn" 
            :class="{ disabled: isChasingMode }"
            :disabled="isChasingMode"
            @click="handleSetRounds"
          >
            <text class="btn-icon">⚙️</text>
            <text class="btn-text">设置局数</text>
          </button>
          <button 
            class="action-btn primary" 
            :class="{ disabled: isChasingMode }"
            :disabled="isChasingMode"
            @click="handleEndGame"
          >
            <text class="btn-icon">🏆</text>
            <text class="btn-text">结束本局</text>
          </button>
        </view>
      </view>
    </view>
    
    <scroll-view class="content-section" scroll-y>
      <view class="scroll-container">
        <view class="score-area">
          <view class="cards-grid">
            <ScoreCard 
              v-for="card in scoreCards" 
              :key="card.id"
              :card="card"
              @plus="handleCardPlus"
              @minus="handleCardMinus"
              @edit="handleCardEdit"
            />
          </view>
          
          <view v-if="currentMode === 'snooker'" class="quick-buttons-area">
            <QuickButtons
              title="玩家1快捷加减分"
              bg-color="rgba(59, 130, 246, 0.15)"
              text-color="#3b82f6"
              btn-color="#3b82f6"
              minus-color="#ef4444"
              @plus="(v) => handleSnookerPlus(0, v)"
              @minus="() => handleSnookerMinus(0)"
            />
            <QuickButtons
              title="玩家2快捷加减分"
              bg-color="rgba(239, 68, 68, 0.15)"
              text-color="#ef4444"
              btn-color="#ef4444"
              minus-color="#3b82f6"
              @plus="(v) => handleSnookerPlus(1, v)"
              @minus="() => handleSnookerMinus(1)"
            />
          </view>
        </view>
        

      </view>
    </scroll-view>
    
    <view class="call-waiter-btn-wrap">
      <view 
        class="call-waiter-btn" 
        :class="{ calling: isCallingWaiter }"
        @click="callWaiter"
      >
        <view class="btn-glow-ring" v-if="isCallingWaiter"></view>
        <view class="btn-pulse-ring" v-if="isCallingWaiter"></view>
        <view class="call-icon-wrap">
          <view class="icon-glow"></view>
          <text class="call-icon">{{ isCallingWaiter ? '⏳' : '🛎️' }}</text>
        </view>
      </view>
    </view>
    
    <ResultModal
      :visible="showResultModal"
      :player1-score="players[0]?.score || 0"
      :player2-score="players[1]?.score || 0"
      :match-number="currentMatchNumber"
      @cancel="showResultModal = false"
      @confirm="handleResultConfirm"
    />
    
    <ScoreInputModal
      :visible="showInputModal"
      :current-value="editingCard?.value || 0"
      @cancel="showInputModal = false"
      @confirm="handleInputConfirm"
    />
    
    <SetRoundsModal
      :visible="showSetRoundsModal"
      :current-rounds="totalRounds"
      @cancel="showSetRoundsModal = false"
      @confirm="handleSetRoundsConfirm"
    />
    
    <ConfirmModal
      :visible="showResetModal"
      title="确认重置"
      message="确定要清空所有分数吗？"
      icon="⚠️"
      confirm-text="确定重置"
      :danger="true"
      @cancel="showResetModal = false"
      @confirm="handleResetConfirm"
    />
    
    <AlertModal
      :visible="showCancelWaiterModal"
      icon="🛎️"
      title="确定要取消呼叫服务员吗？"
      message="取消后服务员可能仍在赶来途中"
      confirm-text="确定取消"
      cancel-text="继续等待"
      :confirm-danger="true"
      @confirm="showCancelWaiterModal = false; cancelWaiterCall()"
      @cancel="showCancelWaiterModal = false"
    />
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import type { GameMode, Player, ScoreCard as ScoreCardType, ScoreState } from '../../types/score'
import { saveCurrentState, getCurrentState, generateRecordId, saveScoreRecordNew } from '../../utils/score-storage'
import GameSelector from './components/GameSelector.vue'
import ScoreCard from './components/ScoreCard.vue'
import QuickButtons from './components/QuickButtons.vue'
import ResultModal from './components/ResultModal.vue'
import ScoreInputModal from './components/ScoreInputModal.vue'
import SetRoundsModal from './components/SetRoundsModal.vue'
import ConfirmModal from './components/ConfirmModal.vue'
import AlertModal from '@/components/standard/AlertModal.vue'
import { useServiceCall } from '@/composables/useServiceCall'

const currentMode = ref<GameMode>('eight_ball')
const players = ref<Player[]>([])
const penalty = ref(0)
const currentMatchNumber = ref(1)
const totalRounds = ref(5)

const showResultModal = ref(false)
const showInputModal = ref(false)
const showSetRoundsModal = ref(false)
const showResetModal = ref(false)
const editingCard = ref<ScoreCardType | null>(null)


const {
  isCallingWaiter, showCancelWaiterModal,
  callWaiter, cancelWaiterCall, dispose: disposeServiceCall,
} = useServiceCall()

const playerColors: Record<number, 'blue' | 'red' | 'green' | 'orange'> = {
  1: 'blue',
  2: 'red',
  3: 'green',
  4: 'orange'
}

const showExtraButtons = computed(() => {
  return currentMode.value === 'eight_ball' || currentMode.value === 'snooker'
})

const isChasingMode = computed(() => {
  return currentMode.value.startsWith('chasing')
})

const playerCount = computed(() => {
  switch (currentMode.value) {
    case 'chasing_4': return 4
    case 'chasing_3': return 3
    default: return 2
  }
})

const scoreCards = computed((): ScoreCardType[] => {
  const cards: ScoreCardType[] = []
  
  for (let i = 0; i < playerCount.value; i++) {
    const player = players.value[i]
    cards.push({
      id: `player_${i}`,
      type: 'player',
      playerId: i + 1,
      label: `玩家${i + 1}号`,
      value: player?.score || 0,
      color: playerColors[i + 1],
      showActions: currentMode.value !== 'snooker'
    })
  }
  
  if (currentMode.value.startsWith('chasing')) {
    cards.push({
      id: 'penalty',
      type: 'penalty',
      label: '罚分',
      value: penalty.value,
      color: '#1f2937',
      showActions: true,
      span: playerCount.value === 2 ? 2 : 1
    })
  }
  
  if (showExtraButtons.value) {
    for (let i = 0; i < playerCount.value; i++) {
      const player = players.value[i]
      cards.push({
        id: `win_${i}`,
        type: 'win',
        playerId: i + 1,
        label: '胜场',
        value: player?.wins || 0,
        color: playerColors[i + 1],
        showActions: false
      })
    }
  }
  
  return cards
})

function initPlayers(count: number) {
  players.value = Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `玩家${i + 1}号`,
    score: 0,
    wins: 0,
    color: playerColors[i + 1]
  }))
}

function handleModeChange(mode: GameMode) {
  currentMode.value = mode
  initPlayers(playerCount.value)
  penalty.value = 0
  currentMatchNumber.value = 1
  saveCurrentState(getCurrentStateData())
}

function handleCardPlus(id: string) {
  if (id === 'penalty') {
    penalty.value++
  } else if (id.startsWith('player_')) {
    const index = parseInt(id.split('_')[1])
    if (players.value[index]) {
      players.value[index].score++
    }
  }
  saveCurrentState(getCurrentStateData())
}

function handleCardMinus(id: string) {
  if (id === 'penalty') {
    penalty.value = Math.max(0, penalty.value - 1)
  } else if (id.startsWith('player_')) {
    const index = parseInt(id.split('_')[1])
    if (players.value[index]) {
      players.value[index].score = Math.max(0, players.value[index].score - 1)
    }
  }
  saveCurrentState(getCurrentStateData())
}

function handleCardEdit(id: string) {
  const card = scoreCards.value.find(c => c.id === id)
  if (card) {
    editingCard.value = card
    showInputModal.value = true
  }
}

function handleInputConfirm(value: number) {
  if (editingCard.value) {
    const id = editingCard.value.id
    if (id === 'penalty') {
      penalty.value = value
    } else if (id.startsWith('player_')) {
      const index = parseInt(id.split('_')[1])
      if (players.value[index]) {
        players.value[index].score = value
      }
    }
  }
  showInputModal.value = false
  editingCard.value = null
  saveCurrentState(getCurrentStateData())
}

function handleSnookerPlus(playerIndex: number, value: number) {
  if (players.value[playerIndex]) {
    players.value[playerIndex].score += value
  }
  saveCurrentState(getCurrentStateData())
}

function handleSnookerMinus(playerIndex: number) {
  if (players.value[playerIndex]) {
    players.value[playerIndex].score = Math.max(0, players.value[playerIndex].score - 1)
  }
  saveCurrentState(getCurrentStateData())
}

function handleSetRounds() {
  showSetRoundsModal.value = true
}

function handleSetRoundsConfirm(value: number) {
  totalRounds.value = value
  showSetRoundsModal.value = false
}

function handleEndGame() {
  showResultModal.value = true
}

function handleResultConfirm() {
  const p1 = players.value[0]
  const p2 = players.value[1]
  const winnerId = p1.score > p2.score ? 1 : p1.score < p2.score ? 2 : 0
  
  if (winnerId !== 0) {
    players.value[winnerId - 1].wins++
  }
  
  saveScoreRecordNew({
    id: generateRecordId(),
    gameMode: currentMode.value,
    players: [...players.value],
    winnerId,
    matchNumber: currentMatchNumber.value,
    totalRounds: totalRounds.value,
    startTime: Date.now() - 3600000,
    endTime: Date.now(),
    roundDetails: [{
      roundNumber: currentMatchNumber.value,
      player1Score: p1.score,
      player2Score: p2.score,
      winnerId,
      timestamp: Date.now()
    }]
  })
  
  p1.score = 0
  p2.score = 0
  currentMatchNumber.value++
  showResultModal.value = false
  saveCurrentState(getCurrentStateData())
  
  if (currentMatchNumber.value > totalRounds.value) {
    uni.showToast({
      title: `比赛结束！玩家${players.value[0].wins > players.value[1].wins ? '1' : '2'}获胜！`,
      icon: 'success',
      duration: 3000
    })
    currentMatchNumber.value = 1
    p1.wins = 0
    p2.wins = 0
  }
}

function handleViewRecords() {
  uni.navigateTo({ url: '/pages/score/record' })
}

function handleReset() {
  showResetModal.value = true
}

function handleResetConfirm() {
  initPlayers(playerCount.value)
  penalty.value = 0
  currentMatchNumber.value = 1
  saveCurrentState(getCurrentStateData())
  showResetModal.value = false
}

function getCurrentStateData(): ScoreState {
  return {
    currentMode: currentMode.value,
    players: players.value,
    penalty: penalty.value,
    currentMatchNumber: currentMatchNumber.value,
    totalRounds: totalRounds.value
  }
}

function loadSavedState() {
  const state = getCurrentState()
  if (state) {
    currentMode.value = state.currentMode
    players.value = state.players
    penalty.value = state.penalty
    currentMatchNumber.value = state.currentMatchNumber
    totalRounds.value = state.totalRounds
  } else {
    initPlayers(playerCount.value)
  }
}

onMounted(() => {
  loadSavedState()
})

onUnmounted(() => {
  disposeServiceCall()
})
</script>

<style lang="scss" scoped>
.score-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #f0fdf4 0%, #f7f7f7 40%, #f0fdf4 100%);
  position: relative;
  overflow: hidden;
  padding-bottom: calc(env(safe-area-inset-bottom) + 200rpx);
  
  .page-bg {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: 0;
    
    .bg-gradient-1 {
      position: absolute;
      top: -10%;
      left: -10%;
      width: 120%;
      height: 50%;
      background: radial-gradient(ellipse at 30% 20%, rgba(7,193,96,0.08) 0%, transparent 50%);
      animation: floatBg 10s ease-in-out infinite;
    }
    
    .bg-gradient-2 {
      position: absolute;
      bottom: -10%;
      right: -10%;
      width: 100%;
      height: 40%;
      background: radial-gradient(ellipse at 70% 80%, rgba(6,182,212,0.06) 0%, transparent 50%);
      animation: floatBg 10s ease-in-out infinite 3s;
    }
    
    .bg-gradient-3 {
      position: absolute;
      top: 40%;
      left: 50%;
      transform: translateX(-50%);
      width: 150%;
      height: 30%;
      background: radial-gradient(ellipse at 50% 50%, rgba(255,151,106,0.04) 0%, transparent 50%);
      animation: floatBg 10s ease-in-out infinite 5s;
    }
    
    .bg-grid {
      position: absolute;
      inset: 0;
      background-image: 
        linear-gradient(rgba(7,193,96,0.02) 1px, transparent 1px),
        linear-gradient(90deg, rgba(7,193,96,0.02) 1px, transparent 1px);
      background-size: 50rpx 50rpx;
    }
  }
}

@keyframes floatBg {
  0%,100%{transform:translate(0,0) scale(1);}
  33%{transform:translate(40rpx,40rpx) scale(1.05);}
  66%{transform:translate(-20rpx,-20rpx) scale(0.95);}
}

.header-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 24rpx 24rpx;
  padding-top: calc(env(safe-area-inset-top) + 24rpx);
  
  .header-card {
    background: rgba(255,255,255,0.95);
    border-radius: 48rpx;
    padding: 36rpx 40rpx;
    border: 2rpx solid rgba(7,193,96,0.1);
    box-shadow: 
      0 8rpx 40rpx rgba(0,0,0,0.06),
      0 0 30rpx rgba(7,193,96,0.08);
    backdrop-filter: blur(20rpx);
    
    .header-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 24rpx;
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 16rpx;
        
        .header-btn {
          display: flex;
          align-items: center;
          gap: 10rpx;
          padding: 24rpx 28rpx;
          background: rgba(7,193,96,0.06);
          border-radius: 32rpx;
          border: 2rpx solid rgba(7,193,96,0.1);
          transition: all 0.2s;
          
          &:active {
            transform: scale(0.96);
            background: rgba(7,193,96,0.12);
            border-color: rgba(7,193,96,0.2);
          }
          
          &.reset {
            background: rgba(239,68,68,0.08);
            border-color: rgba(239,68,68,0.15);
            
            .btn-icon, .btn-text {
              color: #ef4444;
            }
          }
          
          .btn-icon {
            font-size: 40rpx;
          }
          
          .btn-text {
            font-size: 36rpx;
            font-weight: 600;
            color: #333333;
          }
        }
      }
    }
    
    .header-secondary {
      display: flex;
      gap: 20rpx;
      margin-top: 28rpx;
      padding-top: 28rpx;
      border-top: 2rpx solid rgba(7,193,96,0.08);
      
      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12rpx;
        padding: 32rpx;
        border-radius: 36rpx;
        background: rgba(7,193,96,0.06);
        border: 2rpx solid rgba(7,193,96,0.12);
        transition: all 0.2s;
        
        &:active {
          transform: scale(0.98);
          background: rgba(7,193,96,0.1);
        }
        
        &.primary {
          background: linear-gradient(135deg, #07C160, #06AD56);
          border: 2rpx solid rgba(255,255,255,0.2);
          box-shadow: 0 12rpx 32rpx rgba(7,193,96,0.35);
          
          .btn-icon, .btn-text {
            color: #ffffff;
          }
        }
        
        &.disabled {
          opacity: 0.4;
          pointer-events: none;
          
          .btn-icon, .btn-text {
            color: #cccccc;
          }
          
          &.primary {
            background: rgba(7,193,96,0.2);
            
            .btn-icon, .btn-text {
              color: rgba(7,193,96,0.4);
            }
          }
        }
        
        .btn-icon {
          font-size: 44rpx;
        }
        
        .btn-text {
          font-size: 44rpx;
          font-weight: 700;
          color: #333333;
        }
      }
    }
  }
}

.content-section {
  margin-top: calc(env(safe-area-inset-top) + 480rpx);
  padding: 0 24rpx;
  height: calc(100vh - env(safe-area-inset-top) - 200rpx);
}

.scroll-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
}

.score-area {
  flex: 1;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.quick-buttons-area {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24rpx;
  margin-bottom: 32rpx;
}



.call-waiter-btn-wrap {
  position: fixed;
  left: 32rpx;
  bottom: calc(env(safe-area-inset-bottom) + 200rpx);
  z-index: 9999;
}

.call-waiter-btn {
  position: relative;
  width: 170rpx;
  height: 170rpx;
  background: linear-gradient(135deg, #07C160, #06AD56);
  border-radius: 50%;
  border: 4rpx solid rgba(255,255,255,0.95);
  box-shadow: 
    0 20rpx 60rpx rgba(7,193,96,0.4),
    0 0 50rpx rgba(7,193,96,0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    transform: scale(0.9);
    box-shadow: 
      0 10rpx 30rpx rgba(7,193,96,0.3),
      0 0 30rpx rgba(7,193,96,0.1);
  }
  
  .call-icon-wrap {
    position: relative;
    width: 110rpx;
    height: 110rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%);
      border-radius: 50%;
      animation: iconPulse 3s ease-in-out infinite;
    }
    
    .call-icon {
      position: relative;
      z-index: 1;
      font-size: 72rpx;
    }
  }
  
  &.calling {
    background: linear-gradient(135deg, #F97316, #EA580C);
    border-color: rgba(255,255,255,0.95);
    
    .btn-glow-ring {
      position: absolute;
      top: -16rpx; left: -16rpx; right: -16rpx; bottom: -16rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(249,115,22,0.5);
      animation: glowPulse 1.5s ease-out infinite;
    }
    
    .btn-pulse-ring {
      position: absolute;
      top: -10rpx; left: -10rpx; right: -10rpx; bottom: -10rpx;
      border-radius: 50%;
      border: 3rpx solid rgba(249,115,22,0.3);
      animation: glowPulse 1.5s ease-out infinite;
      animation-delay: 0.5s;
    }
  }
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 0.5; }
  50% { transform: scale(1.3); opacity: 0.8; }
}

@keyframes glowPulse {
  0% { transform: scale(1); opacity: 0.7; }
  100% { transform: scale(1.4); opacity: 0; }
}
</style>