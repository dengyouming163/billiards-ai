export type GameType = 'eight_ball' | 'snooker' | 'chasing'

export type GameMode = 'eight_ball' | 'chasing_2' | 'chasing_3' | 'chasing_4' | 'snooker'

export interface Player {
  id: number
  name: string
  score: number
  wins: number
  color: 'blue' | 'red' | 'green' | 'orange'
  group?: 'solid' | 'striped'
  isActive?: boolean
}

export interface ScoreCard {
  id: string
  type: 'player' | 'penalty' | 'win'
  playerId?: number
  label: string
  value: number
  color: string
  showActions: boolean
  span?: number
}

export type ChasingResult = 'big_gold' | 'small_gold' | 'normal_win' | 'foul'

export type EightBallResult = 'win' | 'foul' | 'switch'

export type SnookerBallValue = 1 | 2 | 3 | 4 | 5 | 7

export interface ScoreEvent {
  id: string
  timestamp: number
  playerId: number
  resultType: string
  points: number
  description: string
}

export interface ScoreRecord {
  id: string
  gameType: GameType
  players: Player[]
  currentPlayerIndex: number
  startTime: number
  endTime?: number
  history: ScoreEvent[]
  isAfterBreak?: boolean
  eightBallPhase?: 'open' | 'assigned' | 'game_over'
}

export interface MatchRecord {
  id: string
  gameMode: GameMode
  players: Player[]
  winnerId: number
  matchNumber: number
  totalRounds: number
  startTime: number
  endTime: number
  roundDetails: RoundDetail[]
}

export interface RoundDetail {
  roundNumber: number
  player1Score: number
  player2Score: number
  winnerId: number
  timestamp: number
}

export interface ScoreState {
  currentMode: GameMode
  players: Player[]
  penalty: number
  currentMatchNumber: number
  totalRounds: number
}