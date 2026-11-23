'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function MemberBindInner() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get('order_id') || ''
  const storeId = searchParams.get('store_id') || ''

  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [member, setMember] = useState<any>(null)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const searchMember = async () => {
    if (!phone.trim()) { setError('请输入手机号'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch(`http://api.tpzl88.com/storeapi/pos.Member/search?keyword=${encodeURIComponent(phone)}&store_id=${storeId}`)
      const data = await res.json()
      if (data.code === 1 && data.data?.length > 0) {
        setMember(data.data[0])
      } else {
        setError('未找到该会员，请检查手机号')
      }
    } catch { setError('网络错误') }
    finally { setLoading(false) }
  }

  const bindMember = async () => {
    if (!member) return
    setLoading(true); setError('')
    try {
      const formData = new URLSearchParams()
      formData.append('order_id', orderId)
      formData.append('phone', member.phone || phone)
      const res = await fetch(`http://api.tpzl88.com/storeapi/tablet.Order/bindMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      })
      const data = await res.json()
      if (data.code === 1) {
        setDone(true)
      } else {
        setError(data.msg || '绑定失败')
      }
    } catch { setError('网络错误') }
    finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '40px 24px', fontFamily: 'system-ui' }}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#059669', marginBottom: 8 }}>绑定成功</h2>
          <p style={{ color: '#64748b' }}>{member?.name || member?.phone} 已绑定到账单</p>
        </div>
      ) : member ? (
        <div>
          <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 24 }}>
            <div style={{ fontSize: 48, marginBottom: 8 }}>👤</div>
            <h3 style={{ color: '#065f46', margin: '0 0 4px' }}>{member.name || '会员'}</h3>
            <p style={{ color: '#059669', margin: 0 }}>{member.phone}</p>
            <p style={{ color: '#64748b', margin: '4px 0 0' }}>余额 ¥{Number(member.balance || 0).toFixed(2)}</p>
          </div>
          {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <button onClick={bindMember} disabled={loading} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff',
            fontSize: 18, fontWeight: 700, cursor: 'pointer'
          }}>{loading ? '绑定中...' : '确认绑定到当前账单'}</button>
          <button onClick={() => setMember(null)} style={{
            width: '100%', padding: 16, marginTop: 12, borderRadius: 16, border: '1px solid #e5e7eb',
            background: '#fff', color: '#64748b', fontSize: 16, cursor: 'pointer'
          }}>重新搜索</button>
        </div>
      ) : (
        <div>
          <h2 style={{ textAlign: 'center', color: '#1e293b', marginBottom: 24 }}>会员绑定</h2>
          <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && searchMember()}
            placeholder="请输入会员手机号" autoFocus style={{
            width: '100%', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0',
            fontSize: 18, marginBottom: 16, boxSizing: 'border-box', outline: 'none'
          }} />
          {error && <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 12 }}>{error}</p>}
          <button onClick={searchMember} disabled={loading} style={{
            width: '100%', padding: '16px', borderRadius: 16, border: 'none',
            background: 'linear-gradient(135deg, #059669, #10b981)', color: '#fff',
            fontSize: 18, fontWeight: 700, cursor: 'pointer'
          }}>{loading ? '搜索中...' : '搜索会员'}</button>
        </div>
      )}
    </div>
  )
}

export default function MemberBindPage() {
  return <Suspense fallback={<div style={{textAlign:'center',padding:60}}>加载中...</div>}><MemberBindInner /></Suspense>
}
