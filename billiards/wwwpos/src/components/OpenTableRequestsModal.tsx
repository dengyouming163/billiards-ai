'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Clock, Users } from 'lucide-react'
import { posApi } from '@/lib/api/pos'
import { toast } from 'sonner'

interface ConfirmRequest {
  token: string
  tableName: string
  tableId: string
  playerCount: number
  expiresAt: number
  timeout: number
}

interface OpenTableRequestsModalProps {
  open: boolean
  onClose: () => void
}

export function OpenTableRequestsModal({ open, onClose }: OpenTableRequestsModalProps) {
  const [requests, setRequests] = useState<ConfirmRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [processingToken, setProcessingToken] = useState<string | null>(null)
  const [now, setNow] = useState(Math.floor(Date.now() / 1000))

  // 每 5 秒轮询待处理请求
  const fetchRequests = useCallback(async () => {
    if (!open) return
    setLoading(true)
    try {
      const storeId = JSON.parse(localStorage.getItem('userInfo') || '{}').storeId || ''
      const result = await posApi.pendingConfirmRequests(storeId)
      setRequests(result || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [open])

  useEffect(() => {
    fetchRequests()
    const poll = setInterval(fetchRequests, 5000)
    const tick = setInterval(() => setNow(Math.floor(Date.now() / 1000)), 1000)
    return () => { clearInterval(poll); clearInterval(tick) }
  }, [fetchRequests])

  // 监听来自 NotificationPanel 的确认/拒绝操作，同步移除本地条目
  useEffect(() => {
    const handler = (e: CustomEvent<{ token: string }>) => {
      setRequests(prev => prev.filter(r => r.token !== e.detail.token))
    }
    window.addEventListener('pos:open-request-resolved', handler as EventListener)
    return () => window.removeEventListener('pos:open-request-resolved', handler as EventListener)
  }, [])

  const handleAction = async (token: string, action: 'confirm' | 'reject') => {
    setProcessingToken(token)
    try {
      await posApi.confirmOpen({ token, action })
      toast.success(action === 'confirm' ? '已确认开台' : '已拒绝')
      setRequests(prev => prev.filter(r => r.token !== token))
      // 通知 NotificationPanel 同步移除
      window.dispatchEvent(new CustomEvent('pos:open-request-resolved', { detail: { token } }))
    } catch (e: any) {
      toast.error(e?.msg || e?.message || '操作失败')
    } finally {
      setProcessingToken(null)
    }
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full w-[420px] bg-white z-50 flex flex-col shadow-2xl animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-slate-900">开台申请</h2>
            {requests.length > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-200 text-amber-800 text-xs font-bold">
                {requests.length}条待处理
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-amber-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading && requests.length === 0 ? (
            <div className="flex items-center justify-center py-20 text-slate-400">
              <div className="animate-spin w-6 h-6 border-2 border-amber-400 border-t-transparent rounded-full mr-2" />
              加载中...
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <span className="text-4xl mb-3">📋</span>
              <p className="text-sm">暂无开台申请</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {requests.map(req => {
                const remaining = req.expiresAt - now
                const isExpired = remaining <= 0
                const displayTime = remaining > 0
                  ? remaining >= 60 ? `${Math.floor(remaining / 60)}分${remaining % 60}秒` : `${remaining}秒`
                  : '已超时'
                return (
                  <div key={req.token} className={`px-5 py-4 ${isExpired ? 'opacity-50 bg-slate-50' : ''}`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🎱</span>
                        <span className="font-bold text-slate-800">{req.tableName || req.tableId}</span>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-mono font-bold ${isExpired ? 'text-red-500' : remaining <= 15 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {displayTime}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-400 mb-3">
                      <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{req.playerCount}人</span>
                      <span>申请时间 {new Date((req.expiresAt - (req.timeout || 1) * 60) * 1000).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'})}</span>
                      <span>处理时限 {req.timeout || 1}分钟</span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        disabled={isExpired || !!processingToken}
                        onClick={() => handleAction(req.token, 'confirm')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isExpired ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                        }`}
                      >
                        {processingToken === req.token ? '处理中...' : '✅ 确认开台'}
                      </button>
                      <button
                        disabled={isExpired || !!processingToken}
                        onClick={() => handleAction(req.token, 'reject')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isExpired ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                          : 'bg-red-500 text-white hover:bg-red-600'
                        }`}
                      >
                        拒绝
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
