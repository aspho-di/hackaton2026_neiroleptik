import { useState, useMemo, useEffect } from 'react'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ReferenceLine,
  ComposedChart, Bar, Legend,
} from 'recharts'
import { loadSavedFields } from '../components/AddFieldModal'
import { fetchPredictions, fetchSensorData } from '../api/client'
import { IconDownload, IconWarning, IconBarChart, IconArrowUp, IconInfo } from '../components/icons/Icons'

// ── Constants ─────────────────────────────────────────────────────────────────
const CROP_LABEL_MAP = {
  wheat: 'Пшеница', sunflower: 'Подсолнечник', corn: 'Кукуруза',
  barley: 'Ячмень', tomato: 'Томат',
}

// Oblast-level reference data (clearly regional, not field-specific)
const OBLAST_DATA = [
  { year: 2016, yield_ctha: 32.1, precip_mm: 210, avg_temp: 24.1, hot_days: 18, water_balance: -45 },
  { year: 2017, yield_ctha: 38.4, precip_mm: 285, avg_temp: 22.8, hot_days: 9,  water_balance: 12  },
  { year: 2018, yield_ctha: 29.7, precip_mm: 178, avg_temp: 26.3, hot_days: 24, water_balance: -82 },
  { year: 2019, yield_ctha: 41.2, precip_mm: 310, avg_temp: 21.9, hot_days: 6,  water_balance: 38  },
  { year: 2020, yield_ctha: 35.8, precip_mm: 241, avg_temp: 23.5, hot_days: 14, water_balance: -18 },
  { year: 2021, yield_ctha: 27.3, precip_mm: 156, avg_temp: 27.8, hot_days: 31, water_balance: -98 },
  { year: 2022, yield_ctha: 43.6, precip_mm: 298, avg_temp: 22.1, hot_days: 8,  water_balance: 24  },
  { year: 2023, yield_ctha: 39.1, precip_mm: 267, avg_temp: 23.2, hot_days: 12, water_balance: -5  },
  { year: 2024, yield_ctha: 44.8, precip_mm: 321, avg_temp: 21.7, hot_days: 5,  water_balance: 41  },
  { year: 2025, yield_ctha: 36.2, precip_mm: 198, avg_temp: 25.4, hot_days: 19, water_balance: -31 },
]

const STATUS_DOT = { normal: '#4caf50', warning: '#f59e0b', anomaly: '#ef4444' }

// ── Helpers ───────────────────────────────────────────────────────────────────
function loadSensorHistory(fieldId) {
  try {
    return JSON.parse(localStorage.getItem(`sensor_history_${fieldId}`) || '[]')
  } catch { return [] }
}

function fmtDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function avg(arr) {
  if (!arr.length) return null
  return +(arr.reduce((s, v) => s + v, 0) / arr.length).toFixed(1)
}

function getRating(y) {
  if (y >= 40) return { label: 'Отличный', color: '#16a34a' }
  if (y >= 33) return { label: 'Хороший',  color: '#4caf50' }
  if (y >= 28) return { label: 'Средний',  color: '#f59e0b' }
  return         { label: 'Плохой',    color: '#ef4444' }
}

// ── Styles ────────────────────────────────────────────────────────────────────
const card = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '24px',
  marginBottom: '20px',
}

function SectionLabel({ children }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, margin: '28px 0 14px',
    }}>
      <div style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
        {children}
      </span>
      <div style={{ height: 1, flex: 1, background: 'var(--color-border)' }} />
    </div>
  )
}

function StatCard({ label, value, sub, color, bg }) {
  return (
    <div style={{
      background: bg || 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '16px 18px',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)', lineHeight: 1, marginBottom: 3 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{sub}</div>}
    </div>
  )
}

function EmptyBlock({ text }) {
  return (
    <div style={{
      padding: '32px', textAlign: 'center',
      background: 'var(--color-bg)', borderRadius: 10,
      border: '1px dashed var(--color-border)',
      color: 'var(--color-text-muted)', fontSize: 13, lineHeight: 1.6,
    }}>
      {text}
    </div>
  )
}

// ── Custom tooltips ───────────────────────────────────────────────────────────
function SensorTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--color-text)' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color }}>
          {p.name}: {p.value != null ? p.value : '—'}
        </div>
      ))}
    </div>
  )
}

function PredTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  const yieldVal = d?.yield_ctha
  const yieldColor = yieldVal === 1 ? '#4caf50' : yieldVal === 0 ? '#ef4444' : 'var(--color-text-muted)'
  const yieldText  = yieldVal === 1 ? '1 — урожаемо' : yieldVal === 0 ? '0 — не урожаемо' : '—'
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: yieldColor, fontWeight: 600 }}>Урожаемость: {yieldText}</div>
      {d?.confidence != null && (
        <div style={{ color: 'var(--color-text-muted)' }}>Уверенность: {Math.round(d.confidence * 100)}%</div>
      )}
      {d?.is_anomaly && <div style={{ color: '#ef4444', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}><IconWarning size={11} color="#ef4444" />Аномалия</div>}
    </div>
  )
}

function OblastTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#4caf50' }}>Урожайность: {d?.yield_ctha} ц/га</div>
      <div style={{ color: '#3b82f6' }}>Осадки: {d?.precip_mm} мм</div>
      <div style={{ color: d?.hot_days > 20 ? '#ef4444' : 'var(--color-text-muted)' }}>Жарких дней: {d?.hot_days}</div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function History() {
  const allFields = loadSavedFields()
  const [selectedFieldId, setSelectedFieldId] = useState(() => allFields[0]?.field_id ?? null)
  const [predictions,  setPredictions]  = useState([])
  const [predsLoading, setPredsLoading] = useState(false)
  const [backendSensors, setBackendSensors] = useState([])

  const field = allFields.find(f => f.field_id === selectedFieldId) ?? null

  useEffect(() => {
    if (!selectedFieldId) return
    setPredsLoading(true)
    setPredictions([])
    setBackendSensors([])

    Promise.all([
      fetchPredictions(selectedFieldId).catch(() => null),
      fetchSensorData(selectedFieldId).catch(() => null),
    ]).then(([preds, sensors]) => {
      setPredictions(Array.isArray(preds) ? preds : [])
      // Адаптируем ответ бэка { id, field_id, soil_moisture, temperature, humidity, timestamp }
      // к формату localStorage { ts, soil_moisture, air_temperature, humidity }
      if (Array.isArray(sensors)) {
        setBackendSensors(sensors.map(s => ({
          ts:              s.timestamp,
          soil_moisture:   s.soil_moisture,
          air_temperature: s.temperature,
          humidity:        s.humidity,
          wind_speed:      null,
          is_anomaly:      false,
          irrigate:        false,
          amount_mm:       null,
          _source:         'backend',
        })))
      }
    }).finally(() => setPredsLoading(false))
  }, [selectedFieldId])

  // Мержим сенсоры из бэка и localStorage, дедублируем по ts
  const sensorHistory = useMemo(() => {
    const local = field ? loadSensorHistory(field.field_id) : []
    const localTs = new Set(local.map(r => r.ts))
    // Добавляем из бэка только те записи, которых нет в localStorage
    const merged = [...local, ...backendSensors.filter(r => !localTs.has(r.ts))]
    return merged.sort((a, b) => new Date(a.ts) - new Date(b.ts))
  }, [field, backendSensors])

  // Build prediction chart data: sorted by date, null = gap
  const predChartData = useMemo(() => {
    return [...predictions]
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map(p => ({
        label: fmtDate(p.created_at),
        yield_ctha: p.yield_prediction ?? null,
        confidence: p.confidence ?? null,
        is_anomaly: p.is_anomaly ?? false,
      }))
  }, [predictions])

  // Build sensor timeline: sorted by ts
  const sensorChartData = useMemo(() => {
    return [...sensorHistory]
      .sort((a, b) => new Date(a.ts) - new Date(b.ts))
      .map(r => ({
        label: fmtDate(r.ts),
        soil_moisture: r.soil_moisture ?? null,
        air_temperature: r.air_temperature ?? null,
        wind_speed: r.wind_speed ?? null,
      }))
  }, [sensorHistory])

  // Summary stats from real data
  const avgYield = useMemo(() => {
    const vals = predictions.map(p => p.yield_prediction).filter(v => v != null)
    return avg(vals)
  }, [predictions])

  const anomalyCount = useMemo(
    () => predictions.filter(p => p.is_anomaly).length,
    [predictions]
  )

  const avgMoisture = useMemo(() => {
    const vals = sensorHistory.map(r => r.soil_moisture).filter(v => v != null)
    return avg(vals)
  }, [sensorHistory])

  const irrigationCount = useMemo(
    () => sensorHistory.filter(r => r.irrigate).length,
    [sensorHistory]
  )

  // Oblast stats
  const oblastAvg = +(OBLAST_DATA.reduce((s, d) => s + d.yield_ctha, 0) / OBLAST_DATA.length).toFixed(1)
  const oblastBest = OBLAST_DATA.reduce((a, b) => a.yield_ctha > b.yield_ctha ? a : b)

  function exportCSV() {
    if (!sensorHistory.length && !predictions.length) return
    const rows = [
      ['Тип', 'Дата', 'Влажность почвы (%)', 'Темп. воздуха (°C)', 'Ветер (м/с)', 'Аномалия', 'Полив', 'Прогноз урожая (ц/га)'],
      ...sensorHistory.map(r => ['Датчик', r.ts, r.soil_moisture, r.air_temperature, r.wind_speed, r.is_anomaly ? 'Да' : 'Нет', r.irrigate ? r.amount_mm + ' мм' : 'Нет', '']),
      ...predictions.map(p => ['Прогноз', p.created_at, '', '', '', p.is_anomaly ? 'Да' : 'Нет', p.irrigation_recommendation ?? '', p.yield_prediction ?? '']),
    ]
    const csv = rows.map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `history_${(field?.name ?? 'field').replace(/\s/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── No fields ──────────────────────────────────────────────────────────────
  if (allFields.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--color-accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><IconBarChart size={34} color="var(--color-accent)" /></div>
        <div style={{ fontSize: 20, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
          Нет полей для анализа
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Добавьте поле на главной странице — его данные появятся здесь.
        </p>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 24px 48px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="page-title">Исторический анализ</h1>
          <p style={{ fontSize: 13, color: 'var(--color-text-muted)', marginTop: 4 }}>
            Данные участка + справочные показатели Ростовской области
          </p>
        </div>
        <button
          onClick={exportCSV}
          disabled={!sensorHistory.length && !predictions.length}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-accent)',
            borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            color: 'var(--color-accent)',
            cursor: (!sensorHistory.length && !predictions.length) ? 'not-allowed' : 'pointer',
            opacity: (!sensorHistory.length && !predictions.length) ? 0.45 : 1,
            fontFamily: 'Montserrat, sans-serif',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { if (sensorHistory.length || predictions.length) { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff' } }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-accent)' }}
        >
          <IconDownload size={15} color="currentColor" />
          Скачать CSV
        </button>
      </div>

      {/* Field selector */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Участок
        </div>
        {allFields.length <= 6 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allFields.map(f => {
              const active = f.field_id === selectedFieldId
              const dot = STATUS_DOT[f.status] ?? '#9ca3af'
              return (
                <button
                  key={f.field_id}
                  onClick={() => setSelectedFieldId(f.field_id)}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-text)',
                    fontWeight: active ? 600 : 400, transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: active ? '#fff' : dot, flexShrink: 0 }} />
                  {f.name}
                  {f.crop && (
                    <span style={{ fontSize: 11, opacity: active ? 0.8 : 0.6, marginLeft: 2 }}>
                      · {CROP_LABEL_MAP[f.crop] ?? f.crop}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ) : (
          <select
            value={selectedFieldId ?? ''}
            onChange={e => setSelectedFieldId(Number(e.target.value) || null)}
            style={{ padding: '9px 14px', borderRadius: 8, border: '1px solid var(--color-border)', fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', maxWidth: 360 }}
          >
            {allFields.map(f => <option key={f.field_id} value={f.field_id}>{f.name}</option>)}
          </select>
        )}

        {field && (
          <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-muted)' }}>
            {field.crop && <span>Культура: <b style={{ color: 'var(--color-text)' }}>{CROP_LABEL_MAP[field.crop] ?? field.crop}</b></span>}
            {field.area && <span>Площадь: <b style={{ color: 'var(--color-text)' }}>{field.area} га</b></span>}
            {field.district && <span>Район: <b style={{ color: 'var(--color-text)' }}>{field.district}</b></span>}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION A — ДАННЫЕ УЧАСТКА (только реальные)
      ═══════════════════════════════════════════════════════════════════════ */}
      <SectionLabel>Данные участка · {field?.name}</SectionLabel>

      {/* Summary stat cards from real data */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Прогнозов сохранено"
          value={predictions.length}
          sub={predsLoading ? 'Загрузка...' : 'из API'}
          color="var(--color-text)"
        />
        <StatCard
          label="Доля урожаемых прогнозов"
          value={(() => {
            const good = predictions.filter(p => p.yield_prediction === 1).length
            return predictions.length > 0 ? `${good} / ${predictions.length}` : '—'
          })()}
          sub={predictions.length > 0 ? `бинарный прогноз ML (0/1)` : 'нет данных'}
          color={predictions.length > 0 ? 'var(--color-normal)' : 'var(--color-text-muted)'}
        />
        <StatCard
          label="Аномалии в прогнозах"
          value={anomalyCount}
          sub={predictions.length > 0 ? `из ${predictions.length} записей` : 'нет данных'}
          color={anomalyCount > 0 ? 'var(--color-anomaly)' : 'var(--color-normal)'}
          bg={anomalyCount > 0 ? '#fef2f2' : undefined}
        />
        <StatCard
          label="Показаний датчика"
          value={sensorHistory.length}
          sub={avgMoisture != null ? `ср. влажность почвы ${avgMoisture}%` : 'нет данных'}
          color="var(--color-text)"
        />
        <StatCard
          label="Рекомендованных поливов"
          value={irrigationCount}
          sub={sensorHistory.length > 0 ? `из ${sensorHistory.length} замеров` : 'нет данных'}
          color={irrigationCount > 0 ? '#3b82f6' : 'var(--color-text-muted)'}
        />
      </div>

      {/* Prediction history chart */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          История прогнозов урожаемости
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Бинарный прогноз ML: <b style={{ color: '#4caf50' }}>1 = урожаемо</b>, <b style={{ color: '#ef4444' }}>0 = не урожаемо</b>. Каждая точка — реальный прогноз.
        </div>

        {predsLoading ? (
          <div style={{ height: 200, background: 'var(--color-bg)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
            Загрузка...
          </div>
        ) : predChartData.length === 0 ? (
          <EmptyBlock text="Нет прогнозов для этого участка. Откройте карточку поля — данные появятся здесь." />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={predChartData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7c6e' }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7c6e' }}
                width={40} axisLine={false} tickLine={false}
                domain={[-0.1, 1.1]}
                ticks={[0, 1]}
                tickFormatter={v => v === 1 ? '1 ✓' : v === 0 ? '0 ✗' : ''}
              />
              <Tooltip content={<PredTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
              <ReferenceLine y={0.5} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1} />
              <Line
                type="stepAfter" dataKey="yield_ctha"
                stroke="#4caf50" strokeWidth={2}
                dot={({ cx, cy, payload }) => (
                  <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={6}
                    fill={payload.yield_ctha === 1 ? '#4caf50' : payload.yield_ctha === 0 ? '#ef4444' : '#9ca3af'}
                    stroke="#fff" strokeWidth={2} />
                )}
                activeDot={{ r: 8 }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
        {predChartData.some(d => d.yield_ctha === 0) && (
          <div style={{ fontSize: 11, color: '#ef4444', marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>●</span> Красные точки — прогноз 0 (не урожаемо)
          </div>
        )}
      </div>

      {/* Sensor timeline chart */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          Динамика показаний датчиков
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Влажность почвы и температура воздуха по времени. Разрыв = нет данных за период.
        </div>

        {sensorChartData.length === 0 ? (
          <EmptyBlock text="Нет показаний датчиков. Перейдите на карточку поля, введите данные и нажмите «Рассчитать»." />
        ) : (
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={sensorChartData} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7c6e' }}
                axisLine={false} tickLine={false}
                interval="preserveStartEnd"
              />
              <YAxis tick={{ fontSize: 11, fill: '#6b7c6e' }} width={42} axisLine={false} tickLine={false} />
              <Tooltip content={<SensorTooltip />} />
              <Legend formatter={n => n === 'soil_moisture' ? 'Влажность почвы, %' : 'Темп. воздуха, °C'} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line type="monotone" dataKey="soil_moisture" name="soil_moisture" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6', stroke: '#fff', strokeWidth: 1.5 }} connectNulls={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="air_temperature" name="air_temperature" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 1.5 }} connectNulls={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sensor readings table */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 16 }}>
          Журнал показаний датчиков
        </div>

        {sensorHistory.length === 0 ? (
          <EmptyBlock text="Нет сохранённых показаний. Введите данные датчика на карточке участка." />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  {['Дата', 'Влажность воздуха', 'Влажность почвы', 'Темп. воздуха', 'Ветер', 'Аномалия', 'Рекоменд. полив'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sensorHistory].reverse().map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: r.is_anomaly ? '#fef2f2' : 'transparent' }}>
                    <td style={{ padding: '9px 12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>{fmtDate(r.ts)}</td>
                    <td style={{ padding: '9px 12px' }}>{r.humidity ?? '—'} %</td>
                    <td style={{ padding: '9px 12px', color: r.soil_moisture < 20 ? '#ef4444' : r.soil_moisture > 80 ? '#f59e0b' : 'inherit', fontWeight: 500 }}>
                      {r.soil_moisture ?? '—'} %
                    </td>
                    <td style={{ padding: '9px 12px', color: r.air_temperature > 35 ? '#ef4444' : 'inherit' }}>
                      {r.air_temperature ?? '—'} °C
                    </td>
                    <td style={{ padding: '9px 12px' }}>{r.wind_speed ?? '—'} м/с</td>
                    <td style={{ padding: '9px 12px', color: r.is_anomaly ? 'var(--color-anomaly)' : 'var(--color-normal)', fontWeight: r.is_anomaly ? 600 : 400 }}>
                      {r.is_anomaly ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><IconWarning size={12} color="var(--color-anomaly)" />Да</span> : 'Нет'}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {r.irrigate
                        ? <span style={{ color: '#3b82f6', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}><IconArrowUp size={12} color="#3b82f6" />{r.amount_mm} мм</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════
          SECTION B — СПРАВОЧНЫЕ ДАННЫЕ РАЙОНА
      ═══════════════════════════════════════════════════════════════════════ */}
      <SectionLabel>Справочные данные Ростовской области · 2016–2025</SectionLabel>

      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        background: '#fffbeb', border: '1px solid #fde68a',
        borderRadius: 8, padding: '10px 14px', marginBottom: 20, fontSize: 12,
        color: 'var(--color-text-muted)',
      }}>
        <IconInfo size={16} color="#f59e0b" />
        Данные ниже — региональная статистика Ростовской области, <b>не конкретного участка</b>. Используйте для сравнения с вашими результатами.
      </div>

      {/* Oblast yield chart */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          Урожайность по Ростовской области
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Среднее за 2016–2025: <b style={{ color: 'var(--color-text)' }}>{oblastAvg} ц/га</b>
          {' · '}Рекорд: <b style={{ color: '#16a34a' }}>{oblastBest.year} ({oblastBest.yield_ctha} ц/га)</b>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={OBLAST_DATA} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" ц" width={52} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<OblastTooltip />} cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }} />
            <ReferenceLine
              y={oblastAvg} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5}
              label={{ value: `сред. ${oblastAvg}`, position: 'insideBottomRight', fontSize: 11, fill: '#9ca3af' }}
            />
            <Line
              type="monotone" dataKey="yield_ctha"
              stroke="#9ca3af" strokeWidth={2} strokeDasharray="0"
              dot={{ r: 4, fill: '#9ca3af', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Oblast precip + water balance */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          Осадки и водный баланс по области
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Водный баланс = осадки − испаряемость ET₀ · вегетационный период (май–август)
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={OBLAST_DATA} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="precip" orientation="left" tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" мм" width={52} axisLine={false} tickLine={false} />
            <YAxis yAxisId="balance" orientation="right" tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" мм" width={52} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
            />
            <Legend formatter={n => n === 'precip_mm' ? 'Осадки, мм' : 'Водный баланс, мм'} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={0} yAxisId="balance" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
            <Bar yAxisId="precip" dataKey="precip_mm" fill="#bfdbfe" radius={[4,4,0,0]} name="precip_mm" maxBarSize={40} />
            <Line
              yAxisId="balance" type="monotone" dataKey="water_balance"
              stroke="#9ca3af" strokeWidth={2}
              dot={({ cx, cy, value }) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4}
                  fill={value >= 0 ? '#9ca3af' : '#d1d5db'}
                  stroke="#fff" strokeWidth={1.5} />
              )}
              name="water_balance" isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}