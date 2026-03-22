import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import FieldList from '../components/FieldList'
import AddFieldModal, { loadSavedFields } from '../components/AddFieldModal'
import { fetchFields } from '../api/client'
import { getUser } from '../auth'
import WheatEmoji from '../components/icons/WheatEmoji'
import Toast, { showToast } from '../components/Toast'
import Onboarding from '../components/Onboarding'
import { CROPS, CROP_LABEL } from '../constants/districts'
import { IconSearch, IconX, IconCheck, IconDroplets, IconBarChart } from '../components/icons/Icons'
import { useNavigate } from 'react-router-dom'

const GO_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

// Go API + оба ML-сервиса через единый прокси-эндпоинт /api/v1/ml/health
const DATA_SOURCES = [
  { key: 'go',      label: 'Go API',     url: `${GO_BASE}/api/v1/fields`,   short: ':8080' },
  { key: 'ml',      label: 'ML-сервисы', url: `${GO_BASE}/api/v1/ml/health`, short: 'ML'   },
  { key: 'weather', label: 'Open-Meteo', url: 'https://api.open-meteo.com/v1/forecast?latitude=46.85&longitude=40.31&daily=precipitation_sum&forecast_days=1&timezone=Europe%2FMoscow', short: 'API' },
]

function DataSourcesWidget() {
  const [statuses, setStatuses] = useState(() => Object.fromEntries(DATA_SOURCES.map(s => [s.key, 'checking'])))
  const [lastCheck, setLastCheck] = useState(null)

  const checkAll = useCallback(async () => {
    setStatuses(Object.fromEntries(DATA_SOURCES.map(s => [s.key, 'checking'])))
    const results = await Promise.all(DATA_SOURCES.map(async s => {
      try {
        const ctrl  = new AbortController()
        const timer = setTimeout(() => ctrl.abort(), 3000)
        const res   = await fetch(s.url, { signal: ctrl.signal, method: 'GET' })
        clearTimeout(timer)
        if (s.key === 'ml' && res.ok) {
          // ml/health возвращает { status, ml_yield_service, ml_irrigation_service }
          const data = await res.json()
          return [s.key, data.status === 'ok' ? 'online' : 'offline']
        }
        return [s.key, res.ok || res.status < 500 ? 'online' : 'offline']
      } catch {
        return [s.key, 'offline']
      }
    }))
    setStatuses(Object.fromEntries(results))
    setLastCheck(new Date())
  }, [])

  useEffect(() => { checkAll() }, [checkAll])

  const allOnline  = Object.values(statuses).every(s => s === 'online')
  const anyOffline = Object.values(statuses).some(s => s === 'offline')
  const checking   = Object.values(statuses).some(s => s === 'checking')

  const overallColor = checking ? '#f59e0b' : anyOffline ? '#ef4444' : '#4caf50'
  const overallLabel = checking ? 'Проверка...' : anyOffline ? 'Нет связи' : 'Все активны'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 12, padding: '10px 16px',
      marginBottom: 16, fontSize: 12,
    }}>
      {/* Overall indicator */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginRight: 4 }}>
        <span style={{
          width: 8, height: 8, borderRadius: '50%', background: overallColor, flexShrink: 0,
          boxShadow: checking ? 'none' : `0 0 0 3px ${overallColor}22`,
          animation: checking ? 'pulse 1s infinite' : 'none',
        }} />
        <span style={{ fontWeight: 700, color: overallColor, fontFamily: 'Montserrat, sans-serif', fontSize: 11 }}>
          {overallLabel}
        </span>
      </div>

      <span style={{ width: 1, height: 16, background: 'var(--color-border)', flexShrink: 0 }} />

      {/* Per-source status */}
      {DATA_SOURCES.map(src => {
        const s = statuses[src.key]
        const color = s === 'online' ? '#4caf50' : s === 'offline' ? '#ef4444' : '#f59e0b'
        return (
          <div key={src.key} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0,
              animation: s === 'checking' ? 'pulse 1s infinite' : 'none',
            }} />
            <span style={{ color: 'var(--color-text-muted)' }}>
              {src.label}
              <span style={{ display: 'inline-flex', alignItems: 'center', marginLeft: 4 }}>
                {s === 'online'
                  ? <IconCheck size={11} color="var(--color-normal)" />
                  : s === 'offline'
                  ? <IconX size={11} color="var(--color-anomaly)" />
                  : <span style={{ color: 'var(--color-warning)', fontSize: 11, fontWeight: 600 }}>…</span>}
              </span>
            </span>
          </div>
        )
      })}

      {/* Refresh + last check */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {lastCheck && !checking && (
          <span style={{ color: 'var(--color-text-muted)', fontSize: 11 }}>
            {lastCheck.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <button
          onClick={checkAll}
          disabled={checking}
          title="Проверить соединение"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            width: 26, height: 26, borderRadius: 6,
            border: '1px solid var(--color-border)',
            background: 'transparent', cursor: checking ? 'not-allowed' : 'pointer',
            color: 'var(--color-text-muted)', transition: 'all 0.15s',
            opacity: checking ? 0.5 : 1,
          }}
          onMouseEnter={e => { if (!checking) { e.currentTarget.style.borderColor = 'var(--color-accent)'; e.currentTarget.style.color = 'var(--color-accent)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-border)'; e.currentTarget.style.color = 'var(--color-text-muted)' }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            style={{ animation: checking ? 'spin 1s linear infinite' : 'none' }}>
            <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

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

  const navigate = useNavigate()
  const [tab, setTab] = useState('overview')
  const [savedFields, setSavedFields] = useState(() => loadSavedFields())
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchFields().then(data => {
      if (!Array.isArray(data) || !data.length) return
      const backendFields = data.map(f => ({
        field_id:  f.id,
        name:      f.name,
        crop:      f.crop_type ?? 'wheat',
        status:    'normal',
        area:      f.area_hectares,
        latitude:  f.latitude,
        longitude: f.longitude,
        temp:      20,
        precip:    5,
      }))
      setSavedFields(prev => {
        const backendIds = new Set(backendFields.map(f => f.field_id))
        const localOnly  = prev.filter(f => !backendIds.has(f.field_id))
        return [...backendFields, ...localOnly]
      })
    }).catch(() => {})
  }, [])
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('onboarding_done'))

  // Search & filter state
  const [search, setSearch]             = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cropFilter, setCropFilter]     = useState('all')
  const [filterOpen, setFilterOpen]     = useState(false)
  const filterRef                       = useRef(null)

  useEffect(() => {
    if (!filterOpen) return
    function handleClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) setFilterOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [filterOpen])

  const allFields = savedFields

  const filteredFields = useMemo(() => {
    return allFields.filter(f => {
      const matchSearch = !search || (f.name?.toLowerCase() ?? '').includes(search.toLowerCase())
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

  const TABS = [
    { key: 'overview', label: 'Главная' },
    { key: 'fields',   label: `Участки${allFields.length ? ` (${allFields.length})` : ''}` },
  ]

  return (
    <>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '28px 24px 0' }}>

        {/* Greeting */}
        <div style={{ marginBottom: '16px' }}>
          <h1 className="page-title">
            Добрый день, {firstName}!
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '14px' }}>
            Ростовская область — прогнозы урожайности и рекомендации по поливу
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 4, marginBottom: 24,
          borderBottom: '2px solid var(--color-border)',
          paddingBottom: 0,
        }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: '8px 20px',
                fontSize: 14, fontWeight: tab === t.key ? 700 : 500,
                fontFamily: 'Montserrat, sans-serif',
                color: tab === t.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                background: 'none', border: 'none', cursor: 'pointer',
                borderBottom: `2px solid ${tab === t.key ? 'var(--color-accent)' : 'transparent'}`,
                marginBottom: -2,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ── TAB: Главная ── */}
        {tab === 'overview' && (<>

        {/* Stat pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
          {STAT_CARDS.map(card => (
            <StatPill key={card.key} dot={card.dot} label={card.label} count={allFields.filter(card.filter).length} />
          ))}
        </div>

        {/* Data sources status */}
        <DataSourcesWidget />

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            {
              label: 'Мои участки',
              desc: `${allFields.length} участков`,
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
              color: 'var(--color-accent)',
              onClick: () => setTab('fields'),
            },
            {
              label: 'Полив',
              desc: 'Оптимизация ресурса',
              icon: <IconDroplets size={22} color="var(--color-accent)" />,
              color: 'var(--color-accent)',
              onClick: () => navigate('/irrigation'),
            },
            {
              label: 'Сравнение',
              desc: 'Сравнить участки',
              icon: <IconBarChart size={22} color="#3b82f6" />,
              color: '#3b82f6',
              onClick: () => navigate('/compare'),
            },
            {
              label: 'История',
              desc: 'Данные датчиков',
              icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              color: 'var(--color-warning)',
              onClick: () => navigate('/history'),
            },
          ].map(action => (
            <button
              key={action.label}
              onClick={action.onClick}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '16px 18px',
                cursor: 'pointer', textAlign: 'left',
                transition: 'box-shadow 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; e.currentTarget.style.borderColor = action.color }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'var(--shadow-card)'; e.currentTarget.style.borderColor = 'var(--color-border)' }}
            >
              <div style={{ width: 42, height: 42, borderRadius: 10, background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: action.color }}>
                {action.icon}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 2 }}>{action.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{action.desc}</div>
              </div>
            </button>
          ))}
        </div>

        </>)}

        {/* ── TAB: Участки ── */}
        {tab === 'fields' && (<>

        {/* Search + filter button */}
        {allFields.length > 0 && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>

            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 180px', maxWidth: 320 }}>
              <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', display: 'flex' }}>
                <IconSearch size={14} color="var(--color-text-muted)" />
              </span>
              <input
                type="text"
                placeholder="Поиск по названию..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px 8px 33px',
                  border: '1px solid var(--color-border)',
                  borderRadius: 8, fontSize: 13,
                  background: 'var(--color-surface)', color: 'var(--color-text)',
                  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={e => { e.target.style.borderColor = 'var(--color-accent)'; e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.12)' }}
                onBlur={e => { e.target.style.borderColor = 'var(--color-border)'; e.target.style.boxShadow = 'none' }}
              />
            </div>

            {/* Filter toggle button */}
            <div ref={filterRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setFilterOpen(o => !o)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '8px 14px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                  border: `1px solid ${hasFilters ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  background: hasFilters ? 'var(--color-accent-light)' : 'var(--color-surface)',
                  color: hasFilters ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  fontWeight: hasFilters ? 700 : 400,
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {/* Filter icon — funnel */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                {hasFilters && (
                  <span style={{
                    minWidth: 17, height: 17, borderRadius: 9,
                    background: 'var(--color-accent)', color: '#fff',
                    fontSize: 10, fontWeight: 700,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    padding: '0 4px',
                  }}>
                    {(statusFilter !== 'all' ? 1 : 0) + (cropFilter !== 'all' ? 1 : 0)}
                  </span>
                )}
              </button>

              {/* Dropdown panel */}
              {filterOpen && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 8px)', left: 0,
                  zIndex: 200,
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 12,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.14)',
                  padding: '18px 18px 14px',
                  minWidth: 280,
                  animation: 'fadeIn 0.15s ease',
                }}>
                  {/* Статус */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Статус
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {STATUS_FILTERS.map(sf => (
                      <button
                        key={sf.key}
                        onClick={() => setStatusFilter(sf.key)}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: 5,
                          padding: '5px 11px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                          border: `1px solid ${statusFilter === sf.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: statusFilter === sf.key ? 'var(--color-accent-light)' : 'var(--color-bg)',
                          color: statusFilter === sf.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          fontWeight: statusFilter === sf.key ? 700 : 400,
                          transition: 'all 0.12s',
                        }}
                      >
                        {sf.dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: sf.dot, flexShrink: 0 }} />}
                        {sf.label}
                      </button>
                    ))}
                  </div>

                  {/* Культура */}
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                    Культура
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                    {[{ key: 'all', label: 'Все' }, ...CROPS].map(c => (
                      <button
                        key={c.key}
                        onClick={() => setCropFilter(c.key)}
                        style={{
                          padding: '5px 11px', borderRadius: 8, fontSize: 12, cursor: 'pointer',
                          border: `1px solid ${cropFilter === c.key ? 'var(--color-accent)' : 'var(--color-border)'}`,
                          background: cropFilter === c.key ? 'var(--color-accent-light)' : 'var(--color-bg)',
                          color: cropFilter === c.key ? 'var(--color-accent)' : 'var(--color-text-muted)',
                          fontWeight: cropFilter === c.key ? 700 : 400,
                          transition: 'all 0.12s',
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  {/* Сбросить */}
                  {hasFilters && (
                    <button
                      onClick={() => { clearFilters(); setFilterOpen(false) }}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '6px 12px', borderRadius: 8,
                        border: '1px solid var(--color-border)',
                        background: 'transparent', color: 'var(--color-text-muted)',
                        fontSize: 12, cursor: 'pointer', transition: 'color 0.15s',
                        width: '100%', justifyContent: 'center',
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = 'var(--color-anomaly)'}
                      onMouseLeave={e => e.currentTarget.style.color = 'var(--color-text-muted)'}
                    >
                      <IconX size={12} color="currentColor" />
                      Сбросить все фильтры
                    </button>
                  )}
                </div>
              )}
            </div>

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

        </>)}
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
