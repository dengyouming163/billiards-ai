var fs=require('fs');
var c=fs.readFileSync('src/pages/score/index.vue','utf-8');

// Replace game-grid with vh-based height
c=c.replace(
'  flex: 1; padding: 0 4rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; align-content: stretch;',
'  flex: 1; padding: 0 4rpx; display: grid; grid-template-columns: 1fr 1fr; gap: 16rpx; align-content: start; overflow-y: auto; -webkit-overflow-scrolling: touch;'
);

// Replace .game-card to use height:18vh and remove color loop
var oldCard = /\.game-card \{[\s\S]*?@keyframes cardPulse \{[\s\S]*?\}/;
var newCard =
`.game-card {
  position: relative; border-radius: 28rpx; padding: 20rpx 14rpx 16rpx; height: 18vh;
  text-align: center; overflow: hidden;
  background: linear-gradient(160deg, rgba(255,255,255,.04), rgba(255,255,255,.01));
  border: 2rpx solid rgba(255,255,255,.06);
  backdrop-filter: blur(10rpx);
  transition: all .4s cubic-bezier(.4,0,.2,1);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8rpx;

  .card-bg-pulse {
    position: absolute; inset: 0; opacity: 0; border-radius: 28rpx;
    background: radial-gradient(ellipse at 50% 0%, rgba($gold,.15), transparent 70%);
    transition: opacity .4s;
  }

  .card-corners { position: absolute; inset: 0; pointer-events: none; opacity: 0; transition: opacity .35s;
    i { position: absolute; width: 22rpx; height: 22rpx; border-color: $gold; }
    .c-tl { top: 10rpx; left: 10rpx; border-top: 3rpx solid; border-left: 3rpx solid; }
    .c-tr { top: 10rpx; right: 10rpx; border-top: 3rpx solid; border-right: 3rpx solid; }
    .c-bl { bottom: 10rpx; left: 10rpx; border-bottom: 3rpx solid; border-left: 3rpx solid; }
    .c-br { bottom: 10rpx; right: 10rpx; border-bottom: 3rpx solid; border-right: 3rpx solid; }
  }

  .card-icon { width: 84rpx; height: 84rpx; position: relative; display: flex; align-items: center; justify-content: center; z-index: 1; flex-shrink: 0; }
  .card-name { display: block; font-size: 32rpx; font-weight: 800; color: #fff; z-index: 1; transition: all .3s; flex-shrink: 0; }
  .card-desc { display: block; font-size: 22rpx; color: rgba(255,255,255,.35); line-height: 1.3; z-index: 1; flex-shrink: 0; }

  .card-glow-bar {
    position: absolute; bottom: 0; left: 10%; right: 10%; height: 3rpx; border-radius: 3rpx;
    background: linear-gradient(90deg, transparent, $gold, transparent);
    opacity: 0; transition: opacity .35s;
  }

  // Default: dim gold icons
  .geo-shape::before, .geo-shape::after { border-color: $dim; background-color: $dim; }
  .geo-snooker .geo-shape::before { background: none; border-bottom-color: $dim; border-left-color: transparent; border-right-color: transparent; }
  .geo-snooker .geo-shape::after { background: rgba($dim,.35); }
  .geo-chasing .geo-shape::after { background: none; border-top-color: $dim; }
  .geo-chasing .geo-shape::before { background: none; }
  .geo-eight_ball .geo-shape::before, .geo-nine_ball .geo-shape::before,
  .geo-ten_ball .geo-shape::before, .geo-shootout .geo-shape::before,
  .geo-rolling_score .geo-shape::before { background: none; }
  .geo-ten_ball .geo-shape::after { background: none; }
  .geo-straight_pool .geo-shape::before, .geo-draw_lots .geo-shape::before,
  .geo-draw_lots .geo-shape::after { background: none; }
  .geo-draw_lots .geo-shape::after { background: rgba($dim,.2); }
  .geo-carom .geo-shape::before { box-shadow: 34rpx 0 0 $dim; }

  &:active { border-color: rgba($gold,.5); background: rgba($gold,.06); }

  &.active {
    border-color: $gold; background: rgba($gold,.1);
    box-shadow: 0 0 50rpx rgba($gold,.35), 0 0 120rpx rgba($gold,.1), inset 0 1rpx 0 rgba($gold,.1);
    transform: scale(1.04);
    .card-bg-pulse { opacity: 1; animation: cardPulse 2.5s ease-in-out infinite; }
    .card-corners { opacity: 1; }
    .card-glow-bar { opacity: 1; }
    .card-name { color: $gold; text-shadow: 0 0 24rpx rgba($gold,.7); }
    .geo-shape::before, .geo-shape::after { border-color: $gold; background-color: $gold; }
    .geo-snooker .geo-shape::before { background: none; border-bottom-color: $gold; border-left-color: transparent; border-right-color: transparent; }
    .geo-snooker .geo-shape::after { background: rgba($gold,.35); }
    .geo-chasing .geo-shape::after { background: none; border-top-color: $gold; }
    .geo-chasing .geo-shape::before { background: none; }
    .geo-eight_ball .geo-shape::before, .geo-nine_ball .geo-shape::before,
    .geo-ten_ball .geo-shape::before, .geo-shootout .geo-shape::before,
    .geo-rolling_score .geo-shape::before { background: none; }
    .geo-ten_ball .geo-shape::after { background: none; }
    .geo-straight_pool .geo-shape::before, .geo-draw_lots .geo-shape::before,
    .geo-draw_lots .geo-shape::after { background: none; }
    .geo-draw_lots .geo-shape::after { background: rgba($gold,.2); }
    .geo-carom .geo-shape::before { box-shadow: 34rpx 0 0 $gold; }
  }

  &:active { transform: scale(.96); }
}
@keyframes cardPulse { 0%,100%{opacity:.5} 50%{opacity:1} }`;

c = c.replace(oldCard, newCard);

// Remove .color-x classes from template (no longer needed)
c = c.replace(/ :class="\['color-' \+ \(idx % 5\), \{ active: selectedGame\?\.id === game\.id \}\]"/g,
  ' :class="{ active: selectedGame?.id === game.id }"');

fs.writeFileSync('src/pages/score/index.vue',c,'utf-8');
console.log('Done',c.length);
