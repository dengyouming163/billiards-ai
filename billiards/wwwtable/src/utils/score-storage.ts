import type { ScoreRecord, MatchRecord, ScoreState } from '../types/score'

const STORAGE_KEY = 'score_records'
const RECORDS_KEY = 'score_records_new'
const STATE_KEY = 'score_current_state'

export function saveScoreRecord(record: ScoreRecord): void {
  const records = getScoreRecords()
  records.push(record)
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
}

export function getScoreRecords(): ScoreRecord[] {
  try {
    const data = uni.getStorageSync(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getScoreRecordById(id: string): ScoreRecord | undefined {
  const records = getScoreRecords()
  return records.find(r => r.id === id)
}

export function updateScoreRecord(record: ScoreRecord): void {
  const records = getScoreRecords()
  const index = records.findIndex(r => r.id === record.id)
  if (index !== -1) {
    records[index] = record
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
  }
}

export function deleteScoreRecord(id: string): void {
  const records = getScoreRecords().filter(r => r.id !== id)
  uni.setStorageSync(STORAGE_KEY, JSON.stringify(records))
}

export function clearAllScoreRecords(): void {
  uni.removeStorageSync(STORAGE_KEY)
  uni.removeStorageSync(RECORDS_KEY)
}

export function generateRecordId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function saveScoreRecordNew(record: MatchRecord): void {
  const records = getScoreRecordsNew()
  records.push(record)
  uni.setStorageSync(RECORDS_KEY, JSON.stringify(records))
}

export function getScoreRecordsNew(): MatchRecord[] {
  try {
    const data = uni.getStorageSync(RECORDS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function saveCurrentState(state: ScoreState): void {
  uni.setStorageSync(STATE_KEY, JSON.stringify(state))
}

export function getCurrentState(): ScoreState | null {
  try {
    const data = uni.getStorageSync(STATE_KEY)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

export function clearCurrentState(): void {
  uni.removeStorageSync(STATE_KEY)
}