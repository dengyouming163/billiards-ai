/**
 * useScoreHistory — 计分历史记录持久化
 *
 * 功能：每局结束后自动保存到 localStorage，选择页加载时恢复
 * 最多保留 50 条，按时间倒序
 */
import { ref } from 'vue'

const HISTORY_KEY = 'tt_score_history'
const MAX_RECORDS = 50

export interface MatchRecord {
  id: string
  gameCode: string
  gameName: string
  players: string[]
  scores: number[]
  winner: number
  date: string
}

function load(): MatchRecord[] {
  try {
    const raw = uni.getStorageSync(HISTORY_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function persist(records: MatchRecord[]): void {
  try { uni.setStorageSync(HISTORY_KEY, JSON.stringify(records)) } catch {}
}

export function useScoreHistory() {
  const matchHistory = ref<MatchRecord[]>(load())

  function addMatch(record: Omit<MatchRecord, 'id' | 'date'>) {
    const now = new Date()
    const entry: MatchRecord = {
      ...record,
      id: Date.now().toString(),
      date: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
    }
    matchHistory.value.unshift(entry)
    if (matchHistory.value.length > MAX_RECORDS) {
      matchHistory.value = matchHistory.value.slice(0, MAX_RECORDS)
    }
    persist(matchHistory.value)
  }

  function clearHistory() {
    matchHistory.value = []
    persist([])
  }

  return { matchHistory, addMatch, clearHistory }
}
