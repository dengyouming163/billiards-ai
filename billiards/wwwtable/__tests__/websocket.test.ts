/**
 * websocket.test.ts — TableWebSocket 事件系统 + 消息路由测试
 *
 * 测试策略：不 Mock uni.connectSocket（那是平台层），
 * 而是直接测试内部逻辑：事件注册/取消、消息路由、引用计数
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { tableWs } from '../src/utils/websocket'

// 通过反射访问私有方法/属性（仅测试用）
function wsInternals() {
  return {
    // @ts-ignore
    handlers: tableWs.handlers as Map<string, Set<Function>>,
    // @ts-ignore
    refCount: tableWs.refCount as number,
    // @ts-ignore
    state: tableWs.state,
    // @ts-ignore
    missedPongs: tableWs.missedPongs as number,
    // @ts-ignore
    emit: tableWs.emit?.bind(tableWs) as (event: string, data: any, msg: any) => void,
    // @ts-ignore
    handleMessage: tableWs.handleMessage?.bind(tableWs) as (data: any) => void,
  }
}

describe('TableWebSocket — 事件系统', () => {
  beforeEach(() => {
    // 清理所有 handlers
    const { handlers } = wsInternals()
    handlers.clear()
    // 重置引用计数（通过 disconnect 清理到 0）
    // @ts-ignore
    tableWs.refCount = 0
    // @ts-ignore
    tableWs.state.connected = false
  })

  describe('事件注册 / 取消', () => {
    it('on() 注册 handler', () => {
      const fn = () => {}
      tableWs.on('test_event', fn)

      const { handlers } = wsInternals()
      expect(handlers.has('test_event')).toBe(true)
      expect(handlers.get('test_event')!.has(fn)).toBe(true)
    })

    it('off() 取消 handler', () => {
      const fn = () => {}
      tableWs.on('test_event', fn)
      tableWs.off('test_event', fn)

      const { handlers } = wsInternals()
      expect(handlers.get('test_event')!.has(fn)).toBe(false)
    })

    it('同一事件可注册多个 handler', () => {
      const fn1 = () => {}, fn2 = () => {}
      tableWs.on('order_update', fn1)
      tableWs.on('order_update', fn2)

      const { handlers } = wsInternals()
      expect(handlers.get('order_update')!.size).toBe(2)
    })

    it('off 不存在的 handler 不报错', () => {
      expect(() => tableWs.off('nonexistent', () => {})).not.toThrow()
    })

    it('重复注册同一 handler 不会增加计数', () => {
      const fn = () => {}
      tableWs.on('test', fn)
      tableWs.on('test', fn) // 重复

      const { handlers } = wsInternals()
      expect(handlers.get('test')!.size).toBe(1) // Set 去重
    })
  })

  describe('消息路由 (handleMessage)', () => {
    it('pong 消息重置 missedPongs', () => {
      // @ts-ignore — 直接设置 missedPongs
      tableWs.missedPongs = 5
      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'pong' }))
      // @ts-ignore
      expect(tableWs.missedPongs).toBe(0)
    })

    it('order_update 消息触发对应 handler', () => {
      const received: any[] = []
      tableWs.on('order_update', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'order_update', data: { table_fee: 100 } }))

      expect(received).toHaveLength(1)
      expect(received[0]).toEqual({ table_fee: 100 })
    })

    it('payment_success 消息触发对应 handler', () => {
      const received: any[] = []
      tableWs.on('payment_success', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'payment_success', data: { order_id: '123' } }))

      expect(received).toHaveLength(1)
      expect(received[0]).toEqual({ order_id: '123' })
    })

    it('notification 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('notification', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'notification', data: { title: '测试通知' } }))

      expect(received[0]).toEqual({ title: '测试通知' })
    })

    it('table_open_confirmed 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('table_open_confirmed', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'table_open_confirmed', data: {} }))

      expect(received).toHaveLength(1)
    })

    it('table_open_rejected 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('table_open_rejected', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'table_open_rejected', data: { reason: '拒绝' } }))

      expect(received[0]).toEqual({ reason: '拒绝' })
    })

    it('table_open_timeout 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('table_open_timeout', () => received.push(true))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'table_open_timeout', data: {} }))

      expect(received).toHaveLength(1)
    })

    it('table_released 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('table_released', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'table_released', data: { table_id: 't1' } }))

      expect(received[0]).toEqual({ table_id: 't1' })
    })

    it('service_call_ack 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('service_call_ack', () => received.push(true))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'service_call_ack', data: {} }))

      expect(received).toHaveLength(1)
    })

    it('service_call_response 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('service_call_response', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'service_call_response', data: { responder: '张三' } }))

      expect(received[0]).toEqual({ responder: '张三' })
    })

    it('order_item_status 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('order_item_status', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'order_item_status', data: { status: 'delivered' } }))

      expect(received[0]).toEqual({ status: 'delivered' })
    })

    it('table_status 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('table_status', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'table_status', data: { status: 'occupied' } }))

      expect(received[0]).toEqual({ status: 'occupied' })
    })

    it('subscribe_ack 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('subscribe_ack', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'subscribe_ack', data: { channels: ['table_1'] } }))

      expect(received[0]).toEqual({ channels: ['table_1'] })
    })

    it('preorder_confirmed 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('preorder_confirmed', () => received.push(true))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'preorder_confirmed', data: {} }))

      expect(received).toHaveLength(1)
    })

    it('preorder_rejected 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('preorder_rejected', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'preorder_rejected', data: { reason: '缺货' } }))

      expect(received[0]).toEqual({ reason: '缺货' })
    })

    it('new_order_item 消息触发 handler', () => {
      const received: any[] = []
      tableWs.on('new_order_item', () => received.push(true))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'new_order_item', data: {} }))

      expect(received).toHaveLength(1)
    })

    it('未知消息类型也触发 handler（兜底）', () => {
      const received: any[] = []
      tableWs.on('custom_event', (data) => received.push(data))

      const { handleMessage } = wsInternals()
      handleMessage(JSON.stringify({ type: 'custom_event', data: { foo: 'bar' } }))

      expect(received[0]).toEqual({ foo: 'bar' })
    })

    it('handler 抛异常不中断其他 handler', () => {
      const good: any[] = []
      tableWs.on('order_update', () => { throw new Error('boom') })
      tableWs.on('order_update', (data) => good.push(data))

      const { handleMessage } = wsInternals()
      expect(() => handleMessage(JSON.stringify({ type: 'order_update', data: { x: 1 } }))).not.toThrow()
      expect(good[0]).toEqual({ x: 1 })
    })

    it('无效 JSON 不抛异常', () => {
      const { handleMessage } = wsInternals()
      expect(() => handleMessage('{ invalid json }')).not.toThrow()
    })
  })

  describe('引用计数', () => {
    it('初始 refCount = 0', () => {
      // @ts-ignore — 访问内部属性
      expect(tableWs.refCount).toBe(0)
    })
  })

  describe('isConnected', () => {
    it('初始状态返回 false', () => {
      expect(tableWs.isConnected()).toBe(false)
    })
  })

  describe('getState', () => {
    it('返回连接状态快照', () => {
      const state = tableWs.getState()
      expect(state).toHaveProperty('connected')
      expect(state).toHaveProperty('connecting')
      expect(state).toHaveProperty('reconnectAttempts')
      expect(state).toHaveProperty('tableId')
    })
  })
})
