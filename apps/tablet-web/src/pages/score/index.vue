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
        
        <view v-if="showAdSection" class="ad-section">
          <view class="ad-card">
            <video 
              src="/static/tabbar/billiards_ad.mp4" 
              autoplay 
              loop 
              muted 
              class="ad-video"
              object-fit="fill"
              :controls="false"
              :show-center-play-btn="false"
              :show-play-btn="false"
              :show-fullscreen-btn="false"
              :enable-play-gesture="false"
            />
            <view class="video-overlay"></view>
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
const showAdSection = ref(true)

function checkAdVisibility() {
  const instance = getCurrentInstance()
  if (!instance) return
  
  const query = uni.createSelectorQuery().in(instance)
  query.select('.score-area').boundingClientRect((rect) => {
    if (rect) {
      const screenHeight = uni.getSystemInfoSync().windowHeight
      const scoreAreaHeight = rect.height
      const adRequiredHeight = screenHeight * 0.4
      const availableSpace = screenHeight - scoreAreaHeight
      showAdSection.value = availableSpace >= adRequiredHeight
    }
  }).exec()
}

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
  setTimeout(() => {
    checkAdVisibility()
  }, 500)
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
  setTimeout(() => {
    checkAdVisibility()
  }, 300)
})

onUnmounted(() => {
  disposeServiceCall()
})
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.score-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0a0a1a 0%, #1a1a2e 40%, #16162a 70%, #0f0f1f 100%);
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
      top: -20%;
      left: -20%;
      width: 140%;
      height: 60%;
      background: radial-gradient(ellipse at 30% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
    }
    
    .bg-gradient-2 {
      position: absolute;
      bottom: -10%;
      right: -10%;
      width: 120%;
      height: 50%;
      background: radial-gradient(ellipse at 70% 80%, rgba(201, 169, 98, 0.06) 0%, transparent 50%);
    }
    
    .bg-gradient-3 {
      position: absolute;
      top: 30%;
      left: 50%;
      transform: translateX(-50%);
      width: 200%;
      height: 40%;
      background: radial-gradient(ellipse at 50% 50%, rgba(239, 68, 68, 0.04) 0%, transparent 50%);
    }
  }
}

