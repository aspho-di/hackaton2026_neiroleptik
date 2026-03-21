import { useState, useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine, Tooltip, ResponsiveContainer,
  ComposedChart, Bar, CartesianGrid, Legend,
  ScatterChart, Scatter, Cell, ZAxis,
} from 'recharts'
import { loadSavedFields } from '../components/AddFieldModal'
import { IconDownload } from '../components/icons/Icons'

// ── Crop yield multipliers ────────────────────────────────────────────────────
const CROP_MULT = { wheat: 1.0, sunflower: 0.88, corn: 1.08, barley: 0.92, tomato: 1.18 }
const CROP_LABEL_MAP = {
  wheat: 'Пшеница', sunflower: 'Подсолнечник', corn: 'Кукуруза',
  barley: 'Ячмень', tomato: 'Томат',
}

const BASE_DATA = [
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

// Deterministic pseudo-random variation by field_id
function seeded(fieldId, year, range) {
  return ((fieldId * 17 + year * 3 + fieldId * year) % (range * 2 + 1)) - range
}

function generateFieldHistory(field) {
  const mult = CROP_MULT[field.crop] ?? 1.0
  const id = field.field_id ?? 1
  return BASE_DATA.map(d => {
    const yDelta = seeded(id, d.year, 3.5)
    const pDelta = seeded(id * 2, d.year, 18)
    const wDelta = seeded(id * 3, d.year, 12)
    const rawYield = +(d.yield_ctha * mult + yDelta).toFixed(1)
    return {
      year:          d.year,
      yield_ctha:    Math.max(10, rawYield),
      precip_mm:     Math.max(80, d.precip_mm + pDelta),
      avg_temp:      d.avg_temp,
      hot_days:      d.hot_days,
      water_balance: d.water_balance + wDelta,
    }
  })
}

// ── Sensor readings from localStorage ────────────────────────────────────────
function loadSensorHistory(fieldId) {
  try {
    return JSON.parse(localStorage.getItem(`sensor_history_${fieldId}`) || '[]')
  } catch { return [] }
}

// ── Pearson ───────────────────────────────────────────────────────────────────
function pearson(xs, ys) {
  const n = xs.length
  if (n < 2) return 0
  const mx = xs.reduce((s, x) => s + x, 0) / n
  const my = ys.reduce((s, y) => s + y, 0) / n
  const num = xs.reduce((s, x, i) => s + (x - mx) * (ys[i] - my), 0)
  const den = Math.sqrt(
    xs.reduce((s, x) => s + (x - mx) ** 2, 0) *
    ys.reduce((s, y) => s + (y - my) ** 2, 0)
  )
  return den === 0 ? 0 : +(num / den).toFixed(2)
}

// ── ML metrics (global, model-level) ─────────────────────────────────────────
const ML_METRICS = [
  { label: 'RMSE',               value: '3.4',  unit: 'ц/га', desc: 'Среднеквадратичная ошибка',   color: 'var(--color-normal)' },
  { label: 'MAE',                value: '2.6',  unit: 'ц/га', desc: 'Средняя абсолютная ошибка',  color: 'var(--color-normal)' },
  { label: 'R²',                 value: '0.87', unit: '',     desc: 'Коэффициент детерминации',    color: '#3b82f6' },
  { label: 'Accuracy аномалий',  value: '94.3', unit: '%',    desc: 'Точность обнаружения аномалий', color: '#8b5cf6' },
]
const FEATURE_IMPORTANCE = [
  { feature: 'soil_moisture',   pct: 34, color: '#3b82f6' },
  { feature: 'precipitation',   pct: 28, color: '#4caf50' },
  { feature: 'air_temperature', pct: 19, color: '#f59e0b' },
  { feature: 'wind_speed',      pct: 9,  color: '#8b5cf6' },
  { feature: 'hot_days',        pct: 7,  color: '#ef4444' },
  { feature: 'humidity',        pct: 3,  color: '#6b7c6e' },
]

// ── Styles ────────────────────────────────────────────────────────────────────
const card = {
  background: 'var(--color-surface)',
  border: '1px solid var(--color-border)',
  borderRadius: 'var(--radius-card)',
  boxShadow: 'var(--shadow-card)',
  padding: '24px',
  marginBottom: '20px',
}

function getRating(y) {
  if (y >= 40) return { label: 'Отличный', color: '#16a34a' }
  if (y >= 33) return { label: 'Хороший',  color: '#4caf50' }
  if (y >= 28) return { label: 'Средний',  color: '#f59e0b' }
  return         { label: 'Плохой',    color: '#ef4444' }
}

// ── Tooltip components ────────────────────────────────────────────────────────
function YieldTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      <div style={{ color: '#4caf50' }}>Урожайность: <b>{d?.yield_ctha} ц/га</b></div>
      <div style={{ color: '#3b82f6' }}>Осадки: {d?.precip_mm} мм</div>
      <div style={{ color: d?.hot_days > 20 ? '#ef4444' : 'var(--color-text-muted)' }}>Жарких дней: {d?.hot_days}</div>
    </div>
  )
}

function PrecipTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', fontSize: 13, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, marginBottom: 6 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.dataKey === 'precip_mm' ? '#3b82f6' : (p.value >= 0 ? '#16a34a' : '#ef4444') }}>
          {p.dataKey === 'precip_mm' ? 'Осадки' : 'Водный баланс'}:{' '}
          {p.value > 0 && p.dataKey !== 'precip_mm' ? '+' : ''}{p.value} мм
        </div>
      ))}
    </div>
  )
}

function SummaryCard({ label, value, sub, color, bg }) {
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

const STATUS_DOT = { normal: '#4caf50', warning: '#f59e0b', anomaly: '#ef4444' }

// ── Main component ────────────────────────────────────────────────────────────
export default function History() {
  const allFields = loadSavedFields()
  const [selectedFieldId, setSelectedFieldId] = useState(() => allFields[0]?.field_id ?? null)
  const [selectedYear, setSelectedYear] = useState(null)

  const field = allFields.find(f => f.field_id === selectedFieldId) ?? null
  const data  = useMemo(() => field ? generateFieldHistory(field) : [], [field])
  const sensorHistory = useMemo(() => field ? loadSensorHistory(field.field_id) : [], [field])

  const avgYield = useMemo(() => data.length ? +(data.reduce((s, d) => s + d.yield_ctha, 0) / data.length).toFixed(1) : 0, [data])
  const best     = useMemo(() => data.length ? data.reduce((a, b) => a.yield_ctha > b.yield_ctha ? a : b) : null, [data])
  const worst    = useMemo(() => data.length ? data.reduce((a, b) => a.yield_ctha < b.yield_ctha ? a : b) : null, [data])
  const trend    = useMemo(() => {
    if (data.length < 6) return 0
    const n = data.length
    const first3 = data.slice(0, 3).reduce((s, d) => s + d.yield_ctha, 0) / 3
    const last3  = data.slice(n - 3).reduce((s, d) => s + d.yield_ctha, 0) / 3
    return +(last3 - first3).toFixed(1)
  }, [data])

  const analysis = selectedYear ? data.find(d => d.year === selectedYear) : null

  function exportCSV() {
    if (!field || !data.length) return
    const headers = ['Год', 'Урожайность (ц/га)', 'Осадки (мм)', 'Жарких дней', 'Ср. температура (°C)', 'Водный баланс (мм)']
    const rows = data.map(d => [d.year, d.yield_ctha, d.precip_mm, d.hot_days, d.avg_temp, d.water_balance])
    const csv = [headers, ...rows].map(r => r.join(';')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `history_${field.name.replace(/\s/g, '_')}_2016_2025.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // ── No fields state ────────────────────────────────────────────────────────
  if (allFields.length === 0) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: 'var(--color-accent-light)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 20px', fontSize: 32,
        }}>📊</div>
        <div style={{ fontSize: 20, fontFamily: 'Montserrat, sans-serif', fontWeight: 700, color: 'var(--color-text)', marginBottom: 10 }}>
          Нет полей для анализа
        </div>
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
          Добавьте хотя бы одно поле на главной странице, чтобы просматривать исторический анализ по конкретным участкам.
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
            Урожайность и погодные условия 2016–2025 · Ростовская область
          </p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            background: 'var(--color-surface)',
            border: '1px solid var(--color-accent)',
            borderRadius: 8, padding: '9px 18px',
            fontSize: 13, fontWeight: 600,
            color: 'var(--color-accent)',
            cursor: 'pointer', fontFamily: 'Montserrat, sans-serif',
            transition: 'all 0.15s', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-accent)'; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-surface)'; e.currentTarget.style.color = 'var(--color-accent)' }}
        >
          <IconDownload size={15} color="currentColor" />
          Скачать CSV
        </button>
      </div>

      {/* Field selector */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
          Выберите участок
        </div>
        {allFields.length <= 6 ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {allFields.map(f => {
              const active = f.field_id === selectedFieldId
              const dot = STATUS_DOT[f.status] ?? '#9ca3af'
              return (
                <button
                  key={f.field_id}
                  onClick={() => { setSelectedFieldId(f.field_id); setSelectedYear(null) }}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '8px 16px', borderRadius: 8, fontSize: 13, cursor: 'pointer',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                    background: active ? 'var(--color-accent)' : 'var(--color-surface)',
                    color: active ? '#fff' : 'var(--color-text)',
                    fontWeight: active ? 600 : 400,
                    transition: 'all 0.15s',
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
            onChange={e => { setSelectedFieldId(Number(e.target.value) || null); setSelectedYear(null) }}
            style={{
              padding: '9px 14px', borderRadius: 8, border: '1px solid var(--color-border)',
              fontSize: 13, background: 'var(--color-surface)', color: 'var(--color-text)', outline: 'none', maxWidth: 360,
            }}
          >
            {allFields.map(f => <option key={f.field_id} value={f.field_id}>{f.name}</option>)}
          </select>
        )}

        {/* Selected field info strip */}
        {field && (
          <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap', fontSize: 12, color: 'var(--color-text-muted)' }}>
            <span>Культура: <b style={{ color: 'var(--color-text)' }}>{CROP_LABEL_MAP[field.crop] ?? field.crop ?? '—'}</b></span>
            {field.area && <span>Площадь: <b style={{ color: 'var(--color-text)' }}>{field.area} га</b></span>}
            {field.district && <span>Район: <b style={{ color: 'var(--color-text)' }}>{field.district}</b></span>}
            <span>
              Статус:{' '}
              <span style={{ fontWeight: 600, color: STATUS_DOT[field.status] ?? '#9ca3af' }}>
                {field.status === 'normal' ? 'Норма' : field.status === 'warning' ? 'Требует внимания' : 'Аномалия'}
              </span>
            </span>
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        <SummaryCard
          label="Средняя урожайность"
          value={`${avgYield} ц/га`}
          sub={`за 2016–2025 · ${CROP_LABEL_MAP[field?.crop] ?? ''}`}
          color="var(--color-normal)"
        />
        {best && (
          <SummaryCard
            label={`Рекорд ${best.year}`}
            value={`${best.yield_ctha} ц/га`}
            sub={`${best.precip_mm} мм осадков`}
            color="#16a34a"
            bg="rgba(22,163,74,0.05)"
          />
        )}
        {worst && (
          <SummaryCard
            label={`Минимум ${worst.year}`}
            value={`${worst.yield_ctha} ц/га`}
            sub={`${worst.hot_days} жарких дней`}
            color="var(--color-anomaly)"
            bg="rgba(239,68,68,0.04)"
          />
        )}
        <SummaryCard
          label="Тренд"
          value={`${trend > 0 ? '+' : ''}${trend} ц/га`}
          sub="посл. 3 года vs первые 3 года"
          color={trend >= 0 ? 'var(--color-normal)' : 'var(--color-anomaly)'}
        />
      </div>

      {/* Block 1 — Yield line */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          Урожайность по годам · {field?.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Среднее: <b style={{ color: 'var(--color-text)' }}>{avgYield} ц/га</b>
          {best && <> · Лучший: <b style={{ color: '#16a34a' }}>{best.year} ({best.yield_ctha})</b></>}
          {worst && <> · Худший: <b style={{ color: '#ef4444' }}>{worst.year} ({worst.yield_ctha})</b></>}
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" ц" width={52} axisLine={false} tickLine={false} domain={['auto', 'auto']} />
            <Tooltip content={<YieldTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
            <ReferenceLine
              y={avgYield} stroke="#9ca3af" strokeDasharray="5 5" strokeWidth={1.5}
              label={{ value: `сред. ${avgYield}`, position: 'insideBottomRight', fontSize: 11, fill: '#9ca3af' }}
            />
            <Line
              type="monotone" dataKey="yield_ctha"
              stroke="#4caf50" strokeWidth={2.5}
              dot={{ r: 5, fill: '#4caf50', stroke: '#fff', strokeWidth: 2 }}
              activeDot={{ r: 7 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Block 2 — Precipitation & water balance */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          Осадки и водный баланс
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Водный баланс = осадки − испаряемость (ET₀) · мм за вегетационный период (май–август)
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <ComposedChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="precip" orientation="left" tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" мм" width={52} axisLine={false} tickLine={false} />
            <YAxis yAxisId="balance" orientation="right" tick={{ fontSize: 12, fill: '#6b7c6e' }} unit=" мм" width={52} axisLine={false} tickLine={false} />
            <Tooltip content={<PrecipTooltip />} />
            <Legend formatter={n => n === 'precip_mm' ? 'Осадки, мм' : 'Водный баланс, мм'} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <ReferenceLine y={0} yAxisId="balance" stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
            <Bar yAxisId="precip" dataKey="precip_mm" fill="#93c5fd" radius={[4,4,0,0]} name="precip_mm" maxBarSize={40} />
            <Line
              yAxisId="balance" type="monotone" dataKey="water_balance"
              stroke="#16a34a" strokeWidth={2.2}
              dot={({ cx, cy, value }) => (
                <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={4}
                  fill={value >= 0 ? '#16a34a' : '#ef4444'}
                  stroke="#fff" strokeWidth={1.5} />
              )}
              name="water_balance" isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Block 3 — Summary table */}
      <div style={{ ...card, overflow: 'auto' }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 16 }}>
          Сводная таблица · {field?.name}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
              {['Год', 'Урожайность', 'Осадки', 'Жарких дней', 'Водный баланс', 'Оценка'].map(h => (
                <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map(d => {
              const r = getRating(d.yield_ctha)
              const isBest  = d.year === best?.year
              const isWorst = d.year === worst?.year
              return (
                <tr key={d.year} style={{
                  background: isBest ? '#f0fdf4' : isWorst ? '#fff1f0' : 'transparent',
                  borderBottom: '1px solid var(--color-border)',
                }}>
                  <td style={{ padding: '11px 14px', fontWeight: isBest || isWorst ? 700 : 400 }}>
                    {d.year}
                    {isBest  && <span style={{ marginLeft: 6, fontSize: 11, color: '#16a34a', fontWeight: 700 }}>↑ лучший</span>}
                    {isWorst && <span style={{ marginLeft: 6, fontSize: 11, color: '#ef4444', fontWeight: 700 }}>↓ худший</span>}
                  </td>
                  <td style={{ padding: '11px 14px', fontWeight: 600, color: r.color }}>{d.yield_ctha} ц/га</td>
                  <td style={{ padding: '11px 14px' }}>{d.precip_mm} мм</td>
                  <td style={{ padding: '11px 14px', color: d.hot_days > 20 ? '#ef4444' : d.hot_days > 10 ? '#f59e0b' : 'inherit', fontWeight: d.hot_days > 20 ? 600 : 400 }}>{d.hot_days}</td>
                  <td style={{ padding: '11px 14px', color: d.water_balance >= 0 ? '#16a34a' : '#ef4444', fontWeight: 500 }}>
                    {d.water_balance > 0 ? '+' : ''}{d.water_balance} мм
                  </td>
                  <td style={{ padding: '11px 14px' }}>
                    <span style={{ background: r.color + '20', color: r.color, padding: '3px 10px', borderRadius: 4, fontWeight: 600, fontSize: 12 }}>
                      {r.label}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Block 4 — Season analysis */}
      <div style={{ ...card }}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 12 }}>
          Анализ сезона · {field?.name}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {data.map(d => (
            <button
              key={d.year}
              onClick={() => setSelectedYear(d.year === selectedYear ? null : d.year)}
              style={{
                padding: '6px 16px', borderRadius: 6,
                border: `1px solid ${selectedYear === d.year ? 'var(--color-accent)' : 'var(--color-border)'}`,
                background: selectedYear === d.year ? 'var(--color-accent)' : 'var(--color-surface)',
                color: selectedYear === d.year ? '#fff' : 'var(--color-text)',
                cursor: 'pointer', fontSize: 13, fontWeight: 500, transition: 'all 0.15s',
              }}
            >
              {d.year}
            </button>
          ))}
        </div>

        {analysis ? (() => {
          const r = getRating(analysis.yield_ctha)
          const extraIrr = analysis.water_balance < 0 ? Math.round(Math.abs(analysis.water_balance) * 0.4) : 0
          return (
            <div style={{
              background: r.color + '10', border: `1px solid ${r.color}40`,
              borderLeft: `4px solid ${r.color}`, borderRadius: 8, padding: '18px 20px',
            }}>
              <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 700, fontSize: 15, marginBottom: 10 }}>
                Сезон {analysis.year} · {field?.name}
              </div>
              <p style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--color-text)', margin: 0 }}>
                В <strong>{analysis.year}</strong> году урожайность участка составила{' '}
                <strong>{analysis.yield_ctha} ц/га</strong> — оценка «<strong style={{ color: r.color }}>{r.label}</strong>».{' '}
                Ключевые факторы: <strong>{analysis.hot_days}</strong> дней с температурой выше 30°C,
                средняя температура вегетационного периода <strong>{analysis.avg_temp}°C</strong>,
                суммарные осадки <strong>{analysis.precip_mm} мм</strong>.{' '}
                {analysis.water_balance < 0 ? (
                  <>
                    Водный дефицит составил <strong style={{ color: '#ef4444' }}>{Math.abs(analysis.water_balance)} мм</strong>.{' '}
                    Рекомендация: увеличить полив на <strong>{extraIrr} мм</strong> относительно нормы.
                  </>
                ) : (
                  <>
                    Положительный водный баланс <strong style={{ color: '#16a34a' }}>+{analysis.water_balance} мм</strong> —
                    сезон был благоприятным по влагообеспеченности.
                  </>
                )}
              </p>
            </div>
          )
        })() : (
          <div style={{ color: 'var(--color-text-muted)', fontSize: 13, padding: '12px 0' }}>
            Выберите год для просмотра детального анализа
          </div>
        )}
      </div>

      {/* Block 5 — Sensor readings history */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 4 }}>
          История показаний датчиков · {field?.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Записи из формы датчика на карточке участка
        </div>

        {sensorHistory.length === 0 ? (
          <div style={{
            padding: '24px', textAlign: 'center',
            background: 'var(--color-bg)', borderRadius: 10,
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-muted)', fontSize: 13,
          }}>
            Нет сохранённых показаний. Откройте карточку участка и введите данные датчика — они появятся здесь.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  {['Дата', 'Влажность воздуха', 'Влажность почвы', 'Темп. воздуха', 'Скорость ветра', 'Аномалия', 'Полив'].map(h => (
                    <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...sensorHistory].reverse().map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-border)', background: r.is_anomaly ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                    <td style={{ padding: '9px 12px', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.ts).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '9px 12px' }}>{r.humidity ?? '—'} %</td>
                    <td style={{ padding: '9px 12px', color: r.soil_moisture < 20 ? '#ef4444' : r.soil_moisture > 80 ? '#f59e0b' : 'inherit', fontWeight: 500 }}>
                      {r.soil_moisture ?? '—'} %
                    </td>
                    <td style={{ padding: '9px 12px', color: r.air_temperature > 35 ? '#ef4444' : 'inherit' }}>
                      {r.air_temperature ?? '—'} °C
                    </td>
                    <td style={{ padding: '9px 12px' }}>{r.wind_speed ?? '—'} м/с</td>
                    <td style={{ padding: '9px 12px', color: r.is_anomaly ? 'var(--color-anomaly)' : 'var(--color-normal)', fontWeight: r.is_anomaly ? 600 : 400 }}>
                      {r.is_anomaly ? 'Да' : 'Нет'}
                    </td>
                    <td style={{ padding: '9px 12px' }}>
                      {r.irrigate
                        ? <span style={{ color: 'var(--color-normal)', fontWeight: 600 }}>↑ {r.amount_mm} мм</span>
                        : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Block 6 — EDA scatter */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          EDA: Зависимость урожайности от осадков · {field?.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Каждая точка — один год. Цвет: водный баланс участка.
        </div>

        {/* Correlation cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
          {[
            { label: 'Осадки → Урожай',       xs: data.map(d => d.precip_mm),     ys: data.map(d => d.yield_ctha) },
            { label: 'Температура → Урожай',   xs: data.map(d => d.avg_temp),      ys: data.map(d => d.yield_ctha) },
            { label: 'Жарких дней → Урожай',   xs: data.map(d => d.hot_days),      ys: data.map(d => d.yield_ctha) },
            { label: 'Водный баланс → Урожай', xs: data.map(d => d.water_balance), ys: data.map(d => d.yield_ctha) },
          ].map(({ label, xs, ys }) => {
            const r = pearson(xs, ys)
            const abs = Math.abs(r)
            const color = abs > 0.7 ? (r > 0 ? '#16a34a' : '#ef4444') : abs > 0.4 ? '#f59e0b' : '#9ca3af'
            const strength = abs > 0.7 ? 'Сильная' : abs > 0.4 ? 'Умеренная' : 'Слабая'
            return (
              <div key={label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '12px 14px' }}>
                <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color, lineHeight: 1 }}>r = {r}</div>
                <div style={{ fontSize: 11, color, marginTop: 3, fontWeight: 500 }}>{strength} {r > 0 ? 'положительная' : 'отрицательная'}</div>
              </div>
            )
          })}
        </div>

        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 8, right: 24, bottom: 20, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="x" name="Осадки" unit=" мм" type="number" domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#6b7c6e' }} axisLine={false} tickLine={false}
              label={{ value: 'Осадки, мм', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#9ca3af' }}
            />
            <YAxis
              dataKey="y" name="Урожайность" unit=" ц" type="number" domain={['auto', 'auto']}
              tick={{ fontSize: 11, fill: '#6b7c6e' }} axisLine={false} tickLine={false} width={46}
            />
            <ZAxis range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <div style={{ fontWeight: 700, marginBottom: 2 }}>{d.year}</div>
                    <div>Осадки: {d.x} мм</div>
                    <div>Урожайность: {d.y} ц/га</div>
                  </div>
                )
              }}
            />
            <Scatter data={data.map(d => ({ x: d.precip_mm, y: d.yield_ctha, year: d.year, wb: d.water_balance }))} fill="#4caf50">
              {data.map((d, i) => (
                <Cell key={i} fill={d.water_balance >= 0 ? '#4caf50' : d.water_balance > -50 ? '#f59e0b' : '#ef4444'} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'var(--color-text-muted)', marginTop: 8, flexWrap: 'wrap' }}>
          <span><span style={{ color: '#4caf50', fontWeight: 700 }}>●</span> Положительный водный баланс</span>
          <span><span style={{ color: '#f59e0b', fontWeight: 700 }}>●</span> Умеренный дефицит</span>
          <span><span style={{ color: '#ef4444', fontWeight: 700 }}>●</span> Сильный дефицит</span>
        </div>
      </div>

      {/* Block 7 — Yield distribution */}
      <div style={card}>
        <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)', marginBottom: 2 }}>
          EDA: Распределение урожайности по диапазонам · {field?.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginBottom: 16 }}>
          Количество сезонов в каждом диапазоне ц/га · 2016–2025
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <ComposedChart
            data={[
              { range: '<30',   count: data.filter(d => d.yield_ctha < 30).length },
              { range: '30–35', count: data.filter(d => d.yield_ctha >= 30 && d.yield_ctha < 35).length },
              { range: '35–40', count: data.filter(d => d.yield_ctha >= 35 && d.yield_ctha < 40).length },
              { range: '40–45', count: data.filter(d => d.yield_ctha >= 40 && d.yield_ctha < 45).length },
              { range: '45+',   count: data.filter(d => d.yield_ctha >= 45).length },
            ]}
            margin={{ top: 8, right: 24, bottom: 0, left: 0 }}
          >
            <XAxis dataKey="range" tick={{ fontSize: 12, fill: '#6b7c6e' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#6b7c6e' }} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
            <Tooltip
              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, fontSize: 12 }}
              formatter={v => [`${v} сезон${v === 1 ? '' : v < 5 ? 'а' : 'ов'}`, 'Количество']}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]} isAnimationActive={false}>
              {['#ef4444', '#f59e0b', '#4caf50', '#16a34a', '#1a4d2e'].map((fill, i) => (
                <Cell key={i} fill={fill} />
              ))}
            </Bar>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Block 8 — ML metrics */}
      <div style={{ ...card, marginBottom: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ fontFamily: 'Montserrat, sans-serif', fontWeight: 600, fontSize: 15, color: 'var(--color-text)' }}>
              Метрики ML-модели
            </div>
            <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 2 }}>
              Gradient Boosting Regressor · Train/Test: 80% / 20% · Датасет: 12 450 записей
            </div>
          </div>
          <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: 'rgba(76,175,80,0.12)', color: 'var(--color-normal)', fontWeight: 600 }}>
            Аномалий в датасете: 847 (6.8%)
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, margin: '20px 0' }}>
          {ML_METRICS.map(m => (
            <div key={m.label} style={{ background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500, marginBottom: 6 }}>{m.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: m.color, lineHeight: 1 }}>
                {m.value}<span style={{ fontSize: 13, fontWeight: 500, marginLeft: 2 }}>{m.unit}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-muted)', marginTop: 4 }}>{m.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--color-text)', marginBottom: 12 }}>Важность признаков</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEATURE_IMPORTANCE.map(f => (
            <div key={f.feature}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text)', fontWeight: 500 }}>{f.feature}</span>
                <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{f.pct}%</span>
              </div>
              <div style={{ height: 8, background: 'var(--color-border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.pct}%`, background: f.color, borderRadius: 4, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
