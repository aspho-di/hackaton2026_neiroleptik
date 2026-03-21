import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { getMockForecastForField, MOCK_FIELDS } from '../mockData'
import { fetchForecast, fetchCurrentWeather, deleteField } from '../api/client'

import { useFields } from '../hooks/useFields'
import { IconDroplet, IconThermometer, IconSun, IconTrendingUp, IconWarning } from '../components/icons/Icons'
import WheatEmoji from '../components/icons/WheatEmoji'
import AnomalyAlert from '../components/AnomalyAlert'
import PrecipChart from '../components/PrecipChart'
import StatusBadge from '../components/StatusBadge'
import SensorForm from '../components/SensorForm'
import CropSVG from '../components/CropSVG'

const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const ET0  = 4.0

const STATUS_GRADIENT = {
  normal:  'linear-gradient(135deg, #f0faf0 0%, #ffffff 60%)',
  warning: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 60%)',
  anomaly: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 60%)',
}

// ── Water balance ─────────────────────────────────────────────────────────────
function BalanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
      <div style={{ fontWeight: 600, marginBottom: 2, color: '#1c2b1e' }}>{label}</div>
      <div style={{ color: v >= 0 ? '#16a34a' : '#dc2626' }}>{v > 0 ? '+' : ''}{v} мм</div>
    </div>
  )
}

function BalanceDot({ cx, cy, value }) {
  if (cx == null || cy == null) return null
  return <circle cx={cx} cy={cy} r={4} fill={value >= 0 ? '#22c55e' : '#ef4444'} stroke="#fff" strokeWidth={1.5} />
}

function WaterBalanceChart({ precip }) {
  const data = precip.map((p, i) => ({ day: DAYS[i], balance: +(p - ET0).toFixed(1) }))
  const avg  = data.reduce((s, d) => s + d.balance, 0) / data.length
  const lineColor = avg >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{
      background: avg >= 0 ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)' : 'linear-gradient(135deg, #fff1f0 0%, #ffffff 60%)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 20px 16px',
      display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0,
    }}>
      <div style={{ marginBottom: 14, flexShrink: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 2 }}>Водный баланс</div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Осадки − ET₀ ({ET0} мм/день) по дням</div>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#6b7c6e' }} unit=" мм" width={46} axisLine={false} tickLine={false} />
          <Tooltip content={<BalanceTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
          <Line type="monotone" dataKey="balance" stroke={lineColor} strokeWidth={2.5} dot={<BalanceDot />} activeDot={{ r: 5 }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── WeatherSummary ────────────────────────────────────────────────────────────
function WeatherSummaryRow({ summary }) {
  const { avg_temp, total_precip_mm, hot_days, water_balance } = summary
  const wbColor = water_balance >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)'
  const items = [
    { icon: <IconThermometer size={16} color="#c2410c" />, label: 'Средняя темп.', value: `${avg_temp}°C`, color: avg_temp > 30 ? '#c2410c' : 'var(--color-text)' },
    { icon: <IconDroplet     size={16} color="#1d4ed8" />, label: 'Осадки',        value: `${total_precip_mm} мм`, color: 'var(--color-text)' },
    { icon: <IconSun         size={16} color="#f59e0b" />, label: 'Жарких дней',   value: hot_days, color: hot_days > 5 ? '#f59e0b' : 'var(--color-text)' },
    { icon: <IconTrendingUp  size={16} color={wbColor} />, label: 'Водный баланс', value: `${water_balance > 0 ? '+' : ''}${water_balance} мм`, color: wbColor },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
      {items.map(({ icon, label, value, color }) => (
        <div key={label} style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-card)',
          boxShadow: 'var(--shadow-card)',
          padding: '12px 14px',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{ flexShrink: 0 }}>{icon}</div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color }}>{value}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, hint }) {
  return (
    <div style={{ background: bg || 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '14px 16px' }}>
      <div style={{ marginBottom: 4, display: 'flex' }}>{icon}</div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontWeight: 500 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)' }}>{value}</div>
      {hint && <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>{hint}</div>}
    </div>
  )
}