.header-section {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  padding: 20rpx 24rpx;
  padding-top: calc(env(safe-area-inset-top) + 20rpx);
  
  .header-card {
    background: linear-gradient(145deg, rgba(26, 26, 46, 0.92), rgba(20, 20, 40, 0.95));
    border-radius: 56rpx;
    padding: 36rpx 40rpx;
    border: 4rpx solid rgba($gold, 0.15);
    box-shadow: 
      0 16rpx 64rpx rgba(0, 0, 0, 0.4),
      0 0 40rpx rgba($gold, 0.08),
      inset 0 1rpx 0 rgba(255, 255, 255, 0.05);
    
    .header-main {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32rpx;
      
      .header-actions {
        display: flex;
        align-items: center;
        gap: 20rpx;
        
        .header-btn {
          display: flex;
          align-items: center;
          gap: 12rpx;
          padding: 24rpx 28rpx;
          background: rgba(255, 255, 255, 0.08);
          border-radius: 28rpx;
          border: 2rpx solid rgba(255, 255, 255, 0.12);
          transition: all 0.2s;
          
          &:active {
            transform: scale(0.96);
            opacity: 0.8;
          }
          
          &.reset {
            background: rgba(239, 68, 68, 0.15);
            border-color: rgba(239, 68, 68, 0.3);
            
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
            color: rgba(255, 255, 255, 0.8);
          }
        }
      }
    }
    
    .header-secondary {
      display: flex;
      gap: 24rpx;
      margin-top: 28rpx;
      padding-top: 28rpx;
      border-top: 2rpx solid rgba(255, 255, 255, 0.06);
      
      .action-btn {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16rpx;
        padding: 32rpx;
        border-radius: 36rpx;
        background: rgba(255, 255, 255, 0.08);
        border: 2rpx solid rgba(255, 255, 255, 0.12);
        transition: all 0.2s;
        
        &:active {
          transform: scale(0.98);
          opacity: 0.8;
        }
        
        &.primary {
          background: linear-gradient(135deg, $gold, #8a6d3b);
          border: none;
          
          .btn-icon, .btn-text {
            color: #1a1a2e;
          }
        }
        
        &.disabled {
          opacity: 0.4;
          pointer-events: none;
          
          .btn-icon, .btn-text {
            color: rgba(255, 255, 255, 0.3);
          }
          
          &.primary {
            background: rgba(201, 169, 98, 0.2);
            
            .btn-icon, .btn-text {
              color: rgba(201, 169, 98, 0.4);
            }
          }
        }
        
        .btn-icon {
          font-size: 44rpx;
        }
        
        .btn-text {
          font-size: 44rpx;
          font-weight: 700;
          color: rgba(255, 255, 255, 0.8);
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
  gap: 32rpx;
  margin-bottom: 40rpx;
}

.quick-buttons-area {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 32rpx;
  margin-bottom: 40rpx;
}

.ad-section {
  margin-top: 32rpx;
  padding-bottom: 40rpx;
  
  .ad-card {
    position: relative;
    margin-bottom:200rpx;
    overflow: hidden;
    
    .ad-video {
      width: 100%;
      height: 40vh;
      pointer-events: none;
    }
    
    .video-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: transparent;
      z-index: 10;
    }
  }
}

.call-waiter-btn-wrap {
  position: fixed;
  right: 32rpx;
  bottom: calc(env(safe-area-inset-bottom) + 200rpx);
  z-index: 9999;
}

.call-waiter-btn {
  position: relative;
  width: 180rpx;
  height: 180rpx;
  background: linear-gradient(135deg, rgba(201, 169, 98, 0.95), rgba(138, 109, 59, 0.9));
  border-radius: 50%;
  border: 4rpx solid rgba(255, 255, 255, 0.3);
  box-shadow: 
    0 24rpx 72rpx rgba(201, 169, 98, 0.5),
    0 0 60rpx rgba(201, 169, 98, 0.3),
    inset 0 4rpx 8rpx rgba(255, 255, 255, 0.3),
    inset 0 -4rpx 8rpx rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:active {
    transform: scale(0.92);
    box-shadow: 
      0 12rpx 36rpx rgba(201, 169, 98, 0.4),
      0 0 30rpx rgba(201, 169, 98, 0.2),
      inset 0 4rpx 8rpx rgba(255, 255, 255, 0.2),
      inset 0 -4rpx 8rpx rgba(0, 0, 0, 0.3);
  }
  
  .call-icon-wrap {
    position: relative;
    width: 120rpx;
    height: 120rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .icon-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0%, transparent 70%);
      border-radius: 50%;
      animation: iconPulse 3s ease-in-out infinite;
    }
    
    .call-icon {
      position: relative;
      z-index: 1;
      font-size: 72rpx;
      filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.3));
    }
  }
  
  &.calling {
    background: linear-gradient(135deg, rgba(245, 158, 11, 0.95), rgba(217, 119, 6, 0.9));
    border-color: rgba(255, 255, 255, 0.4);
    
    .btn-glow-ring {
      position: absolute;
      top: -20rpx; left: -20rpx; right: -20rpx; bottom: -20rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(245, 158, 11, 0.6);
      animation: glowPulse 2s ease-out infinite;
    }
    
    .btn-pulse-ring {
      position: absolute;
      top: -30rpx; left: -30rpx; right: -30rpx; bottom: -30rpx;
      border-radius: 50%;
      border: 4rpx solid rgba(245, 158, 11, 0.4);
      animation: glowPulse 2s ease-out infinite;
      animation-delay: 0.5s;
    }
  }
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.3); opacity: 1; }
}

@keyframes glowPulse {
  0% { transform: scale(1); opacity: 0.8; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes adGlow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.8; }
}
</style>