import { useState, useEffect } from 'react'
import { IconCheck, IconX, IconCircleAlert } from './icons/Icons'

let _id = 0

export function showToast(message, type = 'success') {
  window.dispatchEvent(new CustomEvent('show-toast', { detail: { message, type } }))
}

export default function Toast() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    function handler(e) {
      const { message, type = 'success' } = e.detail
      const id = ++_id
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
    }
    window.addEventListener('show-toast', handler)
    return () => window.removeEventListener('show-toast', handler)
  }, [])

  if (!toasts.length) return null

  return (
    <div style={{
      position: 'fixed', bottom: 28, right: 28,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      pointerEvents: 'none',
    }}>
      {toasts.map(t => {
        const icon = t.type === 'success'
          ? <IconCheck size={15} color="#4ade80" />
          : t.type === 'error'
            ? <IconX size={15} color="#f87171" />
            : <IconCircleAlert size={15} color="#fbbf24" />
        const bg = t.type === 'success' ? '#1a4d2e'
          : t.type === 'error' ? '#450a0a'
          : '#422006'

        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: bg,
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 10,
            fontSize: 14, fontWeight: 500,
            boxShadow: '0 6px 24px rgba(0,0,0,0.32)',
            animation: 'toastIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both',
            pointerEvents: 'all',
            maxWidth: 340, minWidth: 200,
            fontFamily: 'Inter, sans-serif',
            border: '1px solid rgba(255,255,255,0.1)',
          }}>
            {icon}
            {t.message}
          </div>
        )
      })}
    </div>
  )
}
