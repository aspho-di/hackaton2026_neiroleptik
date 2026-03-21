import { useState } from 'react'
import FieldList from '../components/FieldList'
import AddFieldModal, { loadSavedFields } from '../components/AddFieldModal'
import { getUser } from '../auth'
import WheatEmoji from '../components/icons/WheatEmoji'

const STAT_CARDS = [
  { key: 'normal',  dot: '#4caf50', label: 'В норме',           filter: f => f.status === 'normal'  },
  { key: 'warning', dot: '#f59e0b', label: 'Требуют внимания',  filter: f => f.status === 'warning' },
  { key: 'anomaly', dot: '#ef4444', label: 'Аномалии',          filter: f => f.status === 'anomaly' },
]

function StatPill({ dot, label, count }) {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '20px',
      padding: '5px 12px',
      fontSize: '13px',
      color: 'var(--color-text)',
      whiteSpace: 'nowrap',
    }}>
      <span style={{
        width: '8px', height: '8px',
        borderRadius: '50%',
        background: dot,
        flexShrink: 0,
        display: 'inline-block',
      }} />
      <span style={{ fontWeight: 700, fontFamily: 'Montserrat, sans-serif' }}>{count}</span>
      <span style={{ color: 'var(--color-text-muted)' }}>{label}</span>
    </div>
  )
}

export default function Dashboard() {
  const user = getUser()
  const parts = (user?.name || '').trim().split(' ')
  const firstName = parts.slice(1, 3).join(' ') || 'Агроном'

  const [savedFields, setSavedFields] = useState(() => loadSavedFields())
  const [showModal, setShowModal] = useState(false)

  const allFields = savedFields

  function handleAdd(newField) {
    setSavedFields(prev => [...prev, newField])
  }

  return (
    <>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px 0' }}>

          {/* Greeting */}
          <div style={{ marginBottom: '24px' }}>
            <h1 style={{ fontSize: '22px', color: 'var(--color-text)', marginBottom: '4px' }}>
              Добрый день, {firstName}!
            </h1>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
              Ростовская область — прогнозы урожайности и рекомендации по поливу
            </p>
          </div>

          {/* Stat pills */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
            {STAT_CARDS.map(card => (
              <StatPill
                key={card.key}
                dot={card.dot}
                label={card.label}
                count={allFields.filter(card.filter).length}
              />
            ))}
          </div>

          {/* Section header + кнопка добавить */}
          <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <h2 style={{ fontSize: '15px', color: 'var(--color-text)' }}>Мои поля</h2>
              <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                {allFields.length} участков
              </span>
            </div>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-accent)',
                borderRadius: '10px',
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--color-accent)',
                cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif',
                transition: 'background 0.15s, color 0.15s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'var(--color-accent)'
                e.currentTarget.style.color = '#fff'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'var(--color-surface)'
                e.currentTarget.style.color = 'var(--color-accent)'
              }}
            >
              + Добавить участок
            </button>
          </div>

          {allFields.length === 0 ? (
            <div style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '72px 24px', textAlign: 'center',
              animation: 'fadeIn 0.4s ease',
            }}>
              <div style={{
                width: 96, height: 96, borderRadius: '50%',
                background: 'var(--color-accent-light)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 24,
              }}>
                <WheatEmoji size={52} />
              </div>
              <div style={{
                fontSize: 22, fontFamily: 'Montserrat, sans-serif', fontWeight: 700,
                background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                marginBottom: 10,
              }}>
                Это могут быть ваши поля
              </div>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 300, lineHeight: 1.7, marginBottom: 32 }}>
                Добавьте первый участок, чтобы начать отслеживать урожайность и получать рекомендации по поливу
              </p>
              <button
                onClick={() => setShowModal(true)}
                style={{
                  background: 'var(--color-accent)', color: '#fff', border: 'none',
                  borderRadius: 10, padding: '12px 32px',
                  fontSize: 15, fontWeight: 600, fontFamily: 'Montserrat, sans-serif',
                  cursor: 'pointer', transition: 'background 0.15s',
                  boxShadow: '0 4px 14px rgba(76,175,80,0.35)',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--color-accent-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--color-accent)'}
              >
                + Добавить первый участок
              </button>
            </div>
          ) : (
            <FieldList fields={allFields} />
          )}
        </div>

      {showModal && (
        <AddFieldModal
          allFields={allFields}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </>
  )
}