// ── YieldCard ─────────────────────────────────────────────────────────────────
function YieldCard({ forecast, status }) {
  const { yield_ctha, yield_min, yield_max, risk_factors } = forecast
  const barColor = status === 'anomaly' ? 'var(--color-anomaly)' : status === 'warning' ? 'var(--color-warning)' : 'var(--color-normal)'
  const hasRange = yield_min != null && yield_max != null

  const trackMax = hasRange ? yield_max * 1.25 : yield_ctha * 1.25
  const minPct   = hasRange ? (yield_min / trackMax) * 100 : 0
  const maxPct   = hasRange ? (yield_max / trackMax) * 100 : 80
  const dotPct   = (yield_ctha / trackMax) * 100

  return (
    <div style={{ background: 'var(--color-accent-light)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', padding: '16px 18px' }}>
      <div style={{ marginBottom: 4, display: 'flex' }}><WheatEmoji size={20} /></div>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3, fontWeight: 500 }}>Прогноз урожайности</div>
      <div style={{ fontSize: 26, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-normal)' }}>{yield_ctha} ц/га</div>
      {hasRange && (
        <>
          <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2, marginBottom: 10 }}>
            от {yield_min} до {yield_max} ц/га
          </div>
          <div style={{ position: 'relative', height: 8, background: '#e5e7eb', borderRadius: 4, marginBottom: 12 }}>
            <div style={{
              position: 'absolute', left: `${minPct}%`, width: `${maxPct - minPct}%`,
              height: '100%', background: barColor, borderRadius: 4, opacity: 0.55,
            }} />
            <div style={{
              position: 'absolute', left: `${dotPct}%`, top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 14, height: 14, borderRadius: '50%',
              background: barColor, border: '2px solid #fff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
            }} />
          </div>
        </>
      )}
      {risk_factors?.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
          {risk_factors.map((rf, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <IconWarning size={13} color={rf.severity === 'critical' ? 'var(--color-anomaly)' : 'var(--color-warning)'} />
              <span style={{ color: 'var(--color-text)' }}>{rf.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── WhatIfSection ─────────────────────────────────────────────────────────────
function WhatIfSection({ baseYield }) {
  const [open, setOpen]               = useState(false)
  const [precipChange, setPrecipChange] = useState(0)
  const [tempChange,   setTempChange]   = useState(0)

  const precipEffect   = (precipChange / 100) * 8
  const tempEffect     = tempChange * (-1.2)
  const adjustedYield  = +(baseYield + precipEffect + tempEffect).toFixed(1)
  const delta          = +(adjustedYield - baseYield).toFixed(1)
  const deltaColor     = delta >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)'

  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', textAlign: 'left',
          background: 'none', border: 'none',
          padding: '16px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          cursor: 'pointer', fontSize: 14, fontWeight: 600,
          fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)',
        }}
      >
        <span>Сценарий: что если?</span>
        <span style={{ fontSize: 12, color: 'var(--color-text-muted)', transition: 'transform 0.2s', display: 'inline-block', transform: open ? 'rotate(180deg)' : 'none' }}>▼</span>
      </button>

      {open && (
        <div style={{ padding: '0 20px 20px', borderTop: '1px solid var(--color-border)' }}>
          <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Precip slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 8 }}>
                <span>Осадки июля</span>
                <span style={{ color: precipChange >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)', fontWeight: 700 }}>
                  {precipChange > 0 ? '+' : ''}{precipChange}% от нормы (45 мм)
                </span>
              </div>
              <input type="range" min="-50" max="50" step="5" value={precipChange}
                onChange={e => setPrecipChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                <span>−50%</span><span>0%</span><span>+50%</span>
              </div>
            </div>

            {/* Temp slider */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-muted)', fontWeight: 500, marginBottom: 8 }}>
                <span>Температура июля</span>
                <span style={{ color: tempChange > 0 ? 'var(--color-anomaly)' : tempChange < 0 ? 'var(--color-normal)' : 'var(--color-text)', fontWeight: 700 }}>
                  {tempChange > 0 ? '+' : ''}{tempChange}°C от нормы
                </span>
              </div>
              <input type="range" min="-5" max="5" step="0.5" value={tempChange}
                onChange={e => setTempChange(Number(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--color-accent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--color-text-muted)', marginTop: 2 }}>
                <span>−5°C</span><span>0°C</span><span>+5°C</span>
              </div>
            </div>

            {/* Result */}
            <div style={{
              background: delta >= 0 ? '#f0fdf4' : '#fff1f0',
              border: `1px solid ${delta >= 0 ? '#bbf7d0' : '#fca5a5'}`,
              borderRadius: 8, padding: '12px 16px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div style={{ fontSize: 13, color: 'var(--color-text)' }}>
                При осадках <b>{precipChange > 0 ? '+' : ''}{precipChange}%</b> и температуре <b>{tempChange > 0 ? '+' : ''}{tempChange}°C</b>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 16, color: deltaColor }}>
                  {adjustedYield} ц/га
                </div>
                <div style={{ fontSize: 11, color: deltaColor, fontWeight: 600 }}>
                  {delta >= 0 ? '+' : ''}{delta} ц/га
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function FieldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fieldId  = Number(id)

  const { fields: allFields, loading: fieldsLoading } = useFields()
  const field = allFields.find(f => f.field_id === fieldId)
  const [forecast,        setForecast]        = useState(null)
  const [loading,         setLoading]         = useState(true)
  const [sensorResult,    setSensorResult]    = useState(null)
  const [weatherData,     setWeatherData]     = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteError,     setDeleteError]     = useState('')

  const isMockField = MOCK_FIELDS.some(f => f.field_id === fieldId)

  async function handleDelete() {
    if (isMockField) {
      setDeleteError('Демонстрационные поля нельзя удалить')
      return
    }
    await deleteField(field.field_id)
    const saved   = JSON.parse(localStorage.getItem('fields') || '[]')
    const updated = saved.filter(f => f.field_id !== field.field_id)
    localStorage.setItem('fields', JSON.stringify(updated))
    navigate('/')
  }

  useEffect(() => {
    if (fieldsLoading) return
    let cancelled = false
    setLoading(true)
    setSensorResult(null)

    const lat = field?.latitude  ?? 46.85
    const lon = field?.longitude ?? 40.31

    async function load() {
      const [forecastData, weather] = await Promise.all([
        fetchForecast(fieldId, lat, lon),
        fetchCurrentWeather(lat, lon),
      ])
      if (!cancelled) {
        setForecast(forecastData ?? getMockForecastForField(fieldId))
        setWeatherData(weather)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [fieldId, fieldsLoading])

  if (fieldsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
        Загрузка...
      </div>
    )
  }

  if (!field) {
    return (
      <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
        Поле не найдено.{' '}
        <button onClick={() => navigate('/')} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
          На главную
        </button>
      </div>
    )
  }

  const isAnomaly   = forecast?.status === 'anomaly' || forecast?.anomaly_flag === true
  const isLowConf   = typeof forecast?.confidence === 'number' ? forecast.confidence < 0.7 : forecast?.confidence === 'low'
  const fieldStatus = isAnomaly ? 'anomaly' : isLowConf ? 'warning' : 'normal'
  const cardGradient = STATUS_GRADIENT[fieldStatus] ?? STATUS_GRADIENT.normal
  const showAlert    = sensorResult && (sensorResult.irrigation?.confidence === 'low' || sensorResult.irrigation?.status === 'anomaly')

  return (
    <>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Back */}
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--color-accent)', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 4, padding: 0, fontFamily: 'inherit' }}>
          ← Все поля
        </button>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 20, color: 'var(--color-text)', marginBottom: 3 }}>{field.name}</h1>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>ID поля: {field.field_id} · {field.crop}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {forecast && <StatusBadge status={forecast.status} confidence={forecast.confidence} />}
            <button
              onClick={() => { setDeleteError(''); setShowDeleteModal(true) }}
              style={{
                background: 'none', border: '1px solid #fca5a5', borderRadius: 8,
                padding: '6px 14px', fontSize: 13, fontWeight: 600,
                color: 'var(--color-anomaly)', cursor: 'pointer',
                fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >
              Удалить участок
            </button>
          </div>
        </div>

        {/* Delete modal */}
        {showDeleteModal && (
          <div
            onClick={() => setShowDeleteModal(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          >
            <div
              onClick={e => e.stopPropagation()}
              style={{ background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', maxWidth: 440, width: '100%', padding: '28px 28px 24px' }}
            >
              <h2 style={{ fontSize: 17, color: 'var(--color-text)', marginBottom: 12 }}>Удалить участок?</h2>
              <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.6, marginBottom: 20 }}>
                Вы уверены, что хотите удалить <strong style={{ color: 'var(--color-text)' }}>{field.name}</strong>?{' '}
                Это действие необратимо.
              </p>
              {deleteError && (
                <div style={{ fontSize: 13, color: 'var(--color-anomaly)', marginBottom: 16 }}>{deleteError}</div>
              )}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  style={{ background: 'none', border: '1px solid var(--color-border)', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif' }}
                >
                  Отмена
                </button>
                <button
                  onClick={handleDelete}
                  style={{ background: '#ef4444', border: 'none', borderRadius: 8, padding: '9px 20px', fontSize: 14, fontWeight: 600, color: '#fff', cursor: 'pointer', fontFamily: 'Montserrat, sans-serif', transition: 'background 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dc2626' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ef4444' }}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {showAlert && <AnomalyAlert message={sensorResult.irrigation?.message} anomalies={sensorResult.irrigation?.anomalies} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
            Загрузка прогноза...
          </div>
        ) : (
          <>
            {/* Условия сезона */}
            {forecast?.weather_summary && (
              <WeatherSummaryRow summary={forecast.weather_summary} />
            )}

            <div className="field-detail-grid">

              {/* ── ЛЕВАЯ КОЛОНКА ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

                {/* Yield */}
                <YieldCard forecast={forecast} status={fieldStatus} />

                {/* Sensor quick stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <StatCard icon={<IconDroplet size={18} color="#1d4ed8" />} label="Влажность почвы" value="—" hint="Введите данные" bg="#eff6ff" color="#1d4ed8" />
                  <StatCard icon={<IconThermometer size={18} color="#c2410c" />} label="Темп. воздуха" value="—" hint="Введите данные" bg="#fff7ed" color="#c2410c" />
                </div>

                {/* Sensor form */}
                <SensorForm fieldId={fieldId} crop={field?.crop ?? 'wheat'} onResult={setSensorResult} />

                {/* What-if */}
                <WhatIfSection baseYield={forecast.yield_ctha} />

              </div>

              {/* ── ПРАВАЯ КОЛОНКА ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, height: '100%' }}>

                {/* CropSVG + PrecipChart */}
                <div style={{
                  position: 'relative', overflow: 'hidden',
                  background: cardGradient,
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-card)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '20px 20px 16px', flexShrink: 0,
                }}>
                  <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.85 }}>
                    <CropSVG crop={field.crop} status={fieldStatus} temp={field.temp} precip={field.precip} width={80} height={80} />
                  </div>
                  <div style={{ marginBottom: 14, paddingRight: 96 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: 2 }}>Осадки на 7 дней</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>{field.crop}</div>
                  </div>
                  <PrecipChart data={weatherData?.precip_forecast_7days ?? forecast.precip_forecast_7days} height={240} />
                  {weatherData && (
                    <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 6, textAlign: 'right' }}>
                      Данные: {weatherData.source} · обновлено в {new Date(weatherData.updated_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  )}
                </div>

                {/* Водный баланс — после расчёта */}
                {sensorResult && <WaterBalanceChart precip={sensorResult.precip ?? weatherData?.precip_forecast_7days ?? forecast?.precip_forecast_7days} />}

              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
