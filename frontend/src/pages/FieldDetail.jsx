import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  LineChart, Line, XAxis, YAxis, ReferenceLine,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { MOCK_FIELDS, getMockForecastForField } from '../mockData'
import { IconWheat, IconDroplet, IconThermometer } from '../components/icons/Icons'
import Navbar from '../components/Navbar'
import AnomalyAlert from '../components/AnomalyAlert'
import PrecipChart from '../components/PrecipChart'
import StatusBadge from '../components/StatusBadge'
import SensorForm from '../components/SensorForm'
import CropSVG from '../components/CropSVG'

const API_FORECAST = 'http://localhost:8001/predict/forecast'
const DAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
const ET0 = 4.0

const STATUS_GRADIENT = {
  normal:  'linear-gradient(135deg, #f0faf0 0%, #ffffff 60%)',
  warning: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 60%)',
  anomaly: 'linear-gradient(135deg, #fff1f0 0%, #ffffff 60%)',
}

// ── Water balance tooltip ────────────────────────────────────────────────────
function BalanceTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const v = payload[0].value
  return (
    <div style={{
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '8px 12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      fontSize: '13px',
    }}>
      <div style={{ fontWeight: 600, marginBottom: '2px', color: '#1c2b1e' }}>{label}</div>
      <div style={{ color: v >= 0 ? '#16a34a' : '#dc2626' }}>{v > 0 ? '+' : ''}{v} мм</div>
    </div>
  )
}

// ── Custom dot: green if positive, red if negative ───────────────────────────
function BalanceDot({ cx, cy, value }) {
  if (cx == null || cy == null) return null
  return (
    <circle
      cx={cx} cy={cy} r={4}
      fill={value >= 0 ? '#22c55e' : '#ef4444'}
      stroke="#fff" strokeWidth={1.5}
    />
  )
}

