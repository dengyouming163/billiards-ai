import { describe, it, expect } from 'vitest'
import { calculateChasingScore, calculateEightBallScore, calculateSnookerScore, getPlayerRelation, getGameName } from '../src/utils/score-rules'

describe('calculateChasingScore', () => {
  it('should calculate big gold for 3 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'big_gold')
    expect(result.scores).toEqual([8, -4, -4])
    expect(result.description).toBe('大金！上家-4，下家-4')
  })

  it('should calculate small gold for 3 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'small_gold')
    expect(result.scores).toEqual([7, 0, -7])
    expect(result.description).toBe('小金！上家-7')
  })

  it('should calculate normal win for 3 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'normal_win')
    expect(result.scores).toEqual([2, 0, -2])
    expect(result.description).toBe('普胜！上家-2')
  })

  it('should calculate foul for 3 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'foul')
    expect(result.scores).toEqual([-1, 0, 1])
    expect(result.description).toBe('犯规！上家+1')
  })

  it('should calculate big gold for 2 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'big_gold')
    expect(result.scores).toEqual([5, 0])
    expect(result.description).toBe('大金！')
  })

  it('should calculate small gold for 2 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'small_gold')
    expect(result.scores).toEqual([4, 0])
    expect(result.description).toBe('小金！')
  })

  it('should calculate normal win for 2 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'normal_win')
    expect(result.scores).toEqual([1, 0])
    expect(result.description).toBe('普胜！')
  })

  it('should calculate foul for 2 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'foul')
    expect(result.scores).toEqual([-1, 1])
    expect(result.description).toBe('犯规！上家+1')
  })

  it('should calculate big gold for 4 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 },
      { id: 3, name: 'D', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'big_gold')
    expect(result.scores).toEqual([12, -4, -4, -4])
    expect(result.description).toBe('大金！三家各-4')
  })

  it('should calculate small gold for 4 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 },
      { id: 3, name: 'D', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'small_gold')
    expect(result.scores).toEqual([9, 0, 0, -9])
    expect(result.description).toBe('小金！上家-9')
  })

  it('should calculate normal win for 4 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 },
      { id: 3, name: 'D', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'normal_win')
    expect(result.scores).toEqual([3, 0, 0, -3])
    expect(result.description).toBe('普胜！上家-3')
  })

  it('should calculate foul for 4 players', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 },
      { id: 2, name: 'C', score: 0 },
      { id: 3, name: 'D', score: 0 }
    ]
    const result = calculateChasingScore(players, 0, 'foul')
    expect(result.scores).toEqual([-1, 0, 0, 1])
    expect(result.description).toBe('犯规！上家+1')
  })
})

describe('calculateEightBallScore', () => {
  it('should calculate win', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateEightBallScore(players, 0, 'win')
    expect(result.scores).toEqual([1, 0])
    expect(result.description).toBe('A胜！')
  })

  it('should calculate foul', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateEightBallScore(players, 0, 'foul')
    expect(result.scores).toEqual([-1, 0])
    expect(result.description).toBe('犯规！-1')
  })

  it('should accumulate scores correctly', () => {
    const players = [
      { id: 0, name: 'A', score: 5 },
      { id: 1, name: 'B', score: 3 }
    ]
    const result = calculateEightBallScore(players, 0, 'win')
    expect(result.scores).toEqual([6, 3])
  })
})

describe('calculateSnookerScore', () => {
  it('should calculate red ball score', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 1)
    expect(result.scores).toEqual([1, 0])
    expect(result.description).toBe('红球+1')
  })

  it('should calculate yellow ball score', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 2)
    expect(result.scores).toEqual([2, 0])
    expect(result.description).toBe('黄球+2')
  })

  it('should calculate green ball score', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 3)
    expect(result.scores).toEqual([3, 0])
    expect(result.description).toBe('绿球+3')
  })

  it('should calculate blue ball score', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 4)
    expect(result.scores).toEqual([4, 0])
    expect(result.description).toBe('蓝球+4')
  })

  it('should calculate pink ball score', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 5)
    expect(result.scores).toEqual([5, 0])
    expect(result.description).toBe('粉球+5')
  })

  it('should calculate black ball score', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 7)
    expect(result.scores).toEqual([7, 0])
    expect(result.description).toBe('黑球+7')
  })

  it('should add foul points to opponent', () => {
    const players = [
      { id: 0, name: 'A', score: 0 },
      { id: 1, name: 'B', score: 0 }
    ]
    const result = calculateSnookerScore(players, 0, 'foul')
    expect(result.scores).toEqual([0, 4])
    expect(result.description).toBe('犯规！对手+4')
  })

  it('should add foul points to opponent when player 1 fouls', () => {
    const players = [
      { id: 0, name: 'A', score: 10 },
      { id: 1, name: 'B', score: 5 }
    ]
    const result = calculateSnookerScore(players, 1, 'foul')
    expect(result.scores).toEqual([14, 5])
    expect(result.description).toBe('犯规！对手+4')
  })
})

describe('getPlayerRelation', () => {
  it('should return self for current player', () => {
    expect(getPlayerRelation(0, 0, 3)).toBe('self')
  })

  it('should return prev for previous player', () => {
    expect(getPlayerRelation(2, 0, 3)).toBe('prev')
    expect(getPlayerRelation(0, 1, 3)).toBe('prev')
    expect(getPlayerRelation(1, 2, 3)).toBe('prev')
  })

  it('should return next for next player', () => {
    expect(getPlayerRelation(1, 0, 3)).toBe('next')
    expect(getPlayerRelation(2, 1, 3)).toBe('next')
    expect(getPlayerRelation(0, 2, 3)).toBe('next')
  })

  it('should handle 4 player relation', () => {
    expect(getPlayerRelation(0, 0, 4)).toBe('self')
    expect(getPlayerRelation(3, 0, 4)).toBe('prev')
    expect(getPlayerRelation(1, 0, 4)).toBe('next')
    expect(getPlayerRelation(2, 0, 4)).toBe('other')
  })
})

describe('getGameName', () => {
  it('should return correct game name for eight_ball', () => {
    expect(getGameName('eight_ball')).toBe('中式八球')
  })

  it('should return correct game name for snooker', () => {
    expect(getGameName('snooker')).toBe('斯诺克')
  })

  it('should return correct game name for chasing', () => {
    expect(getGameName('chasing')).toBe('追分')
  })
})