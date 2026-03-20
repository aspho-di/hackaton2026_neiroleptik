import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { MOCK_FIELDS, getMockForecastForField } from '../mockData'
import Navbar from '../components/Navbar'
import AnomalyAlert from '../components/AnomalyAlert'
import PrecipChart from '../components/PrecipChart'
import StatusBadge from '../components/StatusBadge'
import SensorForm from '../components/SensorForm'

const API_FORECAST = 'http://localhost:8001/predict/forecast'

export default function FieldDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fieldId = Number(id)

  const field = MOCK_FIELDS.find(f => f.field_id === fieldId)
  const [forecast, setForecast] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

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

  const showAlert = forecast && (forecast.confidence === 'low' || forecast.status === 'anomaly')

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg)' }}>
      <Navbar />

      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '24px 16px 48px' }}>

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

        {/* Title */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h1 style={{ fontSize: '20px', color: 'var(--color-text)', marginBottom: '3px' }}>
              {field.name}
            </h1>
            <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
              ID поля: {field.field_id}
            </div>
          </div>
          {forecast && <StatusBadge status={forecast.status} confidence={forecast.confidence} />}
        </div>

        {/* Alert */}
        {showAlert && <AnomalyAlert message={forecast.message} />}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--color-text-muted)' }}>
            Загрузка прогноза...
          </div>
        ) : (
          <>
            {/* Yield + sensor stats */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
              gap: '12px',
              marginBottom: '16px',
            }}>
              <StatCard
                icon="🌾"
                label="Прогноз урожайности"
                value={`${forecast.yield_ctha} ц/га`}
                big
                color="var(--color-normal)"
                bg="var(--color-accent-light)"
              />
              <StatCard
                icon="💧"
                label="Влажность почвы"
                value="—"
                hint="Введите данные датчика"
                bg="#eff6ff"
                color="#1d4ed8"
              />
              <StatCard
                icon="🌡️"
                label="Температура воздуха"
                value="—"
                hint="Введите данные датчика"
                bg="#fff7ed"
                color="#c2410c"
              />
            </div>

            {/* Precipitation chart */}
            <div style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '16px 20px',
              marginBottom: '16px',
            }}>
              <PrecipChart data={forecast.precip_forecast_7days} />
            </div>
          </>
        )}

        {/* Sensor form */}
        <SensorForm fieldId={fieldId} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, big, color, bg, hint }) {
  return (
    <div style={{
      background: bg || 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius-card)',
      boxShadow: 'var(--shadow-card)',
      padding: '16px',
    }}>
      <div style={{ fontSize: '20px', marginBottom: '6px' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: big ? '28px' : '20px', fontWeight: 700, fontFamily: 'Montserrat, sans-serif', color: color || 'var(--color-text)' }}>
        {value}
      </div>
      {hint && <div style={{ fontSize: '11px', color: 'var(--color-text-muted)', marginTop: '3px' }}>{hint}</div>}
    </div>
  )
}