function WaterBalanceChart({ precip }) {
  const data = precip.map((p, i) => ({
    day: DAYS[i],
    balance: +(p - ET0).toFixed(1),
  }))
  const avg = data.reduce((s, d) => s + d.balance, 0) / data.length
  const lineColor = avg >= 0 ? '#22c55e' : '#ef4444'

  return (
    <div style={{
      background: avg >= 0
        ? 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 60%)'
        : 'linear-gradient(135deg, #fff1f0 0%, #ffffff 60%)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '20px 20px 16px',
      display: 'flex',
      flexDirection: 'column',
      flex: 1,
      minHeight: 0,
    }}>
      <div style={{ marginBottom: '14px', flexShrink: 0 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: '2px' }}>
          Водный баланс
        </div>
        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
          Осадки − ET₀ ({ET0} мм/день) по дням
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#22c55e" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0.08} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: '#6b7c6e' }}
            axisLine={false} tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: '#6b7c6e' }}
            unit=" мм" width={46}
            axisLine={false} tickLine={false}
          />
          <Tooltip content={<BalanceTooltip />} cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }} />
          <ReferenceLine y={0} stroke="#9ca3af" strokeDasharray="4 4" strokeWidth={1.5} />
          <Line
            type="monotone"
            dataKey="balance"
            stroke={lineColor}
            strokeWidth={2.5}
            dot={<BalanceDot />}
            activeDot={{ r: 5 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Stat card (left column) ──────────────────────────────────────────────────
function StatCard({ icon, label, value, color, bg, hint }) {
  return (
    <div style={{
      background: bg || 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '14px 16px',
    }}>
      <div style={{ marginBottom: '4px', display: 'flex' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '2px' }}>{hint}</div>}
    </div>
  )
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function FieldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fieldId = Number(id)

  const field = MOCK_FIELDS.find(f => f.field_id === fieldId)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sensorResult, setSensorResult] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setSensorResult(null)

    async function load() {
      let data
      try {
        const res = await fetch(`${API_FORECAST}?field_id=${fieldId}`)
        if (!res.ok) throw new Error('api error')
        data = await res.json()
      } catch {
        data = getMockForecastForField(fieldId)
      }
      if (!cancelled) {
        setForecast(data)
        setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [fieldId])

  if (!field) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
        <Navbar />
        <div style={{ padding: '60px 16px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
          Поле не найдено.{' '}
          <button onClick={() => navigate('/')} style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            На главную
          </button>
        </div>
      </div>
    )
  }

  const fieldStatus = forecast?.status === 'anomaly' ? 'anomaly'
    : forecast?.confidence === 'low' ? 'warning' : 'normal'
  const cardGradient = STATUS_GRADIENT[fieldStatus] ?? STATUS_GRADIENT.normal

  // AnomalyAlert только после расчёта датчика
  const showAlert = sensorResult && (
    sensorResult.irrigation?.confidence === 'low' ||
    sensorResult.irrigation?.status === 'anomaly'
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* Back */}
        <button
          onClick={() => navigate('/')}
          style={{
            background: 'none', border: 'none',
            color: 'var(--color-accent)',
            fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '16px',
            display: 'flex', alignItems: 'center', gap: '4px',
            padding: 0, fontFamily: 'inherit',
          }}
        >
          ← Все поля
        </button>

        {/* Title row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '20px', color: 'var(--color-text)', marginBottom: '3px' }}>
              {field.name}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              ID поля: {field.field_id} · {field.crop}
            </div>
          </div>
          {forecast && <StatusBadge status={forecast.status} confidence={forecast.confidence} />}
        </div>

        {showAlert && <AnomalyAlert message={sensorResult.irrigation?.message} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '64px', color: 'var(--color-text-muted)' }}>
            Загрузка прогноза...
          </div>
        ) : (
          <div className="field-detail-grid">

            {/* ── ЛЕВАЯ КОЛОНКА ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Yield */}
              <StatCard
                icon={<IconWheat size={20} color="var(--color-normal)" />}
                label="Прогноз урожайности"
                value={`${forecast.yield_ctha} ц/га`}
                color="var(--color-normal)"
                bg="var(--color-accent-light)"
              />

              {/* Sensor quick stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <StatCard
                  icon={<IconDroplet size={18} color="#1d4ed8" />}
                  label="Влажность почвы"
                  value="—"
                  hint="Введите данные"
                  bg="#eff6ff"
                  color="#1d4ed8"
                />
                <StatCard
                  icon={<IconThermometer size={18} color="#c2410c" />}
                  label="Темп. воздуха"
                  value="—"
                  hint="Введите данные"
                  bg="#fff7ed"
                  color="#c2410c"
                />
              </div>

              {/* Sensor form */}
              <SensorForm fieldId={fieldId} onResult={setSensorResult} />
            </div>

            {/* ── ПРАВАЯ КОЛОНКА ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: '100%' }}>

              {/* Объединённая карточка: CropSVG + график осадков */}
              <div style={{
                position: 'relative',
                overflow: 'hidden',
                background: cardGradient,
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '20px 20px 16px',
                flexShrink: 0,
              }}>
                {/* CropSVG — абсолютно, правый верхний угол */}
                <div style={{ position: 'absolute', top: 16, right: 16, opacity: 0.85 }}>
                  <CropSVG
                    crop={field.crop}
                    status={fieldStatus}
                    temp={field.temp}
                    precip={field.precip}
                    width={80}
                    height={80}
                  />
                </div>

                {/* Заголовок */}
                <div style={{ marginBottom: '14px', paddingRight: '96px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, fontFamily: 'Montserrat, sans-serif', color: 'var(--color-text)', marginBottom: '2px' }}>
                    Осадки на 7 дней
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
                    {field.crop}
                  </div>
                </div>

                <PrecipChart data={forecast.precip_forecast_7days} height={240} />
              </div>

              {/* Водный баланс — появляется после расчёта */}
              {sensorResult && (
                <WaterBalanceChart precip={sensorResult.precip} />
              )}

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
