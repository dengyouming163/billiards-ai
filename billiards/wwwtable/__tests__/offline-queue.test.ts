/**
 * offline-queue.test.ts — 离线操作队列去重合并测试
 *
 * 核心: mergeOperations 纯函数 — 同 product_id 合并数量, 净零删除
 */
import { describe, it, expect } from 'vitest'
import { mergeOperations, type OfflineOperation } from '../src/utils/offline-queue'

describe('mergeOperations — 离线队列去重合并', () => {
  it('相同 product_id 多条 add → 数量累加', () => {
    const result = mergeOperations([
      op('p1', 2), op('p1', 3),
    ])
    expect(result).toHaveLength(1)
    expect(result[0].payload.quantity).toBe(5)
    expect(result[0].payload.product_id).toBe('p1')
  })

  it('多个不同 product → 分别保留', () => {
    const result = mergeOperations([
      op('p1', 1), op('p2', 2), op('p3', 3),
    ])
    expect(result).toHaveLength(3)
    const ids = result.map(r => r.payload.product_id).sort()
    expect(ids).toEqual(['p1', 'p2', 'p3'])
  })

  it('净零 → 删除操作', () => {
    const result = mergeOperations([
      op('p1', 3), op('p1', -3),
    ])
    expect(result).toHaveLength(0)
  })

  it('add + book_assistant → assistant 操作不受影响', () => {
    const result = mergeOperations([
      op('p1', 1),
      { id: 'a1', type: 'book_assistant', payload: { assistant_id: 'a1' }, createdAt: 0, retries: 0 },
      op('p2', 2),
    ])
    expect(result).toHaveLength(3)
    expect(result.find(r => r.type === 'book_assistant')).toBeDefined()
  })

  it('cancel_assistant 操作保留', () => {
    const result = mergeOperations([
      { id: 'c1', type: 'cancel_assistant', payload: { item_id: 'i1' }, createdAt: 0, retries: 0 },
    ])
    expect(result).toHaveLength(1)
    expect(result[0].type).toBe('cancel_assistant')
  })

  it('空队列 → 返回空', () => {
    expect(mergeOperations([])).toHaveLength(0)
  })

  it('单条 operation → 原样保留', () => {
    const result = mergeOperations([op('p1', 5)])
    expect(result).toHaveLength(1)
    expect(result[0].payload.quantity).toBe(5)
  })

  it('净零 + 正常 → 只保留正常', () => {
    const result = mergeOperations([
      op('p1', 5), op('p1', -5),  // p1 净零
      op('p2', 3),                 // p2 保留
    ])
    expect(result).toHaveLength(1)
    expect(result[0].payload.product_id).toBe('p2')
    expect(result[0].payload.quantity).toBe(3)
  })

  it('多轮 add 复杂合并', () => {
    const result = mergeOperations([
      op('p1', 2), op('p2', 1), op('p1', 3),
      op('p3', 4), op('p2', -1),  // p2 净零
    ])
    expect(result).toHaveLength(2)
    const p1 = result.find(r => r.payload.product_id === 'p1')!
    const p3 = result.find(r => r.payload.product_id === 'p3')!
    expect(p1.payload.quantity).toBe(5)
    expect(p3.payload.quantity).toBe(4)
  })
})

function op(productId: string, quantity: number): OfflineOperation {
  return {
    id: `op_${Math.random().toString(36).slice(2, 8)}`,
    type: 'add_product',
    payload: { product_id: productId, quantity },
    createdAt: Date.now(),
    retries: 0,
  }
}
