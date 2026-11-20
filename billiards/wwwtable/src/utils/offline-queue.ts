import { tabletApi } from '@/api/modules/tablet'

// ---- 类型 (导出供测试) ----
export type OfflineOpType = 'add_product' | 'remove_product' | 'book_assistant' | 'cancel_assistant'

export interface OfflineOperation {
  id: string
  type: OfflineOpType
  payload: Record<string, any>
  createdAt: number
  retries: number
}

export interface FlushResult { done: number; failed: number }

const QUEUE_KEY = 'offline_queue'
const MAX_QUEUE = 200

let queue: OfflineOperation[] = []

// ---- 生成唯一ID ----
function uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8) }

// ---- 持久化 ----
function save(): void {
  try { uni.setStorageSync(QUEUE_KEY, JSON.stringify(queue)) } catch {}
}

function load(): void {
  try {
    const raw = uni.getStorageSync(QUEUE_KEY)
    queue = raw ? JSON.parse(raw) : []
  } catch { queue = [] }
}

// ---- 去重合并 (纯函数, 可独立测试) ----
export function mergeOperations(ops: OfflineOperation[]): OfflineOperation[] {
  const productOps = new Map<string, number>()
  const nonProduct: OfflineOperation[] = []

  for (const op of ops) {
    if (op.type === 'add_product') {
      const pid = String(op.payload.product_id)
      const qty = Number(op.payload.quantity) || 1
      productOps.set(pid, (productOps.get(pid) || 0) + qty)
    } else {
      nonProduct.push(op)
    }
  }

  const merged: OfflineOperation[] = []
  for (const [pid, qty] of productOps) {
    if (qty !== 0) {
      merged.push({
        id: uid(), type: 'add_product',
        payload: { product_id: pid, quantity: qty },
        createdAt: Date.now(), retries: 0,
      })
    }
  }

  return [...merged, ...nonProduct]
}

// ---- 模块级去重 ----
function mergeQueue(): void {
  queue = mergeOperations(queue)
}

// ---- 入队 ----
function enqueue(type: OfflineOpType, payload: Record<string, any>): void {
  if (queue.length >= MAX_QUEUE) {
    uni.showToast({ title: '离线操作过多，请检查网络', icon: 'none' })
    return
  }
  queue.push({ id: uid(), type, payload, createdAt: Date.now(), retries: 0 })
  if (type === 'add_product' || type === 'remove_product') mergeQueue()
  save()
}

// ---- 重放 ----
async function flush(): Promise<FlushResult> {
  let done = 0; let failed = 0
  mergeQueue()
  const ops = [...queue]
  queue = []
  save()

  for (const op of ops) {
    try {
      let result: any
      switch (op.type) {
        case 'add_product':
          result = await tabletApi.addOrderItem(op.payload as any)
          break
        case 'remove_product':
          if (String(op.payload.item_id).startsWith('local_')) {
            console.log('[OfflineQueue] 跳过本地ID的remove_product:', op.payload.item_id)
            done++
            continue
          }
          result = await tabletApi.removeOrderItem(op.payload.item_id)
          break
        case 'book_assistant':
          result = await tabletApi.bookAssistant(op.payload as any)
          break
        case 'cancel_assistant':
          result = await tabletApi.cancelAssistant(op.payload.item_id)
          break
      }
      if (result && (result as any).code !== 0) {
        done++
      } else {
        op.retries++
        failed++
        queue.push(op)
        mergeQueue()  // 去重合并，防止重复操作堆积
      }
    } catch (e: any) {
      if (e?.errMsg?.includes('fail') || e?.message?.includes('network')) {
        queue.push(op)
        queue.push(...ops.slice(ops.indexOf(op) + 1))
        mergeQueue()  // 网络恢复后重新合并去重
        save()
        return { done, failed }
      }
      if ((op.retries || 0) >= 3) {
        console.error('[OfflineQueue] 操作永久失败，已丢弃:', op.type, op.payload)
        continue
      }
      op.retries++
      failed++
    }
  }

  mergeQueue()  // 最终合并去重
  save()
  return { done, failed }
}
// ---- 查询 ----
function getPendingCount(): number { return queue.length }
function getQueue(): readonly OfflineOperation[] { return queue }

// ---- 初始化 ----
load()

export const offlineQueue = {
  enqueue, flush, getPendingCount, getQueue,
}
