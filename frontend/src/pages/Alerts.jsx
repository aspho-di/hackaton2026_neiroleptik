import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { MOCK_ALERTS } from '../mockData'
import { fetchAlerts, markAlertRead as markAlertReadApi } from '../api/client'
import { IconWarning, IconCircleAlert, IconCheck } from '../components/icons/Icons'

const FILTER_TABS = [
  { key: 'all',       label: 'Все' },
  { key: 'weather',   label: 'Погода' },
  { key: 'anomaly',   label: 'Аномалии датчиков' },
  { key: 'irrigation',label: 'Полив' },
]

const SEV = {
  critical: { bg: '#fff1f0', border: '#fca5a5', accent: '#ef4444', text: '#b91c1c' },
  warning:  { bg: '#fffbeb', border: '#fde68a', accent: '#f59e0b', text: '#92400e' },
  info:     { bg: '#eff6ff', border: '#bfdbfe', accent: '#3b82f6', text: '#1e40af' },
}

function getReadIds() {
  try { return JSON.parse(localStorage.getItem('alerts_read') || '[]') } catch { return [] }
}

export default function Alerts() {
  const [filter,  setFilter]  = useState('all')
  const [readIds, setReadIds] = useState(getReadIds)
  const [alerts,  setAlerts]  = useState(MOCK_ALERTS)

  useEffect(() => {
    fetchAlerts().then(data => {
      if (data && Array.isArray(data)) setAlerts(data)
    })
  }, [])

  function markRead(id) {
    setReadIds(prev => {
      const next = prev.includes(id) ? prev : [...prev, id]
      localStorage.setItem('alerts_read', JSON.stringify(next))
      return next
    })
    markAlertReadApi(id)
  }

  function markAllRead() {
    const all = alerts.map(a => a.id)
    setReadIds(all)
    localStorage.setItem('alerts_read', JSON.stringify(all))
  }

  const filtered = alerts.filter(a => filter === 'all' || a.type === filter)
  const unread   = alerts.filter(a => !readIds.includes(a.id)).length

  return (
    <>
      <Navbar />
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 4 }}>
              Уведомления
            </h1>
            <p style={{ fontSize: 13, color: unread > 0 ? 'var(--color-anomaly)' : 'var(--color-text-muted)' }}>
              {unread > 0 ? `${unread} непрочитанных` : 'Все уведомления прочитаны'}
            </p>
          </div>
          {unread > 0 && (
            <button
              onClick={markAllRead}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', border: '1px solid var(--color-border)',
                borderRadius: 8, background: 'var(--color-surface)',
                fontSize: 13, cursor: 'pointer', color: 'var(--color-text-muted)',
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text-muted)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
            >
              <IconCheck size={14} color="var(--color-normal)" />
              Прочитать все
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {FILTER_TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              style={{
                padding: '7px 18px', borderRadius: 20,
                border: `1px solid ${filter === t.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: filter === t.key ? 'var(--color-accent)' : 'var(--color-surface)',
                color: filter === t.key ? '#fff' : 'var(--color-text)',
                fontSize: 13, fontWeight: 500, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Alert cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(alert => {
            const isRead = readIds.includes(alert.id)
            const sev    = SEV[alert.severity] || SEV.info
            return (
              <div
                key={alert.id}
                style={{
                  background: isRead ? 'var(--color-surface)' : sev.bg,
                  border: `1px solid ${isRead ? 'var(--color-border)' : sev.border}`,
                  borderLeft: `4px solid ${isRead ? 'var(--color-border)' : sev.accent}`,
                  borderRadius: 10,
                  padding: '16px 20px',
                  opacity: isRead ? 0.65 : 1,
                  transition: 'opacity 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 12, flex: 1 }}>
                    <div style={{ marginTop: 2, flexShrink: 0 }}>
                      {alert.severity === 'critical'
                        ? <IconCircleAlert size={18} color={sev.text} />
                        : <IconWarning size={18} color={sev.text} />
                      }
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                        <span style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 14, color: isRead ? 'var(--color-text)' : sev.text }}>
                          {alert.title}
                        </span>
                        {!isRead && (
                          <span style={{
                            fontSize: 10, background: sev.accent, color: '#fff',
                            padding: '1px 7px', borderRadius: 10, fontWeight: 700, flexShrink: 0,
                          }}>
                            Новое
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 13, color: 'var(--color-text)', lineHeight: 1.6, marginBottom: 8 }}>
                        {alert.message}
                      </div>
                      {alert.action && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--color-normal)', fontWeight: 600 }}>
                          <IconCheck size={13} color="var(--color-normal)" />
                          Действие: {alert.action}
                        </div>
                      )}
                      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8 }}>
                        {alert.district} · {new Date(alert.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                  </div>
                  {!isRead && (
                    <button
                      onClick={() => markRead(alert.id)}
                      style={{
                        padding: '5px 12px', border: '1px solid var(--color-border)',
                        borderRadius: 6, background: '#fff', fontSize: 12,
                        cursor: 'pointer', color: 'var(--color-text-muted)',
                        flexShrink: 0, whiteSpace: 'nowrap',
                        transition: 'border-color 0.15s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-text-muted)'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-border)'}
                    >
                      Прочитано
                    </button>
                  )}
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '56px 0', color: 'var(--color-text-muted)', fontSize: 14 }}>
              Уведомлений нет
            </div>
          )}
        </div>

      </div>
    </>
  )
}
