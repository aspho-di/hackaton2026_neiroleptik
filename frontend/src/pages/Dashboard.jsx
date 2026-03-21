import { useState, useMemo } from 'react'
import FieldList from '../components/FieldList'
import AddFieldModal, { loadSavedFields } from '../components/AddFieldModal'
import { getUser } from '../auth'
import WheatEmoji from '../components/icons/WheatEmoji'
import Toast, { showToast } from '../components/Toast'
import Onboarding from '../components/Onboarding'
import { CROPS, CROP_LABEL } from '../constants/districts'
import { IconSearch, IconX } from '../components/icons/Icons'

const STATUS_FILTERS = [
  { key: 'all',     label: 'Все',               dot: null },
  { key: 'normal',  label: 'Норма',             dot: '#4caf50' },
  { key: 'warning', label: 'Требуют внимания',  dot: '#f59e0b' },
  { key: 'anomaly', label: 'Аномалии',          dot: '#ef4444' },
]

const STAT_CARDS = [
  { key: 'normal',  dot: '#4caf50', label: 'В норме',           filter: f => f.status === 'normal'  },
  { key: 'warning', dot: '#f59e0b', label: 'Требуют внимания',  filter: f => f.status === 'warning' },
  { key: 'anomaly', dot: '#ef4444', label: 'Аномалии',          filter: f => f.status === 'anomaly' },
]

function StatPill({ dot, label, count }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '20px', padding: '5px 12px',
      fontSize: '13px', color: 'var(--color-text)', whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 8, height: 8, borderRadius: '50%', background: dot, flexShrink: 0, display: 'inline-block' }} />
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
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_done'))

  // Search & filter state
  const [search, setSearch]           = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cropFilter, setCropFilter]   = useState('all')

  const allFields = savedFields

  const filteredFields = useMemo(() => {
    return allFields.filter(f => {
      const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase())
      const matchStatus = statusFilter === 'all' || f.status === statusFilter
      const matchCrop   = cropFilter === 'all'   || f.crop === cropFilter
      return matchSearch && matchStatus && matchCrop
    })
  }, [allFields, search, statusFilter, cropFilter])

  const hasFilters = search || statusFilter !== 'all' || cropFilter !== 'all'

  function handleAdd(newField) {
    setSavedFields(prev => [...prev, newField])
    showToast(`Участок «${newField.name.split('—')[0].trim()}» добавлен`)
  }

  function clearFilters() {
    setSearch('')
    setStatusFilter('all')
    setCropFilter('all')
  }

  return (
    <>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '20px' }}>
          <h1 className="page-title">
            Добрый день, {firstName}!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Ростовская область — прогнозы урожайности и рекомендации по поливу
          </p>
        </div>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STAT_CARDS.map(card => (
            <StatPill key={card.key} dot={card.dot} label={card.label} count={allFields.filter(card.filter).length} />
          ))}
        </div>

        {/* Search & filters */}
        {allFields.length > 0 && (
          <div style={{
            display: 'flex', gap: 10, alignItems: 'center',
            marginBottom: '16px', flexWrap: 'wrap',
          }}>
            {/* Search input */}
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                <IconSearch size={15} color="var(--color-text-muted)" />
              </span>
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '9px 14px 9px 36px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, fontSize: 13,
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  outline: 'none',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Status filter */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {STATUS_FILTERS.map(sf => (
                <button
                  key={sf.key}
                  onClick={() => setStatusFilter(sf.key)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 12px',
                    borderRadius: 8,
                    border: `1px solid ${statusFilter === sf.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: statusFilter === sf.key ? 'var(--color-accent-light)' : 'var(--color-surface)',
                    color: statusFilter === sf.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                    fontWeight: statusFilter === sf.key ? 700 : 400,
                    fontSize: 13, cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {sf.dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: sf.dot, flexShrink: 0 }} />}
                  {sf.label}
                </button>
              ))}
            </div>

            {/* Crop filter */}
            <select
              value={cropFilter}
              onChange={e => setCropFilter(e.target.value)}
              style={{
                padding: '8px 12px',
                border: `1px solid ${cropFilter !== 'all' ? 'var(--color-accent)' : 'var(--color-border)'}`,
                borderRadius: 8, fontSize: 13,
                background: 'var(--color-surface)',
                color: cropFilter !== 'all' ? 'var(--color-accent)' : 'var(--color-text)',
                outline: 'none', cursor: 'pointer',
                fontWeight: cropFilter !== 'all' ? 600 : 400,
              }}
            >
              <option value="all">Все культуры</option>
              {CROPS.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>

            {/* Clear filters */}
            {hasFilters && (
              <button
                onClick={clearFilters}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '7px 12px',
                  borderRadius: 8, border: '1px solid var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-muted)',
                  fontSize: 13, cursor: 'pointer',
                  transition: 'color 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-anomaly)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
              >
                <IconX size={13} color="currentColor" />
                Сбросить
              </button>
            )}
          </div>
        )}

        {/* Section header + add button */}
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h2 style={{ fontSize: '15px', color: 'var(--color-text)' }}>Мои поля</h2>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              {hasFilters ? `${filteredFields.length} из ${allFields.length}` : `${allFields.length} участков`}
            </span>
          </div>
          <button
            onClick={() => setShowModal(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-accent)',
              borderRadius: '10px', padding: '10px 24px',
              fontSize: '15px', fontWeight: 600,
              color: 'var(--color-accent)', cursor: 'pointer',
              fontFamily: 'Montserrat, sans-serif',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-accent)' }}
          >
            + Добавить участок
          </button>
        </div>

        {/* Field list or empty states */}
        {allFields.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '72px 24px', textAlign: 'center', animation: 'fadeIn 0.4s ease',
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
        ) : filteredFields.length === 0 ? (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            padding: '48px 24px', textAlign: 'center',
            animation: 'fadeIn 0.3s ease',
          }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%',
              background: 'var(--color-accent-light)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 16,
            }}>
              <IconSearch size={28} color="var(--color-accent)" />
            </div>
            <div style={{ fontSize: 17, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--color-text)', marginBottom: 8 }}>
              Ничего не найдено
            </div>
            <p style={{ fontSize: 14, color: 'var(--color-text-muted)', marginBottom: 20 }}>
              Попробуйте изменить критерии поиска или сбросить фильтры
            </p>
            <button
              onClick={clearFilters}
              style={{
                background: 'var(--color-accent)', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 24px',
                fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif',
                cursor: 'pointer',
              }}
            >
              Сбросить фильтры
            </button>
          </div>
        ) : (
          <FieldList fields={filteredFields} />
        )}
      </div>

      {showModal && (
        <AddFieldModal
          allFields={allFields}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
      <Toast />
      {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    </>
  )
}
