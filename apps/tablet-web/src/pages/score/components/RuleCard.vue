<template>
  <view class="rule-card-overlay" v-if="visible" @tap="$emit('close')">
    <view class="rule-card" @tap.stop>
      <view class="rc-top-line"></view>

      <view class="rc-header">
        <text class="rc-title">{{ gameName }} — 规则说明</text>
        <view class="rc-close" @tap="$emit('close')">
          <text>✕</text>
        </view>
      </view>

      <scroll-view class="rc-body" scroll-y :show-scrollbar="false">
        <view v-for="(rule, idx) in rules" :key="idx" class="rule-item">
          <text class="rule-label">{{ rule.label }}</text>
          <text class="rule-text">{{ rule.text }}</text>
        </view>
      </scroll-view>

      <view class="rc-footer">
        <view class="rc-back-btn" @tap="$emit('close')">返回重选</view>
        <view class="rc-start-btn" @tap="$emit('start')">开始游戏</view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Rule {
  label: string
  text: string
}

const props = defineProps<{
  visible: boolean
  gameCode: string
  gameName: string
}>()

defineEmits<{
  close: []
  start: []
}>()

const eightBallRules: Rule[] = [
  { label: '使用球', text: '1-15号球 + 白球，1-7为全色(Solids)，9-15为半色(Stripes)' },
  { label: '开球定花色', text: '开球后第一个合法进袋的球决定你的花色' },
  { label: '目标', text: '先打完自己的花色球，最后将8号球打进指定袋口' },
  { label: '犯规', text: '白球进袋、未碰到己方球、8号球提前进袋或进错袋 → 判负' },
]

const snookerRules: Rule[] = [
  { label: '使用球', text: '15个红球(各1分) + 黄2/绿3/棕4/蓝5/粉6/黑7 + 白球' },
  { label: '打法', text: '红球→彩球→红球→彩球交替，红球进袋不回位，彩球回位' },
  { label: '红球清光后', text: '按黄→绿→棕→蓝→粉→黑顺序收彩球，此时进袋不回位' },
  { label: '满分147', text: '15×(1+7) + 2+3+4+5+6+7 = 147' },
  { label: '犯规罚分', text: '最少罚4分或犯规球的分值（取高者），如碰黑球犯规罚7分' },
]

const chaseRules: Rule[] = [
  { label: '人数', text: '3-4人轮换打球' },
  { label: '大金(+6分)', text: '开球后一杆清台，对手没有出手机会' },
  { label: '小金(+4分)', text: '对方犯规后，你一杆清台' },
  { label: '普通赢(+2分)', text: '正常对局中获胜' },
  { label: '计分', text: '赢家加分，输家扣分均摊。如3人局大金：+6/-3/-3' },
]

const rules = computed<Rule[]>(() => {
  switch (props.gameCode) {
    case 'eight_ball':
      return eightBallRules
    case 'snooker':
      return snookerRules
    case 'chasing':
      return chaseRules
    default:
      return []
  }
})
</script>

<style lang="scss" scoped>
$gold: #c9a962;

.rule-card-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, .9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(16rpx);
  padding: 40rpx;
}

.rule-card {
  width: 85vw;
  max-height: 80vh;
  background: linear-gradient(180deg, #232340 0%, #1a1a30 100%);
  border-radius: 64rpx;
  padding: 0;
  border: 4rpx solid rgba($gold, .35);
  box-shadow: 0 40rpx 100rpx rgba(0, 0, 0, .6), 0 0 80rpx rgba($gold, .15), inset 0 2rpx 0 rgba(255, 255, 255, .08);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.rc-top-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6rpx;
  background: linear-gradient(90deg, transparent, rgba($gold, .8), rgba($gold, .4), transparent);
  z-index: 1;
}

.rc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 40rpx 48rpx;
  border-bottom: 2rpx solid rgba($gold, .2);
  flex-shrink: 0;
}

.rc-title {
  font-size: 44rpx;
  font-weight: 800;
  color: $gold;
  flex: 1;
  margin-right: 24rpx;
}

.rc-close {
  width: 72rpx;
  height: 72rpx;
  background: linear-gradient(135deg, rgba($gold, .12), rgba($gold, .04));
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  color: $gold;
  border: 2rpx solid rgba($gold, .25);
  flex-shrink: 0;

  &:active {
    transform: scale(.92);
  }
}

.rc-body {
  flex: 1;
  overflow-y: auto;
  padding: 40rpx 48rpx;
}

.rule-item {
  margin-bottom: 40rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.rule-label {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: $gold;
  margin-bottom: 12rpx;
}

.rule-text {
  display: block;
  font-size: 38rpx;
  color: rgba(255, 255, 255, .6);
  line-height: 1.7;
}

.rc-footer {
  flex-shrink: 0;
  display: flex;
  gap: 24rpx;
  padding: 28rpx 48rpx 40rpx;
  border-top: 2rpx solid rgba($gold, .2);
  background: rgba(0, 0, 0, .3);
}

.rc-back-btn {
  flex: 1;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, .08);
  color: rgba(255, 255, 255, .7);
  border: 2rpx solid rgba(255, 255, 255, .1);
  font-size: 40rpx;
  font-weight: 700;

  &:active {
    background: rgba(255, 255, 255, .15);
  }
}

.rc-start-btn {
  flex: 2;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $gold, #8a6d3b);
  color: #1a1a2e;
  font-size: 40rpx;
  font-weight: 700;

  &:active {
    transform: scale(.96);
    opacity: .9;
  }
}
</style>
