import type { OfflineOperation } from '@/types'

const QUEUE_KEY = 'pos_offline_queue'
const MAX_QUEUE = 200

let queue: OfflineOperation[] = []

function uid(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
}

function load(): void {
  try {
    const raw = localStorage.getItem(QUEUE_KEY)
    queue = raw ? JSON.parse(raw) : []
  } catch { queue = [] }
}

function save(): void {
  try { localStorage.setItem(QUEUE_KEY, JSON.stringify(queue)) } catch {}
}

export function enqueue(type: OfflineOperation['type'], data: Record<string, unknown>): boolean {
  if (queue.length >= MAX_QUEUE) return false
  queue.push({ id: uid(), type, data, timestamp: new Date().toISOString(), retryCount: 0 })

  // 去重合并：同一 product_id 的多次 add 合并为最终数量
  if (type === 'add_product') {
    const productOps = new Map<string, { op: OfflineOperation; qty: number }>()
    const remaining: OfflineOperation[] = []
    for (const op of queue) {
      if (op.type === 'add_product') {
        const pid = (op.data as any).product_id as string
        const qty = ((op.data as any).quantity as number) || 1
        const existing = productOps.get(pid)
        if (existing) {
          existing.qty += qty
          existing.op.data = { ...existing.op.data, quantity: existing.qty }
        } else {
          productOps.set(pid, { op, qty })
        }
      } else {
        remaining.push(op)
      }
    }
    queue = [...Array.from(productOps.values()).map(v => v.op), ...remaining]
  }

  save()
  return true
}

// replay callback receives each operation and returns true on success
// Uses append-only removal: only remove ops confirmed successful, preventing data loss on crash
export async function replayAll(
  replayFn: (op: OfflineOperation) => Promise<boolean>
): Promise<{ done: number; failed: number }> {
  let done = 0; let failed = 0
  const ops = [...queue]
  const remaining: OfflineOperation[] = []

  for (const op of ops) {
    try {
      const ok = await replayFn(op)
      if (ok) { done++ } else { op.retryCount++; failed++; remaining.push(op) }
    } catch {
      op.retryCount++
      failed++
      remaining.push(op)
    }
  }
  queue = remaining
  save()
  return { done, failed }
}

export function getQueue(): readonly OfflineOperation[] { return queue }
export function getPendingCount(): number { return queue.length }

load()
