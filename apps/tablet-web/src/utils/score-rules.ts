import type { Player, ChasingResult, SnookerBallValue, GameType } from '../types/score'

export function calculateChasingScore(
  players: Player[],
  currentPlayerIndex: number,
  result: ChasingResult
): { scores: number[]; description: string } {
  const scores = [...players.map(p => p.score)]
  const playerCount = players.length
  const prevPlayerIndex = (currentPlayerIndex - 1 + playerCount) % playerCount
  const nextPlayerIndex = (currentPlayerIndex + 1) % playerCount

  let description = ''

  switch (result) {
    case 'big_gold':
      if (playerCount === 2) {
        scores[currentPlayerIndex] += 5
        description = '大金！'
      } else if (playerCount === 3) {
        scores[currentPlayerIndex] += 8
        scores[prevPlayerIndex] -= 4
        scores[nextPlayerIndex] -= 4
        description = '大金！上家-4，下家-4'
      } else {
        scores[currentPlayerIndex] += 12
        scores[prevPlayerIndex] -= 4
        scores[nextPlayerIndex] -= 4
        scores[(nextPlayerIndex + 1) % playerCount] -= 4
        description = '大金！三家各-4'
      }
      break

    case 'small_gold':
      if (playerCount === 2) {
        scores[currentPlayerIndex] += 4
        description = '小金！'
      } else if (playerCount === 3) {
        scores[currentPlayerIndex] += 7
        scores[prevPlayerIndex] -= 7
        description = '小金！上家-7'
      } else {
        scores[currentPlayerIndex] += 9
        scores[prevPlayerIndex] -= 9
        description = '小金！上家-9'
      }
      break

    case 'normal_win':
      if (playerCount === 2) {
        scores[currentPlayerIndex] += 1
        description = '普胜！'
      } else if (playerCount === 3) {
        scores[currentPlayerIndex] += 2
        scores[prevPlayerIndex] -= 2
        description = '普胜！上家-2'
      } else {
        scores[currentPlayerIndex] += 3
        scores[prevPlayerIndex] -= 3
        description = '普胜！上家-3'
      }
      break

    case 'foul':
      scores[currentPlayerIndex] -= 1
      scores[prevPlayerIndex] += 1
      description = '犯规！上家+1'
      break
  }

  return { scores, description }
}

export function calculateEightBallScore(
  players: Player[],
  currentPlayerIndex: number,
  result: 'win' | 'foul'
): { scores: number[]; description: string } {
  const scores = [...players.map(p => p.score)]

  if (result === 'win') {
    scores[currentPlayerIndex] += 1
    return { scores, description: `${players[currentPlayerIndex].name}胜！` }
  } else {
    scores[currentPlayerIndex] -= 1
    return { scores, description: '犯规！-1' }
  }
}

export function calculateSnookerScore(
  players: Player[],
  currentPlayerIndex: number,
  ballValue: SnookerBallValue | 'foul'
): { scores: number[]; description: string } {
  const scores = [...players.map(p => p.score)]
  const opponentIndex = currentPlayerIndex === 0 ? 1 : 0

  if (ballValue === 'foul') {
    scores[opponentIndex] += 4
    return { scores, description: '犯规！对手+4' }
  } else {
    scores[currentPlayerIndex] += ballValue
    const ballNames: Record<SnookerBallValue, string> = {
      1: '红球',
      2: '黄球',
      3: '绿球',
      4: '蓝球',
      5: '粉球',
      7: '黑球'
    }
    return { scores, description: `${ballNames[ballValue]}+${ballValue}` }
  }
}

export function getPlayerRelation(
  playerIndex: number,
  currentPlayerIndex: number,
  totalPlayers: number
): 'self' | 'prev' | 'next' | 'other' {
  if (playerIndex === currentPlayerIndex) return 'self'
  if (playerIndex === (currentPlayerIndex - 1 + totalPlayers) % totalPlayers) return 'prev'
  if (playerIndex === (currentPlayerIndex + 1) % totalPlayers) return 'next'
  return 'other'
}

export function getGameName(gameType: GameType): string {
  const names: Record<GameType, string> = {
    eight_ball: '中式八球',
    snooker: '斯诺克',
    chasing: '追分'
  }
  return names[gameType]
}